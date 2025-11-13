import { EnvConfig } from '@config/env.config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@shared/redis/redis.service';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { TokenService } from './token.service';

@Injectable()
export class TokenRevocationService {
  constructor(
    private redisService: RedisService,
    private revokedTokenRepo: RevokedTokenRepository,
    private tokenService: TokenService,
    private configService: ConfigService<EnvConfig>,
  ) {}

  async revokeToken(jti: string, userId: string, expiresAt: Date, reason?: string): Promise<void> {
    const now = new Date();
    const ttl = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    if (ttl > 0) {
      await this.redisService.set(`revoked:${jti}`, '1', ttl);
    }

    await this.revokedTokenRepo.create(userId, jti, expiresAt, reason);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const inRedis = await this.redisService.exists(`revoked:${jti}`);
    if (inRedis) {
      return true;
    }

    return this.revokedTokenRepo.isRevoked(jti);
  }

  async revokeAccessToken(accessToken: string, userId: string, reason?: string) {
    const payload = await this.tokenService.verifyAccessToken(accessToken);
    const expiration = this.tokenService.getTokenExpiration(
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
    );
    const expiresAt = new Date(Date.now() + expiration * 1000);

    await this.revokeToken(payload.jti, userId, expiresAt, reason);
  }

  async revokeRefreshToken(refreshToken: string, userId: string, reason?: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const expiration = this.tokenService.getTokenExpiration(
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION') || '7d',
    );
    const expiresAt = new Date(Date.now() + expiration * 1000);

    await this.revokeToken(payload.jti, userId, expiresAt, reason);
  }
}
