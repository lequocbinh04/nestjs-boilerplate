import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserType } from '@common/models/shared-user.model';
import { AuthenticatedRequest } from '@common/types/request.types';
import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { UserService } from '../services/user.service';
import { GetMeResDTO } from '../user.dto';
import { GetMeResSchema } from '../user.model';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ZodResponse({ type: GetMeResDTO })
  async getMe(@CurrentUser() user: UserType) {
    return JSON.parse(JSON.stringify(user));
  }
}
