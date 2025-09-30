import { IsUUID, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiPropertyOptional({
    description: 'Array of notification IDs to mark as read',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly notificationIds?: readonly string[];
}

export class MarkSingleAsReadDto {
  @ApiProperty({
    description: 'Notification ID to mark as read',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  readonly notificationId: string;
}
