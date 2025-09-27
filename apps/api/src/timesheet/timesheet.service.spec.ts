import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetService } from './timesheet.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './utils/pdf.service';

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
  };

  const mockPdfService = {
    generateTimesheetPdf: jest.fn(),
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
      });

      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'SUBMITTED',
      });

      const result = await service.submitTask(userId, taskId);

      expect(result.status).toBe('SUBMITTED');
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: 'SUBMITTED' },
      });
    });

    it('should reject non-owner trying to submit task', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        userId: otherUserId,
        status: 'DRAFT',
      });

      await expect(service.submitTask(userId, taskId)).rejects.toThrow();
    });
  });
});
