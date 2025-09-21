import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../../../generated/prisma';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { TimesheetService } from './timesheet.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';

class ApproveTaskDto {
  note?: string;
}
class RejectTaskDto {
  reason!: string;
}

@ApiTags('Timesheet')
@ApiBearerAuth('JWT-auth')
@Controller('timesheet')
@UseGuards(JwtAuthGuard)
export class TimesheetController {
  constructor(private readonly service: TimesheetService) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Task created' })
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
    return this.service.listTasks(req.user.id, req.user.role, query);
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
  @ApiBody({ type: ApproveTaskDto })
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ApproveTaskDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.approveTask(req.user.id, id, body?.note);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('tasks/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a SUBMITTED task with comment (admin only)',
  })
  @ApiBody({ type: RejectTaskDto })
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: RejectTaskDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.rejectTask(req.user.id, id, body?.reason);
  }

  @Get('tasks/:id/pdf')
  @ApiOperation({ summary: 'Download PDF summary for a task (owner or admin)' })
  @ApiResponse({ status: 200, description: 'Returns application/pdf' })
  async pdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthRequest,
  ) {
    // Nest will set headers automatically if we return a Stream/Buffer with custom headers,
    // but for simplicity we return a base64 payload here (client can download). For real download,
    // use @Res() and set headers.
    const bytes = await this.service.getTaskPdf(req.user.id, id);
    return {
      contentType: 'application/pdf',
      data: Buffer.from(bytes).toString('base64'),
    };
  }
}
