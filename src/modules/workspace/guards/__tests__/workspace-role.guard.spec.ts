import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRoleGuard } from '../workspace-role.guard';
import { WorkspaceMemberService } from '../../services/workspace-member.service';
import { RoleType } from '@prisma/client';

describe('WorkspaceRoleGuard', () => {
  let guard: WorkspaceRoleGuard;
  let reflector: jest.Mocked<Reflector>;
  let memberService: jest.Mocked<WorkspaceMemberService>;

  const createMockExecutionContext = (tenantContext?: any, user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          tenantContext,
          user: user || { id: 'user-001', tenantId: 'tenant-001' },
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
      ],
    }).compile();

    guard = module.get<WorkspaceRoleGuard>(WorkspaceRoleGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    memberService = module.get(WorkspaceMemberService) as jest.Mocked<WorkspaceMemberService>;
  });

  describe('when no roles are required', () => {
    it('should allow access', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ workspaceId: 'ws-001', userId: 'user-001' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('when tenant context is missing', () => {
    it('should allow POST requests without workspaceId', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: undefined,
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'POST',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for non-POST requests without workspaceId', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: undefined,
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      expect(async () => {
        await guard.canActivate(context);
      }).rejects.toMatchObject({
        message: 'Tenant context required',
      });
    });
  });

  describe('when user is not a workspace member', () => {
    it('should throw ForbiddenException', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue(null);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User is not a member of this workspace'),
      );
    });
  });

  describe('roleType comparison (not roleId)', () => {
    it('should reject when roleType does not match required RoleType', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.OWNER]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        role: { roleType: RoleType.ADMIN },
      } as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Insufficient workspace role'),
      );
    });

    it('should allow when roleType matches required RoleType', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        role: { roleType: RoleType.ADMIN },
      } as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should compare roleType (enum) not roleId (UUID)', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);

      // Same roleId but different roleType -> should fail
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        roleId: 'some-uuid',
        role: { roleType: RoleType.AGENT },
      } as any);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Insufficient workspace role'),
      );

      // Same roleId but matching roleType -> should succeed
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        roleId: 'some-uuid',
        role: { roleType: RoleType.ADMIN },
      } as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw when member role relation is missing', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);
      memberService.findByIdWithRole.mockResolvedValue({
        id: 'member-001',
        role: undefined,
      } as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Member role not found'),
      );
    });
  });

  describe('cross-workspace access', () => {
    it('should reject access to a workspace the user does not belong to', async () => {
      reflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      // User is a member of ws-002, but trying to access ws-001
      memberService.findByUserIdAndWorkspaceId.mockImplementation((userId, workspaceId) => {
        if (workspaceId === 'ws-002') {
          return Promise.resolve({ id: 'member-001' } as any);
        }
        return Promise.resolve(null);
      });
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantContext: { workspaceId: 'ws-001', userId: 'user-001' },
            user: { id: 'user-001', tenantId: 'tenant-001' },
            method: 'GET',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User is not a member of this workspace'),
      );
    });
  });
});
