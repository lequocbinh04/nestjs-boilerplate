import { IsPublic } from '@common/decorators/auth.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisHealthIndicator } from '@shared/redis/redis.health';

@ApiTags('Health')
@Controller('health')
@IsPublic()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Overall health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prismaService),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check' })
  checkDatabase() {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prismaService)]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check' })
  checkRedisHealth() {
    return this.health.check([() => this.redisHealth.isHealthy('redis')]);
  }
}
