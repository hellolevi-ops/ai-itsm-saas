import { TenantContextHolder, TenantContext } from '../tenant-context';

describe('TenantContextHolder', () => {
  const testContext: TenantContext = {
    workspaceId: 'ws-001',
    userId: 'user-001',
  };

  beforeEach(() => {
    TenantContextHolder.clear();
  });

  describe('setContext and getContext', () => {
    it('should set and get context', () => {
      TenantContextHolder.setContext(testContext);
      const context = TenantContextHolder.getContext();
      expect(context).toEqual(testContext);
    });

    it('should return undefined when no context set', () => {
      const context = TenantContextHolder.getContext();
      expect(context).toBeUndefined();
    });
  });

  describe('getWorkspaceId', () => {
    it('should return workspaceId when context is set', () => {
      TenantContextHolder.setContext(testContext);
      const workspaceId = TenantContextHolder.getWorkspaceId();
      expect(workspaceId).toBe('ws-001');
    });

    it('should throw error when context not set', () => {
      expect(() => TenantContextHolder.getWorkspaceId()).toThrow('Tenant context not set');
    });

    it('should throw error when workspaceId is missing', () => {
      TenantContextHolder.setContext({ workspaceId: '' });
      expect(() => TenantContextHolder.getWorkspaceId()).toThrow('Tenant context not set');
    });
  });

  describe('clear', () => {
    it('should clear the context', () => {
      TenantContextHolder.setContext(testContext);
      TenantContextHolder.clear();
      const context = TenantContextHolder.getContext();
      expect(context).toBeUndefined();
    });
  });

  describe('runWithContext', () => {
    it('should run function with context and restore previous state', () => {
      const previousContext: TenantContext = { workspaceId: 'ws-previous' };
      TenantContextHolder.setContext(previousContext);

      const result = TenantContextHolder.runWithContext(testContext, () => {
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws-001');
        return 'done';
      });

      expect(result).toBe('done');
      expect(TenantContextHolder.getWorkspaceId()).toBe('ws-previous');
    });

    it('should clear context after run when no previous context', () => {
      const result = TenantContextHolder.runWithContext(testContext, () => {
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws-001');
        return 'done';
      });

      expect(result).toBe('done');
      expect(TenantContextHolder.getContext()).toBeUndefined();
    });

    it('should restore context even if function throws', () => {
      const previousContext: TenantContext = { workspaceId: 'ws-previous' };
      TenantContextHolder.setContext(previousContext);

      try {
        TenantContextHolder.runWithContext(testContext, () => {
          throw new Error('test error');
        });
      } catch (e) {
        // expected
      }

      expect(TenantContextHolder.getWorkspaceId()).toBe('ws-previous');
    });
  });

  describe('runWithContextAsync', () => {
    it('should run async function with context and restore previous state', async () => {
      const previousContext: TenantContext = { workspaceId: 'ws-previous' };
      TenantContextHolder.setContext(previousContext);

      const result = await TenantContextHolder.runWithContextAsync(testContext, async () => {
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws-001');
        return Promise.resolve('done');
      });

      expect(result).toBe('done');
      expect(TenantContextHolder.getWorkspaceId()).toBe('ws-previous');
    });

    it('should clear context after async run when no previous context', async () => {
      const result = await TenantContextHolder.runWithContextAsync(testContext, async () => {
        expect(TenantContextHolder.getWorkspaceId()).toBe('ws-001');
        return Promise.resolve('done');
      });

      expect(result).toBe('done');
      expect(TenantContextHolder.getContext()).toBeUndefined();
    });

    it('should restore context even if async function throws', async () => {
      const previousContext: TenantContext = { workspaceId: 'ws-previous' };
      TenantContextHolder.setContext(previousContext);

      try {
        await TenantContextHolder.runWithContextAsync(testContext, async () => {
          throw new Error('test error');
        });
      } catch (e) {
        // expected
      }

      expect(TenantContextHolder.getWorkspaceId()).toBe('ws-previous');
    });
  });
});
