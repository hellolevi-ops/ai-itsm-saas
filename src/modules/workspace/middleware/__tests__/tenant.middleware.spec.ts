import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantMiddleware } from '../tenant.middleware';
import { WorkspaceService } from '../../services/workspace.service';
import { WorkspaceMemberService } from '../../services/workspace-member.service';
import { TenantContextHolder } from '../../tenant/tenant-context';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let workspaceService: jest.Mocked<WorkspaceService>;
  let memberService: jest.Mocked<WorkspaceMemberService>;

  const createMockRequest = (overrides: any = {}): Request =>
    ({
      headers: {},
      query: {},
      ...overrides,
    }) as Request;

  const mockResponse = {} as Response;
  const mockNext = jest.fn() as NextFunction;

  beforeEach(async () => {
    jest
      .spyOn(TenantContextHolder, 'runWithContext')
      .mockImplementation((_ctx: any, fn: any) => fn());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMiddleware,
        {
          provide: WorkspaceService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: WorkspaceMemberService,
          useValue: {
            findByUserIdAndWorkspaceId: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
    workspaceService = module.get(WorkspaceService) as jest.Mocked<WorkspaceService>;
    memberService = module.get(WorkspaceMemberService) as jest.Mocked<WorkspaceMemberService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when req.user is missing', () => {
    it('should call next() without setting tenantContext', async () => {
      const req = createMockRequest({ headers: { 'x-workspace-id': 'ws-001' } });
      await middleware.use(req, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.tenantContext).toBeUndefined();
    });
  });

  describe('when workspaceId is missing', () => {
    it('should call next() without setting tenantContext', async () => {
      const req = createMockRequest({ user: { id: 'user-001', tenantId: 'tenant-001' } });
      await middleware.use(req, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.tenantContext).toBeUndefined();
    });
  });

  describe('when workspace belongs to a different tenant', () => {
    it('should throw ForbiddenException (403)', async () => {
      const req = createMockRequest({
        user: { id: 'user-001', tenantId: 'tenant-001' },
        headers: { 'x-workspace-id': 'ws-001' },
      });
      workspaceService.findById.mockResolvedValue({
        id: 'ws-001',
        tenantId: 'tenant-002',
      } as any);

      await expect(middleware.use(req, mockResponse, mockNext)).rejects.toThrow(
        new ForbiddenException('Invalid workspace or cross-tenant access denied'),
      );
    });
  });

  describe('when user is not a member of the workspace', () => {
    it('should throw ForbiddenException (403)', async () => {
      const req = createMockRequest({
        user: { id: 'user-001', tenantId: 'tenant-001' },
        headers: { 'x-workspace-id': 'ws-001' },
      });
      workspaceService.findById.mockResolvedValue({
        id: 'ws-001',
        tenantId: 'tenant-001',
      } as any);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue(null);

      await expect(middleware.use(req, mockResponse, mockNext)).rejects.toThrow(
        new ForbiddenException('User is not a member of this workspace'),
      );
    });
  });

  describe('when request is valid', () => {
    it('should set tenantContext and run next inside TenantContextHolder', async () => {
      const req = createMockRequest({
        user: { id: 'user-001', tenantId: 'tenant-001' },
        headers: { 'x-workspace-id': 'ws-001' },
      });
      workspaceService.findById.mockResolvedValue({
        id: 'ws-001',
        tenantId: 'tenant-001',
      } as any);
      memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' } as any);

      await middleware.use(req, mockResponse, mockNext);

      expect(req.tenantContext).toEqual({
        tenantId: 'tenant-001',
        workspaceId: 'ws-001',
        userId: 'user-001',
      });
      expect(TenantContextHolder.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-001',
          workspaceId: 'ws-001',
          userId: 'user-001',
        }),
        expect.any(Function),
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
