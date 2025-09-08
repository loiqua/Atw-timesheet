import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService, UserResponse } from './users.service';
import { UpdateUserRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../../../generated/prisma';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async findById(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findById(id);
  }

  @Put(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.updateUserRole(
      { ...updateUserRoleDto, userId },
      req.user.id,
    );
  }

  @Put(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deactivateUser(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.deactivateUser(userId, req.user.id);
  }

  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async activateUser(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.activateUser(userId, req.user.id);
  }
}
