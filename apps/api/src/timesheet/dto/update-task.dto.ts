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
} from 'class-validator';
import { ReportType } from '../../../../../generated/prisma';

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
