import {
  SHARED_ROLE_REPOSITORY,
  SHARED_TOKEN_SERVICE,
  SHARED_USER_REPOSITORY,
} from '@common/di-token';
import { RefreshTokenRepository } from '@common/repositories/shared-refresh-token.repository';
import { RolePrismaRepository } from '@common/repositories/shared-role.repository';
import { PrismaUserRepository } from '@common/repositories/shared-user.repository';
import { TokenService } from '@common/services/token.service';
import { EmailModule } from '@infrastructure/email/email.module';
import { Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_REPOSITORY, AUTH_SERVICE } from './auth.di-token';
import { AuthController } from './infras/auth.controller';
import { AuthPrismaRepository } from './infras/auth-prisma.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';

const dependencies: Provider[] = [
  {
    provide: SHARED_USER_REPOSITORY,
    useClass: PrismaUserRepository,
  },
  {
    provide: AUTH_SERVICE,
    useClass: AuthService,
  },
  {
    provide: SHARED_TOKEN_SERVICE,
    useClass: TokenService,
  },

  {
    provide: AUTH_REPOSITORY,
    useClass: AuthPrismaRepository,
  },
  {
    provide: SHARED_ROLE_REPOSITORY,
    useClass: RolePrismaRepository,
  },
  PasswordService,
  RefreshTokenRepository,
];
@Module({
  imports: [EmailModule, JwtModule],
  controllers: [AuthController],
  providers: dependencies,
})
export class AuthModule {}
