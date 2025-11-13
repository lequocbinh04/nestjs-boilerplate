import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.error(`HTTP ${status} Error: ${request.method} ${request.url}`, exception.stack);

    const errorResponse =
      typeof exceptionResponse === 'string' ? { message: exceptionResponse } : exceptionResponse;

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        ...errorResponse,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
