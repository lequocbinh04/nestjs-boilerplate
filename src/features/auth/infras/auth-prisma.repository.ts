import { SerializeAll } from '@common/decorators/serializers.decorator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { DeviceType } from '../auth.model';
import { IAuthRepository } from '../auth.port';

@Injectable()
@SerializeAll()
export class AuthPrismaRepository implements IAuthRepository {
  constructor(private prismaService: PrismaService) {}

  createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> &
      Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    }) as unknown as Promise<DeviceType>;
  }
}
