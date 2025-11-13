import { z } from 'zod';

export const EnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('NestJS Auth Boilerplate'),
  APP_URL: z.string().url('Invalid APP_URL').default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string().default('7d'),

  // Email
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email('Invalid RESEND_FROM_EMAIL').optional(),

  // Email Verification
  EMAIL_VERIFICATION_REQUIRED: z.coerce.boolean().default(true),
  EMAIL_VERIFICATION_TOKEN_EXPIRATION: z.string().default('24h'),

  // Password Reset
  PASSWORD_RESET_TOKEN_EXPIRATION: z.string().default('1h'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  try {
    return EnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}
