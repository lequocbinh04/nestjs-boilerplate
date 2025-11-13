import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(
      {
        success: false,
        error: {
          statusCode,
          message,
          errors,
        },
      },
      statusCode,
    );
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized', errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.UNAUTHORIZED, errors);
  }
}

export class ForbiddenException extends BaseException {
  constructor(message = 'Forbidden', errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.FORBIDDEN, errors);
  }
}

export class NotFoundException extends BaseException {
  constructor(message = 'Resource not found', errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.NOT_FOUND, errors);
  }
}

export class ConflictException extends BaseException {
  constructor(message = 'Resource already exists', errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.CONFLICT, errors);
  }
}

export class BadRequestException extends BaseException {
  constructor(message = 'Bad request', errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}
