import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the user who receives the notification',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  readonly userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.TASK_NEEDS_REVISION,
  })
  readonly type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Révision demandée',
  })
  readonly title: string;

  @ApiProperty({
    description: 'Notification message content',
    example:
      "Merci de préciser les horaires exacts et d'ajouter plus de détails.",
  })
  readonly message: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  readonly isRead: boolean;

  @ApiPropertyOptional({
    description: 'ID of the related task (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  readonly relatedTaskId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: {
      adminNote: 'Please add more details',
      taskTitle: 'Development API',
    },
  })
  readonly metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Notification creation timestamp',
    example: '2024-09-28T08:30:00Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'Notification last update timestamp',
    example: '2024-09-28T08:30:00Z',
  })
  readonly updatedAt: Date;
}
