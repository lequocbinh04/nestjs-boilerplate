import { UsersModule } from '@features/users/users.module';
import { EmailModule } from '@infrastructure/email/email.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RevokedTokenRepository } from './repositories/revoked-token.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TokenRevocationService } from './services/token-revocation.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    TokenRevocationService,
    RefreshTokenRepository,
    RevokedTokenRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    TokenRevocationService,
    RefreshTokenRepository,
    RevokedTokenRepository,
  ],
})
export class AuthModule {}
