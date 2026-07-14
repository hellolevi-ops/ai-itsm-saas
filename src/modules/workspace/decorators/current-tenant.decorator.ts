import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant-context';

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContext = request.tenantContext;

    if (!tenantContext) {
      return undefined;
    }

    return data ? tenantContext[data] : tenantContext;
  },
);
