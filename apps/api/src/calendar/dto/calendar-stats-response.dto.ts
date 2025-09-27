import { ApiProperty } from '@nestjs/swagger';

export class CalendarStatsResponseDto {
  @ApiProperty({ description: "Nombre total d'heures travaillées" })
  totalHours: number;

  @ApiProperty({ description: 'Nombre de tâches en brouillon' })
  draftTasks: number;

  @ApiProperty({ description: 'Nombre de tâches soumises' })
  submittedTasks: number;

  @ApiProperty({ description: 'Nombre de tâches approuvées' })
  approvedTasks: number;

  @ApiProperty({ description: 'Nombre de tâches rejetées' })
  rejectedTasks: number;
}
