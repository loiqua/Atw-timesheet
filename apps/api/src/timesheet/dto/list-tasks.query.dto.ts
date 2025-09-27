import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class ListTasksQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  domainId?: string;

  @IsOptional()
  @IsNumberString()
  page?: string; // default 1

  @IsOptional()
  @IsNumberString()
  pageSize?: string; // default 20

  // Admin-only: view another user's tasks
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsBooleanString()
  all?: string; // admin: if true, view all users
}
