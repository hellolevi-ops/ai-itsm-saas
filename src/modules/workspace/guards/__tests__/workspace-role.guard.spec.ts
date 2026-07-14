import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { WorkspaceRoleGuard } from '../workspace-role.guard';
import { WorkspaceMemberService } from '../../services/workspace-member.service';
import { WorkspaceService } from '../../services/workspace.service';

describe('WorkspaceRoleGuard', () => {
  let guard: WorkspaceRoleGuard;
  let reflector: jest.Mocked<Reflector>;
  let memberService: jest.Mocked<WorkspaceMemberService>;
  let workspaceService: jest.Mocked<WorkspaceService>;

  const createContext = (request: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {},
          headers: {},
          query: {},
          method: 'GET',
          ...request,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceRoleGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: WorkspaceMemberService,
          useValue: {
            findByUserIdAndWorkspaceId: jest.fn(),
            findByIdWithRole: jest.fn(),
          },
        },
        {
          provide: WorkspaceService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<WorkspaceRoleGuard>(WorkspaceRoleGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    memberService = module.get(WorkspaceMemberService) as jest.Mocked<WorkspaceMemberService>;
    workspaceService = module.get(WorkspaceService) as jest.Mocked<WorkspaceService>;

    workspaceService.findById.mockResolvedValue({ id: 'ws-001', tenantId: 'tenant-001' } as any);
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);
    memberService.findByIdWithRole.mockResolvedValue({
      id: 'member-001',
      role: { roleType: RoleType.ADMIN },
    } as any);
  });

  describe('when no roles are required', () => {
    it('allows anonymous public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      await expect(guard.canActivate(createContext({ user: undefined }))).resolves.toBe(true);
    });

    it('validates membership when a workspace route is present', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(
        createContext({
          user: { id: 'user-001', tenantId: 'tenant-001' },
          params: { workspaceId: 'ws-001' },
        }),
      );

      expect(result).toBe(true);
      expect(workspaceService.findById).toHaveBeenCalledWith('ws-001');
      expect(memberService.findByUserIdAndWorkspaceId).toHaveBeenCalledWith('user-001', 'ws-001');
    });
  });

  describe('when tenant context is missing', () => {
    it('allows POST requests without workspaceId for workspace creation', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);

      const result = await guard.canActivate(
        createContext({
          user: { id: 'user-001', tenantId: 'tenant-001' },
          method: 'POST',
        }),
      );

      expect(result).toBe(true);
    });

    it('throws ForbiddenException for non-POST requests without workspaceId', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('Tenant context required'));
    });
  });

  describe('workspace and role validation', () => {
    it('rejects workspace from another tenant', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      workspaceService.findById.mockResolvedValue({ id: 'ws-001', tenantId: 'tenant-002' } as any);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('Invalid workspace or cross-tenant access denied'));
    });

    it('rejects access when user is not a workspace member', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue(null);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('User is not a member of this workspace'));
    });

    it('rejects when roleType does not match required RoleType', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.OWNER]);
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        role: { roleType: RoleType.ADMIN },
      } as any);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('Insufficient workspace role'));
    });

    it('allows when roleType matches required RoleType', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).resolves.toBe(true);
    });

    it('compares roleType enum instead of roleId', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByIdWithRole.mockResolvedValueOnce({
        id: 'member-001',
        roleId: 'some-uuid',
        role: { roleType: RoleType.AGENT },
      } as any);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('Insufficient workspace role'));

      memberService.findByIdWithRole.mockResolvedValueOnce({
        id: 'member-001',
        roleId: 'some-uuid',
        role: { roleType: RoleType.ADMIN },
      } as any);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).resolves.toBe(true);
    });

    it('throws when member role relation is missing', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        role: undefined,
      } as any);

      await expect(
        guard.canActivate(
          createContext({
            user: { id: 'user-001', tenantId: 'tenant-001' },
            params: { workspaceId: 'ws-001' },
          }),
        ),
      ).rejects.toThrow(new ForbiddenException('Member role not found'));
    });
  });
});
