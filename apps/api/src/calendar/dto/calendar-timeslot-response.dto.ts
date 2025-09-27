import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class CalendarTimeSlotResponseDto {
  @ApiProperty({ description: 'ID unique du créneau' })
  id: string;

  @ApiProperty({ description: 'ID de la tâche' })
  taskId: string;

  @ApiProperty({ description: "ID de l'utilisateur" })
  userId: string;

  @ApiProperty({ description: "Nom complet de l'utilisateur" })
  userName: string;

  @ApiProperty({ description: "Initiales de l'utilisateur" })
  userInitials: string;

  @ApiProperty({ description: 'ID du projet' })
  projectId: string;

  @ApiProperty({ description: 'Nom du projet' })
  projectName: string;

  @ApiProperty({ description: 'ID du domaine' })
  domainId: string;

  @ApiProperty({ description: 'Nom du domaine' })
  domainName: string;

  @ApiProperty({ description: 'Couleur du domaine' })
  domainColor: string;

  @ApiProperty({ description: 'Heure de début (HH:mm)' })
  startTime: string;

  @ApiProperty({ description: 'Heure de fin (HH:mm)' })
  endTime: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Statut de la tâche', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Description de la tâche', required: false })
  description?: string;

  @ApiProperty({ description: "Nombre d'heures travaillées" })
  hoursWorked: number;
}
