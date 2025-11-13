import { RevokedTokenRepository } from '@features/auth/repositories/revoked-token.repository';
import { TokenService } from '@features/auth/services/token.service';
import { TokenRevocationService } from '@features/auth/services/token-revocation.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@shared/redis/redis.service';

describe('TokenRevocationService', () => {
  let service: TokenRevocationService;
  let _redisService: RedisService;
  let _revokedTokenRepo: RevokedTokenRepository;
  let _tokenService: TokenService;

  const mockRedisService = {
    set: jest.fn().mockResolvedValue('OK'),
    exists: jest.fn().mockResolvedValue(0),
    del: jest.fn().mockResolvedValue(1),
  };

  const mockRevokedTokenRepo = {
    create: jest.fn().mockResolvedValue(undefined),
    isRevoked: jest.fn().mockResolvedValue(false),
    findByJti: jest.fn().mockResolvedValue(null),
  };

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'user-123',
      email: 'test@example.com',
      jti: 'jti-123',
      type: 'access',
    }),
    verifyRefreshToken: jest.fn().mockResolvedValue({
      sub: 'user-123',
      email: 'test@example.com',
      jti: 'jti-456',
      type: 'refresh',
    }),
    getTokenExpiration: jest.fn().mockReturnValue(900), // 15 minutes
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_TOKEN_EXPIRATION: '15m',
        JWT_REFRESH_TOKEN_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRevocationService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: RevokedTokenRepository, useValue: mockRevokedTokenRepo },
        { provide: TokenService, useValue: mockTokenService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenRevocationService>(TokenRevocationService);
    redisService = module.get<RedisService>(RedisService);
    revokedTokenRepo = module.get<RevokedTokenRepository>(RevokedTokenRepository);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('revokeToken', () => {
    it('should revoke token in both Redis and database', async () => {
      const jti = 'jti-123';
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 900000); // 15 minutes from now
      const reason = 'logout';

      await service.revokeToken(jti, userId, expiresAt, reason);

      expect(mockRedisService.set).toHaveBeenCalledWith(`revoked:${jti}`, '1', expect.any(Number));
      expect(mockRevokedTokenRepo.create).toHaveBeenCalledWith(userId, jti, expiresAt, reason);
    });

    it('should calculate TTL correctly', async () => {
      const jti = 'jti-123';
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 60000); // 1 minute from now

      await service.revokeToken(jti, userId, expiresAt);

      const setCall = mockRedisService.set.mock.calls[0];
      const ttl = setCall[2];

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should not set Redis TTL for expired token', async () => {
      const jti = 'jti-123';
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      await service.revokeToken(jti, userId, expiresAt);

      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockRevokedTokenRepo.create).toHaveBeenCalled();
    });

    it('should handle revocation without reason', async () => {
      const jti = 'jti-123';
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 900000);

      await service.revokeToken(jti, userId, expiresAt);

      expect(mockRevokedTokenRepo.create).toHaveBeenCalledWith(userId, jti, expiresAt, undefined);
    });
  });

  describe('isRevoked', () => {
    it('should return true if token is in Redis', async () => {
      mockRedisService.exists.mockResolvedValueOnce(1);

      const result = await service.isRevoked('jti-123');

      expect(result).toBe(true);
      expect(mockRedisService.exists).toHaveBeenCalledWith('revoked:jti-123');
      expect(mockRevokedTokenRepo.isRevoked).not.toHaveBeenCalled();
    });

    it('should check database if not in Redis', async () => {
      mockRedisService.exists.mockResolvedValueOnce(0);
      mockRevokedTokenRepo.isRevoked.mockResolvedValueOnce(true);

      const result = await service.isRevoked('jti-123');

      expect(result).toBe(true);
      expect(mockRedisService.exists).toHaveBeenCalledWith('revoked:jti-123');
      expect(mockRevokedTokenRepo.isRevoked).toHaveBeenCalledWith('jti-123');
    });

    it('should return false if token is not revoked', async () => {
      mockRedisService.exists.mockResolvedValueOnce(0);
      mockRevokedTokenRepo.isRevoked.mockResolvedValueOnce(false);

      const result = await service.isRevoked('jti-123');

      expect(result).toBe(false);
    });
  });

  describe('revokeAccessToken', () => {
    it('should revoke access token correctly', async () => {
      const accessToken = 'valid-access-token';
      const userId = 'user-123';
      const reason = 'logout';

      await service.revokeAccessToken(accessToken, userId, reason);

      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(accessToken);
      expect(mockTokenService.getTokenExpiration).toHaveBeenCalledWith('15m');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRevokedTokenRepo.create).toHaveBeenCalled();
    });

    it('should handle revocation without reason', async () => {
      const accessToken = 'valid-access-token';
      const userId = 'user-123';

      await service.revokeAccessToken(accessToken, userId);

      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(accessToken);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token correctly', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-123';
      const reason = 'security';

      mockTokenService.getTokenExpiration.mockReturnValueOnce(604800); // 7 days

      await service.revokeRefreshToken(refreshToken, userId, reason);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockTokenService.getTokenExpiration).toHaveBeenCalledWith('7d');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRevokedTokenRepo.create).toHaveBeenCalled();
    });

    it('should handle revocation without reason', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-123';

      await service.revokeRefreshToken(refreshToken, userId);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });
});
