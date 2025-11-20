import { IsPublic } from '@common/decorators/public.decorator';
import { UserAgent } from '@common/decorators/user-agent.decorator';
import { Body, Controller, Inject, Ip, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AUTH_SERVICE } from '../auth.di-token';
import { LoginBodyDTO, LoginResDTO, RegisterBodyDTO, RegisterResDTO } from '../auth.dto';
import { IAuthService } from '../auth.port';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private authService: IAuthService) {}

  @Post('register')
  @IsPublic()
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ZodResponse({ type: RegisterResDTO })
  async register(@Body() dto: RegisterBodyDTO) {
    return this.authService.register(dto);
  }

  @Post('login')
  @IsPublic()
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ZodResponse({ type: LoginResDTO })
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.login({
      ...body,
      userAgent,
      ip,
    });
  }

  // @Post('verify-email')
  // @IsPublic()
  // @ApiOperation({ summary: 'Verify email address' })
  // @ApiResponse({ status: 200, description: 'Email verified' })
  // @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  // async verifyEmail(@Body() dto: VerifyEmailDto) {
  //   return this.authService.verifyEmail(dto);
  // }

  // @Post('forgot-password')
  // @IsPublic()
  // @ApiOperation({ summary: 'Request password reset' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Reset email sent if account exists',
  // })
  // async forgotPassword(@Body() dto: ForgotPasswordDto) {
  //   return this.authService.forgotPassword(dto);
  // }

  // @Post('reset-password')
  // @IsPublic()
  // @ApiOperation({ summary: 'Reset password with token' })
  // @ApiResponse({ status: 200, description: 'Password reset successful' })
  // @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  // async resetPassword(@Body() dto: ResetPasswordDto) {
  //   return this.authService.resetPassword(dto);
  // }

  // @Post('refresh')
  // @IsPublic()
  // @UseGuards(AuthGuard('jwt-refresh'))
  // @ApiOperation({ summary: 'Refresh access token' })
  // @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  // @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  // async refresh(@Request() req: RefreshTokenRequest) {
  //   const { userId, jti, refreshToken } = req.user;
  //   return this.authService.refreshTokens(userId, refreshToken, jti);
  // }

  // @Post('revoke')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Revoke current token (logout)' })
  // @ApiResponse({ status: 200, description: 'Token revoked' })
  // async revoke(@Request() req: AuthenticatedRequest) {
  //   const { userId, jti } = req.user;
  //   return this.authService.revokeToken(userId, jti);
  // }
}
