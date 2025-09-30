import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user who will receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  readonly userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.TASK_NEEDS_REVISION,
  })
  @IsEnum(NotificationType)
  readonly type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Révision demandée',
  })
  @IsString()
  readonly title: string;

  @ApiProperty({
    description: 'Notification message content',
    example:
      "Merci de préciser les horaires exacts et d'ajouter plus de détails.",
  })
  @IsString()
  readonly message: string;

  @ApiPropertyOptional({
    description: 'ID of the related task (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  readonly relatedTaskId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: {
      adminNote: 'Please add more details',
      taskTitle: 'Development API',
    },
  })
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, unknown>;
}
