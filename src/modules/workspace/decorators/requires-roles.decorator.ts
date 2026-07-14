import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@prisma/client';

export const ROLES_KEY = 'requiredRoles';
export const RequiresRoles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
