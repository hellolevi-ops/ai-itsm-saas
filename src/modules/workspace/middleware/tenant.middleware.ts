import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext, TenantContextHolder } from '../tenant/tenant-context';
import { WorkspaceService } from '../services/workspace.service';

declare module 'express' {
  interface Request {
    tenantContext?: TenantContext;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const workspaceId =
      (req.headers['x-workspace-id'] as string) ||
      (req.query.workspaceId as string) ||
      this.extractFromSubdomain(req);

    if (!workspaceId) {
      return next();
    }

    const workspace = await this.workspaceService.findById(workspaceId);
    if (!workspace) {
      throw new ForbiddenException('Invalid workspace');
    }

    const userId = (req.headers['x-user-id'] as string) || undefined;

    const tenantContext: TenantContext = {
      workspaceId,
      userId,
    };

    req.tenantContext = tenantContext;
    TenantContextHolder.setContext(tenantContext);

    next();
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
