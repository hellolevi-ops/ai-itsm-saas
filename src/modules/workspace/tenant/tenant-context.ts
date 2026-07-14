export interface TenantContext {
  workspaceId: string;
  userId?: string;
}

const TENANT_CONTEXT_STORAGE = new Map<string, TenantContext>();

export class TenantContextHolder {
  private static contextKey = 'current';

  static setContext(context: TenantContext): void {
    TENANT_CONTEXT_STORAGE.set(this.contextKey, context);
  }

  static getContext(): TenantContext | undefined {
    return TENANT_CONTEXT_STORAGE.get(this.contextKey);
  }

  static getWorkspaceId(): string {
    const context = this.getContext();
    if (!context?.workspaceId) {
      throw new Error('Tenant context not set');
    }
    return context.workspaceId;
  }

  static clear(): void {
    TENANT_CONTEXT_STORAGE.delete(this.contextKey);
  }

  static runWithContext<T>(context: TenantContext, fn: () => T): T {
    const previous = this.getContext();
    try {
      this.setContext(context);
      return fn();
    } finally {
      if (previous) {
        this.setContext(previous);
      } else {
        this.clear();
      }
    }
  }

  static async runWithContextAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    const previous = this.getContext();
    try {
      this.setContext(context);
      return await fn();
    } finally {
      if (previous) {
        this.setContext(previous);
      } else {
        this.clear();
      }
    }
  }
}
