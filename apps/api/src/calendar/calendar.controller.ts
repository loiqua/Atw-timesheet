import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CalendarService } from './calendar.service';
import { CalendarWeekQueryDto } from './dto/calendar-week-query.dto';
import { CalendarStatsQueryDto } from './dto/calendar-stats-query.dto';
import {
  UpdateTaskStatusDto,
  UpdateTaskStatus,
} from './dto/update-task-status.dto';
import { CalendarWeekResponseDto } from './dto/calendar-week-response.dto';
import { CalendarStatsResponseDto } from './dto/calendar-stats-response.dto';
import { CalendarUserResponseDto } from './dto/calendar-user-response.dto';
import { CalendarDomainResponseDto } from './dto/calendar-domain-response.dto';
import { CalendarTimeSlotResponseDto } from './dto/calendar-timeslot-response.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('week')
  @ApiOperation({
    summary: 'Récupérer les données du calendrier pour une semaine',
  })
  @ApiResponse({
    status: 200,
    description: 'Données du calendrier récupérées avec succès',
    type: CalendarWeekResponseDto,
  })
  async getWeekData(
    @Query() query: CalendarWeekQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CalendarWeekResponseDto> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      return await this.calendarService.getWeekData(query, userId, userRole);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des données du calendrier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Récupérer les statistiques du calendrier' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    type: CalendarStatsResponseDto,
  })
  async getWeekStats(
    @Query() query: CalendarStatsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CalendarStatsResponseDto> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      return await this.calendarService.getWeekStats(query, userId, userRole);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Récupérer la liste des utilisateurs (Admin/Manager uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès',
    type: [CalendarUserResponseDto],
  })
  async getUsers(): Promise<CalendarUserResponseDto[]> {
    try {
      return await this.calendarService.getUsers();
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des utilisateurs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('domains')
  @ApiOperation({ summary: 'Récupérer la liste des domaines' })
  @ApiResponse({
    status: 200,
    description: 'Liste des domaines récupérée avec succès',
    type: [CalendarDomainResponseDto],
  })
  async getDomains(): Promise<CalendarDomainResponseDto[]> {
    try {
      return await this.calendarService.getDomains();
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des domaines',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('timeslots/:id')
  @ApiOperation({ summary: "Récupérer les détails d'un créneau horaire" })
  @ApiResponse({
    status: 200,
    description: 'Détails du créneau récupérés avec succès',
    type: CalendarTimeSlotResponseDto,
  })
  async getTimeSlotDetails(
    @Param('id') timeSlotId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CalendarTimeSlotResponseDto> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      return await this.calendarService.getTimeSlotDetails(
        timeSlotId,
        userId,
        userRole,
      );
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des détails du créneau',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('tasks/:id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: "Mettre à jour le statut d'une tâche (Admin/Manager uniquement)",
  })
  @ApiResponse({
    status: 200,
    description: 'Statut de la tâche mis à jour avec succès',
  })
  async updateTaskStatus(
    @Param('id') taskId: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Validation et type assertion sécurisée
      const { status } = updateTaskStatusDto;
      if (
        status !== UpdateTaskStatus.APPROVED &&
        status !== UpdateTaskStatus.REJECTED
      ) {
        throw new HttpException('Statut invalide', HttpStatus.BAD_REQUEST);
      }

      await this.calendarService.updateTaskStatus(
        taskId,
        status,
        userId,
        userRole,
      );

      const statusMessage =
        status === UpdateTaskStatus.APPROVED ? 'approuvée' : 'rejetée';
      return {
        message: `Tâche ${statusMessage} avec succès`,
      };
    } catch {
      throw new HttpException(
        'Erreur lors de la mise à jour du statut de la tâche',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
