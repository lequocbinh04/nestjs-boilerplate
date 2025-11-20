import { Global, Module } from '@nestjs/common';
import { VerificationCodeRepository } from './verification-code.repository';
import { VerificationCodeService } from './verification-code.service';

@Global()
@Module({
  providers: [VerificationCodeRepository, VerificationCodeService],
  exports: [VerificationCodeRepository, VerificationCodeService],
})
export class VerificationCodeModule {}
