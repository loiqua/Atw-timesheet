import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  CreateRoleAssignmentDto,
  UpdateRoleAssignmentDto,
  RoleAssignmentResponseDto,
  PaginatedRoleAssignmentsDto,
  GetRoleAssignmentsQueryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../../../generated/prisma';
import type { AuthRequest } from '../auth/types/auth-request.type';

@ApiTags('Role Management')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('users/:userId/assignments')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({
    status: 201,
    description: 'Role assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'ID of the user to assign role to' })
  @ApiBody({ type: CreateRoleAssignmentDto })
  @ApiOkResponse({ type: RoleAssignmentResponseDto })
  async assignRole(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() createRoleAssignmentDto: CreateRoleAssignmentDto,
    @Request() req: AuthRequest,
  ) {
    return await this.rolesService.assignRole(
      userId,
      createRoleAssignmentDto,
      req.user.id,
    );
  }

  @Delete('assignments/:assignmentId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a role assignment' })
  @ApiResponse({
    status: 200,
    description: 'Role assignment revoked successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Role assignment not found' })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID of the role assignment to revoke',
  })
  @ApiOkResponse({ type: RoleAssignmentResponseDto })
  async revokeRole(
    @Param('assignmentId', new ParseUUIDPipe({ version: '4' }))
    assignmentId: string,
    @Request() req: AuthRequest,
  ) {
    return await this.rolesService.revokeRole(assignmentId, req.user.id);
  }

  @Get('users/:userId/assignments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get active role assignments for a user' })
  @ApiResponse({
    status: 200,
    description: 'Active role assignments retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get assignments for',
  })
  @ApiOkResponse({ type: [RoleAssignmentResponseDto] })
  async getUserActiveRoles(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return await this.rolesService.getUserActiveRoles(userId);
  }

  @Get('assignments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all role assignments' })
  @ApiResponse({
    status: 200,
    description: 'All role assignments retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiOkResponse({ type: PaginatedRoleAssignmentsDto })
  async getAllRoleAssignments(@Query() query: GetRoleAssignmentsQueryDto) {
    return await this.rolesService.getAllRoleAssignments(query);
  }

  @Patch('assignments/:assignmentId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a role assignment' })
  @ApiResponse({
    status: 200,
    description: 'Role assignment updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Role assignment not found' })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID of the role assignment to update',
  })
  @ApiOkResponse({ type: RoleAssignmentResponseDto })
  async updateRoleAssignment(
    @Param('assignmentId', new ParseUUIDPipe({ version: '4' }))
    assignmentId: string,
    @Body() dto: UpdateRoleAssignmentDto,
    @Request() req: AuthRequest,
  ) {
    return await this.rolesService.updateRoleAssignment(
      assignmentId,
      dto,
      req.user.id,
    );
  }
}
