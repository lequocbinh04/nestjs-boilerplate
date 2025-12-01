import { AppError } from '@common/exceptions/app-error';
import { UserSchema } from '@common/models/shared-user.model';
import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';

export const ErrEmailAlreadyExists = AppError.from(
  new Error('Email already exists'),
  HttpStatus.CONFLICT,
  'EMAIL_ALREADY_EXISTS',
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

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      });
    }
  });

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
  deletedAt: true,
  deletedById: true,
  createdById: true,
  updatedById: true,
  updatedAt: true,
});

export const LoginBodySchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: RegisterResSchema,
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.email('Invalid email format'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  isActive: z.boolean(),
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type DeviceType = z.infer<typeof DeviceSchema>;
