import { randomUUID } from 'node:crypto';
import { EnvConfig } from '@config/env.config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface TokenPayload {
  sub: string;
  email: string;
  jti: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenJti: string;
  refreshTokenJti: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<EnvConfig>,
  ) {}

  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const accessTokenJti = randomUUID();
    const refreshTokenJti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, accessTokenJti),
      this.generateRefreshToken(userId, email, refreshTokenJti),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenJti,
      refreshTokenJti,
    };
  }

  private async generateAccessToken(userId: string, email: string, jti: string): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      jti,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
    });
  }

  private async generateRefreshToken(userId: string, email: string, jti: string): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      jti,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });
  }

  decodeToken(token: string): TokenPayload | null {
    return this.jwtService.decode(token) as TokenPayload | null;
  }

  getTokenExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 min

    const value = parseInt(match[1], 10);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] || 60);
  }
}
