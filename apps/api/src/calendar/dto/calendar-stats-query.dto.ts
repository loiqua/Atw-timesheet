import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalendarStatsQueryDto {
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
}
