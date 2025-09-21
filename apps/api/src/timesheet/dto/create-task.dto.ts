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
} from 'class-validator';
import { ReportType } from '../../../../../generated/prisma';

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

  @IsInt()
  @Min(0)
  durationMin!: number;

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
