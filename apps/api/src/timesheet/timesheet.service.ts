import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
import { PdfService } from './utils/pdf.service';

@Injectable()
export class TimesheetService {
  private readonly logger = new Logger(TimesheetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
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

    const task = await this.prisma.task.create({
      data: {
        userId,
        domainId: dto.domainId,
        date,
        title: dto.title,
        description: dto.description ?? null,
        durationMin: dto.durationMin,
        status: 'DRAFT',
      },
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
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    const isOwner = task.userId === userId;
    const isAdmin = task.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new ForbiddenException();
    if (task.status !== 'DRAFT') {
      throw new BadRequestException('Only draft tasks can be edited');
    }

    if (dto.domainId) await this.ensureDomain(dto.domainId);

    const data: Prisma.TaskUpdateInput = {
      ...(dto.domainId ? { domain: { connect: { id: dto.domainId } } } : {}),
      date: dto.date ? new Date(dto.date) : undefined,
      title: dto.title ?? undefined,
      description: dto.description ?? undefined,
      durationMin: dto.durationMin ?? undefined,
    };

    await this.prisma.task.update({ where: { id: taskId }, data });

    if (
      dto.reportType !== undefined ||
      dto.reportContent !== undefined ||
      dto.reportCategory !== undefined
    ) {
      const existing = await this.prisma.report.findUnique({
        where: { taskId },
      });
      let content: Record<string, unknown> = {};
      const rawContent = existing?.content;
      if (this.isJsonObject(rawContent)) {
        content = { ...rawContent };
      }
      const nextContent = {
        ...content,
        ...(dto.reportCategory !== undefined
          ? { category: dto.reportCategory }
          : {}),
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

    return this.getTaskById(userId, taskId, { allowAdmin: true });
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    const isOwner = task.userId === userId;
    const isAdmin = task.user?.role === 'ADMIN';
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
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted tasks can be approved');
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'APPROVED', managerNote: note ?? null },
    });
  }

  async rejectTask(adminUserId: string, taskId: string, reason: string) {
    await this.ensureAdmin(adminUserId);
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestException('Rejection comment is required');
    }
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted tasks can be rejected');
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'REJECTED', managerNote: reason },
    });
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

    // Ownership or admin-scope
    if (userRole === 'ADMIN' && (query.all === 'true' || query.userId)) {
      if (query.userId) where.userId = query.userId;
      // else: all users
    } else {
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

    return { data, total, page, pageSize };
  }

  async getTaskPdf(userId: string, taskId: string): Promise<Uint8Array> {
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
    const isAdmin = task.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new ForbiddenException();

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
}
