import { responseErr } from '@common/exceptions/app-error';
import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ClsService, ClsServiceManager } from 'nestjs-cls';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const cls = ClsServiceManager.getClsService();
    const requestId = cls.getId();
    responseErr(exception, response, requestId);
  }
}
