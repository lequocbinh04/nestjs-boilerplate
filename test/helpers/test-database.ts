import { PrismaClient } from '@prisma/client';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async cleanup() {
    // Order matters due to foreign key constraints
    await this.prisma.revokedToken.deleteMany({});
    await this.prisma.refreshToken.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  getPrisma() {
    return this.prisma;
  }
}
