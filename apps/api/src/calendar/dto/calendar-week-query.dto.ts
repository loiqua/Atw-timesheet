import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class CalendarWeekQueryDto {
  @ApiProperty({
    description: 'Date de début de la semaine (format YYYY-MM-DD)',
    example: '2024-01-08',
  })
  @IsDateString()
  weekStartDate: string;

  @ApiProperty({
    description: "ID de l'utilisateur à filtrer (admin/manager uniquement)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID du domaine à filtrer',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  domainId?: string;

  @ApiProperty({
    description: 'Statut des tâches à filtrer',
    enum: TaskStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
