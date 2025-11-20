import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import CustomZodValidationPipe from '@common/pipes/custom-zod-validation.pipe';
import { validateEnv } from '@config/env.config';
import { AuthModule } from '@features/auth/auth.module';
import { HealthModule } from '@features/health/health.module';
import { UsersModule } from '@features/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { SharedModule } from '@shared/shared.module';
import { ZodSerializerInterceptor } from 'nestjs-zod';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      envFilePath: ['.env'],
    }),
    HealthModule,
    SharedModule,

    // Routes
    AuthModule,
    UsersModule,
  ],
  providers: [
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
  ],
})
export class AppModule {}
