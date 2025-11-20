import { SerializeAll } from '@common/decorators/serializers.decorator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
@SerializeAll()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    token: string;
    userId: number;
    deviceId: number;
    expiresAt: Date;
    jti: string;
  }) {
    return this.prisma.refreshToken.create({
      data,
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

  async deleteByUserId(userId: number) {
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
