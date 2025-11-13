export class UserEntity {
  id: string;
  email: string;
  password: string;
  name: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  isEmailVerificationValid(): boolean {
    if (!this.emailVerificationToken || !this.emailVerificationExpires) {
      return false;
    }
    return new Date() < this.emailVerificationExpires;
  }

  isPasswordResetValid(): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return false;
    }
    return new Date() < this.passwordResetExpires;
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}
