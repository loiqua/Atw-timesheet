import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { Role } from '../../../../../generated/prisma';
import * as PrismaEnums from '../../../../../generated/prisma';

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
