# Zod Validation Integration in NestJS

**Date:** 2025-11-13 | **Status:** Research Complete

## Executive Summary

Zod provides superior TypeScript type inference & schema-based validation for NestJS applications. Integration via `nestjs-zod` library enables request/response validation with automatic type generation. Outperforms class-validator in type safety but requires manual setup compared to NestJS's default decorator approach.

## 1. Integration Approaches

### Zod with NestJS - Core Pattern

**Request validation flow:**
```typescript
// 1. Define Zod schema
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().positive()
});

// 2. Create DTO from schema (automatic type inference)
class UserDto extends createZodDto(UserSchema) {}

// 3. Use in controller (validated automatically)
@Post()
createUser(@Body() data: UserDto) {
  // data is fully typed & validated
}
```

**Key advantage:** TypeScript infers `UserDto` type directly from Zod schema—no redundant type definitions needed.

### Setup Options

**Automatic (recommended):**
```bash
npx nestjs-zod-cli /path/to/nestjs/project
```

**Manual global setup:**
```typescript
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';

@Module({
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }
  ]
})
export class AppModule {}
```

## 2. DTO Validation Patterns

### Request Body Validation
```typescript
const CreatePostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  published: z.boolean().optional()
});

class CreatePostDto extends createZodDto(CreatePostSchema) {}

@Post()
create(@Body() dto: CreatePostDto) {
  return this.postsService.create(dto);
}
```

### Query & Param Validation
```typescript
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

class PaginationDto extends createZodDto(QuerySchema) {}

@Get()
list(@Query() query: PaginationDto) {
  return this.postsService.list(query.page, query.limit);
}
```

### Response Serialization
```typescript
const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'user']),
  password: z.string().omit() // Prevent data leaks
});

class UserResponseDto extends createZodDto(UserResponseSchema) {}

@Get(':id')
@ZodResponse(UserResponseDto)
getUser(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

## 3. Environment Configuration Validation

### Pattern: ConfigModule Integration
```typescript
import { z } from 'zod';
import { ConfigModule } from '@nestjs/config';

// Define environment schema
const EnvSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional()
});

// Export typed ConfigService
export type AppConfig = z.infer<typeof EnvSchema>;

// Validation function
const validateConfig = (config: Record<string, unknown>) => {
  try {
    return EnvSchema.parse(config);
  } catch (error) {
    throw new Error(`Invalid env vars: ${error.message}`);
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
      cache: true
    })
  ]
})
export class AppModule {}
```

### Type-Safe ConfigService Usage
```typescript
export type IConfigService = ConfigService<AppConfig>;

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(ConfigService) private config: IConfigService
  ) {
    // Full type safety on config access
    const dbUrl = this.config.get('DATABASE_URL', { infer: true });
  }
}
```

## 4. Custom Validation Pipes

### Advanced Pipe Pattern
```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  }
}

// Usage
@Post()
create(@Body(new ZodValidationPipe(CreateDtoSchema)) dto: CreateDto) {}
```

## 5. Type Inference Benefits

### Automatic Type Generation
```typescript
// Single source of truth
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.date(),
  tags: z.array(z.string())
});

// Type automatically inferred
type User = z.infer<typeof UserSchema>;
// Equivalent to:
// type User = {
//   id: string;
//   email: string;
//   createdAt: Date;
//   tags: string[];
// }

class UserDto extends createZodDto(UserSchema) {}
```

### Type-Safe Transformations
```typescript
const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
}).transform(data => ({
  email: data.username, // Optional: type-safe transform
  ...data
}));

type LoginData = z.infer<typeof LoginSchema>;
```

## 6. Zod vs Class-Validator Comparison

| Feature | Class-Validator | Zod |
|---------|-----------------|-----|
| **Type Inference** | Manual type definitions needed | Automatic from schema |
| **Syntax Style** | Decorators (verbose) | Schema-based (concise) |
| **Setup Effort** | Global pipe required | Single import |
| **Swagger Support** | Native support | Manual or via plugins |
| **Performance** | Standard | Lightweight & fast |
| **Framework Coupling** | NestJS-specific | Framework agnostic |
| **Validation Errors** | Standard NestJS format | Detailed error codes & paths |

**Recommendation:** Choose Zod for new projects prioritizing type safety; use class-validator for existing codebases with team Swagger dependencies.

## 7. Error Handling

### Default Error Response
```
POST /users
Content-Type: application/json
{"email": "invalid", "age": "not-a-number"}

HTTP 400
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "path": "email", "code": "invalid_email", "message": "Invalid email" },
    { "path": "age", "code": "not_a_number", "message": "Expected number, received NaN" }
  ]
}
```

### Custom Exception Filter
```typescript
@Catch(ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors: exception.getZodError().errors
    });
  }
}
```

## Key Libraries & Resources

**Primary:** `nestjs-zod` (v5.0.1+) - https://github.com/BenLorantfy/nestjs-zod
**Alternative:** `async-nestjs-zod` - For async validation support
**OpenAPI Support:** `nestjs-zod-openapi` helper

## Unresolved Questions

1. How does `nestjs-zod` handle discriminated unions vs class-validator?
2. What's the performance difference in large validation schemas (100+ fields)?
3. Does `cleanupOpenApiDoc()` support all Swagger features (file uploads, etc.)?
