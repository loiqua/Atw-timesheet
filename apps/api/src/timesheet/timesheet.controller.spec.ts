import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { AuthRequest } from '../auth/types/auth-request.type';

describe('TimesheetController', () => {
  let controller: TimesheetController;

  const mockTimesheetService = {
    createTask: jest.fn(),
    getUserTasks: jest.fn(),
    getAllTasks: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    submitTask: jest.fn(),
    approveTask: jest.fn(),
    rejectTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimesheetController],
      providers: [
        {
          provide: TimesheetService,
          useValue: mockTimesheetService,
        },
      ],
    }).compile();

    controller = module.get<TimesheetController>(TimesheetController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have timesheet service', () => {
    expect(mockTimesheetService).toBeDefined();
  });

  describe('pdf endpoint', () => {
    it('should return base64 encoded PDF', async () => {
      const taskId = 'task-123';
      const mockUser = {
        id: 'user-123',
        role: 'EMPLOYEE' as const,
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        isActive: true,
        domainId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockPdfBytes = new Uint8Array([1, 2, 3, 4]); // Mock PDF bytes

      mockTimesheetService.getTaskPdf.mockResolvedValue(mockPdfBytes);

      const mockRequest: Partial<AuthRequest> = { user: mockUser };
      const result = await controller.pdf(taskId, mockRequest as AuthRequest);

      expect(result).toEqual({
        contentType: 'application/pdf',
        data: Buffer.from(mockPdfBytes).toString('base64'),
      });
      expect(mockTimesheetService.getTaskPdf).toHaveBeenCalledWith(
        mockUser.id,
        taskId,
      );
    });
  });
});
