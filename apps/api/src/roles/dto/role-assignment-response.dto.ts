import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '@prisma/client';

export class UserSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] })
  role?: Role;
}

export class RoleAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] })
  role!: Role;

  @ApiProperty({ required: false, nullable: true })
  scope?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date | string;

  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  validTo?: Date | string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: () => UserSummaryDto })
  user!: UserSummaryDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date | string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date | string;
}

export class PaginatedRoleAssignmentsDto {
  @ApiProperty({ type: [RoleAssignmentResponseDto] })
  data!: RoleAssignmentResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
