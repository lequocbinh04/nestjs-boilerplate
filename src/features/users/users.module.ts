import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository.interface';
import { PrismaUserRepository } from './repositories/user.repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class UsersModule {}
