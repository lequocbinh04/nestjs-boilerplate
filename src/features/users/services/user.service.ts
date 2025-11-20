import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async getMe(_userId: number) {}
}
