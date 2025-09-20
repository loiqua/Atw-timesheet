import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoleAssignmentDto,
  UpdateRoleAssignmentDto,
  GetRoleAssignmentsQueryDto,
} from './dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assignRole(
    userId: string,
    createRoleAssignmentDto: CreateRoleAssignmentDto,
    assignedByUserId: string,
  ) {
    this.logger.log(
      `Role assignment attempt: userId=${userId}, role=${createRoleAssignmentDto.role}, assignedBy=${assignedByUserId}`,
    );

    // Vérifier que l'utilisateur qui assigne a le droit (ADMIN)
    const assignedByUser = await this.prisma.user.findUnique({
      where: { id: assignedByUserId },
      select: { role: true },
    });

    if (!assignedByUser || assignedByUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can assign roles');
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Validate dates and ranges
    const newValidFrom = new Date(createRoleAssignmentDto.validFrom);
    if (isNaN(newValidFrom.getTime())) {
      throw new BadRequestException('validFrom must be a valid ISO date-time');
    }
    const newValidTo = createRoleAssignmentDto.validTo
      ? new Date(createRoleAssignmentDto.validTo)
      : null;
    if (newValidTo && isNaN(newValidTo.getTime())) {
      throw new BadRequestException(
        'validTo must be a valid ISO date-time when provided',
      );
    }
    if (newValidTo && newValidFrom > newValidTo) {
      throw new BadRequestException(
        'validFrom must be before or equal to validTo',
      );
    }

    // Prevent overlapping active assignments for same user/role/scope
    const farFuture = new Date('9999-12-31T23:59:59.999Z');
    const overlap = await this.prisma.roleAssignment.findFirst({
      where: {
        userId,
        role: createRoleAssignmentDto.role,
        scope: createRoleAssignmentDto.scope ?? null,
        isActive: true,
        // Overlap condition: existing.validFrom <= newValidTo && newValidFrom <= existing.validTo
        AND: [
          { validFrom: { lte: newValidTo ?? farFuture } },
          {
            OR: [{ validTo: null }, { validTo: { gte: newValidFrom } }],
          },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException(
        'Overlapping active role assignment exists for this user/role/scope',
      );
    }

    // Créer l'assignation de rôle
    const roleAssignment = await this.prisma.roleAssignment.create({
      data: {
        userId,
        role: createRoleAssignmentDto.role,
        scope: createRoleAssignmentDto.scope,
        validFrom: newValidFrom,
        validTo: newValidTo,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(
      `Role assignment success: assignmentId=${roleAssignment.id}, userId=${userId}, role=${roleAssignment.role}`,
    );

    return roleAssignment;
  }

  async revokeRole(assignmentId: string, revokedByUserId: string) {
    this.logger.log(
      `Role revocation attempt: assignmentId=${assignmentId}, revokedBy=${revokedByUserId}`,
    );

    // Vérifier que l'utilisateur qui révoque a le droit (ADMIN)
    const revokedByUser = await this.prisma.user.findUnique({
      where: { id: revokedByUserId },
      select: { role: true },
    });

    if (!revokedByUser || revokedByUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can revoke roles');
    }

    // Trouver et désactiver l'assignation
    const roleAssignment = await this.prisma.roleAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    const updatedAssignment = await this.prisma.roleAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(
      `Role revocation success: assignmentId=${assignmentId}, userId=${roleAssignment.userId}`,
    );

    return updatedAssignment;
  }

  async getUserActiveRoles(userId: string) {
    const now = new Date();

    const activeRoles = await this.prisma.roleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        validFrom: { lte: now },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activeRoles;
  }

  async getAllRoleAssignments(query: GetRoleAssignmentsQueryDto) {
    const { page = 1, pageSize = 20, userId, role, active } = query;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.RoleAssignmentWhereInput = {};
    if (userId) where.userId = userId;
    if (role) where.role = role;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const total = await this.prisma.roleAssignment.count({ where });
    const data = await this.prisma.roleAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return { data, total, page, pageSize };
  }

  async updateRoleAssignment(
    assignmentId: string,
    dto: UpdateRoleAssignmentDto,
    updatedByUserId: string,
  ) {
    // Admin check
    const updatedBy = await this.prisma.user.findUnique({
      where: { id: updatedByUserId },
      select: { role: true },
    });
    if (!updatedBy || updatedBy.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update roles');
    }

    const existing = await this.prisma.roleAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    // If dates provided, validate
    const nextValidFrom = dto.validFrom
      ? new Date(dto.validFrom)
      : existing.validFrom;
    if (isNaN(nextValidFrom.getTime())) {
      throw new BadRequestException('validFrom must be a valid ISO date-time');
    }
    let nextValidTo: Date | null;
    if (dto.validTo === undefined) {
      nextValidTo = existing.validTo;
    } else if (dto.validTo) {
      nextValidTo = new Date(dto.validTo);
    } else {
      nextValidTo = null;
    }
    if (nextValidTo && isNaN(nextValidTo.getTime())) {
      throw new BadRequestException(
        'validTo must be a valid ISO date-time when provided',
      );
    }
    if (nextValidTo && nextValidFrom > nextValidTo) {
      throw new BadRequestException(
        'validFrom must be before or equal to validTo',
      );
    }

    const nextRole = dto.role ?? existing.role;
    const nextScope = dto.scope ?? existing.scope ?? null;
    const farFuture = new Date('9999-12-31T23:59:59.999Z');

    // Prevent overlap with other active assignments
    const overlap = await this.prisma.roleAssignment.findFirst({
      where: {
        id: { not: assignmentId },
        userId: existing.userId,
        role: nextRole,
        scope: nextScope,
        isActive: true,
        AND: [
          { validFrom: { lte: nextValidTo ?? farFuture } },
          {
            OR: [{ validTo: null }, { validTo: { gte: nextValidFrom } }],
          },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException(
        'Update would create an overlapping active role assignment for this user/role/scope',
      );
    }

    const updated = await this.prisma.roleAssignment.update({
      where: { id: assignmentId },
      data: {
        role: dto.role ?? undefined,
        scope: dto.scope ?? undefined,
        validFrom: dto.validFrom ? nextValidFrom : undefined,
        validTo: dto.validTo !== undefined ? nextValidTo : undefined,
        isActive: dto.isActive ?? undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });

    return updated;
  }
}
