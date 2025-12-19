import { AppError } from '@common/exceptions/app-error';
import { HttpStatus } from '@nestjs/common';

export const ErrEmailAlreadyExists = AppError.from(
  new Error('Email already exists'),
  HttpStatus.CONFLICT,
  'EMAIL_ALREADY_EXISTS',
);

export const ErrEmailNotExists = AppError.from(
  new Error('Email not exists'),
  HttpStatus.NOT_FOUND,
  'EMAIL_NOT_EXISTS',
);

export const ErrInvalidCredentials = AppError.from(
  new Error('Invalid email or password'),
  HttpStatus.UNAUTHORIZED,
  'INVALID_CREDENTIALS',
);
export const ErrEmailNotVerified = AppError.from(
  new Error('Email not verified'),
  HttpStatus.FORBIDDEN,
  'EMAIL_NOT_VERIFIED',
);
