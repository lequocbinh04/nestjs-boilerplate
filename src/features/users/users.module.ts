import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { PrismaUserRepository } from './repositories/user.repository';
import { UserRepository } from './repositories/user.repository.interface';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class UsersModule {}
