import { AppError } from '@common/exceptions/app-error';
import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';

export const ErrInvalidOTP = AppError.from(
  new Error('Invalid OTP'),
  HttpStatus.UNPROCESSABLE_ENTITY,
  'INVALID_OTP',
);

export const ErrOTPExpired = AppError.from(
  new Error('OTP has expired'),
  HttpStatus.UNPROCESSABLE_ENTITY,
  'OTP_EXPIRED',
);
