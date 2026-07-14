import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { RoleType } from '@prisma/client';
import { WorkspaceService } from '../services/workspace.service';
import { TenantContext, TenantContextHolder } from '../tenant/tenant-context';

export const ROLES_KEY = 'requiredRoles';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly memberService: WorkspaceMemberService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    if (!user?.id || !user?.tenantId) {
      return !requiredRoles;
    }

    const workspaceId = this.resolveWorkspaceId(request);
    if (!workspaceId) {
      if (!requiredRoles || request.method === 'POST') {
        return true;
      }
      throw new ForbiddenException('Tenant context required');
    }

    const tenantContext = await this.resolveTenantContext(workspaceId, user.id, user.tenantId);
    request.tenantContext = tenantContext;
    TenantContextHolder.setContext(tenantContext);

    if (!requiredRoles) {
      return true;
    }

    return this.validateRole(tenantContext.workspaceId, tenantContext.userId!, requiredRoles);
  }

  private resolveWorkspaceId(request: any): string | undefined {
    return (
      request.params?.workspaceId ||
      request.params?.id ||
      request.headers?.['x-workspace-id'] ||
      request.query?.workspaceId ||
      this.extractFromSubdomain(request)
    );
  }

  private extractFromSubdomain(request: any): string | undefined {
    const host = request.headers?.host;
    if (!host) return undefined;

    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
    return undefined;
  }

  private async resolveTenantContext(
    workspaceId: string,
    userId: string,
    tenantId: string,
  ): Promise<TenantContext> {
    const workspace = await this.workspaceService.findById(workspaceId);
    if (!workspace || workspace.tenantId !== tenantId) {
      throw new ForbiddenException('Invalid workspace or cross-tenant access denied');
    }

    const member = await this.memberService.findByUserIdAndWorkspaceId(userId, workspaceId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    return { tenantId, workspaceId, userId };
  }

  private async validateRole(
    workspaceId: string,
    userId: string,
    requiredRoles: RoleType[],
  ): Promise<boolean> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(userId, workspaceId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    // Load role relation to compare roleType, not roleId
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const userRole = memberWithRole?.role;
    if (!userRole) {
      throw new ForbiddenException('Member role not found');
    }

    const hasRole = requiredRoles.some((role) => userRole.roleType === role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
