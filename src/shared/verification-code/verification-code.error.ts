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

export const ErrOTPSpam = AppError.from(
  new Error('Too many OTP requests, please wait a minute before requesting again'),
  HttpStatus.TOO_MANY_REQUESTS,
  'TOO_MANY_OTP_REQUESTS',
);
