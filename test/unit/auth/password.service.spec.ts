import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '@features/auth/services/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123';
      const hashed = await service.hash(password);
      const result = await service.compare(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashed = await service.hash(password);
      const result = await service.compare(wrongPassword, hashed);

      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hashed = await service.hash(password);
      const result = await service.compare('testpassword123', hashed);

      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashed = await service.hash(password);
      const result = await service.compare('', hashed);

      expect(result).toBe(true);
    });
  });

  describe('generateRandomToken', () => {
    it('should generate token with default length of 32', () => {
      const token = service.generateRandomToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(32);
    });

    it('should generate token with custom length', () => {
      const length = 64;
      const token = service.generateRandomToken(length);

      expect(token.length).toBe(length);
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateRandomToken();
      const token2 = service.generateRandomToken();

      expect(token1).not.toBe(token2);
    });

    it('should only contain alphanumeric characters', () => {
      const token = service.generateRandomToken(100);
      const alphanumericRegex = /^[A-Za-z0-9]+$/;

      expect(alphanumericRegex.test(token)).toBe(true);
    });

    it('should handle length of 1', () => {
      const token = service.generateRandomToken(1);

      expect(token.length).toBe(1);
    });
  });
});
