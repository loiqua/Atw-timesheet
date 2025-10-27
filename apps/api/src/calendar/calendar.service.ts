import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarWeekQueryDto } from './dto/calendar-week-query.dto';
import { CalendarStatsQueryDto } from './dto/calendar-stats-query.dto';
import { CalendarWeekResponseDto } from './dto/calendar-week-response.dto';
import { CalendarStatsResponseDto } from './dto/calendar-stats-response.dto';
import { Prisma } from '@prisma/client';
import { CalendarUserResponseDto } from './dto/calendar-user-response.dto';
import { CalendarDomainResponseDto } from './dto/calendar-domain-response.dto';
import { CalendarTimeSlotResponseDto } from './dto/calendar-timeslot-response.dto';
import { TaskStatus } from '@prisma/client';

// Type pour les jours du calendrier
interface CalendarDayDto {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  timeSlots: any[];
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeekData(
    query: CalendarWeekQueryDto,
    requestUserId: string,
    userRole: string,
  ): Promise<CalendarWeekResponseDto> {
    const { weekStartDate, userId, domainId, status } = query;

    // Debug logs removed for production

    if (!weekStartDate) {
      throw new Error('weekStartDate est requis');
    }

    // Calculer les dates de début et fin de semaine
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Déterminer les filtres selon les permissions - POLITIQUE STRICTE
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const canViewAllUsers = isAdmin || isManager;

    let userFilter: { userId?: string } = {};
    if (!canViewAllUsers) {
      // 🔒 RESTRICTION STRICTE: Les utilisateurs normaux ne voient QUE leurs propres tâches
      // Ignorer complètement le paramètre userId du query pour les non-admin
      userFilter = { userId: requestUserId };
    } else if (userId) {
      // Les admins/managers peuvent filtrer par utilisateur
      userFilter = { userId };
    }

    // Construire les filtres
    const whereClause: Prisma.TaskWhereInput = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...userFilter,
      ...(domainId && { domainId }),
      ...(status && { status }),
    };

    // Prisma query logs removed for production

    // Récupérer les tâches
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        domain: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Task details logs removed for production

    // Générer la structure de la semaine
    const days: CalendarDayDto[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayTasks = tasks.filter((task) => {
        const taskDateStr = task.date.toISOString().split('T')[0];
        const currentDateStr = currentDate.toISOString().split('T')[0];
        return taskDateStr === currentDateStr;
      });

      // Day filtering logs removed for production

      const timeSlots = dayTasks.map((task) => {
        const startTime = task.startTime ?? '05:00';
        const endTime = task.endTime ?? '22:00';

        // Task time logs removed for production

        return {
          id: `${task.id}-${task.date.toISOString()}`,
          taskId: task.id,
          userId: task.user.id,
          userName: task.user.fullName,
          userInitials: this.generateInitials(task.user.fullName),
          projectId: task.id, // Utiliser l'ID de la tâche comme projectId pour l'instant
          projectName: task.title,
          domainId: task.domain.id,
          domainName: task.domain.name,
          domainColor: '#3B82F6', // Couleur par défaut, à adapter selon vos besoins
          startTime,
          endTime,
          date: currentDate.toISOString().split('T')[0],
          status: task.status,
          description: task.description ?? undefined,
          hoursWorked: this.calculateHours(startTime, endTime),
        };
      });

      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayName: currentDate.toLocaleDateString('fr-FR', { weekday: 'long' }),
        dayNumber: currentDate.getDate(),
        isToday: this.isToday(currentDate),
        timeSlots,
      });
    }

    // Calculer le numéro de semaine
    const weekNumber = this.getWeekNumber(startDate);

    return {
      weekNumber,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days,
    };
  }

  async getWeekStats(
    query: CalendarStatsQueryDto,
    requestUserId: string,
    userRole: string,
  ): Promise<CalendarStatsResponseDto> {
    const { weekStartDate, userId, domainId } = query;

    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const canViewAllUsers = isAdmin || isManager;

    let userFilter: { userId?: string } = {};
    if (!canViewAllUsers) {
      // 🔒 RESTRICTION STRICTE: Les utilisateurs normaux ne voient QUE leurs statistiques
      userFilter = { userId: requestUserId };
    } else if (userId) {
      userFilter = { userId };
    }

    const whereClause = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...userFilter,
      ...(domainId && { domainId }),
    };

    // Récupérer les statistiques
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    // Calculer les statistiques
    let totalHours = 0;
    let draftTasks = 0;
    let submittedTasks = 0;
    let approvedTasks = 0;
    let rejectedTasks = 0;

    tasks.forEach((task) => {
      totalHours += this.calculateHours(
        task.startTime ?? '05:00',
        task.endTime ?? '22:00',
      );
      switch (task.status) {
        case 'DRAFT':
          draftTasks++;
          break;
        case 'SUBMITTED':
          submittedTasks++;
          break;
        case 'APPROVED':
          approvedTasks++;
          break;
        case 'REJECTED':
          rejectedTasks++;
          break;
      }
    });

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      draftTasks,
      submittedTasks,
      approvedTasks,
      rejectedTasks,
    };
  }

  async getUsers(): Promise<CalendarUserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: [{ fullName: 'asc' }],
    });

    return users.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      initials: this.generateInitials(user.fullName),
    }));
  }

  async getDomains(
    requestUserId?: string,
    userRole?: string,
  ): Promise<CalendarDomainResponseDto[]> {
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const canViewAllDomains = isAdmin || isManager;

    let whereClause = {};
    if (!canViewAllDomains && requestUserId) {
      // 🔒 RESTRICTION: Les utilisateurs normaux ne voient que les domaines où ils ont des tâches
      whereClause = {
        tasks: {
          some: {
            userId: requestUserId,
          },
        },
      };
    }

    const domains = await this.prisma.domain.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ name: 'asc' }],
    });

    return domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      color: '#3B82F6', // Couleur par défaut, à adapter selon vos besoins
    }));
  }

  async getTimeSlotDetails(
    timeSlotId: string,
    requestUserId: string,
    userRole: string,
  ): Promise<CalendarTimeSlotResponseDto> {
    // Extraire l'ID de la tâche du timeSlotId
    const taskId = timeSlotId.split('-')[0];

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        domain: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Créneau horaire non trouvé');
    }

    // Vérifier les permissions
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const isOwner = task.userId === requestUserId;

    if (!isAdmin && !isManager && !isOwner) {
      throw new ForbiddenException('Accès refusé à ce créneau horaire');
    }

    return {
      id: timeSlotId,
      taskId: task.id,
      userId: task.user.id,
      userName: task.user.fullName,
      userInitials: this.generateInitials(task.user.fullName),
      projectId: task.id,
      projectName: task.title,
      domainId: task.domain.id,
      domainName: task.domain.name,
      domainColor: '#3B82F6',
      startTime: task.startTime ?? '05:00',
      endTime: task.endTime ?? '22:00',
      date: task.date.toISOString().split('T')[0],
      status: task.status,
      description: task.description ?? undefined,
      hoursWorked: this.calculateHours(
        task.startTime ?? '05:00',
        task.endTime ?? '22:00',
      ),
    };
  }

  async updateTaskStatus(
    taskId: string,
    status: 'APPROVED' | 'REJECTED',
    requestUserId: string,
    userRole: string,
  ): Promise<void> {
    // Vérifier que l'utilisateur a les permissions
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';

    if (!isAdmin && !isManager) {
      throw new ForbiddenException(
        'Seuls les admins et managers peuvent modifier le statut des tâches',
      );
    }

    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Mettre à jour le statut
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: status as TaskStatus,
        updatedAt: new Date(),
      },
    });
  }

  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private calculateHours(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return (endMinutes - startMinutes) / 60;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
