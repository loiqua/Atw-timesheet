import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsInt,
  Matches,
} from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateTaskDto {
  @IsUUID()
  domainId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date!: string; // ISO 8601, stored as timestamptz

  // Nouveau système d'heures (prioritaire)
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: "Format d'heure invalide. Attendu: HH:mm",
  })
  endTime?: string;

  // Ancien système (optionnel pour compatibilité)
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  // Optional detailed report
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType; // STANDARD | CUSTOM

  @IsOptional()
  @IsString()
  reportCategory?: string; // e.g., FieldSurvey, CallCenter, Training, etc.

  @IsOptional()
  @IsObject()
  reportContent?: Record<string, unknown>;
}
