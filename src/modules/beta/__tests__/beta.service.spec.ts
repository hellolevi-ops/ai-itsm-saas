import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BetaFeedbackSeverity,
  BetaFeedbackStatus,
  BetaFeedbackType,
  RoleType,
} from '@prisma/client';
import { BetaService } from '../beta.service';

describe('BetaService', () => {
  const now = new Date('2026-07-15T06:50:00.000Z');
  const feedback = {
    id: 'feedback-001',
    workspaceId: 'ws-001',
    reporterId: 'user-001',
    type: BetaFeedbackType.BUG,
    severity: BetaFeedbackSeverity.HIGH,
    title: 'Invite flow copy is unclear',
    description: 'The design partner could not tell whether the invite link was reusable.',
    status: BetaFeedbackStatus.OPEN,
    createdAt: now,
    updatedAt: now,
  };
  const featureFlag = {
    id: 'flag-001',
    workspaceId: 'ws-001',
    key: 'beta_billing_manual_orders',
    enabled: true,
    description: 'Enable manual order and activation flow for beta payment validation.',
    changedByUserId: 'owner-001',
    changedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  let prisma: any;
  let memberService: any;
  let service: BetaService;

  beforeEach(() => {
    prisma = {
      betaFeedback: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      workspaceFeatureFlag: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    };
    service = new BetaService(prisma, memberService);
  });

  const mockMemberRole = (roleType: RoleType) => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' });
    memberService.findByIdWithRole.mockResolvedValue({ id: 'member-001', role: { roleType } });
  };

  it('returns the public beta package without workspace access', () => {
    const result = service.publicPackage();

    expect(result.data).toEqual(
      expect.objectContaining({
        package_version: 'm10-beta-readiness-2026-07-15',
        production_release: false,
        paid_external_resources_required: false,
      }),
    );
  });

  it('returns workspace readiness with default flags and feedback summary', async () => {
    mockMemberRole(RoleType.AGENT);
    prisma.workspaceFeatureFlag.findMany.mockResolvedValue([]);
    prisma.betaFeedback.findMany.mockResolvedValue([feedback]);

    const result = await service.workspaceReadiness('ws-001', {
      id: 'user-001',
      tenantId: 'tenant-001',
    });

    expect(result.data.feature_flags as any[]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'beta_feedback_intake',
          enabled: true,
        }),
      ]),
    );
    expect(result.data.feedback_summary).toEqual({
      total: 1,
      open: 1,
      bugs: 1,
      high_or_critical: 1,
    });
  });

  it('creates beta feedback for workspace members', async () => {
    mockMemberRole(RoleType.REQUESTER);
    prisma.betaFeedback.create.mockResolvedValue(feedback);

    const result = await service.createFeedback(
      'ws-001',
      { id: 'user-001', tenantId: 'tenant-001' },
      {
        type: BetaFeedbackType.BUG,
        severity: BetaFeedbackSeverity.HIGH,
        title: ' Invite flow copy is unclear ',
        description: ' The design partner could not tell whether the invite link was reusable. ',
      },
    );

    expect(prisma.betaFeedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Invite flow copy is unclear',
          description: 'The design partner could not tell whether the invite link was reusable.',
        }),
      }),
    );
    expect((result.data.feedback as any).status).toBe(BetaFeedbackStatus.OPEN);
  });

  it('rejects beta readiness access for non-members', async () => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue(null);

    await expect(
      service.workspaceReadiness('ws-001', { id: 'outsider-001', tenantId: 'tenant-001' }),
    ).rejects.toThrow(new ForbiddenException('Workspace access denied'));
  });

  it('allows workspace owners to toggle known beta flags', async () => {
    mockMemberRole(RoleType.OWNER);
    prisma.workspaceFeatureFlag.upsert.mockResolvedValue(featureFlag);

    const result = await service.updateFeatureFlag('ws-001', 'beta_billing_manual_orders', true, {
      id: 'owner-001',
      tenantId: 'tenant-001',
    });

    expect(prisma.workspaceFeatureFlag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId_key: { workspaceId: 'ws-001', key: 'beta_billing_manual_orders' } },
        update: expect.objectContaining({ enabled: true }),
      }),
    );
    expect(result.data.feature_flag).toEqual(
      expect.objectContaining({ key: 'beta_billing_manual_orders', enabled: true }),
    );
  });

  it('rejects beta flag toggles from requesters', async () => {
    mockMemberRole(RoleType.REQUESTER);

    await expect(
      service.updateFeatureFlag('ws-001', 'beta_feedback_intake', false, {
        id: 'requester-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(
      new ForbiddenException('Only workspace owners or admins can manage beta flags'),
    );
  });

  it('rejects unknown beta feature flags', async () => {
    mockMemberRole(RoleType.ADMIN);

    await expect(
      service.updateFeatureFlag('ws-001', 'beta_unknown', true, {
        id: 'admin-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new BadRequestException('Unknown beta feature flag'));
  });
});
