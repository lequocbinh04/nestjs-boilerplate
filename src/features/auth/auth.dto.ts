import { createZodDto } from 'nestjs-zod';
import {
  LoginBodySchema,
  LoginResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  ResendOTPVerifyEmailSchema,
  VerifyEmailSchema,
} from './auth.model';

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResDTO extends createZodDto(LoginResSchema) {}

export class VerifyEmailBodyDTO extends createZodDto(VerifyEmailSchema) {}
export class ResendOTPVerifyEmailBodyDTO extends createZodDto(ResendOTPVerifyEmailSchema) {}
