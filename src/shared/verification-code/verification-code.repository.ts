import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import { ErrInvalidOTP, ErrOTPExpired, ErrOTPSpam } from './verification-code.error';
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
      throw ErrInvalidOTP;
    }

    if (verificationCode.expiresAt < new Date()) {
      throw ErrOTPExpired;
    }

    return verificationCode;
  }

  async findExistingVerificationCode(email: string, type: TypeOfVerificationCodeType) {
    return this.prisma.verificationCode.findFirst({
      where: {
        email,
        type,
      },
    });
  }

  async createVerificationCode(
    email: string,
    otp: string,
    type: TypeOfVerificationCodeType,
    expiresAt: ms.StringValue,
  ): Promise<{ id: number; email: string; code: string }> {
    const verificationCode = await this.prisma.verificationCode.upsert({
      where: {
        email_type: {
          email,
          type,
        },
      },
      update: {
        code: otp,
        expiresAt: addMilliseconds(new Date(), ms(expiresAt)).toISOString(),
        createdAt: new Date(),
      },
      create: {
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
