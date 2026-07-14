import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext, TenantContextHolder } from '../tenant/tenant-context';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { WorkspaceService } from '../services/workspace.service';

declare module 'express' {
  interface Request {
    tenantContext?: TenantContext;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // T-001: Read authenticated user from request (set by JwtAuthGuard upstream).
    // Do NOT trust x-workspace-id / x-user-id headers directly.
    const user = (req as any).user;
    if (!user?.id || !user?.tenantId) {
      return next();
    }

    const workspaceId =
      (req.headers['x-workspace-id'] as string) ||
      (req.query.workspaceId as string) ||
      this.extractFromSubdomain(req);

    if (!workspaceId) {
      return next();
    }

    // Validate workspace exists and belongs to the user's tenant
    const workspace = await this.workspaceService.findById(workspaceId);
    if (!workspace || workspace.tenantId !== user.tenantId) {
      throw new ForbiddenException('Invalid workspace or cross-tenant access denied');
    }

    // Validate user is a member of this workspace
    const member = await this.memberService.findByUserIdAndWorkspaceId(user.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const tenantContext: TenantContext = {
      tenantId: user.tenantId,
      workspaceId,
      userId: user.id,
    };

    req.tenantContext = tenantContext;
    TenantContextHolder.runWithContext(tenantContext, () => next());
  }

  private extractFromSubdomain(req: Request): string | undefined {
    const host = req.headers.host;
    if (!host) return undefined;

    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
    return undefined;
  }
}
