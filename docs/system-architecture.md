# System Architecture

## Overview

NestJS authentication boilerplate built with Clean Architecture principles, implementing a modular, testable, and scalable authentication system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                  (Web App, Mobile App, API Consumer)           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer                  │
│                         (nginx, ALB, etc.)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Application                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Presentation Layer                           │ │
│  │  (Controllers, Guards, Interceptors, Filters, DTOs)      │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Application Layer                            │ │
│  │  (Services: Auth, Token, Password, Revocation)           │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Domain Layer                                 │ │
│  │  (Entities, Repository Interfaces)                       │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           Infrastructure Layer                            │ │
│  │  (Repository Implementations, Email Service)             │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ↓                             ↓
    ┌──────────────────┐         ┌──────────────────┐
    │   PostgreSQL     │         │      Redis       │
    │   (Primary DB)   │         │    (Cache)       │
    └──────────────────┘         └──────────────────┘
              │
              ↓
    ┌──────────────────┐
    │  External APIs   │
    │  (Resend Email)  │
    └──────────────────┘
```

## Architectural Layers

### 1. Presentation Layer

**Responsibility**: Handle HTTP concerns and data transformation

**Components**:
- **Controllers**: Receive HTTP requests, delegate to services, return responses
- **Guards**: Protect routes (JwtAuthGuard)
- **Interceptors**: Transform responses (ResponseInterceptor)
- **Filters**: Handle exceptions (HttpExceptionFilter, PrismaExceptionFilter)
- **Pipes**: Validate input (ZodValidationPipe)
- **DTOs**: Define data transfer objects with Zod schemas

**Example Flow**:
```
HTTP Request → Guard → Pipe → Controller → Service → Response
```

**Key Files**:
- `src/features/auth/controllers/auth.controller.ts`
- `src/common/guards/jwt-auth.guard.ts`
- `src/common/interceptors/response.interceptor.ts`
- `src/common/filters/http-exception.filter.ts`
- `src/common/pipes/zod-validation.pipe.ts`

### 2. Application Layer

**Responsibility**: Business logic and use case orchestration

**Components**:
- **Services**: Implement business rules
- **Strategies**: Passport.js authentication strategies

**Services**:
1. **AuthService**: Registration, login, email verification, password reset
2. **TokenService**: JWT generation and validation
3. **TokenRevocationService**: Token blacklist management (Redis + PostgreSQL)
4. **PasswordService**: Password hashing and comparison

**Key Principles**:
- No direct database access (uses repositories)
- No HTTP concerns (delegates to controllers)
- Focused on business logic only

**Key Files**:
- `src/features/auth/services/auth.service.ts`
- `src/features/auth/services/token.service.ts`
- `src/features/auth/services/token-revocation.service.ts`
- `src/features/auth/services/password.service.ts`

### 3. Domain Layer

**Responsibility**: Core business entities and contracts

**Components**:
- **Entities**: Domain models (User)
- **Repository Interfaces**: Data access contracts (IUserRepository)

**Key Principle**: Domain layer has no dependencies on outer layers

**Key Files**:
- `src/features/users/entities/user.entity.ts`
- `src/features/users/repositories/user.repository.interface.ts`

### 4. Infrastructure Layer

**Responsibility**: External integrations and data persistence

**Components**:
- **Repository Implementations**: Prisma-based data access
- **Email Service**: Resend integration
- **Database Module**: Prisma connection management
- **Redis Module**: Cache connection management

**Key Files**:
- `src/features/users/repositories/user.repository.ts`
- `src/features/auth/repositories/refresh-token.repository.ts`
- `src/features/auth/repositories/revoked-token.repository.ts`
- `src/infrastructure/email/email.service.ts`
- `src/shared/database/prisma.service.ts`
- `src/shared/redis/redis.service.ts`

## Data Flow

### Registration Flow

```
1. POST /auth/register
   ↓
2. AuthController.register()
   ↓ (validates with ZodValidationPipe)
3. AuthService.register()
   ↓ (checks email uniqueness)
4. UserRepository.findByEmail()
   ↓ (if not exists)
5. PasswordService.hash()
   ↓
6. UserRepository.create()
   ↓ (generates verification token)
7. EmailService.sendVerificationEmail()
   ↓
8. Return success response
```

### Login Flow

```
1. POST /auth/login
   ↓
2. AuthController.login()
   ↓ (validates with ZodValidationPipe)
3. AuthService.login()
   ↓
4. UserRepository.findByEmail()
   ↓ (verify email if required)
5. PasswordService.compare()
   ↓ (if valid)
6. TokenService.generateAccessToken()
   ↓
7. TokenService.generateRefreshToken()
   ↓
8. RefreshTokenRepository.save()
   ↓
9. Return tokens
```

### Token Refresh Flow

```
1. POST /auth/refresh
   ↓
2. AuthController.refresh()
   ↓
3. TokenService.verifyRefreshToken()
   ↓
4. TokenRevocationService.isRevoked() [Check Redis]
   ↓ (if not revoked)
5. RefreshTokenRepository.findByJti()
   ↓ (if valid)
6. TokenRevocationService.revokeToken() [Old token]
   ↓
7. TokenService.generateAccessToken() [New token]
   ↓
8. TokenService.generateRefreshToken() [New token]
   ↓
9. RefreshTokenRepository.save() [New token]
   ↓
10. RefreshTokenRepository.delete() [Old token]
   ↓
11. Return new tokens
```

### Token Revocation Flow

```
1. POST /auth/revoke
   ↓
2. JwtAuthGuard validates access token
   ↓
3. AuthController.revoke()
   ↓
4. TokenRevocationService.revokeToken()
   ↓
5. Redis.set("revoked:access:{jti}", "1", TTL)
   ↓
6. Redis.set("revoked:refresh:{jti}", "1", TTL)
   ↓
7. RevokedTokenRepository.create() [PostgreSQL]
   ↓
8. RefreshTokenRepository.delete()
   ↓
9. Return success
```

## Authentication System

### JWT Strategy

**Access Token**:
- **Purpose**: Authorize API requests
- **Expiration**: 15 minutes
- **Storage**: Client memory (not localStorage for security)
- **Payload**: `{ sub: userId, jti: tokenId, type: 'access' }`

**Refresh Token**:
- **Purpose**: Obtain new access tokens
- **Expiration**: 7 days
- **Storage**: HTTP-only secure cookie or client storage
- **Payload**: `{ sub: userId, jti: tokenId, type: 'refresh' }`
- **Rotation**: New refresh token issued on each use

### Token Security

**Protection Mechanisms**:
1. **Short-lived access tokens** - Limit exposure window
2. **Refresh token rotation** - Prevent reuse attacks
3. **JTI (JWT ID)** - Unique identifier for revocation
4. **Separate secrets** - Different keys for access/refresh
5. **Hybrid revocation** - Redis (speed) + PostgreSQL (persistence)

### Token Revocation Architecture

**Hybrid Approach**:

```
┌─────────────────────────────────────────────┐
│        Token Revocation Flow                │
└─────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│  Step 1: Check Redis (Fast lookup)         │
│  GET revoked:access:{jti}                   │
│  GET revoked:refresh:{jti}                  │
└─────────────────────────────────────────────┘
              │
              ↓
        ┌─────────┐
        │ Cached? │
        └─────────┘
         │       │
    Yes  │       │ No
         ↓       ↓
    ┌────────┐  ┌─────────────────────────────┐
    │ Reject │  │ Step 2: Allow & cache       │
    └────────┘  │ Redis.set(jti, 0, TTL)      │
                └─────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│  On Revocation:                             │
│  1. Redis.set(jti, 1, TTL)                  │
│  2. PostgreSQL RevokedToken.create()        │
└─────────────────────────────────────────────┘
```

**Why Hybrid?**:
- **Redis**: Fast lookups (microseconds) for every request
- **PostgreSQL**: Persistent audit trail, Redis recovery after restart
- **TTL Strategy**: Auto-cleanup, no manual maintenance

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Rounds: 11 (balance security vs performance)
- Salt: Automatic per-password

**Password Requirements** (enforced by Zod):
```typescript
z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
```

### Email Verification

**Flow**:
1. User registers → token generated (UUID)
2. Token saved to `user.emailVerificationToken`
3. Token expiry set (default 24h)
4. Verification email sent with link containing token
5. User clicks link → `POST /auth/verify-email`
6. Token validated (not expired, matches DB)
7. `user.emailVerified = true`, token cleared

**Configurable**:
- `EMAIL_VERIFICATION_REQUIRED=true` - Block login until verified
- `EMAIL_VERIFICATION_REQUIRED=false` - Allow login, optional verification

## Database Architecture

### Schema Organization

**Multi-file Prisma schema**:

```
prisma/
├── schema/
│   ├── base.prisma      # Generator + datasource config
│   ├── user.prisma      # User model
│   └── auth.prisma      # Auth-related models
└── migrations/          # Version-controlled migrations
```

**Configuration** (`package.json`):
```json
{
  "prisma": {
    "schema": "prisma/schema"
  }
}
```

### Entity Relationships

```
User (1) ──────┬──── (*) RefreshToken
               │
               └──── (*) RevokedToken
```

**User Model**:
- Core user data (id, email, password, name)
- Email verification (token, expiry, verified flag)
- Password reset (token, expiry)
- Timestamps (createdAt, updatedAt)

**RefreshToken Model**:
- Links to user (userId foreign key)
- Stores token hash and JTI
- Tracks expiration

**RevokedToken Model**:
- Links to user (userId foreign key)
- Stores JTI of revoked tokens
- Tracks revocation timestamp and reason
- Auto-cleanup via TTL (can match Redis TTL)

### Indexing Strategy

**User Model**:
- Primary: `id` (cuid, clustered index)
- Unique: `email` (login lookups)
- Index: `emailVerificationToken` (verification lookups)
- Index: `passwordResetToken` (reset lookups)

**RefreshToken Model**:
- Primary: `id` (cuid)
- Unique: `token` (prevent duplicates)
- Unique: `jti` (revocation lookups)
- Index: `userId` (user's tokens)
- Index: `expiresAt` (cleanup query)

**RevokedToken Model**:
- Primary: `id` (cuid)
- Unique: `jti` (uniqueness)
- Index: `userId` (audit queries)
- Index: `expiresAt` (cleanup query)

## Caching Strategy

### Redis Architecture

**Connection**:
```typescript
// Single Redis client shared across app
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB,
});
```

### Cache Keys

**Naming Convention**:
```
revoked:access:{jti}    # Access token revocation
revoked:refresh:{jti}   # Refresh token revocation
user:session:{userId}   # User session data (future)
```

### TTL Strategy

**Match JWT expiration**:
```typescript
// Access token (15 min = 900 sec)
redis.set(`revoked:access:${jti}`, '1', 'EX', 900);

// Refresh token (7 days = 604800 sec)
redis.set(`revoked:refresh:${jti}`, '1', 'EX', 604800);
```

**Benefits**:
- Automatic cleanup (no manual maintenance)
- Memory efficient (expired keys auto-removed)
- Matches token lifecycle

## Error Handling

### Exception Hierarchy

```
BaseException (Custom)
    ↓
NestJS HttpException
    ├── BadRequestException (400)
    ├── UnauthorizedException (401)
    ├── ForbiddenException (403)
    ├── NotFoundException (404)
    ├── ConflictException (409)
    └── InternalServerErrorException (500)
```

### Global Exception Filters

**HttpExceptionFilter**:
- Catches all HTTP exceptions
- Returns standardized error format:
  ```json
  {
    "success": false,
    "error": {
      "statusCode": 401,
      "message": "Invalid credentials"
    },
    "timestamp": "2025-11-13T...",
    "path": "/api/v1/auth/login"
  }
  ```

**PrismaExceptionFilter**:
- Catches Prisma errors
- Maps to appropriate HTTP exceptions:
  - `P2002` (unique constraint) → 409 Conflict
  - `P2025` (record not found) → 404 Not Found
  - Other → 500 Internal Server Error
- Prevents database structure leakage

### Error Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "timestamp": "2025-11-13T14:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "message": "Invalid credentials",
    "details": [] // Optional validation errors
  },
  "timestamp": "2025-11-13T14:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

## Module Architecture

### Feature Modules

**AuthModule**:
```typescript
@Module({
  imports: [
    UsersModule,           // User repository
    JwtModule,             // JWT utilities
    PassportModule,        // Strategies
    EmailModule,           // Email service
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    TokenRevocationService,
    PasswordService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    RefreshTokenRepository,
    RevokedTokenRepository,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
```

**UsersModule**:
```typescript
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
```

### Shared Modules

**DatabaseModule** (Global):
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**RedisModule** (Global):
```typescript
@Global()
@Module({
  providers: [RedisService, RedisHealthIndicator],
  exports: [RedisService, RedisHealthIndicator],
})
export class RedisModule {}
```

## Security Architecture

### Defense Layers

```
1. Network Layer
   - HTTPS/TLS encryption
   - CORS configuration
   - Firewall rules

2. Application Layer
   - Global JWT Guard (secure by default)
   - Input validation (Zod)
   - Output sanitization (filters)

3. Data Layer
   - Password hashing (bcrypt)
   - Parameterized queries (Prisma)
   - Connection pooling limits

4. Session Layer
   - Short-lived access tokens
   - Refresh token rotation
   - Token revocation
```

### Attack Mitigation

**SQL Injection**:
- Prisma uses parameterized queries
- Never use raw SQL with string interpolation

**XSS (Cross-Site Scripting)**:
- Input validation with Zod
- Output encoding (automatic in JSON responses)
- Content-Security-Policy headers (via helmet)

**CSRF (Cross-Site Request Forgery)**:
- JWT in Authorization header (not cookies)
- Or HTTP-only secure cookies with CSRF tokens

**Brute Force**:
- Rate limiting (recommended: express-rate-limit)
- Account lockout after N failed attempts (future feature)

**Token Theft**:
- Short access token lifetime (15 min)
- Refresh token rotation
- Token revocation on logout

## Scalability Considerations

### Horizontal Scaling

**Stateless Design**:
- No server-side session state
- All state in database/Redis
- Load balancer can route to any instance

**Shared Resources**:
```
Instance 1 ──┐
Instance 2 ──┼──→ Redis Cluster
Instance 3 ──┘

Instance 1 ──┐
Instance 2 ──┼──→ PostgreSQL (primary + replicas)
Instance 3 ──┘
```

### Database Scaling

**Read Replicas**:
- Prisma supports read replicas
- Route read-heavy queries to replicas
- Write operations to primary

**Connection Pooling**:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```
- Limit per instance: 10 connections
- Formula: `instances × limit ≤ PostgreSQL max_connections`

### Redis Scaling

**Redis Cluster**:
- Shard data across multiple nodes
- Automatic failover
- Client-side library handles routing

**Redis Sentinel**:
- High availability
- Automatic failover
- Master-slave replication

## Monitoring & Observability

### Health Checks

**Endpoints**:
```
GET /api/v1/health        # Overall health
GET /api/v1/health/db     # PostgreSQL status
GET /api/v1/health/redis  # Redis status
```

**Health Indicators**:
- Database: Prisma `$queryRaw('SELECT 1')`
- Redis: `ping()` command
- Memory: Node.js heap usage
- Response time: Average latency

### Logging

**Log Levels**:
- **error**: Exceptions, failures
- **warn**: Deprecated usage, potential issues
- **info**: Normal operations (login, registration)
- **debug**: Detailed flow (development only)

**Structured Logging**:
```typescript
logger.log({
  level: 'info',
  message: 'User login',
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

### Metrics (Future)

**Key Metrics**:
- Request rate (requests/sec)
- Error rate (errors/sec)
- Latency (p50, p95, p99)
- Token generation rate
- Active sessions
- Database query time
- Redis hit/miss rate

## Deployment Architecture

### Production Setup

```
┌───────────────────────────────────────────┐
│         Load Balancer (ALB/nginx)         │
└───────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼─────┐ ┌──▼────────┐ ┌▼──────────┐
│  Instance 1 │ │Instance 2 │ │Instance 3 │
│  (NestJS)   │ │ (NestJS)  │ │ (NestJS)  │
└─────────────┘ └───────────┘ └───────────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼─────┐       ┌─────────▼─────┐
│  PostgreSQL │       │  Redis Cluster│
│  (Primary)  │       │               │
└─────────────┘       └───────────────┘
```

### Docker Deployment

**Multi-stage build**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npx prisma generate

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
```

**Benefits**:
- Smaller final image
- No dev dependencies in production
- Cached layers speed up builds

## Performance Optimization

### Query Optimization

**Select only needed fields**:
```typescript
// Efficient
await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true },
});

// Inefficient (retrieves all fields)
await prisma.user.findUnique({ where: { id } });
```

### Caching Strategy

**Cache layers**:
1. **Redis**: Frequently accessed data (user sessions, revoked tokens)
2. **Prisma Query Cache**: Built-in query result caching
3. **HTTP Cache**: Cache-Control headers for static responses

### Connection Pooling

**Optimal pool size**:
```
pool_size = (core_count × 2) + effective_spindle_count
```

For most apps: 10-20 connections per instance

## Testing Architecture

### Test Pyramid

```
      ┌─────────┐
      │   E2E   │  (5% - Full flows)
      └─────────┘
    ┌─────────────┐
    │ Integration │  (30% - API endpoints)
    └─────────────┘
  ┌─────────────────┐
  │  Unit Tests     │  (65% - Services, repos)
  └─────────────────┘
```

### Test Database

**Isolation**:
- Separate test database
- Reset between test suites
- Use transactions for cleanup

**Configuration**:
```typescript
beforeAll(async () => {
  await prisma.$connect();
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
});

afterEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
});
```

## Future Architecture Enhancements

### Microservices Migration

**Potential services**:
1. **Auth Service**: Authentication and token management
2. **User Service**: User profile and management
3. **Notification Service**: Email and push notifications
4. **Analytics Service**: Usage metrics and reporting

### Event-Driven Architecture

**Event Bus**:
- Publish domain events (UserRegistered, EmailVerified)
- Decouple services
- Enable async processing

### CQRS Pattern

**Separate reads and writes**:
- Write Model: Handle commands (register, login)
- Read Model: Optimized queries (user profile, stats)
- Event Sourcing: Rebuild state from events

## Conclusion

This architecture provides:
- **Scalability**: Stateless design, horizontal scaling
- **Security**: Multiple defense layers, best practices
- **Maintainability**: Clean Architecture, SOLID principles
- **Performance**: Caching, query optimization, connection pooling
- **Testability**: Dependency injection, repository pattern
- **Flexibility**: Easy to extend and modify

The design supports evolution from monolith to microservices while maintaining code quality and development velocity.
