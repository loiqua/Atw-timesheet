import { IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum DateRange {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsEnum(DateRange)
  dateRange?: DateRange = DateRange.MONTH;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
