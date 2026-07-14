import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  workspaceId: string;
  userId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

export class TenantContextHolder {
  static setContext(context: TenantContext): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      Object.assign(store, context);
    }
  }

  static getContext(): TenantContext | undefined {
    return asyncLocalStorage.getStore();
  }

  static getTenantId(): string {
    const context = this.getContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context not set');
    }
    return context.tenantId;
  }

  static getWorkspaceId(): string {
    const context = this.getContext();
    if (!context?.workspaceId) {
      throw new Error('Workspace context not set');
    }
    return context.workspaceId;
  }

  static getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  static runWithContext<T>(context: TenantContext, fn: () => T): T {
    return asyncLocalStorage.run(context, fn);
  }

  static async runWithContextAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return asyncLocalStorage.run(context, fn);
  }
}
