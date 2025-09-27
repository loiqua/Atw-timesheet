import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class CalendarTimeSlotDto {
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

export class CalendarDayDto {
  @ApiProperty({ description: 'Date du jour (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Nom du jour' })
  dayName: string;

  @ApiProperty({ description: 'Numéro du jour' })
  dayNumber: number;

  @ApiProperty({ description: "Indique si c'est aujourd'hui" })
  isToday: boolean;

  @ApiProperty({
    description: 'Créneaux horaires du jour',
    type: [CalendarTimeSlotDto],
  })
  timeSlots: CalendarTimeSlotDto[];
}

export class CalendarWeekResponseDto {
  @ApiProperty({ description: 'Numéro de la semaine' })
  weekNumber: number;

  @ApiProperty({ description: 'Date de début de la semaine (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ description: 'Date de fin de la semaine (YYYY-MM-DD)' })
  endDate: string;

  @ApiProperty({ description: 'Jours de la semaine', type: [CalendarDayDto] })
  days: CalendarDayDto[];
}
