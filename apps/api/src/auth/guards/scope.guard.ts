import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REQUIRE_SCOPED_ROLE_KEY,
  RequireScopedRoleOptions,
} from '../decorators/require-scoped-role.decorator';
import type { AuthRequest } from '../types/auth-request.type';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RequireScopedRoleOptions>(
      REQUIRE_SCOPED_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no scoped-role metadata is set, let other guards decide (noop)
    if (!options) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const scopeValue = request.params?.[options.scopeParam];
    if (!scopeValue) {
      throw new ForbiddenException(
        `Missing scope parameter '${options.scopeParam}' in route`,
      );
    }

    const now = new Date();

    const hasActiveScopedRole = await this.prisma.roleAssignment.findFirst({
      where: {
        userId: user.id,
        role: options.role,
        scope: scopeValue,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
      },
      select: { id: true },
    });

    if (!hasActiveScopedRole) {
      throw new ForbiddenException(
        `Insufficient scope: requires ${options.role} on scope '${scopeValue}'`,
      );
    }

    return true;
  }
}
