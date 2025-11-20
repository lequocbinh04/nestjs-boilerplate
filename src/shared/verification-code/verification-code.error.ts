import { UnprocessableEntityException } from '@nestjs/common';

export const InvalidOTPException = new UnprocessableEntityException([
  {
    code: 'Error.InvalidOTP',
    message: 'Invalid OTP',
    path: 'code',
  },
]);

export const OTPExpiredException = new UnprocessableEntityException([
  {
    code: 'Error.OTPExpired',
    message: 'OTP has expired',
    path: 'code',
  },
]);
