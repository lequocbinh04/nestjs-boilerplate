import { SerializeAll } from '@common/decorators/serializers.decorator';
import { RoleType } from '@common/models/shared-role.model';
import { UserType } from '@common/models/shared-user.model';
import { ISharedUserRepository } from '@common/port/shared-user.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
@SerializeAll()
export class PrismaUserRepository implements ISharedUserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserType> {
    const user = await this.prisma.user.create({
      data,
      omit: {
        password: true,
        totpSecret: true,
      },
    });
    return user as unknown as UserType;
  }

  async findById(id: number): Promise<UserType | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return (user as unknown as UserType) ?? null;
  }

  async findByEmail(email: string): Promise<UserType | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return (user as unknown as UserType) ?? null;
  }

  async findByEmailIncludeRole(email: string): Promise<(UserType & { role: RoleType }) | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });
    return (user as unknown as UserType & { role: RoleType }) ?? null;
  }

  async update(id: number, data: Partial<UserType>): Promise<UserType> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return user as unknown as UserType;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async verifyEmail(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }
}
