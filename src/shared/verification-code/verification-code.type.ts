export enum VerificationCodeType {
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  LOGIN = 'LOGIN',
  DISABLE_2FA = 'DISABLE_2FA',
}

export type TypeOfVerificationCodeType = keyof typeof VerificationCodeType;
