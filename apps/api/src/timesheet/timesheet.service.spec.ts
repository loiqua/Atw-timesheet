import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetService } from './timesheet.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './utils/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('TimesheetService', () => {
  let service: TimesheetService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    domain: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    report: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPdfService = {
    generateTimesheetPdf: jest.fn(),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
    createTaskNotification: jest.fn(),
  };

  const mockNotificationsGateway = {
    sendNotificationToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimesheetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<TimesheetService>(TimesheetService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have prisma service', () => {
    expect(mockPrismaService).toBeDefined();
  });

  it('should have pdf service', () => {
    expect(mockPdfService).toBeDefined();
  });

  describe('deleteTask', () => {
    it('should allow owner to delete their own task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: userId,
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        role: 'EMPLOYEE',
      });

      mockPrismaService.task.delete.mockResolvedValue({});

      const result = await service.deleteTask(userId, taskId);

      expect(result).toEqual({ message: 'Task deleted' });
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('should allow admin to delete any task', async () => {
      const taskId = 'task-123';
      const adminId = 'admin-123';
      const taskOwnerId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: taskOwnerId,
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
      });

      mockPrismaService.task.delete.mockResolvedValue({});

      const result = await service.deleteTask(adminId, taskId);

      expect(result).toEqual({ message: 'Task deleted' });
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });
  });

  describe('submitTask', () => {
    it('should allow owner to submit their own draft task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: userId,
        status: 'DRAFT',
        title: 'Test Task',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'EMPLOYEE',
      });

      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        userId: userId,
        status: 'SUBMITTED',
        title: 'Test Task',
      });

      const result = await service.submitTask(userId, taskId);

      expect(result.status).toBe('SUBMITTED');
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: 'SUBMITTED' },
      });
    });

    it('should reject admin trying to submit task they do not own', async () => {
      const taskId = 'task-123';
      const adminId = 'admin-123';
      const taskOwnerId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: taskOwnerId,
        status: 'DRAFT',
        title: 'Test Task',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: adminId,
        role: 'ADMIN',
      });

      await expect(service.submitTask(adminId, taskId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject non-owner non-admin trying to submit task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: otherUserId,
        status: 'DRAFT',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'EMPLOYEE',
      });

      await expect(service.submitTask(userId, taskId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject submitting non-draft task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: userId,
        status: 'SUBMITTED',
      });

      await expect(service.submitTask(userId, taskId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approveTask', () => {
    it('should allow admin to approve submitted task', async () => {
      const taskId = 'task-123';
      const adminId = 'admin-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: adminId,
        role: 'ADMIN',
        fullName: 'Admin User',
      });

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: 'user-123',
        status: 'SUBMITTED',
        title: 'Test Task',
      });

      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'APPROVED',
      });

      mockNotificationsService.createTaskNotification.mockResolvedValue({
        id: 'notif-123',
      });

      const result = await service.approveTask(adminId, taskId);

      expect(result.status).toBe('APPROVED');
      expect(
        mockNotificationsService.createTaskNotification,
      ).toHaveBeenCalled();
      expect(
        mockNotificationsGateway.sendNotificationToUser,
      ).toHaveBeenCalled();
    });

    it('should reject non-admin trying to approve task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'EMPLOYEE',
      });

      await expect(service.approveTask(userId, taskId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('rejectTask', () => {
    it('should allow admin to reject submitted task with reason', async () => {
      const taskId = 'task-123';
      const adminId = 'admin-123';
      const reason = 'Incomplete information';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: adminId,
        role: 'ADMIN',
        fullName: 'Admin User',
      });

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: 'user-123',
        status: 'SUBMITTED',
        title: 'Test Task',
      });

      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'REJECTED',
        managerNote: reason,
      });

      mockNotificationsService.createTaskNotification.mockResolvedValue({
        id: 'notif-123',
      });

      const result = await service.rejectTask(adminId, taskId, reason);

      expect(result.status).toBe('REJECTED');
      expect(result.managerNote).toBe(reason);
    });
  });

  describe('createTask', () => {
    it('should create task with valid time range', async () => {
      const userId = 'user-123';
      const createDto = {
        title: 'Test Task',
        domainId: 'domain-123',
        date: '2025-09-30',
        startTime: '09:00',
        endTime: '12:00',
      };

      mockPrismaService.domain.findUnique.mockResolvedValue({
        id: 'domain-123',
        name: 'Engineering',
      });

      mockPrismaService.task.create.mockResolvedValue({
        id: 'task-123',
        ...createDto,
        userId,
        status: 'DRAFT',
        durationMin: 180,
      });

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-123',
        ...createDto,
        userId,
        status: 'DRAFT',
        user: {
          id: userId,
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'EMPLOYEE',
        },
      });

      const result = await service.createTask(userId, createDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.task.create).toHaveBeenCalled();
    });

    it('should reject task with invalid time range', async () => {
      const userId = 'user-123';
      const createDto = {
        title: 'Test Task',
        domainId: 'domain-123',
        date: '2025-09-30',
        startTime: '12:00',
        endTime: '09:00', // End before start
      };

      mockPrismaService.domain.findUnique.mockResolvedValue({
        id: 'domain-123',
      });

      await expect(service.createTask(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateTask', () => {
    it('should allow owner to update their draft task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const updateDto = {
        title: 'Updated Task',
      };

      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({
          id: taskId,
          userId: userId,
          status: 'DRAFT',
          title: 'Original Task',
          user: {
            id: userId,
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'EMPLOYEE',
          },
        })
        .mockResolvedValueOnce({
          id: taskId,
          userId: userId,
          status: 'DRAFT',
          title: 'Updated Task',
          user: {
            id: userId,
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'EMPLOYEE',
          },
        });

      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        userId: userId,
        status: 'DRAFT',
        title: 'Updated Task',
      });

      const result = await service.updateTask(userId, taskId, updateDto);

      expect(result.title).toBe('Updated Task');
    });

    it('should reject updating non-draft task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const updateDto = {
        title: 'Updated Task',
      };

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: userId,
        status: 'SUBMITTED',
        user: {
          id: userId,
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'EMPLOYEE',
        },
      });

      await expect(
        service.updateTask(userId, taskId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
