import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { Role } from '@prisma/client';
import * as PrismaEnums from '@prisma/client';

export class CreateRoleAssignmentDto {
  @IsEnum(PrismaEnums.Role)
  role: Role;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scope?: string;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class UpdateRoleAssignmentDto {
  @IsOptional()
  @IsEnum(PrismaEnums.Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scope?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  isActive?: boolean;
}
