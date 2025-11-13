import { SetMetadata } from '@nestjs/common';

export enum AuthType {
  Bearer = 'Bearer',
  None = 'None',
}

export const AUTH_TYPE_KEY = 'authType';
export const Auth = (types: AuthType[] = [AuthType.Bearer]) => SetMetadata(AUTH_TYPE_KEY, types);
