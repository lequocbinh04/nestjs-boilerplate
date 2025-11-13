# Code Standards

## File Organization

### File Size Limit

**RULE**: Maximum 200 lines per file

**Rationale**:
- Forces logical decomposition of complex code
- Improves readability and maintainability
- Easier code reviews
- Reduces cognitive load
- Encourages Single Responsibility Principle

**Enforcement**:
- Manual review during PR process
- Can be automated with ESLint custom rules

**When approaching limit**:
1. Extract helper functions to separate file
2. Split large services into multiple specialized services
3. Move DTOs and interfaces to separate files
4. Extract constants and configurations

**Example**:
```
❌ Bad: auth.service.ts (500 lines)
✅ Good:
  - auth.service.ts (180 lines)
  - password.service.ts (120 lines)
  - token.service.ts (150 lines)
```

### Directory Structure

**Feature-based organization** (preferred over layer-based):

```
src/
├── features/
│   ├── auth/              # Auth feature module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dto/
│   │   ├── strategies/
│   │   └── auth.module.ts
│   └── users/             # User feature module
│       ├── repositories/
│       ├── entities/
│       └── users.module.ts
├── shared/                # Shared across features
│   ├── database/
│   ├── redis/
│   └── logger/
├── infrastructure/        # External integrations
│   └── email/
└── common/                # Global utilities
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interceptors/
    └── pipes/
```

**Benefits**:
- Clear feature boundaries
- Easy to locate related code
- Supports future microservices extraction
- Reduces coupling between features

### Naming Conventions

**Files**:
```
✅ kebab-case with suffix:
  - auth.service.ts
  - user.repository.ts
  - jwt-auth.guard.ts
  - response.interceptor.ts

❌ Avoid:
  - AuthService.ts (PascalCase)
  - auth_service.ts (snake_case)
  - auth.ts (missing suffix)
```

**Classes**:
```typescript
✅ PascalCase with suffix:
  - AuthService
  - UserRepository
  - JwtAuthGuard
  - ResponseInterceptor

❌ Avoid:
  - authService
  - Auth (missing suffix)
```

**Interfaces**:
```typescript
✅ Prefix with 'I':
  - IUserRepository
  - ITokenService

✅ Or descriptive name:
  - UserRepositoryInterface
  - TokenServiceContract
```

**Variables/Functions**:
```typescript
✅ camelCase:
  - const userId = '123';
  - async function findUserById() {}

❌ Avoid:
  - const UserId = '123';
  - const user_id = '123';
```

**Constants**:
```typescript
✅ SCREAMING_SNAKE_CASE:
  - const MAX_LOGIN_ATTEMPTS = 5;
  - const JWT_EXPIRATION = '15m';

✅ For config objects:
  - const jwtConfig = { ... };
```

## Clean Architecture Principles

### Layer Separation

```
Controllers (Presentation)
     ↓
Services (Application)
     ↓
Repositories (Domain)
     ↓
Database (Infrastructure)
```

**Rules**:
1. **Controllers** only handle HTTP concerns (request/response)
2. **Services** contain business logic
3. **Repositories** handle data access
4. **Infrastructure** implements external integrations

**Example**:
```typescript
// ❌ Bad: Business logic in controller
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException();
    const isValid = await bcrypt.compare(dto.password, user.password);
    // ... more logic
  }
}

// ✅ Good: Delegate to service
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### Dependency Inversion

**Depend on abstractions, not concretions**

```typescript
// ✅ Good: Service depends on interface
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}
}

// ❌ Bad: Service depends on concrete implementation
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}
}
```

**Benefits**:
- Easy to mock in tests
- Can swap implementations without changing consumers
- Loose coupling between layers

### Repository Pattern

**All database access goes through repositories**

```typescript
// ✅ Good: Repository interface
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
}

// Implementation
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
  // ... other methods
}

// ❌ Bad: Service directly uses Prisma
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    // ...
  }
}
```

### Single Responsibility Principle

**Each class should have one reason to change**

```typescript
// ❌ Bad: AuthService doing too much
export class AuthService {
  async register() { /* ... */ }
  async login() { /* ... */ }
  async verifyEmail() { /* ... */ }
  async hashPassword() { /* ... */ }
  async generateToken() { /* ... */ }
  async revokeToken() { /* ... */ }
}

// ✅ Good: Split responsibilities
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly tokenRevocationService: TokenRevocationService,
  ) {}

  async register() { /* ... */ }
  async login() { /* ... */ }
  async verifyEmail() { /* ... */ }
}

export class PasswordService {
  async hash(password: string): Promise<string> { /* ... */ }
  async compare(password: string, hash: string): Promise<boolean> { /* ... */ }
}

export class TokenService {
  generateAccessToken() { /* ... */ }
  generateRefreshToken() { /* ... */ }
}
```

## SOLID Principles

### S - Single Responsibility

Each class/function has one job:
- `PasswordService` - password operations only
- `TokenService` - token operations only
- `EmailService` - email sending only

### O - Open/Closed

Open for extension, closed for modification:

```typescript
// ✅ Good: Extend via strategy pattern
interface AuthStrategy {
  validate(credentials: any): Promise<User>;
}

export class JwtStrategy implements AuthStrategy { /* ... */ }
export class OAuthStrategy implements AuthStrategy { /* ... */ }
```

### L - Liskov Substitution

Implementations must be interchangeable:

```typescript
// ✅ Good: Any IUserRepository can replace UserRepository
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}
}

// Can swap implementations:
const mockRepo: IUserRepository = new MockUserRepository();
const realRepo: IUserRepository = new UserRepository(prisma);
```

### I - Interface Segregation

Small, focused interfaces:

```typescript
// ❌ Bad: Fat interface
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<void>;
  findAllWithPagination(): Promise<User[]>;
  exportToCsv(): Promise<string>;
  sendWelcomeEmail(): Promise<void>;
}

// ✅ Good: Focused interfaces
interface IUserReader {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
}

interface IUserWriter {
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
}
```

### D - Dependency Inversion

High-level modules don't depend on low-level modules:

```typescript
// ✅ Good: Both depend on abstraction
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class AuthService {
  constructor(private readonly emailService: IEmailService) {}
}

export class ResendEmailService implements IEmailService {
  async send(to: string, subject: string, body: string) { /* ... */ }
}
```

## TypeScript Standards

### Type Safety

**Avoid `any`**:
```typescript
// ❌ Bad
function processData(data: any) { /* ... */ }

// ✅ Good
function processData(data: User | null) { /* ... */ }

// ✅ Good: Use unknown if type truly unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

**Use strict mode**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### DTOs with Zod

**Use Zod for validation + type inference**:

```typescript
// ✅ Good: Single source of truth
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

// ❌ Bad: Duplicate definitions
export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  name?: string;
}
```

### Async/Await

**Always use async/await over promises**:

```typescript
// ✅ Good
async function findUser(id: string): Promise<User | null> {
  try {
    return await this.prisma.user.findUnique({ where: { id } });
  } catch (error) {
    this.logger.error(error);
    throw new InternalServerErrorException();
  }
}

// ❌ Bad
function findUser(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({ where: { id } })
    .then(user => user)
    .catch(error => {
      this.logger.error(error);
      throw new InternalServerErrorException();
    });
}
```

## Testing Requirements

### Test Coverage

**Minimum 80% code coverage**

Required test types:
1. **Unit tests** - All services and repositories
2. **Integration tests** - All API endpoints
3. **E2E tests** - Critical user flows

### Unit Test Structure

**Arrange-Act-Assert pattern**:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockType<IUserRepository>;

  beforeEach(() => {
    // Arrange: Setup
    userRepository = createMock<IUserRepository>();
    service = new AuthService(userRepository);
  });

  it('should hash password when registering user', async () => {
    // Arrange
    const dto = { email: 'test@test.com', password: 'password123' };
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({ ...dto, id: '1' });

    // Act
    const result = await service.register(dto);

    // Assert
    expect(result).toBeDefined();
    expect(userRepository.create).toHaveBeenCalled();
  });
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should throw UnauthorizedException when password is invalid')
it('should return access token and refresh token on successful login')
it('should send verification email after registration')

// ❌ Bad: Vague test names
it('should work')
it('test login')
it('registration')
```

### Mocking

**Mock external dependencies**:

```typescript
// ✅ Good: Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

// ✅ Good: Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};
```

## Error Handling

### Custom Exceptions

**Use NestJS built-in exceptions**:

```typescript
// ✅ Good
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('Email already registered');
throw new NotFoundException('User not found');

// ❌ Bad
throw new Error('Invalid credentials');
```

### Exception Filters

**Handle all errors gracefully**:

```typescript
// Global filter for HTTP exceptions
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: exception.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Logging

**Log errors with context**:

```typescript
// ✅ Good
try {
  await this.emailService.send(email);
} catch (error) {
  this.logger.error(`Failed to send email to ${email}`, error.stack);
  throw new InternalServerErrorException('Failed to send email');
}

// ❌ Bad
catch (error) {
  console.log(error);
  throw error;
}
```

## Security Standards

### Password Handling

```typescript
// ✅ Good: bcrypt with sufficient rounds
const SALT_ROUNDS = 11;
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// ❌ Bad: Plain text or weak hashing
const hash = password; // Never!
const hash = md5(password); // Too weak
```

### JWT Secrets

```typescript
// ✅ Good: Strong, separate secrets
JWT_SECRET="random-32-char-string-for-access-tokens"
JWT_REFRESH_TOKEN_SECRET="different-32-char-string-for-refresh"

// ❌ Bad: Weak or same secrets
JWT_SECRET="secret"
JWT_REFRESH_TOKEN_SECRET="secret"
```

### Input Validation

**Validate all user input**:

```typescript
// ✅ Good: Zod validation
const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

// Pipe validates automatically
@Post('login')
async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
  return this.authService.login(dto);
}
```

### SQL Injection Prevention

**Use Prisma's parameterized queries**:

```typescript
// ✅ Good: Prisma automatically prevents SQL injection
await this.prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ Bad: Raw SQL with interpolation
await this.prisma.$executeRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ✅ Good: Raw SQL with parameters
await this.prisma.$executeRaw`
  SELECT * FROM users WHERE email = $1
`, [userInput];
```

## Code Style

### Formatting

Use Prettier with default settings:

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

### Linting

Use ESLint with NestJS config:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Imports

**Order imports**:

```typescript
// 1. External libraries
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/client';

// 2. Internal modules
import { UserRepository } from './repositories/user.repository';
import { PasswordService } from './services/password.service';

// 3. Types
import type { User } from './entities/user.entity';
```

## Documentation

### Code Comments

**Comment the why, not the what**:

```typescript
// ✅ Good: Explains reasoning
// Use 11 rounds for balance between security and performance
const SALT_ROUNDS = 11;

// Rotate refresh token to prevent reuse attacks
await this.revokeRefreshToken(oldToken);
const newToken = await this.generateRefreshToken(user);

// ❌ Bad: States the obvious
// Hash the password
const hash = await bcrypt.hash(password, 11);

// Create a user
const user = await this.userRepository.create(dto);
```

### JSDoc for Public APIs

```typescript
/**
 * Authenticates user and returns JWT tokens
 * @param dto - Login credentials (email + password)
 * @returns Access token and refresh token
 * @throws UnauthorizedException if credentials invalid
 */
async login(dto: LoginDto): Promise<AuthResponse> {
  // ...
}
```

## Git Commit Standards

### Commit Messages

**Use conventional commits**:

```
feat: add email verification
fix: resolve token expiration bug
refactor: extract password service
docs: update README with setup instructions
test: add unit tests for auth service
chore: update dependencies
```

### Commit Size

**Small, focused commits**:
- One logical change per commit
- Easy to review and revert
- Clear commit history

## Performance Best Practices

### Database Queries

```typescript
// ✅ Good: Select only needed fields
await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true },
});

// ❌ Bad: Select all fields
await this.prisma.user.findUnique({ where: { id } });
```

### Caching

```typescript
// ✅ Good: Cache frequently accessed data
const cacheKey = `user:${id}`;
let user = await this.redis.get(cacheKey);

if (!user) {
  user = await this.userRepository.findById(id);
  await this.redis.set(cacheKey, user, 'EX', 300); // 5 min TTL
}
```

### N+1 Query Prevention

```typescript
// ✅ Good: Use include/select
await this.prisma.user.findMany({
  include: { refreshTokens: true },
});

// ❌ Bad: Loop with queries
const users = await this.prisma.user.findMany();
for (const user of users) {
  user.tokens = await this.prisma.refreshToken.findMany({
    where: { userId: user.id },
  });
}
```

## Checklist for New Features

Before submitting PR:

- [ ] All files under 200 lines
- [ ] Unit tests written and passing
- [ ] Integration tests for API endpoints
- [ ] Proper error handling
- [ ] Input validation with Zod
- [ ] Logging added for important operations
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Code reviewed for security issues
- [ ] Environment variables documented
- [ ] Migration created if schema changed

## Tools

### Required

- **Node.js 18+**
- **npm** or **yarn**
- **PostgreSQL 14+**
- **Redis 6+**

### Recommended

- **VSCode** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Jest
- **Postman** or **Insomnia** for API testing
- **Prisma Studio** for database visualization

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Zod Documentation](https://zod.dev)
