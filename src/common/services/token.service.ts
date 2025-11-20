import { ITokenService } from '@common/port/shared-token.port';
import { RefreshTokenRepository } from '@common/repositories/shared-refresh-token.repository';
import { EnvConfig } from '@config/env.config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
} from '../types/jwt.type';

@Injectable()
export class TokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService<EnvConfig>,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  signAccessToken(payload: AccessTokenPayloadCreate) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
    });
  }

  signRefreshToken(payload: RefreshTokenPayloadCreate) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });
  }

  async generateTokens({
    userId,
    deviceId,
    roleId,
    roleName,
  }: Omit<AccessTokenPayloadCreate, 'jti'>) {
    const jti = uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
        jti,
      }),
      this.signRefreshToken({
        userId,
        jti,
      }),
    ]);

    const decodedRefreshToken = await this.verifyRefreshToken(refreshToken);
    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
      jti,
    });
    return { accessToken, refreshToken, jti };
  }
}
