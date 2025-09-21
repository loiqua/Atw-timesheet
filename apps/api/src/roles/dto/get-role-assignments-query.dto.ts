import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../../../../generated/prisma';

export class GetRoleAssignmentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID (UUID v4)' })
  @IsOptional()
  @IsUUID(4)
  userId?: string;

  @ApiPropertyOptional({
    enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    description: 'Filter by role',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Filter by active state' })
  @IsOptional()
  active?: 'true' | 'false';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
