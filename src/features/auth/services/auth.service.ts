import {
  SHARED_ROLE_REPOSITORY,
  SHARED_TOKEN_SERVICE,
  SHARED_USER_REPOSITORY,
} from '@common/di-token';
import { ConflictException, UnauthorizedException } from '@common/exceptions/base.exception';
import { UserType } from '@common/models/shared-user.model';
import { ISharedRoleRepository } from '@common/port/shared-role.port';
import { ITokenService } from '@common/port/shared-token.port';
import { ISharedUserRepository } from '@common/port/shared-user.port';
import { EnvConfig } from '@config/env.config';
import { EmailService } from '@infrastructure/email/email.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationCodeService } from '@shared/verification-code/verification-code.service';
import { VerificationCodeType } from '@shared/verification-code/verification-code.type';
import ms from 'ms';
import { AUTH_REPOSITORY } from '../auth.di-token';
import { LoginBodyType, RegisterBodyType, RegisterResType } from '../auth.model';
import { IAuthRepository, IAuthService } from '../auth.port';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SHARED_USER_REPOSITORY) private userRepository: ISharedUserRepository,
    @Inject(SHARED_TOKEN_SERVICE) private tokenService: ITokenService,
    @Inject(AUTH_REPOSITORY) private authRepository: IAuthRepository,
    @Inject(SHARED_ROLE_REPOSITORY) private roleRepository: ISharedRoleRepository,

    private passwordService: PasswordService,
    private emailService: EmailService,
    private configService: ConfigService<EnvConfig>,
    private verificationCodeService: VerificationCodeService,
  ) {}

  async register(body: RegisterBodyType): Promise<RegisterResType> {
    let user: UserType | null = null;
    let verificationToken: { id: number; code: string } | null = null;

    try {
      const existingUser = await this.userRepository.findByEmail(body.email);
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await this.passwordService.hash(body.password);

      user = await this.userRepository.create({
        email: body.email,
        password: hashedPassword,
        name: body.name,
        roleId: await this.roleRepository.getClientRoleId(),
      });

      verificationToken = await this.verificationCodeService.createVerificationCode(
        user.email,
        VerificationCodeType.REGISTER,
        this.configService.get('EMAIL_VERIFICATION_TOKEN_EXPIRATION') as ms.StringValue,
      );

      this.emailService.sendVerificationEmail(user.email, verificationToken.code).catch((error) => {
        this.logger.error(`Failed to send verification email: ${error.message}`);
      });

      return user;
    } catch (error) {
      this.logger.error(`Failed to register user: ${error.message}`);

      if (user) {
        await this.userRepository.delete(user.id);
      }

      if (verificationToken) {
        await this.verificationCodeService.deleteVerificationCode({
          id: verificationToken.id,
        });
      }

      throw error;
    }
  }

  async login(dto: LoginBodyType & { userAgent: string; ip: string }) {
    // 1. Get user to check information
    const user = await this.userRepository.findByEmailIncludeRole(dto.email);
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

    // 2. Tạo mới device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: dto.userAgent,
      ip: dto.ip,
    });

    // 3. Tạo mới token pair
    const tokenPair = await this.tokenService.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user,
    };
  }

  // async verifyEmail(dto: VerifyEmailDto) {
  //   const user = await this.userRepository.findByEmailVerificationToken(dto.token);
  //   if (!user) {
  //     throw new BadRequestException('Invalid or expired verification token');
  //   }

  //   if (!user.isEmailVerificationValid()) {
  //     throw new BadRequestException('Verification token has expired');
  //   }

  //   await this.userRepository.verifyEmail(user.id);

  //   return { message: 'Email verified successfully' };
  // }

  // async forgotPassword(dto: ForgotPasswordDto) {
  //   const user = await this.userRepository.findByEmail(dto.email);
  //   if (!user) {
  //     return { message: 'If the email exists, a reset link has been sent' };
  //   }

  //   const resetToken = this.passwordService.generateRandomToken(32);
  //   const expiresAt = new Date();
  //   expiresAt.setHours(expiresAt.getHours() + 1);

  //   await this.userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);

  //   this.emailService.sendPasswordResetEmail(user.email, resetToken).catch((error) => {
  //     this.logger.error(`Failed to send password reset email: ${error.message}`);
  //   });

  //   return { message: 'If the email exists, a reset link has been sent' };
  // }

  // async resetPassword(dto: ResetPasswordDto) {
  //   const user = await this.userRepository.findByPasswordResetToken(dto.token);
  //   if (!user) {
  //     throw new BadRequestException('Invalid or expired reset token');
  //   }

  //   if (!user.isPasswordResetValid()) {
  //     throw new BadRequestException('Reset token has expired');
  //   }

  //   const hashedPassword = await this.passwordService.hash(dto.password);

  //   await this.userRepository.update(user.id, {
  //     password: hashedPassword,
  //     passwordResetToken: null,
  //     passwordResetExpires: null,
  //   });

  //   await this.refreshTokenRepository.deleteByUserId(user.id);

  //   return { message: 'Password reset successfully' };
  // }

  // async refreshTokens(userId: string, oldRefreshToken: string, oldJti: string) {
  //   const user = await this.userRepository.findById(userId);
  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }

  //   const storedToken = await this.refreshTokenRepository.findByJti(oldJti);
  //   if (!storedToken) {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }

  //   const isValid = await this.passwordService.compare(oldRefreshToken, storedToken.token);
  //   if (!isValid) {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }

  //   await this.tokenRevocationService.revokeToken(oldJti, userId, storedToken.expiresAt, 'refresh');
  //   await this.refreshTokenRepository.deleteByJti(oldJti);

  //   const tokenPair = await this.tokenService.generateTokenPair(user.id, user.email);

  //   const hashedRefreshToken = await this.passwordService.hash(tokenPair.refreshToken);
  //   const expiresAt = new Date();
  //   expiresAt.setDate(expiresAt.getDate() + 7);

  //   await this.refreshTokenRepository.create(
  //     user.id,
  //     hashedRefreshToken,
  //     tokenPair.refreshTokenJti,
  //     expiresAt,
  //   );

  //   return {
  //     accessToken: tokenPair.accessToken,
  //     refreshToken: tokenPair.refreshToken,
  //   };
  // }

  // async revokeToken(userId: string, jti: string) {
  //   const token = await this.refreshTokenRepository.findByJti(jti);
  //   if (!token) {
  //     throw new NotFoundException('Token not found');
  //   }

  //   await this.tokenRevocationService.revokeToken(jti, userId, token.expiresAt, 'logout');
  //   await this.refreshTokenRepository.deleteByJti(jti);

  //   return { message: 'Token revoked successfully' };
  // }
}
