import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    jti: string;
  };
}

export interface RefreshTokenRequest extends Request {
  user: {
    userId: string;
    email: string;
    jti: string;
    refreshToken: string;
  };
}
