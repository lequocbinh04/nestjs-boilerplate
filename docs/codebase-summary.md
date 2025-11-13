# Codebase Summary

## Project Overview

NestJS authentication boilerplate implementing Clean Architecture with SOLID principles. Built for production use with comprehensive security features and testing.

**Total Files**: 65 source files
**Total Tokens**: ~33,420 tokens
**Total Chars**: ~142,061 characters

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                 │
│  (Controllers, DTOs, Decorators, Guards)   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Application Layer                  │
│     (Services, Business Logic)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Domain Layer                       │
│     (Entities, Repositories Interfaces)     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Infrastructure Layer               │
│   (Database, Email, Redis, External APIs)   │
└─────────────────────────────────────────────┘
```

### Dependency Flow

- **Controllers** → **Services** → **Repositories** → **Database**
- **Services** depend on repository interfaces, not implementations (Dependency Inversion)
- **Repositories** implement interfaces defined in domain layer
- **Infrastructure** services (email, Redis) injected via NestJS DI

## Feature Modules

### 1. Authentication Module (`src/features/auth/`)

**Purpose**: Handle user authentication, token management, and password operations

**Components**:
- `AuthController` - REST endpoints for auth operations
- `AuthService` - Core authentication logic (register, login, verify email, reset password)
- `TokenService` - JWT generation and validation
- `TokenRevocationService` - Token revocation with Redis + PostgreSQL hybrid approach
- `PasswordService` - Password hashing and validation (bcrypt)
- `JwtAccessStrategy` / `JwtRefreshStrategy` - Passport JWT strategies
- `RefreshTokenRepository` / `RevokedTokenRepository` - Token persistence

**Key Features**:
- Email verification with configurable requirement
- Password reset with time-limited tokens
- Refresh token rotation on each use
- Hybrid token revocation (Redis for performance, PostgreSQL for persistence)
- Zod validation for all DTOs

**File Count**: 14 files
**Largest File**: `auth.service.ts` (7,759 chars, 1,686 tokens)

### 2. User Module (`src/features/users/`)

**Purpose**: User management and data access

**Components**:
- `UserRepository` - User CRUD operations with Prisma
- `IUserRepository` - Repository interface (enables testing and swapping implementations)
- `User` entity - Domain model

**Design Pattern**: Repository pattern with interface segregation

**File Count**: 4 files

### 3. Health Module (`src/features/health/`)

**Purpose**: Application health monitoring

**Components**:
- `HealthController` - Health check endpoints
- Database health indicator (Prisma)
- Redis health indicator (custom)

**Endpoints**:
- `GET /health` - Overall health
- `GET /health/db` - Database connectivity
- `GET /health/redis` - Redis connectivity

**File Count**: 2 files

### 4. Email Infrastructure (`src/infrastructure/email/`)

**Purpose**: External email service integration

**Components**:
- `EmailService` - Resend API integration
- Email templates (verification, password reset)

**Key Features**:
- HTML email templates with inline styling
- Error handling and logging
- Configurable sender address

**File Count**: 4 files

## Shared Modules

### Database Module (`src/shared/database/`)

**Purpose**: Prisma ORM integration and connection management

**Components**:
- `PrismaService` - Extended PrismaClient with lifecycle hooks
- `DatabaseModule` - Global database module

**Features**:
- Automatic connection on module init
- Graceful shutdown handling
- Connection pooling via DATABASE_URL

### Redis Module (`src/shared/redis/`)

**Purpose**: Redis caching and token revocation

**Components**:
- `RedisService` - ioredis client wrapper
- `RedisHealthIndicator` - Health check integration

**Use Cases**:
- Token revocation (fast lookups)
- Session caching
- Rate limiting (future)

### Logger Module (`src/shared/logger/`)

**Purpose**: Centralized logging service

**Components**:
- `LoggerService` - NestJS logger wrapper

## Common Utilities

### Decorators (`src/common/decorators/`)

- `@IsPublic()` - Mark endpoints as public (skip JWT guard)
- `@Auth()` - Apply authentication (shorthand for guards)
- `@CurrentUser()` - Extract user from request context

### Guards (`src/common/guards/`)

- `JwtAuthGuard` - Global JWT authentication guard with public route support

### Filters (`src/common/filters/`)

- `HttpExceptionFilter` - Standardized HTTP error responses
- `PrismaExceptionFilter` - Convert Prisma errors to HTTP errors (e.g., unique constraint → 409 Conflict)

### Pipes (`src/common/pipes/`)

- `ZodValidationPipe` - Zod schema validation with automatic type inference

### Interceptors (`src/common/interceptors/`)

- `ResponseInterceptor` - Wrap all responses in standardized format:
  ```json
  {
    "success": true,
    "data": {...},
    "timestamp": "2025-11-13T...",
    "path": "/api/v1/..."
  }
  ```

## Configuration

### Environment Validation (`src/config/env.config.ts`)

**Purpose**: Type-safe environment variables with Zod validation

**Features**:
- Validates all required environment variables on startup
- Provides type inference for ConfigService
- Prevents application start with invalid configuration
- Documents expected environment variables

**Key Variables**:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` / `JWT_REFRESH_TOKEN_SECRET` - Token signing
- `RESEND_API_KEY` - Email service
- `REDIS_HOST` / `REDIS_PORT` - Cache connection
- `EMAIL_VERIFICATION_REQUIRED` - Feature toggle

### Swagger Configuration (`src/config/swagger.config.ts`)

**Purpose**: API documentation setup

**Features**:
- OpenAPI 3.0 specification
- Bearer JWT authentication
- Available at `/api/docs`

## Database Schema

### Multi-file Prisma Setup

```
prisma/
├── schema/
│   ├── base.prisma      # Generator config + datasource
│   ├── user.prisma      # User model
│   └── auth.prisma      # RefreshToken + RevokedToken
└── migrations/          # Migration history
```

**Rationale**: Separates concerns, improves maintainability for large schemas

### Models

#### User Model
```prisma
model User {
  id                       String    @id @default(cuid())
  email                    String    @unique
  password                 String
  name                     String?
  emailVerified            Boolean   @default(false)
  emailVerifiedAt          DateTime?
  emailVerificationToken   String?
  emailVerificationExpires DateTime?
  passwordResetToken       String?
  passwordResetExpires     DateTime?
  refreshTokens            RefreshToken[]
  revokedTokens            RevokedToken[]
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
}
```

**Indexes**: email, emailVerificationToken, passwordResetToken

#### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  jti       String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Purpose**: Store active refresh tokens, enable token rotation

**Indexes**: userId, jti, expiresAt (for cleanup)

#### RevokedToken Model
```prisma
model RevokedToken {
  id        String   @id @default(cuid())
  userId    String
  jti       String   @unique
  revokedAt DateTime @default(now())
  reason    String?
  expiresAt DateTime
}
```

**Purpose**: Persist revoked tokens for audit trail and Redis recovery

**Indexes**: userId, jti, expiresAt

## Key Design Decisions

### 1. Hybrid Token Revocation

**Problem**: How to handle token revocation efficiently?

**Solution**: Redis + PostgreSQL hybrid
- **Redis**: Fast in-memory lookups for active requests
- **PostgreSQL**: Persistent storage for audit trail and Redis recovery

**Trade-off**: Slight complexity for significant performance gain

### 2. Refresh Token Rotation

**Problem**: Refresh token reuse attacks

**Solution**: Rotate refresh token on each use
- Old token invalidated immediately
- New token generated with new JTI
- Prevents token replay attacks

**Implementation**: `TokenService.refreshAccessToken()`

### 3. Email Verification Toggle

**Problem**: Development vs production requirements differ

**Solution**: Configurable via `EMAIL_VERIFICATION_REQUIRED`
- **true**: Blocks login until email verified (production)
- **false**: Allow login immediately (development)

**Implementation**: Checked in `AuthService.login()`

### 4. Repository Pattern with Interfaces

**Problem**: Tight coupling to Prisma, difficult testing

**Solution**: Repository interfaces
- `IUserRepository` interface defines contract
- `UserRepository` implements with Prisma
- Services depend on interface, not implementation
- Enables mocking in tests, future ORM changes

**Example**: `UserRepository implements IUserRepository`

### 5. Zod Over class-validator

**Problem**: Need runtime validation + TypeScript types

**Solution**: Zod for DTOs
- Single source of truth for validation + types
- Type inference: `z.infer<typeof RegisterSchema>`
- Better DX than maintaining separate classes and decorators
- Custom `ZodValidationPipe` for NestJS integration

**Example**: `src/features/auth/dto/auth.dto.ts`

### 6. Multi-file Prisma Schema

**Problem**: Large single schema files become unmanageable

**Solution**: Split schema by domain
- `base.prisma` - Configuration
- `user.prisma` - User domain
- `auth.prisma` - Authentication domain

**Configuration**: `package.json` points to `prisma/schema` directory

**Benefits**:
- Logical organization
- Easier collaboration (fewer merge conflicts)
- Follows separation of concerns

### 7. Global JWT Guard with Public Routes

**Problem**: Apply auth globally but allow public endpoints

**Solution**:
- `JwtAuthGuard` set as global guard in `app.module.ts`
- `@IsPublic()` decorator bypasses guard
- Default secure (must explicitly mark public)

**Implementation**: Reflector checks for `IS_PUBLIC_KEY` metadata

### 8. Custom Exception Filters

**Problem**: Prisma errors expose internal database details

**Solution**: `PrismaExceptionFilter`
- Catches `PrismaClientKnownRequestError`
- Converts to appropriate HTTP exceptions
- Example: `P2002` (unique constraint) → `409 Conflict`

**Security**: Prevents information leakage about database structure

### 9. Response Interceptor for Consistency

**Problem**: Inconsistent API response formats

**Solution**: Global `ResponseInterceptor`
- Wraps all responses in standard envelope
- Includes metadata (timestamp, path, success flag)
- Simplifies frontend error handling

**Format**:
```json
{
  "success": true|false,
  "data": {...} | "error": {...},
  "timestamp": "ISO-8601",
  "path": "/api/v1/..."
}
```

### 10. File Size Limit (200 Lines)

**Problem**: Large files become unmaintainable

**Solution**: Strict 200-line limit per file
- Forces logical decomposition
- Improves readability and testability
- Easier code reviews

**Enforcement**: Manual review (can be automated with ESLint plugin)

## Testing Strategy

### Test Distribution

- **Unit Tests**: Service and repository layer (65% of tests)
- **Integration Tests**: API endpoints with test database (30%)
- **E2E Tests**: Full application flows (5%)

### Key Test Files

1. `test/unit/auth/auth.service.spec.ts` (16,882 chars) - AuthService unit tests
2. `test/integration/auth/auth-endpoints.spec.ts` (16,685 chars) - Auth API integration tests
3. `test/unit/users/user.repository.spec.ts` (9,015 chars) - Repository unit tests
4. `test/unit/auth/token-revocation.service.spec.ts` (7,314 chars) - Token revocation tests

### Testing Patterns

- **Mocking**: Jest mocks for external dependencies (Prisma, Redis, Email)
- **Test Database**: In-memory SQLite for integration tests
- **Factory Pattern**: Test data builders for complex entities
- **Arrange-Act-Assert**: Consistent test structure

## Performance Considerations

### Database Optimization

- **Indexes**: All foreign keys and frequently queried fields indexed
- **Connection Pooling**: Configured via `DATABASE_URL` connection_limit
- **Efficient Queries**: Repository methods use Prisma's query optimization

### Redis Optimization

- **TTL Strategy**: Revoked tokens expire automatically (TTL matches JWT expiry)
- **Key Naming**: Consistent prefix pattern (`revoked:access:${jti}`, `revoked:refresh:${jti}`)
- **Memory Management**: Expired keys automatically cleaned by Redis

### Token Management

- **Short-lived Access Tokens**: 15 minutes (reduces revocation overhead)
- **Long-lived Refresh Tokens**: 7 days (balance security and UX)
- **Rotation**: Prevents accumulation of unused refresh tokens

## Security Measures

1. **Password Hashing**: bcrypt with 11 rounds
2. **Token Signing**: Separate secrets for access and refresh tokens
3. **CORS**: Configurable origin whitelist
4. **Rate Limiting**: Ready for implementation (Redis-based)
5. **Input Validation**: Zod schemas prevent injection attacks
6. **Error Sanitization**: Custom filters prevent information leakage
7. **Global Guards**: Secure by default (must explicitly allow public access)

## Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: All state in database/Redis (no in-memory state)
- **Shared Redis**: All instances connect to same Redis cluster
- **Database Connection Pooling**: Adjust per-instance connection limits

### Vertical Scaling

- **Redis Clustering**: Can scale to Redis Cluster for high throughput
- **Database Read Replicas**: Prisma supports read replicas
- **Caching Layer**: Redis ready for application-level caching

## Development Workflow

### Feature Development

1. Create feature branch
2. Implement with tests (TDD recommended)
3. Ensure file size < 200 lines
4. Run linting and formatting
5. Verify all tests pass
6. Create PR with documentation updates

### Database Changes

1. Update Prisma schema files
2. Create migration: `npm run prisma:migrate`
3. Generate client: `npm run prisma:generate`
4. Update repositories and services
5. Add tests for new functionality

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure PostgreSQL and Redis
3. Run migrations
4. Start development server

## Future Enhancements

### Planned Features

- Rate limiting (Redis-based)
- Two-factor authentication (TOTP)
- OAuth providers (Google, GitHub)
- Role-based access control (RBAC)
- Audit logging
- API versioning

### Technical Improvements

- GraphQL API option
- WebSocket support
- Microservices extraction
- Event-driven architecture
- CQRS pattern for complex queries

## Dependencies

### Core Dependencies

- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/jwt`, `@nestjs/passport` - Authentication
- `@prisma/client` - Database ORM
- `bcrypt` - Password hashing
- `ioredis` - Redis client
- `zod` - Schema validation
- `resend` - Email service

### Development Dependencies

- `jest` - Testing framework
- `supertest` - HTTP testing
- `ts-jest` - TypeScript Jest integration
- `prisma` - Database tooling
- `@nestjs/testing` - NestJS testing utilities

## File Organization Principles

1. **Feature-based Structure**: Group by feature, not layer
2. **Colocation**: Keep related files together
3. **Naming Conventions**: Clear, descriptive names (`.service.ts`, `.repository.ts`, `.controller.ts`)
4. **Index Files**: Avoided (explicit imports preferred)
5. **Test Files**: Colocated in `test/` directory with same structure

## Conclusion

This codebase demonstrates production-ready NestJS development with:
- Clean Architecture and SOLID principles
- Comprehensive security measures
- Thorough testing strategy
- Scalable design patterns
- Developer-friendly structure

The 200-line file limit ensures maintainability, while the repository pattern and dependency injection enable testability and flexibility.
