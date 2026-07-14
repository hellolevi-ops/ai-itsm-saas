import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { RoleType } from '@prisma/client';

export const ROLES_KEY = 'requiredRoles';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    if (!tenantContext?.workspaceId || !tenantContext?.userId) {
      throw new ForbiddenException('Tenant context required');
    }

    return this.validateRole(tenantContext.workspaceId, tenantContext.userId, requiredRoles);
  }

  private async validateRole(
    workspaceId: string,
    userId: string,
    requiredRoles: RoleType[],
  ): Promise<boolean> {
    const member = await this.memberService.findByUserId(userId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    return requiredRoles.some((role) => member.roleId === role);
  }
}
