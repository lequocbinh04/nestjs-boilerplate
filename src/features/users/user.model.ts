import { UserSchema } from '@common/models/shared-user.model';

export const GetMeResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
  deletedAt: true,
  deletedById: true,
  createdById: true,
  updatedById: true,
  updatedAt: true,
});
