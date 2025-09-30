import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { TimesheetService } from './timesheet.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
@ApiTags('Timesheet')
@ApiBearerAuth('JWT-auth')
@Controller('timesheet')
@UseGuards(JwtAuthGuard)
export class TimesheetController {
  private readonly logger = new Logger(TimesheetController.name);

  constructor(private readonly service: TimesheetService) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task (DRAFT)' })
  async create(@Body() dto: CreateTaskDto, @Request() req: AuthRequest) {
    return this.service.createTask(req.user.id, dto);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a DRAFT task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.updateTask(req.user.id, id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task (any status, owner or admin)' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.deleteTask(req.user.id, id);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by id (owner or admin)' })
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.getTaskById(req.user.id, id, { allowAdmin: true });
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated list of tasks' })
  async list(@Query() query: ListTasksQueryDto, @Request() req: AuthRequest) {
    this.logger.log(
      `Listing tasks for user ${req.user.id} with role ${req.user.role}`,
    );
    return this.service.listTasks(
      req.user.id,
      req.user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INFO_IT',
      query,
    );
  }

  @Post('tasks/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a DRAFT task (locks editing)' })
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.submitTask(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('tasks/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a SUBMITTED task (admin only)' })
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { note?: string },
    @Request() req: AuthRequest,
  ) {
    return this.service.approveTask(req.user.id, id, body.note);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('tasks/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a SUBMITTED task with comment (admin only)',
  })
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { reason: string },
    @Request() req: AuthRequest,
  ) {
    return this.service.rejectTask(req.user.id, id, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('tasks/:id/request-revision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request revision for a SUBMITTED task (admin only)',
    description: 'Sends task back to DRAFT status with revision notes',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task sent for revision successfully',
  })
  async requestRevision(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { note: string },
    @Request() req: AuthRequest,
  ) {
    return this.service.requestTaskRevision(req.user.id, id, body.note);
  }

  @Get('tasks/:id/pdf')
  @ApiOperation({ summary: 'Download PDF summary for a task (owner or admin)' })
  @ApiResponse({ status: 200, description: 'Returns base64 encoded PDF' })
  async pdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthRequest,
  ): Promise<{ contentType: string; data: string }> {
    const bytes = await this.service.getTaskPdf(req.user.id, id);
    const base64Data = Buffer.from(bytes).toString('base64');

    return {
      contentType: 'application/pdf',
      data: base64Data,
    };
  }
}
