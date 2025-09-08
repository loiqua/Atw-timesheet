import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '../../../../../generated/prisma';

export class UpdateUserRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(Role)
  role: Role;
}
