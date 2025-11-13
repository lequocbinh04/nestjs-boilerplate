import { NotFoundException } from '@common/exceptions/base.exception';
import { UserRepository } from '@features/users/repositories/user.repository.interface';
import { UserService } from '@features/users/services/user.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isEmailVerificationValid: jest.fn(),
    isPasswordResetValid: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user information', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
