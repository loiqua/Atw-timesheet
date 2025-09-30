import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto, MarkAsReadDto } from './dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve paginated notifications for the authenticated user',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications per page (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Filter to show only unread notifications (default: false)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationResponseDto' },
        },
        total: { type: 'number', example: 45 },
        unreadCount: { type: 'number', example: 3 },
      },
    },
  })
  async getUserNotifications(
    @Request() req: AuthRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly,
    });
  }
  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notifications count',
    description:
      'Get the count of unread notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
      },
    },
  })
  async getUnreadCount(@Request() req: AuthRequest) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch('mark-as-read')
  @ApiOperation({
    summary: 'Mark notifications as read',
    description:
      'Mark multiple notifications as read, or all unread notifications if no IDs provided',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        updatedCount: { type: 'number', example: 3 },
      },
    },
  })
  async markAsRead(@Request() req: AuthRequest, @Body() dto: MarkAsReadDto) {
    return this.notificationsService.markAsRead(
      req.user.id,
      dto.notificationIds,
    );
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark single notification as read',
    description: 'Mark a specific notification as read by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markSingleAsRead(
    @Request() req: AuthRequest,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    console.log('🔍 NotificationController.markSingleAsRead:', {
      userId: req.user.id,
      notificationId,
      userObject: req.user,
    });

    return this.notificationsService.markSingleAsRead(
      req.user.id,
      notificationId,
    );
  }
}
