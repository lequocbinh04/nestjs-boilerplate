import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "@shared/database/prisma.service";
import { PrismaUserRepository } from "@features/users/repositories/user.repository";
import { UserEntity } from "@features/users/entities/user.entity";

describe("PrismaUserRepository", () => {
  let repository: PrismaUserRepository;
  let prisma: any;

  const mockPrismaUser = {
    id: "user-123",
    email: "test@example.com",
    password: "hashedPassword",
    name: "Test User",
    emailVerified: false,
    emailVerifiedAt: null,
    emailVerificationToken: "token-123",
    emailVerificationExpires: new Date(Date.now() + 86400000),
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        create: jest.fn().mockResolvedValue(mockPrismaUser),
        findUnique: jest.fn().mockResolvedValue(mockPrismaUser),
        findFirst: jest.fn().mockResolvedValue(mockPrismaUser),
        update: jest.fn().mockResolvedValue(mockPrismaUser),
        delete: jest.fn().mockResolvedValue(mockPrismaUser),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createData = {
        email: "newuser@example.com",
        password: "hashedPassword",
        name: "New User",
      };

      prisma.user.create.mockResolvedValue(mockPrismaUser);

      const result = await repository.create(createData);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.email).toBe(mockPrismaUser.email);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: createData });
    });

    it("should create user without name", async () => {
      const createData = {
        email: "newuser@example.com",
        password: "hashedPassword",
      };

      const userWithoutName = { ...mockPrismaUser, name: null };
      prisma.user.create.mockResolvedValue(userWithoutName);

      const result = await repository.create(createData);

      expect(result.name).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      prisma.user.findUnique.mockResolvedValue(mockPrismaUser);

      const result = await repository.findById("user-123");

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe("user-123");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("should return null if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      prisma.user.findUnique.mockResolvedValue(mockPrismaUser);

      const result = await repository.findByEmail("test@example.com");

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.email).toBe("test@example.com");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return null if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should be case sensitive", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await repository.findByEmail("TEST@EXAMPLE.COM");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "TEST@EXAMPLE.COM" },
      });
    });
  });

  describe("findByEmailVerificationToken", () => {
    it("should find user by verification token", async () => {
      prisma.user.findFirst.mockResolvedValue(mockPrismaUser);

      const result = await repository.findByEmailVerificationToken("token-123");

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.emailVerificationToken).toBe("token-123");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { emailVerificationToken: "token-123" },
      });
    });

    it("should return null if token not found", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result =
        await repository.findByEmailVerificationToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("findByPasswordResetToken", () => {
    it("should find user by password reset token", async () => {
      const userWithResetToken = {
        ...mockPrismaUser,
        passwordResetToken: "reset-token-123",
      };
      prisma.user.findFirst.mockResolvedValue(userWithResetToken);

      const result =
        await repository.findByPasswordResetToken("reset-token-123");

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.passwordResetToken).toBe("reset-token-123");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { passwordResetToken: "reset-token-123" },
      });
    });

    it("should return null if token not found", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByPasswordResetToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update user data", async () => {
      const updateData = { name: "Updated Name" };
      const updatedUser = { ...mockPrismaUser, name: "Updated Name" };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update("user-123", updateData);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.name).toBe("Updated Name");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: updateData,
      });
    });

    it("should update multiple fields", async () => {
      const updateData = {
        name: "New Name",
        emailVerified: true,
        passwordResetToken: null,
      };
      const updatedUser = { ...mockPrismaUser, ...updateData };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update("user-123", updateData);

      expect(result.emailVerified).toBe(true);
      expect(result.name).toBe("New Name");
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      prisma.user.delete.mockResolvedValue(mockPrismaUser);

      await repository.delete("user-123");

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });
  });

  describe("setEmailVerificationToken", () => {
    it("should set email verification token and expiration", async () => {
      const token = "new-verification-token";
      const expiresAt = new Date(Date.now() + 86400000);
      prisma.user.update.mockResolvedValue(mockPrismaUser);

      await repository.setEmailVerificationToken("user-123", token, expiresAt);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          emailVerificationToken: token,
          emailVerificationExpires: expiresAt,
        },
      });
    });
  });

  describe("setPasswordResetToken", () => {
    it("should set password reset token and expiration", async () => {
      const token = "password-reset-token";
      const expiresAt = new Date(Date.now() + 3600000);
      prisma.user.update.mockResolvedValue(mockPrismaUser);

      await repository.setPasswordResetToken("user-123", token, expiresAt);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          passwordResetToken: token,
          passwordResetExpires: expiresAt,
        },
      });
    });
  });

  describe("verifyEmail", () => {
    it("should verify user email", async () => {
      const verifiedUser = {
        ...mockPrismaUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      };
      prisma.user.update.mockResolvedValue(verifiedUser);

      await repository.verifyEmail("user-123");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
    });
  });
});
