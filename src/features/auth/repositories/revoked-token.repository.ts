import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
export class RevokedTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, jti: string, expiresAt: Date, reason?: string) {
    return this.prisma.revokedToken.create({
      data: {
        userId,
        jti,
        expiresAt,
        reason,
      },
    });
  }

  async findByJti(jti: string) {
    return this.prisma.revokedToken.findUnique({
      where: { jti },
    });
  }

  async isRevoked(jti: string): Promise<boolean> {
    const token = await this.findByJti(jti);
    return !!token;
  }

  async deleteExpired() {
    await this.prisma.revokedToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
