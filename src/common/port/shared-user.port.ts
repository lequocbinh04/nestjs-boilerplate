import { RoleType } from '@common/models/shared-role.model';
import { UserType } from '@common/models/shared-user.model';

export interface ISharedUserRepository
  extends ISharedUserQueryRepository,
    ISharedUserCommandRepository {}

export interface ISharedUserQueryRepository {
  findById(id: number): Promise<UserType | null>;
  findByEmail(email: string): Promise<UserType | null>;
  findByEmailIncludeRole(email: string): Promise<(UserType & { role: RoleType }) | null>;
}

export interface ISharedUserCommandRepository {
  create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserType>;
  update(id: number, data: Partial<UserType>): Promise<UserType>;
  delete(id: number): Promise<void>;
  verifyEmail(userId: number): Promise<void>;
}
