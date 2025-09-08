import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../../../generated/prisma';

export interface UpdateUserRoleDto {
  userId: string;
  role: Role;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  domainId: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(
    updateUserRoleDto: UpdateUserRoleDto,
    requestingUserId: string,
  ): Promise<UserResponse> {
    const { userId, role } = updateUserRoleDto;

    // Get requesting user to check permissions
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    // Only ADMIN can change roles
    if (requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent self-demotion from ADMIN
    if (
      requestingUserId === userId &&
      requestingUser.role === Role.ADMIN &&
      role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Administrators cannot demote themselves');
    }

    // Update user role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deactivateUser(
    userId: string,
    requestingUserId: string,
  ): Promise<UserResponse> {
    // Get requesting user to check permissions
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    // Only ADMIN can deactivate users
    if (requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can deactivate users');
    }

    // Prevent self-deactivation
    if (requestingUserId === userId) {
      throw new ForbiddenException('Users cannot deactivate themselves');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Deactivate user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async activateUser(
    userId: string,
    requestingUserId: string,
  ): Promise<UserResponse> {
    // Get requesting user to check permissions
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    // Only ADMIN can activate users
    if (requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can activate users');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Activate user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
