import { NotFoundException } from '@common/exceptions/base.exception';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
