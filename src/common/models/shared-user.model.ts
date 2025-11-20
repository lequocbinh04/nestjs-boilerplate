import { UserStatus } from '@common/constants/auth.constant';
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  // phoneNumber: z.string().min(9).max(15).nullable(),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  emailVerified: z.boolean().default(false),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
  roleId: z.number().positive(),

  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserType = z.infer<typeof UserSchema>;
