import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(Role)
  role: Role;
}
