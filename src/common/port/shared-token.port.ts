import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
} from '@common/types/jwt.type';

export interface ITokenService {
  signAccessToken(payload: AccessTokenPayloadCreate): string;
  signRefreshToken(payload: RefreshTokenPayloadCreate): string;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  generateTokens({
    userId,
    deviceId,
    roleId,
    roleName,
  }: Omit<AccessTokenPayloadCreate, 'jti'>): Promise<{
    accessToken: string;
    refreshToken: string;
    jti: string;
  }>;
}
