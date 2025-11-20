import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    jti: string;
  };
}

export interface RefreshTokenRequest extends Request {
  user: {
    userId: number;
    email: string;
    jti: string;
    refreshToken: string;
  };
}
