import {
  DeviceType,
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  RegisterResType,
  SendOtpEmailType,
  VerifyEmailType,
} from './auth.model';

export interface IAuthService {
  register(body: RegisterBodyType): Promise<RegisterResType>;
  login(dto: LoginBodyType & { userAgent: string; ip: string }): Promise<LoginResType>;
  verifyEmail(body: VerifyEmailType): Promise<void>; // throw when error
  sendOtpEmail(body: SendOtpEmailType): Promise<void>; // throw when error
}

export interface IAuthRepository extends IAuthQueryRepository, IAuthCommandRepository {}

export type IAuthQueryRepository = {};

export interface IAuthCommandRepository {
  createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> &
      Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ): Promise<DeviceType>;
}
