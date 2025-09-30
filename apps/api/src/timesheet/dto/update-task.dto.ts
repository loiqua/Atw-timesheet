import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Matches,
  Validate,
} from 'class-validator';
import { ReportType } from '@prisma/client';
import { WorkingHoursValidator } from './create-task.dto';

export class UpdateTaskDto {
  @IsOptional()
  @IsUUID()
  domainId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  date?: string; // ISO 8601

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  // 🔒 Nouveau système d'heures avec validation 8h-18h
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  @Validate(WorkingHoursValidator)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  @Validate(WorkingHoursValidator)
  endTime?: string;

  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @IsOptional()
  @IsString()
  reportCategory?: string | null;

  @IsOptional()
  @IsObject()
  reportContent?: Record<string, unknown> | null;
}
