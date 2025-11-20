import { Global, Module } from '@nestjs/common';
import { VerificationCodeModule } from '@shared/verification-code/verification-code.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { RedisModule } from './redis/redis.module';

const sharedModules = [DatabaseModule, LoggerModule, RedisModule, VerificationCodeModule];

@Global()
@Module({
  imports: sharedModules,
  exports: sharedModules,
})
export class SharedModule {}
