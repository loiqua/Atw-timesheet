import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../../../generated/prisma';

export const REQUIRE_SCOPED_ROLE_KEY = 'require_scoped_role_meta';

export interface RequireScopedRoleOptions {
  readonly role: Role;
  readonly scopeParam: string; // name of the route param that carries the scope identifier (e.g., 'projectId')
}

export const RequireScopedRole = (options: RequireScopedRoleOptions) =>
  SetMetadata(REQUIRE_SCOPED_ROLE_KEY, options);
