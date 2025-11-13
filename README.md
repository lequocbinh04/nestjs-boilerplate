# NestJS Authentication Boilerplate

Production-ready NestJS authentication boilerplate with Clean Architecture, SOLID principles, and comprehensive security features.

## Features

- **Clean Architecture** - Layered design with dependency inversion
- **JWT Authentication** - Access & refresh tokens with rotation
- **Email Verification** - Configurable email verification flow
- **Password Reset** - Secure token-based password reset
- **Token Revocation** - Redis + PostgreSQL hybrid blacklist
- **Type Safety** - Zod validation with automatic type inference
- **Swagger Documentation** - Interactive API documentation
- **Comprehensive Testing** - Unit, integration, and E2E tests
- **Multi-file Prisma Schema** - Modular database schema organization

## Tech Stack

- **Framework:** NestJS 11+
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis (ioredis)
- **Validation:** Zod + class-validator
- **Authentication:** JWT (Passport.js)
- **Email:** Resend
- **Testing:** Jest
- **Documentation:** Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Resend API key (sign up at https://resend.com)

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/lequocbinh04/nestjs-boilerplate
   cd boilerplate
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Setup database:**
   ```bash
   # Create database
   createdb boilerplate

   # Run migrations
   npx prisma migrate deploy

   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start development server:**
   ```bash
   npm run start:dev
   ```

6. **Access application:**
   - API: http://localhost:3000/api/v1
   - Swagger: http://localhost:3000/api/docs
   - Health: http://localhost:3000/api/v1/health

## Project Structure

```
src/
├── common/                      # Global utilities
│   ├── decorators/             # Custom decorators (@IsPublic, @Auth, @CurrentUser)
│   ├── exceptions/             # Custom exceptions
│   ├── filters/                # Exception filters (HTTP, Prisma)
│   ├── guards/                 # Auth guards (JWT)
│   ├── interceptors/           # Response interceptor
│   └── pipes/                  # Validation pipes (Zod)
├── config/                      # Configuration
│   ├── env.config.ts           # Zod ENV validation
│   └── swagger.config.ts       # Swagger setup
├── shared/                      # Shared modules
│   ├── database/               # Prisma service
│   ├── redis/                  # Redis module & health checks
│   └── logger/                 # Logger service
├── features/                    # Feature modules (Clean Architecture)
│   ├── auth/                   # Authentication module
│   │   ├── controllers/        # AuthController
│   │   ├── services/           # AuthService, TokenService, PasswordService
│   │   ├── strategies/         # JWT strategies (access, refresh)
│   │   ├── repositories/       # Token repositories
│   │   ├── dto/                # Zod DTOs
│   │   └── auth.module.ts
│   ├── users/                  # User management
│   │   ├── repositories/       # UserRepository (interface + impl)
│   │   ├── entities/           # User entity
│   │   └── users.module.ts
│   └── health/                 # Health checks
├── infrastructure/              # External integrations
│   └── email/                  # Resend email service
├── app.module.ts
└── main.ts
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/verify-email` | Verify email | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/revoke` | Revoke token (logout) | Protected |
| GET | `/auth/me` | Get user profile | Protected |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Overall health |
| GET | `/health/db` | Database health |
| GET | `/health/redis` | Redis health |

Full API documentation available at `/api/docs` when running.

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/boilerplate"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-access-token-key-min-32-chars-here"
JWT_REFRESH_TOKEN_SECRET="your-super-secret-jwt-refresh-token-key-min-32-chars-here"

# Email
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

See `.env.example` for complete list of all environment variables.

## Development Commands

```bash
# Development
npm run start:dev              # Start dev server with watch mode
npm run start:debug            # Start with debugging

# Build & Production
npm run build                  # Build application
npm run start:prod             # Start production server

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:cov               # Coverage report
npm run test:e2e               # E2E tests

# Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Create migration (dev)
npm run prisma:deploy          # Apply migrations (prod)
npm run prisma:studio          # Open Prisma Studio

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
```

## Testing

The project includes comprehensive test coverage:

- **Unit Tests** - Service and repository layer testing
- **Integration Tests** - API endpoint testing with test database
- **E2E Tests** - Full application flow testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov
```

## Database Schema

Multi-file Prisma schema organization:

```
prisma/
├── schema/
│   ├── base.prisma     # Generator & datasource configuration
│   ├── user.prisma     # User model with email verification
│   └── auth.prisma     # RefreshToken & RevokedToken models
└── migrations/         # Database migrations
```

### Key Models

- **User** - User accounts with email verification and password reset tokens
- **RefreshToken** - Active refresh tokens with JTI tracking
- **RevokedToken** - Revoked tokens for logout/security

## Authentication Flow

1. **Registration**: User registers → email verification sent → user verifies email
2. **Login**: User logs in → receives access token (15m) + refresh token (7d)
3. **Token Refresh**: Client refreshes using refresh token → old refresh token rotated
4. **Logout**: User logs out → token revoked in Redis + PostgreSQL

## Security Features

- Passwords hashed with bcrypt (11 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens rotate on each use (prevents reuse attacks)
- Tokens revoked immediately on logout
- Hybrid token revocation (Redis for speed + PostgreSQL for persistence)
- Email verification configurable via environment variable
- Strong password requirements enforced by Zod validation
- Protection against Prisma errors with custom exception filters

## Architecture Principles

### Clean Architecture
- **Separation of Concerns** - Clear boundaries between layers
- **Dependency Inversion** - High-level modules don't depend on low-level modules
- **Repository Pattern** - Data access abstraction with interfaces
- **Service Layer** - Business logic isolated from controllers

### SOLID Principles
- **Single Responsibility** - Each class has one reason to change
- **Open/Closed** - Open for extension, closed for modification
- **Liskov Substitution** - Interface implementations are interchangeable
- **Interface Segregation** - Small, focused interfaces
- **Dependency Inversion** - Depend on abstractions, not concretions

### Code Standards
- **File Size Limit** - Maximum 200 lines per file
- **Type Safety** - Zod schemas with TypeScript type inference
- **Error Handling** - Standardized exception filters
- **Testing Required** - Unit tests for all services

See `/docs/code-standards.md` for complete standards.

## Documentation

- [Code Standards](/docs/code-standards.md) - Coding conventions and best practices
- [Codebase Summary](/docs/codebase-summary.md) - Architecture and design decisions
- [System Architecture](/docs/system-architecture.md) - Detailed architecture documentation

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow code standards (200 lines max per file, tests required)
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
