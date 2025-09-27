import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { DashboardService } from './dashboard.service';
import { DashboardStatsQueryDto } from './dto/dashboard-stats.query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiOkResponse({ description: 'User dashboard statistics' })
  async getUserStats(
    @Query() query: DashboardStatsQueryDto,
    @Request() req: AuthRequest,
  ) {
    return await this.dashboardService.getUserDashboardStats(
      req.user.id,
      query,
    );
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiOkResponse({ description: 'Admin dashboard statistics' })
  async getAdminStats(
    @Query() query: DashboardStatsQueryDto,
    @Request() req: AuthRequest,
  ) {
    return await this.dashboardService.getAdminDashboardStats(
      req.user,
      query,
    );
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Get productivity data' })
  @ApiOkResponse({ description: 'Productivity trends data' })
  async getProductivityData(
    @Query() query: DashboardStatsQueryDto,
    @Request() req: AuthRequest,
  ) {
    return await this.dashboardService.getProductivityData(
      req.user,
      query,
    );
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiOkResponse({ description: 'Project statistics' })
  async getProjectStats(
    @Query() query: DashboardStatsQueryDto,
    @Request() req: AuthRequest,
  ) {
    return await this.dashboardService.getProjectStats(
      req.user,
      query,
    );
  }

  @Get('admin/users')
  @ApiOperation({ summary: 'Get users list for admin' })
  @ApiOkResponse({ description: 'Users list with statistics' })
  async getUsersList(@Request() req: AuthRequest) {
    return await this.dashboardService.getUsersList(req.user);
  }
}
