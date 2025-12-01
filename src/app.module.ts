import { SHARED_REFRESH_TOKEN_REPOSITORY, SHARED_TOKEN_SERVICE } from '@common/di-token';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';
import { AccessTokenGuard } from '@common/guards/access-token.guard';
import { AuthenticationGuard } from '@common/guards/authentication.guard';
import { PaymentAPIKeyGuard } from '@common/guards/payment-api-key.guard';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import CustomZodValidationPipe from '@common/pipes/custom-zod-validation.pipe';
import { RefreshTokenRepository } from '@common/repositories/shared-refresh-token.repository';
import { TokenService } from '@common/services/token.service';
import { validateEnv } from '@config/env.config';
import { AuthModule } from '@features/auth/auth.module';
import { HealthModule } from '@features/health/health.module';
import { UsersModule } from '@features/users/users.module';
import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '@shared/shared.module';
import { ClsModule } from 'nestjs-cls';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      envFilePath: ['.env'],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [createKeyv(process.env.REDIS_URL)],
        };
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => req.headers['X-Request-Id'] ?? uuidv4(),
      },
    }),
    HealthModule,
    SharedModule,

    // Routes
    AuthModule,
    UsersModule,
    JwtModule,
  ],
  providers: [
    {
      provide: SHARED_TOKEN_SERVICE,
      useClass: TokenService,
    },
    {
      provide: SHARED_REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    AccessTokenGuard,
    PaymentAPIKeyGuard,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
})
export class AppModule {}
