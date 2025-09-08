import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../../../generated/prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    role: Role.EMPLOYEE,
    isActive: true,
    domainId: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    ...mockUser,
    id: '2',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, mockAdminUser];
      prismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
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
    });

    it('should throw NotFoundException for non-existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    const updateRoleDto = {
      userId: '1',
      role: Role.MANAGER,
    };

    it('should update user role when requested by admin', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce({ role: Role.ADMIN }) // requesting user
        .mockResolvedValueOnce(mockUser); // target user

      const updatedUser = { ...mockUser, role: Role.MANAGER };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole(updateRoleDto, '2');

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          role: Role.MANAGER,
          updatedAt: expect.any(Date),
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
    });

    it('should throw ForbiddenException when non-admin tries to update role', async () => {
      prismaService.user.findUnique.mockResolvedValue({ role: Role.EMPLOYEE });

      await expect(service.updateUserRole(updateRoleDto, '1')).rejects.toThrow(ForbiddenException);
    });

    it('should prevent admin from demoting themselves', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce({ role: Role.ADMIN }) // requesting user
        .mockResolvedValueOnce(mockAdminUser); // target user (same as requesting)

      const demoteDto = {
        userId: '2',
        role: Role.EMPLOYEE,
      };

      await expect(service.updateUserRole(demoteDto, '2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user when requested by admin', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce({ role: Role.ADMIN }) // requesting user
        .mockResolvedValueOnce(mockUser); // target user

      const deactivatedUser = { ...mockUser, isActive: false };
      prismaService.user.update.mockResolvedValue(deactivatedUser);

      const result = await service.deactivateUser('1', '2');

      expect(result).toEqual(deactivatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
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
    });

    it('should throw ForbiddenException when non-admin tries to deactivate', async () => {
      prismaService.user.findUnique.mockResolvedValue({ role: Role.EMPLOYEE });

      await expect(service.deactivateUser('1', '2')).rejects.toThrow(ForbiddenException);
    });

    it('should prevent user from deactivating themselves', async () => {
      prismaService.user.findUnique.mockResolvedValue({ role: Role.ADMIN });

      await expect(service.deactivateUser('1', '1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('activateUser', () => {
    it('should activate user when requested by admin', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce({ role: Role.ADMIN }) // requesting user
        .mockResolvedValueOnce({ ...mockUser, isActive: false }); // target user

      const activatedUser = { ...mockUser, isActive: true };
      prismaService.user.update.mockResolvedValue(activatedUser);

      const result = await service.activateUser('1', '2');

      expect(result).toEqual(activatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
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
    });

    it('should throw ForbiddenException when non-admin tries to activate', async () => {
      prismaService.user.findUnique.mockResolvedValue({ role: Role.EMPLOYEE });

      await expect(service.activateUser('1', '2')).rejects.toThrow(ForbiddenException);
    });
  });
});
