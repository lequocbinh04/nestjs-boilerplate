import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { VerificationCodeRepository } from './verification-code.repository';
import { TypeOfVerificationCodeType } from './verification-code.type';

@Injectable()
export class VerificationCodeService {
  constructor(private readonly verificationCodeRepository: VerificationCodeRepository) {}

  generateOTP(): string {
    return String(randomInt(100000, 1000000)); // generate 6 digits random number
  }

  validateVerificationCode({
    email,
    type,
    code,
  }: {
    email: string;
    type: TypeOfVerificationCodeType;
    code: string;
  }) {
    return this.verificationCodeRepository.validateVerificationCode({ email, type, code });
  }

  async createVerificationCode(
    email: string,
    type: TypeOfVerificationCodeType,
    expiresAt: ms.StringValue,
  ) {
    const otp = this.generateOTP();

    const verifycationCode = await this.verificationCodeRepository.createVerificationCode(
      email,
      otp,
      type,
      expiresAt,
    );
    return verifycationCode;
  }

  deleteVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string;
            type: TypeOfVerificationCodeType;
          };
        },
  ): Promise<void> {
    return this.verificationCodeRepository.deleteVerificationCode(uniqueValue);
  }
}
