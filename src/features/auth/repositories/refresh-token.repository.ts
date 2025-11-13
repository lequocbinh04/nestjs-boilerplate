import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, hashedToken: string, jti: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        jti,
        expiresAt,
      },
    });
  }

  async findByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({
      where: { jti },
    });
  }

  async deleteByJti(jti: string) {
    await this.prisma.refreshToken.delete({
      where: { jti },
    });
  }

  async deleteByUserId(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
