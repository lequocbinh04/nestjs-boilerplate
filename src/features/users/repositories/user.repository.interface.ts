import { UserEntity } from '../entities/user.entity';

export abstract class UserRepository {
  abstract create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<UserEntity>;

  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByEmailVerificationToken(token: string): Promise<UserEntity | null>;
  abstract findByPasswordResetToken(token: string): Promise<UserEntity | null>;

  abstract update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  abstract delete(id: string): Promise<void>;

  abstract setEmailVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;

  abstract setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;

  abstract verifyEmail(userId: string): Promise<void>;
}
