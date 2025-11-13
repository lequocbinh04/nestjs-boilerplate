import { TokenService } from '@features/auth/services/token.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret-key-min-32-characters',
        JWT_ACCESS_TOKEN_EXPIRATION: '15m',
        JWT_REFRESH_TOKEN_SECRET: 'test-refresh-secret-min-32-chars',
        JWT_REFRESH_TOKEN_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        JwtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);

      expect(tokenPair).toBeDefined();
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.accessTokenJti).toBeDefined();
      expect(tokenPair.refreshTokenJti).toBeDefined();
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
    });

    it('should generate unique JTIs for access and refresh tokens', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);

      expect(tokenPair.accessTokenJti).not.toBe(tokenPair.refreshTokenJti);
    });

    it('should include correct payload in access token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);
      const decoded = jwtService.decode(tokenPair.accessToken);

      expect(decoded.sub).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('access');
      expect(decoded.jti).toBe(tokenPair.accessTokenJti);
    });

    it('should include correct payload in refresh token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);
      const decoded = jwtService.decode(tokenPair.refreshToken);

      expect(decoded.sub).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('refresh');
      expect(decoded.jti).toBe(tokenPair.refreshTokenJti);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);
      const payload = await service.verifyAccessToken(tokenPair.accessToken);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.type).toBe('access');
    });

    it('should throw error for invalid token', async () => {
      await expect(service.verifyAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error for empty token', async () => {
      await expect(service.verifyAccessToken('')).rejects.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);
      const payload = await service.verifyRefreshToken(tokenPair.refreshToken);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.type).toBe('refresh');
    });

    it('should throw error for invalid token', async () => {
      await expect(service.verifyRefreshToken('invalid-token')).rejects.toThrow();
    });

    it('should not verify access token as refresh token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);

      // Access token should fail when verified as refresh token
      await expect(service.verifyRefreshToken(tokenPair.accessToken)).rejects.toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const tokenPair = await service.generateTokenPair(userId, email);
      const decoded = service.decodeToken(tokenPair.accessToken);

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(userId);
      expect(decoded.email).toBe(email);
    });

    it('should decode expired token', () => {
      // Manually create an expired token payload
      const expiredToken = jwtService.sign(
        { sub: 'user-123', email: 'test@example.com' },
        { secret: 'test-secret-key-min-32-characters', expiresIn: '-1s' },
      );

      const decoded = service.decodeToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('user-123');
    });
  });

  describe('getTokenExpiration', () => {
    it('should parse seconds correctly', () => {
      const seconds = service.getTokenExpiration('30s');
      expect(seconds).toBe(30);
    });

    it('should parse minutes correctly', () => {
      const seconds = service.getTokenExpiration('15m');
      expect(seconds).toBe(900); // 15 * 60
    });

    it('should parse hours correctly', () => {
      const seconds = service.getTokenExpiration('2h');
      expect(seconds).toBe(7200); // 2 * 3600
    });

    it('should parse days correctly', () => {
      const seconds = service.getTokenExpiration('7d');
      expect(seconds).toBe(604800); // 7 * 86400
    });

    it('should return default for invalid format', () => {
      const seconds = service.getTokenExpiration('invalid');
      expect(seconds).toBe(900); // default 15 min
    });

    it('should return default for empty string', () => {
      const seconds = service.getTokenExpiration('');
      expect(seconds).toBe(900);
    });
  });
});
