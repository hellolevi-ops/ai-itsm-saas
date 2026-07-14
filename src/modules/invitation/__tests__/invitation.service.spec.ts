import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RoleType, WorkspaceInvitationStatus } from '@prisma/client';
import { InvitationService } from '../invitation.service';

describe('InvitationService', () => {
  const now = new Date('2026-07-15T02:45:00.000Z');
  const invitation = {
    id: 'inv-001',
    workspaceId: 'ws-001',
    email: 'teammate@example.com',
    roleType: RoleType.REQUESTER,
    tokenHash: 'hash',
    status: WorkspaceInvitationStatus.PENDING,
    invitedById: 'owner-001',
    acceptedById: null,
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const workspace = {
    id: 'ws-001',
    tenantId: 'tenant-001',
    name: 'Acme Ops',
    slug: 'acme-ops',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    createdAt: now,
  };
  const user = {
    id: 'user-002',
    tenantId: 'tenant-001',
    email: 'teammate@example.com',
    name: 'Team Mate',
    createdAt: now,
  };

  let prisma: any;
  let memberService: any;
  let jwtService: any;
  let service: InvitationService;

  beforeEach(() => {
    prisma = {
      workspaceInvitation: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token'),
    };
    service = new InvitationService(prisma, memberService, jwtService);
  });

  const mockMemberRole = (roleType: RoleType) => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' });
    memberService.findByIdWithRole.mockResolvedValue({ id: 'member-001', role: { roleType } });
  };

  it('creates an invitation for workspace staff and returns the one-time token', async () => {
    mockMemberRole(RoleType.ADMIN);
    prisma.workspaceInvitation.create.mockResolvedValue(invitation);

    const result = await service.create(
      'ws-001',
      { id: 'owner-001', tenantId: 'tenant-001' },
      { email: 'teammate@example.com', role_type: RoleType.REQUESTER },
    );

    expect(prisma.workspaceInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'teammate@example.com',
          roleType: RoleType.REQUESTER,
          tokenHash: expect.any(String),
        }),
      }),
    );
    expect(result.data.token).toHaveLength(32);
    expect((result.data.invitation as any).tokenHash).toBeUndefined();
  });

  it('rejects requester invitation creation', async () => {
    mockMemberRole(RoleType.REQUESTER);

    await expect(
      service.create(
        'ws-001',
        { id: 'requester-001', tenantId: 'tenant-001' },
        { email: 'teammate@example.com' },
      ),
    ).rejects.toThrow(new ForbiddenException('Only workspace owners or admins can invite members'));
  });

  it('rejects privilege-escalating invitation roles', async () => {
    mockMemberRole(RoleType.ADMIN);

    await expect(
      service.create(
        'ws-001',
        { id: 'owner-001', tenantId: 'tenant-001' },
        { email: 'teammate@example.com', role_type: RoleType.OWNER },
      ),
    ).rejects.toThrow(
      new BadRequestException('Invitations can only create agent or requester members'),
    );
  });

  it('accepts an invitation and creates a target-tenant user and membership', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue({ ...invitation, workspace });
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(user),
      },
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 'role-requester' }),
        create: jest.fn(),
      },
      workspaceMember: {
        create: jest.fn().mockResolvedValue({ id: 'member-002' }),
      },
      workspaceInvitation: {
        update: jest.fn().mockResolvedValue({
          ...invitation,
          status: WorkspaceInvitationStatus.ACCEPTED,
          acceptedById: user.id,
          acceptedAt: now,
        }),
      },
    };
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    const result = await service.accept({
      token: 'invite-token-1234567890',
      email: 'teammate@example.com',
      password: 'Password123',
      name: 'Team Mate',
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenant: { connect: { id: 'tenant-001' } },
          email: 'teammate@example.com',
        }),
      }),
    );
    expect(tx.workspaceMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspace: { connect: { id: 'ws-001' } },
          role: { connect: { id: 'role-requester' } },
        }),
      }),
    );
    expect(result.data.token.access_token).toBe('access-token');
    expect(result.data.workspace.id).toBe('ws-001');
    expect(result.data.workspace.role).toBe('requester');
  });

  it('rejects missing invitations', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue(null);

    await expect(
      service.accept({
        token: 'invite-token-1234567890',
        email: 'teammate@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(new NotFoundException('Invitation not found'));
  });

  it('rejects email mismatches', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue({ ...invitation, workspace });

    await expect(
      service.accept({
        token: 'invite-token-1234567890',
        email: 'other@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(new ForbiddenException('Invitation email does not match'));
  });

  it('marks expired invitations and rejects acceptance', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue({
      ...invitation,
      workspace,
      expiresAt: new Date(Date.now() - 60_000),
    });
    prisma.workspaceInvitation.update.mockResolvedValue({
      ...invitation,
      status: WorkspaceInvitationStatus.EXPIRED,
    });

    await expect(
      service.accept({
        token: 'invite-token-1234567890',
        email: 'teammate@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(new ConflictException('Invitation has expired'));
  });
});
