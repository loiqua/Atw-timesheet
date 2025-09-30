import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
import { Prisma, NotificationType } from '@prisma/client';
import { PdfService } from './utils/pdf.service';
import { calculateTimeInfo, isValidTimeRange } from './utils/time.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TimesheetService {
  private readonly logger = new Logger(TimesheetService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private isJsonObject(
    value: Prisma.JsonValue | undefined,
  ): value is Prisma.JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    await this.ensureDomain(dto.domainId);
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    // Logique de calcul des heures et durée
    let finalDurationMin: number;
    let finalStartTime: string | null = null;
    let finalEndTime: string | null = null;

    if (dto.startTime && dto.endTime) {
      // Nouveau système : calculer la durée à partir des heures
      if (!isValidTimeRange(dto.startTime, dto.endTime)) {
        throw new BadRequestException('Plage horaire invalide');
      }

      const timeInfo = calculateTimeInfo({
        startTime: dto.startTime,
        endTime: dto.endTime,
      });

      finalDurationMin = timeInfo.durationMinutes;
      finalStartTime = dto.startTime;
      finalEndTime = dto.endTime;
    } else if (dto.durationMin) {
      // Ancien système : utiliser la durée directement
      finalDurationMin = dto.durationMin;
    } else {
      throw new BadRequestException(
        'Veuillez fournir soit les heures (startTime/endTime) soit la durée (durationMin)',
      );
    }

    const taskData: Prisma.TaskCreateInput = {
      user: { connect: { id: userId } },
      domain: { connect: { id: dto.domainId } },
      date,
      title: dto.title,
      description: dto.description ?? null,
      durationMin: finalDurationMin,
      status: 'DRAFT',
      ...(finalStartTime && { startTime: finalStartTime }),
      ...(finalEndTime && { endTime: finalEndTime }),
    };

    const task = await this.prisma.task.create({
      data: taskData,
    });

    if (dto.reportContent) {
      await this.prisma.report.create({
        data: {
          taskId: task.id,
          type: dto.reportType ?? 'STANDARD',
          content: {
            ...(dto.reportCategory ? { category: dto.reportCategory } : {}),
            ...dto.reportContent,
          } as Prisma.InputJsonObject,
        },
      });
    }

    return this.getTaskById(userId, task.id, { allowAdmin: true });
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    // Validate permission and status
    await this.verifyDraftEditable(userId, taskId);

    // Validate domain if provided
    if (dto.domainId) await this.ensureDomain(dto.domainId);

    // Build and apply base task update
    const data = this.buildTaskUpdateData(dto);
    await this.prisma.task.update({ where: { id: taskId }, data });

    // Upsert report if any report-related fields were provided
    await this.upsertReportForUpdate(taskId, dto);

    return this.getTaskById(userId, taskId, { allowAdmin: true });
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isOwner = task.userId === userId;

    // Vérifier si l'utilisateur actuel est admin
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    if (!isOwner && !isAdmin) throw new ForbiddenException();

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted' };
  }

  async submitTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.userId !== userId) throw new ForbiddenException();
    if (task.status !== 'DRAFT') {
      throw new BadRequestException('Only draft tasks can be submitted');
    }
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'SUBMITTED' },
    });
    return updated;
  }

  async approveTask(adminUserId: string, taskId: string, note?: string) {
    await this.ensureAdmin(adminUserId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { fullName: true } } },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted tasks can be approved');
    }

    // Get admin info for notification
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });

    // Update task status
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'APPROVED', managerNote: note ?? null },
    });

    // Create and send notification
    try {
      const notification =
        await this.notificationsService.createTaskNotification(
          task.userId,
          'TASK_APPROVED' as NotificationType,
          taskId,
          task.title,
          note,
          admin?.fullName,
        );

      // Send real-time notification
      this.notificationsGateway.sendNotificationToUser(
        task.userId,
        notification,
      );

      this.logger.log(
        `Task ${taskId} approved and notification sent to user ${task.userId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send approval notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't fail the approval if notification fails
    }

    return updatedTask;
  }

  async rejectTask(adminUserId: string, taskId: string, reason?: string) {
    await this.ensureAdmin(adminUserId);

    // Rendre le commentaire optionnel avec une valeur par défaut
    const finalReason =
      reason && reason.trim().length >= 3
        ? reason
        : "Rejeté par l'administrateur";

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { fullName: true } } },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted tasks can be rejected');
    }

    // Get admin info for notification
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });

    // Update task status
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'REJECTED', managerNote: finalReason },
    });

    // Create and send notification
    try {
      const notification =
        await this.notificationsService.createTaskNotification(
          task.userId,
          'TASK_REJECTED' as NotificationType,
          taskId,
          task.title,
          finalReason,
          admin?.fullName,
        );

      // Send real-time notification
      this.notificationsGateway.sendNotificationToUser(
        task.userId,
        notification,
      );

      this.logger.log(
        `Task ${taskId} rejected and notification sent to user ${task.userId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send rejection notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't fail the rejection if notification fails
    }

    return updatedTask;
  }

  async requestTaskRevision(
    adminUserId: string,
    taskId: string,
    revisionNote: string,
  ) {
    await this.ensureAdmin(adminUserId);

    if (!revisionNote || revisionNote.trim().length < 3) {
      throw new BadRequestException(
        'Revision note is required and must be at least 3 characters',
      );
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { fullName: true } } },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Only submitted tasks can be sent for revision',
      );
    }

    // Get admin info for notification
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });

    // Update task status to NEEDS_REVISION and reset to DRAFT for editing
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'DRAFT', // Reset to DRAFT so user can edit
        managerNote: revisionNote.trim(),
      },
    });

    // Create and send notification
    try {
      const notification =
        await this.notificationsService.createTaskNotification(
          task.userId,
          'TASK_NEEDS_REVISION' as NotificationType,
          taskId,
          task.title,
          revisionNote.trim(),
          admin?.fullName,
        );

      // Send real-time notification
      this.notificationsGateway.sendNotificationToUser(
        task.userId,
        notification,
      );

      this.logger.log(
        `Task ${taskId} sent for revision and notification sent to user ${task.userId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send revision notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't fail the revision request if notification fails
    }

    return updatedTask;
  }

  async getTaskById(
    requestUserId: string,
    taskId: string,
    opts?: { allowAdmin?: boolean },
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        domain: { select: { id: true, name: true, slug: true } },
        report: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    const isOwner = task.userId === requestUserId;
    const isAdmin = task.user.role === 'ADMIN';
    if (!isOwner && !(opts?.allowAdmin && isAdmin))
      throw new ForbiddenException();
    return task;
  }

  async listTasks(
    userId: string,
    userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INFO_IT',
    query: ListTasksQueryDto,
  ) {
    const page = Math.max(parseInt(query.page ?? '1', 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(query.pageSize ?? '20', 10) || 20, 1),
      100,
    );

    const where: Prisma.TaskWhereInput = {};

    // Ownership or elevated scope (ADMIN or MANAGER)
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      if (query.userId) {
        where.userId = query.userId;
      } else if (query.all === 'true') {
        // Show all users' tasks
      } else {
        // Default: show only own tasks
        where.userId = userId;
      }
    } else {
      // Regular users can only see their own tasks
      where.userId = userId;
    }

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
    if (query.dateTo) dateFilter.lte = new Date(query.dateTo);
    if (dateFilter.gte || dateFilter.lte) where.date = dateFilter;
    if (query.title)
      where.title = { contains: query.title, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    if (query.domainId) where.domainId = query.domainId;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: {
          domain: { select: { id: true, name: true, slug: true } },
          report: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { tasks: data, total, page, pageSize };
  }

  async getTaskPdf(userId: string, taskId: string): Promise<Uint8Array> {
    // Récupérer les infos de l'utilisateur connecté
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!currentUser) throw new NotFoundException('User not found');

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        domain: { select: { id: true, name: true, slug: true } },
        report: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isOwner = task.userId === userId;
    const isCurrentUserAdmin = currentUser.role === 'ADMIN';
    if (!isOwner && !isCurrentUserAdmin) throw new ForbiddenException();

    // Safely narrow report content
    const content = task.report?.content;
    let reportCategory: string | null = null;
    let reportContent: Record<string, unknown> | null = null;
    if (this.isJsonObject(content)) {
      const cat = content['category'];
      if (typeof cat === 'string') reportCategory = cat;
      reportContent = { ...content };
    }

    const bytes = await this.pdfService.generateTimesheetPdf({
      title: task.title,
      domainName: task.domain?.name ?? null,
      dateISO: task.date.toISOString(),
      durationMin: task.durationMin,
      status: task.status,
      description: task.description,
      reportCategory,
      reportContent,
      createdBy: { fullName: task.user.fullName, email: task.user.email },
    });
    return bytes;
  }

  private async ensureDomain(domainId: string) {
    const d = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!d) throw new NotFoundException('Domain not found');
  }

  private async ensureAdmin(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!u || u.role !== 'ADMIN') throw new ForbiddenException('Admin only');
  }

  /** Ensure the task exists, caller can edit it, and it's still a DRAFT. */
  private async verifyDraftEditable(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isOwner = task.userId === userId;

    // Seul le propriétaire peut éditer (même les admins ne peuvent pas éditer les tâches des autres)
    if (!isOwner) {
      throw new ForbiddenException('You can only edit your own tasks');
    }

    if (task.status !== 'DRAFT') {
      throw new BadRequestException('Only draft tasks can be edited');
    }
    return task;
  }

  /** Build partial Task update data from DTO */
  private buildTaskUpdateData(dto: UpdateTaskDto): Prisma.TaskUpdateInput {
    return {
      ...(dto.domainId ? { domain: { connect: { id: dto.domainId } } } : {}),
      date: dto.date ? new Date(dto.date) : undefined,
      title: dto.title ?? undefined,
      // allow explicit null to clear description
      description: dto.description === undefined ? undefined : dto.description,
      durationMin: dto.durationMin ?? undefined,
    };
  }

  /** Upsert task's report if any report-related fields were provided */
  private async upsertReportForUpdate(taskId: string, dto: UpdateTaskDto) {
    if (
      dto.reportType === undefined &&
      dto.reportContent === undefined &&
      dto.reportCategory === undefined
    ) {
      return;
    }

    const existing = await this.prisma.report.findUnique({ where: { taskId } });
    let content: Record<string, unknown> = {};
    const rawContent = existing?.content;
    if (this.isJsonObject(rawContent)) content = { ...rawContent };

    const categoryObj =
      dto.reportCategory !== undefined ? { category: dto.reportCategory } : {};
    const nextContent = {
      ...content,
      ...categoryObj,
      ...(dto.reportContent ?? {}),
    } as Prisma.InputJsonObject;

    if (existing) {
      await this.prisma.report.update({
        where: { taskId },
        data: {
          type: dto.reportType ?? undefined,
          content: nextContent,
        },
      });
    } else {
      await this.prisma.report.create({
        data: {
          taskId,
          type: dto.reportType ?? 'STANDARD',
          content: nextContent,
        },
      });
    }
  }
}
