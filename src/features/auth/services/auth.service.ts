import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@common/exceptions/base.exception';
import { EnvConfig } from '@config/env.config';
import { UserRepository } from '@features/users/repositories/user.repository.interface';
import { EmailService } from '@infrastructure/email/email.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/auth.dto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TokenRevocationService } from './token-revocation.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private tokenRevocationService: TokenRevocationService,
    private refreshTokenRepository: RefreshTokenRepository,
    private emailService: EmailService,
    private configService: ConfigService<EnvConfig>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    const verificationToken = this.passwordService.generateRandomToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.userRepository.setEmailVerificationToken(user.id, verificationToken, expiresAt);

    this.emailService.sendVerificationEmail(user.email, verificationToken).catch((error) => {
      this.logger.error(`Failed to send verification email: ${error.message}`);
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const emailVerificationRequired = this.configService.get('EMAIL_VERIFICATION_REQUIRED', {
      infer: true,
    });
    if (emailVerificationRequired && !user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const tokenPair = await this.tokenService.generateTokenPair(user.id, user.email);

    const hashedRefreshToken = await this.passwordService.hash(tokenPair.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(
      user.id,
      hashedRefreshToken,
      tokenPair.refreshTokenJti,
      expiresAt,
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmailVerificationToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (!user.isEmailVerificationValid()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.userRepository.verifyEmail(user.id);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = this.passwordService.generateRandomToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);

    this.emailService.sendPasswordResetEmail(user.email, resetToken).catch((error) => {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findByPasswordResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.isPasswordResetValid()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    await this.refreshTokenRepository.deleteByUserId(user.id);

    return { message: 'Password reset successfully' };
  }

  async refreshTokens(userId: string, oldRefreshToken: string, oldJti: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const storedToken = await this.refreshTokenRepository.findByJti(oldJti);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.passwordService.compare(oldRefreshToken, storedToken.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.tokenRevocationService.revokeToken(oldJti, userId, storedToken.expiresAt, 'refresh');
    await this.refreshTokenRepository.deleteByJti(oldJti);

    const tokenPair = await this.tokenService.generateTokenPair(user.id, user.email);

    const hashedRefreshToken = await this.passwordService.hash(tokenPair.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(
      user.id,
      hashedRefreshToken,
      tokenPair.refreshTokenJti,
      expiresAt,
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  async revokeToken(userId: string, jti: string) {
    const token = await this.refreshTokenRepository.findByJti(jti);
    if (!token) {
      throw new NotFoundException('Token not found');
    }

    await this.tokenRevocationService.revokeToken(jti, userId, token.expiresAt, 'logout');
    await this.refreshTokenRepository.deleteByJti(jti);

    return { message: 'Token revoked successfully' };
  }
}
