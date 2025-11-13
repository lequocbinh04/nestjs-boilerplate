import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from './user.repository.interface';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async create(data: { email: string; password: string; name?: string }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data,
    });
    return new UserEntity(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? new UserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? new UserEntity(user) : null;
  }

  async findByEmailVerificationToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
    return user ? new UserEntity(user) : null;
  }

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token },
    });
    return user ? new UserEntity(user) : null;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return new UserEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    });
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }
}
