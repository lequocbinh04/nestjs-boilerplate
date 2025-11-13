import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@common/exceptions/base.exception';
import { RefreshTokenRepository } from '@features/auth/repositories/refresh-token.repository';
import { AuthService } from '@features/auth/services/auth.service';
import { PasswordService } from '@features/auth/services/password.service';
import { TokenService } from '@features/auth/services/token.service';
import { TokenRevocationService } from '@features/auth/services/token-revocation.service';
import { UserEntity } from '@features/users/entities/user.entity';
import { UserRepository } from '@features/users/repositories/user.repository.interface';
import { EmailService } from '@infrastructure/email/email.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let tokenRevocationService: jest.Mocked<TokenRevocationService>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = new UserEntity({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    emailVerified: false,
    emailVerifiedAt: null,
    emailVerificationToken: 'verify-token-123',
    emailVerificationExpires: new Date(Date.now() + 86400000),
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockTokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessTokenJti: 'jti-access',
    refreshTokenJti: 'jti-refresh',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setEmailVerificationToken: jest.fn(),
      setPasswordResetToken: jest.fn(),
      verifyEmail: jest.fn(),
      findByEmailVerificationToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
    };

    const mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
      generateRandomToken: jest.fn(),
    };

    const mockTokenService = {
      generateTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    const mockTokenRevocationService = {
      revokeToken: jest.fn(),
      isRevoked: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      create: jest.fn(),
      findByJti: jest.fn(),
      deleteByJti: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'EMAIL_VERIFICATION_REQUIRED') return false;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: TokenRevocationService, useValue: mockTokenRevocationService },
        { provide: RefreshTokenRepository, useValue: mockRefreshTokenRepository },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    tokenRevocationService = module.get(TokenRevocationService);
    refreshTokenRepository = module.get(RefreshTokenRepository);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
    };

    it('should successfully register a new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');
      passwordService.generateRandomToken.mockReturnValue('verification-token');
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.setEmailVerificationToken.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result.message).toContain('Registration successful');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(passwordService.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.setEmailVerificationToken).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should handle email service failure gracefully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');
      passwordService.generateRandomToken.mockReturnValue('verification-token');
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.setEmailVerificationToken.mockResolvedValue(undefined);
      emailService.sendVerificationEmail.mockRejectedValue(new Error('Email failed'));

      const result = await service.register(registerDto);

      expect(result.message).toContain('Registration successful');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should successfully login with valid credentials', async () => {
      const verifiedUser = new UserEntity({ ...mockUser, emailVerified: true });
      userRepository.findByEmail.mockResolvedValue(verifiedUser);
      passwordService.compare.mockResolvedValue(true);
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(result.user.email).toBe(verifiedUser.email);
      expect(refreshTokenRepository.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(tokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should allow login without email verification when not required', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
    });
  });

  describe('verifyEmail', () => {
    const verifyDto = { token: 'verification-token' };

    it('should successfully verify email with valid token', async () => {
      userRepository.findByEmailVerificationToken.mockResolvedValue(mockUser);
      userRepository.verifyEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail(verifyDto);

      expect(result.message).toContain('verified successfully');
      expect(userRepository.verifyEmail).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException if token not found', async () => {
      userRepository.findByEmailVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredUser = new UserEntity({
        ...mockUser,
        emailVerificationExpires: new Date(Date.now() - 1000),
      });
      userRepository.findByEmailVerificationToken.mockResolvedValue(expiredUser);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    const forgotDto = { email: 'test@example.com' };

    it('should send reset email if user exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.generateRandomToken.mockReturnValue('reset-token');
      userRepository.setPasswordResetToken.mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotDto);

      expect(result.message).toContain('reset link has been sent');
      expect(userRepository.setPasswordResetToken).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return generic message if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotDto);

      expect(result.message).toContain('reset link has been sent');
      expect(userRepository.setPasswordResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle email service failure gracefully', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.generateRandomToken.mockReturnValue('reset-token');
      userRepository.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email failed'));

      const result = await service.forgotPassword(forgotDto);

      expect(result.message).toContain('reset link has been sent');
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'reset-token',
      password: 'NewPassword123',
    };

    it('should successfully reset password with valid token', async () => {
      const userWithResetToken = new UserEntity({
        ...mockUser,
        passwordResetToken: 'reset-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
      });
      userRepository.findByPasswordResetToken.mockResolvedValue(userWithResetToken);
      passwordService.hash.mockResolvedValue('newHashedPassword');
      userRepository.update.mockResolvedValue(userWithResetToken);
      refreshTokenRepository.deleteByUserId.mockResolvedValue(undefined);

      const result = await service.resetPassword(resetDto);

      expect(result.message).toContain('reset successfully');
      expect(userRepository.update).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException if token not found', async () => {
      userRepository.findByPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredUser = new UserEntity({
        ...mockUser,
        passwordResetToken: 'reset-token',
        passwordResetExpires: new Date(Date.now() - 1000),
      });
      userRepository.findByPasswordResetToken.mockResolvedValue(expiredUser);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const oldJti = 'old-jti';
      const storedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'hashedOldRefreshToken',
        jti: oldJti,
        expiresAt: new Date(Date.now() + 604800000),
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);
      passwordService.compare.mockResolvedValue(true);
      tokenRevocationService.revokeToken.mockResolvedValue(undefined);
      refreshTokenRepository.deleteByJti.mockResolvedValue(undefined);
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      passwordService.hash.mockResolvedValue('hashedNewRefreshToken');

      const result = await service.refreshTokens(mockUser.id, oldRefreshToken, oldJti);

      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(tokenRevocationService.revokeToken).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteByJti).toHaveBeenCalledWith(oldJti);
      expect(refreshTokenRepository.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(mockUser.id, 'token', 'jti')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if stored token not found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findByJti.mockResolvedValue(null);

      await expect(service.refreshTokens(mockUser.id, 'token', 'jti')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token comparison fails', async () => {
      const storedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'hashedToken',
        jti: 'jti',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);
      passwordService.compare.mockResolvedValue(false);

      await expect(service.refreshTokens(mockUser.id, 'wrong-token', 'jti')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeToken', () => {
    it('should successfully revoke token', async () => {
      const jti = 'jti-123';
      const storedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'hashedToken',
        jti,
        expiresAt: new Date(Date.now() + 604800000),
        createdAt: new Date(),
      };

      refreshTokenRepository.findByJti.mockResolvedValue(storedToken);
      tokenRevocationService.revokeToken.mockResolvedValue(undefined);
      refreshTokenRepository.deleteByJti.mockResolvedValue(undefined);

      const result = await service.revokeToken(mockUser.id, jti);

      expect(result.message).toContain('revoked successfully');
      expect(tokenRevocationService.revokeToken).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteByJti).toHaveBeenCalledWith(jti);
    });

    it('should throw NotFoundException if token not found', async () => {
      refreshTokenRepository.findByJti.mockResolvedValue(null);

      await expect(service.revokeToken(mockUser.id, 'jti')).rejects.toThrow(NotFoundException);
    });
  });
});
