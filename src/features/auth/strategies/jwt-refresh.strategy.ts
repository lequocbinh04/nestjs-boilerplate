import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvConfig } from '@config/env.config';
import { TokenPayload } from '../services/token.service';
import { TokenRevocationService } from '../services/token-revocation.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService<EnvConfig>,
    private tokenRevocationService: TokenRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: TokenPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const isRevoked = await this.tokenRevocationService.isRevoked(payload.jti);
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    return {
      userId: payload.sub,
      email: payload.email,
      jti: payload.jti,
      refreshToken,
    };
  }
}
