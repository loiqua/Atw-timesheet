import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UpdateTaskStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de la tâche',
    enum: UpdateTaskStatus,
    example: UpdateTaskStatus.APPROVED,
  })
  @IsEnum(UpdateTaskStatus)
  status: UpdateTaskStatus;
}
