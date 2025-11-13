import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { TestDatabase } from '../../helpers/test-database';

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await testDb.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await testDb.cleanup();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123',
          name: 'New User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Registration successful');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      // First registration
      await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should register user without name field', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'Password123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'loginuser@example.com',
        password: 'Password123',
        name: 'Login User',
      });

      // Manually verify user in database
      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'loginuser@example.com' },
        data: { emailVerified: true },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'Password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('loginuser@example.com');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/verify-email', () => {
    let verificationToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'verify@example.com',
        password: 'Password123',
      });

      // Get verification token from database
      const prisma = testDb.getPrisma();
      const user = await prisma.user.findUnique({
        where: { email: 'verify@example.com' },
      });
      verificationToken = user?.emailVerificationToken || '';
    });

    it('should verify email with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('verified successfully');

      // Verify in database
      const prisma = testDb.getPrisma();
      const user = await prisma.user.findUnique({
        where: { email: 'verify@example.com' },
      });
      expect(user?.emailVerified).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should return 400 for expired token', async () => {
      // Update token expiration to past
      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'verify@example.com' },
        data: { emailVerificationExpires: new Date(Date.now() - 1000) },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'forgot@example.com',
        password: 'Password123',
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset link has been sent');

      // Verify token was set in database
      const prisma = testDb.getPrisma();
      const user = await prisma.user.findUnique({
        where: { email: 'forgot@example.com' },
      });
      expect(user?.passwordResetToken).toBeDefined();
    });

    it('should return generic message for non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset link has been sent');
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'reset@example.com',
        password: 'OldPassword123',
      });

      await request(app.getHttpServer()).post('/auth/forgot-password').send({
        email: 'reset@example.com',
      });

      const prisma = testDb.getPrisma();
      const user = await prisma.user.findUnique({
        where: { email: 'reset@example.com' },
      });
      resetToken = user?.passwordResetToken || '';

      // Verify email to allow login
      await prisma.user.update({
        where: { email: 'reset@example.com' },
        data: { emailVerified: true },
      });
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword456';

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset successfully');

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'reset@example.com',
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeDefined();
    });

    it('should not login with old password after reset', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword456',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'OldPassword123',
        })
        .expect(401);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for expired token', async () => {
      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'reset@example.com' },
        data: { passwordResetExpires: new Date(Date.now() - 1000) },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'refresh@example.com',
        password: 'Password123',
      });

      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'refresh@example.com' },
        data: { emailVerified: true },
      });

      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'refresh@example.com',
        password: 'Password123',
      });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should not reuse old refresh token after refresh', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      // Try to use old refresh token again
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/revoke', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'revoke@example.com',
        password: 'Password123',
      });

      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'revoke@example.com' },
        data: { emailVerified: true },
      });

      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'revoke@example.com',
        password: 'Password123',
      });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should revoke token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/revoke')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('revoked successfully');
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer()).post('/auth/revoke').expect(401);
    });

    it('should not access protected routes after revoke', async () => {
      await request(app.getHttpServer())
        .post('/auth/revoke')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('GET /users/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'me@example.com',
        password: 'Password123',
        name: 'Me User',
      });

      const prisma = testDb.getPrisma();
      await prisma.user.update({
        where: { email: 'me@example.com' },
        data: { emailVerified: true },
      });

      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'me@example.com',
        password: 'Password123',
      });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@example.com');
      expect(response.body.data.name).toBe('Me User');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
