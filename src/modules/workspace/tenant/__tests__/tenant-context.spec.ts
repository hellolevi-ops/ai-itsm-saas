import { TenantContextHolder, TenantContext } from '../tenant-context';

describe('TenantContextHolder', () => {
  describe('getTenantId', () => {
    it('should throw error when no context set', () => {
      expect(() => TenantContextHolder.getTenantId()).toThrow('Tenant context not set');
    });
  });

  describe('getWorkspaceId', () => {
    it('should throw error when no context set', () => {
      expect(() => TenantContextHolder.getWorkspaceId()).toThrow('Workspace context not set');
    });
  });

  describe('getContext', () => {
    it('should return undefined when no context set', () => {
      expect(TenantContextHolder.getContext()).toBeUndefined();
    });
  });

  describe('runWithContext', () => {
    it('should provide context during synchronous execution', () => {
      const context: TenantContext = {
        tenantId: 'tenant-001',
        workspaceId: 'ws-001',
        userId: 'user-001',
      };

      const result = TenantContextHolder.runWithContext(context, () => {
        expect(TenantContextHolder.getTenantId()).toBe('tenant-001');
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws-001');
        expect(TenantContextHolder.getUserId()).toBe('user-001');
        return 'done';
      });

      expect(result).toBe('done');
      expect(TenantContextHolder.getContext()).toBeUndefined();
    });

    it('should restore previous context after nested run', () => {
      const outer: TenantContext = { tenantId: 'tenant-outer', workspaceId: 'ws-outer' };
      const inner: TenantContext = { tenantId: 'tenant-inner', workspaceId: 'ws-inner' };

      TenantContextHolder.runWithContext(outer, () => {
        expect(TenantContextHolder.getTenantId()).toBe('tenant-outer');
        TenantContextHolder.runWithContext(inner, () => {
          expect(TenantContextHolder.getTenantId()).toBe('tenant-inner');
        });
        expect(TenantContextHolder.getTenantId()).toBe('tenant-outer');
      });
    });

    it('should update existing context with setContext', () => {
      TenantContextHolder.runWithContext({ tenantId: 't1', workspaceId: 'ws1' }, () => {
        TenantContextHolder.setContext({ tenantId: 't2', workspaceId: 'ws2' });
        expect(TenantContextHolder.getTenantId()).toBe('t2');
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws2');
      });
    });
  });

  describe('runWithContextAsync', () => {
    it('should provide context during async execution', async () => {
      const context: TenantContext = { tenantId: 'tenant-001', workspaceId: 'ws-001' };

      const result = await TenantContextHolder.runWithContextAsync(context, async () => {
        await Promise.resolve();
        expect(TenantContextHolder.getTenantId()).toBe('tenant-001');
        return 'async-done';
      });

      expect(result).toBe('async-done');
      expect(TenantContextHolder.getContext()).toBeUndefined();
    });

    it('should restore context even if async function throws', async () => {
      const previousContext: TenantContext = { tenantId: 'tenant-prev', workspaceId: 'ws-prev' };

      await TenantContextHolder.runWithContextAsync(previousContext, async () => {
        try {
          await TenantContextHolder.runWithContextAsync(
            { tenantId: 'tenant-tmp', workspaceId: 'ws-tmp' },
            async () => {
              throw new Error('test error');
            },
          );
        } catch (e) {
          // expected
        }
        expect(TenantContextHolder.getTenantId()).toBe('tenant-prev');
      });
    });
  });

  describe('concurrent request isolation', () => {
    it('should isolate concurrent requests with different tenant IDs', async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const collected: Record<string, string> = {};

      const taskA = TenantContextHolder.runWithContextAsync(
        { tenantId: 'tenant-A', workspaceId: 'ws-A' },
        async () => {
          const tenantId = TenantContextHolder.getTenantId();
          await delay(50);
          collected.A = TenantContextHolder.getTenantId();
          return tenantId;
        },
      );

      const taskB = TenantContextHolder.runWithContextAsync(
        { tenantId: 'tenant-B', workspaceId: 'ws-B' },
        async () => {
          const tenantId = TenantContextHolder.getTenantId();
          await delay(30);
          collected.B = TenantContextHolder.getTenantId();
          return tenantId;
        },
      );

      const [resultA, resultB] = await Promise.all([taskA, taskB]);

      expect(resultA).toBe('tenant-A');
      expect(resultB).toBe('tenant-B');
      expect(collected.A).toBe('tenant-A');
      expect(collected.B).toBe('tenant-B');
    });
  });
});
