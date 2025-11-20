import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import { InvalidOTPException, OTPExpiredException } from './verification-code.error';
import { TypeOfVerificationCodeType } from './verification-code.type';

@Injectable()
export class VerificationCodeRepository {
  constructor(private prisma: PrismaService) {}

  async validateVerificationCode({
    email,
    type,
    code,
  }: {
    email: string;
    type: TypeOfVerificationCodeType;
    code: string;
  }) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        type,
      },
    });

    if (!verificationCode || verificationCode.code !== code) {
      throw InvalidOTPException;
    }

    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException;
    }

    return verificationCode;
  }

  async createVerificationCode(
    email: string,
    otp: string,
    type: TypeOfVerificationCodeType,
    expiresAt: ms.StringValue,
  ): Promise<{ id: number; email: string; code: string }> {
    const verificationCode = await this.prisma.verificationCode.create({
      data: {
        email,
        type,
        code: otp,
        expiresAt: addMilliseconds(new Date(), ms(expiresAt)).toISOString(),
      },
    });

    return verificationCode;
  }

  async deleteVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string;
            type: TypeOfVerificationCodeType;
          };
        },
  ): Promise<void> {
    await this.prisma.verificationCode.delete({
      where: uniqueValue,
    });
  }
}
