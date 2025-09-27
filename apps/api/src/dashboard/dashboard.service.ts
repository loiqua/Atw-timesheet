import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardStatsQueryDto,
  DateRange,
} from './dto/dashboard-stats.query.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getUserFilter(user: { id: string; role: string }, userId?: string) {
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      return userId ? { userId } : {};
    }
    return { userId: user.id };
  }

  private getDateRange(dateRange: DateRange) {
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case DateRange.WEEK:
        startDate.setDate(now.getDate() - 7);
        break;
      case DateRange.MONTH:
        startDate.setMonth(now.getMonth() - 1);
        break;
      case DateRange.QUARTER:
        startDate.setMonth(now.getMonth() - 3);
        break;
      case DateRange.YEAR:
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  }

  async getUserDashboardStats(userId: string, query: DashboardStatsQueryDto) {
    const { startDate, endDate } = this.getDateRange(
      query.dateRange || DateRange.MONTH,
    );

    // Récupérer les tâches de l'utilisateur dans la période
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(query.projectId && { domainId: query.projectId }),
      },
      include: {
        domain: true,
      },
    });

    // Calculer les statistiques
    const totalHoursThisMonth = tasks.reduce((total, task) => {
      if (task.startTime && task.endTime) {
        const startTime = new Date(`1970-01-01T${task.startTime}`);
        const endTime = new Date(`1970-01-01T${task.endTime}`);
        const hours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      // Fallback sur durationMin si startTime/endTime ne sont pas disponibles
      return total + task.durationMin / 60;
    }, 0);

    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.APPROVED,
    ).length;
    const pendingTasks = tasks.filter(
      (task) =>
        task.status === TaskStatus.DRAFT ||
        task.status === TaskStatus.SUBMITTED,
    ).length;
    const rejectedTasks = tasks.filter(
      (task) => task.status === TaskStatus.REJECTED,
    ).length;

    // Compter les projets actifs (domaines avec des tâches)
    const activeProjects = new Set(tasks.map((task) => task.domainId)).size;

    // Calculer la productivité (tâches approuvées / total des tâches)
    const totalTasks = tasks.length;
    const productivity =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100,
      completedTasks,
      pendingTasks,
      rejectedTasks,
      activeProjects,
      productivity,
    };
  }

  async getAdminDashboardStats(
    user: { id: string; role: string },
    query: DashboardStatsQueryDto,
  ) {
    const { startDate, endDate } = this.getDateRange(
      query.dateRange || DateRange.MONTH,
    );

    // Si un userId spécifique est demandé
    if (query.userId) {
      const userStats = await this.getUserDashboardStats(query.userId, query);
      const userData = await this.prisma.user.findUnique({
        where: { id: query.userId },
        select: { id: true, fullName: true, email: true },
      });

      return {
        totalStats: userStats,
        userStats: [
          {
            userId: userData?.id,
            userName: userData?.fullName,
            userEmail: userData?.email,
            ...userStats,
          },
        ],
        topPerformers: [],
      };
    }

    // Statistiques globales
    const allTasks = await this.prisma.task.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(query.projectId && { domainId: query.projectId }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Calculer les stats globales
    const totalHoursThisMonth = allTasks.reduce((total, task) => {
      if (task.startTime && task.endTime) {
        const startTime = new Date(`1970-01-01T${task.startTime}`);
        const endTime = new Date(`1970-01-01T${task.endTime}`);
        const hours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total + task.durationMin / 60;
    }, 0);

    const completedTasks = allTasks.filter(
      (task) => task.status === TaskStatus.APPROVED,
    ).length;
    const pendingTasks = allTasks.filter(
      (task) =>
        task.status === TaskStatus.DRAFT ||
        task.status === TaskStatus.SUBMITTED,
    ).length;
    const rejectedTasks = allTasks.filter(
      (task) => task.status === TaskStatus.REJECTED,
    ).length;
    const activeProjects = new Set(allTasks.map((task) => task.domainId)).size;
    const totalTasks = allTasks.length;
    const productivity =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Statistiques par utilisateur
    const userTasksMap = new Map<
      string,
      {
        user: { id: string; fullName: string; email: string };
        tasks: typeof allTasks;
        hoursWorked: number;
        tasksCompleted: number;
      }
    >();
    allTasks.forEach((task) => {
      const userId = task.user.id;
      if (!userTasksMap.has(userId)) {
        userTasksMap.set(userId, {
          user: task.user,
          tasks: [],
          hoursWorked: 0,
          tasksCompleted: 0,
        });
      }

      const userTasksData = userTasksMap.get(userId)!;
      userTasksData.tasks.push(task);

      // Calculer les heures
      let taskHours = 0;
      if (task.startTime && task.endTime) {
        const startTime = new Date(`1970-01-01T${task.startTime}`);
        const endTime = new Date(`1970-01-01T${task.endTime}`);
        taskHours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      } else {
        taskHours = task.durationMin / 60;
      }

      userTasksData.hoursWorked += taskHours;
      if (task.status === TaskStatus.APPROVED) {
        userTasksData.tasksCompleted++;
      }
    });
    const userStats = Array.from(userTasksMap.entries()).map(([, data]) => {
      const userTasks = data.tasks;
      const userHours = data.hoursWorked;
      const userCompleted = data.tasksCompleted;
      const userPending = userTasks.filter(
        (task) =>
          task.status === TaskStatus.DRAFT ||
          task.status === TaskStatus.SUBMITTED,
      ).length;
      const userRejected = userTasks.filter(
        (task) => task.status === TaskStatus.REJECTED,
      ).length;
      const userActiveProjects = new Set(userTasks.map((task) => task.domainId))
        .size;
      const userTotalTasks = userTasks.length;
      const userProductivity =
        userTotalTasks > 0
          ? Math.round((userCompleted / userTotalTasks) * 100)
          : 0;
      return {
        userId: data.user.id,
        userName: data.user.fullName,
        userEmail: data.user.email,
        totalHoursThisMonth: Math.round(userHours * 100) / 100,
        completedTasks: userCompleted,
        pendingTasks: userPending,
        rejectedTasks: userRejected,
        activeProjects: userActiveProjects,
        productivity: userProductivity,
      };
    });

    return {
      totalStats: {
        totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100,
        completedTasks,
        pendingTasks,
        rejectedTasks,
        activeProjects,
        productivity,
      },
      userStats,
      topPerformers: userStats
        .sort((a, b) => b.productivity - a.productivity)
        .slice(0, 5),
    };
  }

  async getProductivityData(
    user: { id: string; role: string },
    query: DashboardStatsQueryDto,
  ) {
    const { startDate, endDate } = this.getDateRange(
      query.dateRange || DateRange.MONTH,
    );

    // Récupérer les tâches par semaine
    const tasks = await this.prisma.task.findMany({
      where: {
        ...this.getUserFilter(user, query.userId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Grouper par semaine
    const weeklyData = new Map<
      string,
      {
        week: string;
        tasks: typeof tasks;
        hoursWorked: number;
        tasksCompleted: number;
      }
    >();
    tasks.forEach((task) => {
      const weekStart = new Date(task.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = `S${Math.ceil((weekStart.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: weekKey,
          tasks: [],
          hoursWorked: 0,
          tasksCompleted: 0,
        });
      }

      const weekData = weeklyData.get(weekKey)!;
      weekData.tasks.push(task);

      // Calculer les heures
      let taskHours = 0;
      if (task.startTime && task.endTime) {
        const startTime = new Date(`1970-01-01T${task.startTime}`);
        const endTime = new Date(`1970-01-01T${task.endTime}`);
        taskHours =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      } else {
        taskHours = task.durationMin / 60;
      }

      weekData.hoursWorked += taskHours;
      if (task.status === TaskStatus.APPROVED) {
        weekData.tasksCompleted++;
      }
    });

    // Convertir en array et calculer la productivité
    return Array.from(weeklyData.values()).map((week) => ({
      week: week.week,
      productivity:
        week.tasks.length > 0
          ? Math.round((week.tasksCompleted / week.tasks.length) * 100)
          : 0,
      hoursWorked: Math.round(week.hoursWorked * 100) / 100,
      tasksCompleted: week.tasksCompleted,
    }));
  }

  async getProjectStats(
    user: { id: string; role: string },
    query: DashboardStatsQueryDto,
  ) {
    const { startDate, endDate } = this.getDateRange(
      query.dateRange || DateRange.MONTH,
    );

    const projects = await this.prisma.domain.findMany({
      include: {
        tasks: {
          where: {
            ...this.getUserFilter(user, query.userId),
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    return projects
      .filter((project) => project.tasks.length > 0)
      .map((project) => {
        const totalHours = project.tasks.reduce((total, task) => {
          if (task.startTime && task.endTime) {
            const startTime = new Date(`1970-01-01T${task.startTime}`);
            const endTime = new Date(`1970-01-01T${task.endTime}`);
            const hours =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }
          return total + task.durationMin / 60;
        }, 0);

        const completedTasks = project.tasks.filter(
          (task) => task.status === TaskStatus.APPROVED,
        ).length;
        const pendingTasks = project.tasks.filter(
          (task) =>
            task.status === TaskStatus.DRAFT ||
            task.status === TaskStatus.SUBMITTED,
        ).length;
        const totalTasks = project.tasks.length;
        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: project.id,
          name: project.name,
          totalHours: Math.round(totalHours * 100) / 100,
          completedTasks,
          pendingTasks,
          progress,
        };
      });
  }

  async getUsersList(user: { id: string; role: string }) {
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new Error('Access denied');
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    // Récupérer les stats pour chaque utilisateur
    const usersWithStats = await Promise.all(
      users.map(async (userData) => {
        const stats = await this.getUserDashboardStats(userData.id, {
          dateRange: DateRange.MONTH,
        });
        return {
          userId: userData.id,
          userName: userData.fullName,
          userEmail: userData.email,
          ...stats,
        };
      }),
    );

    return usersWithStats;
  }
}
