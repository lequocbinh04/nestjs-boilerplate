import { REQUEST_USER_KEY } from '@common/constants/auth.constant';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request[REQUEST_USER_KEY];
});
