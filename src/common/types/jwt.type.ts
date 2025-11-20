export interface AccessTokenPayloadCreate {
  userId: number;
  deviceId: number;
  roleId: number;
  roleName: string;
  jti: string;
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  exp: number;
  iat: number;
}

export interface RefreshTokenPayloadCreate {
  userId: number;
  jti: string;
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number;
  iat: number;
}
