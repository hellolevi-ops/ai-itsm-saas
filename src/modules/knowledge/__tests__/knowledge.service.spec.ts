import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeVisibility,
  RoleType,
  TicketMessageVisibility,
  TicketPriority,
  TicketSource,
  TicketStatus,
} from '@prisma/client';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { TicketRepository } from '@/modules/ticket/repositories/ticket.repository';
import { KnowledgeRepository } from '../repositories/knowledge.repository';
import { KnowledgeService } from '../knowledge.service';

const now = new Date('2026-07-15T00:00:00.000Z');

const resolvedTicket = {
  id: 'ticket-001',
  workspaceId: 'ws-001',
  number: 'TCK-000001',
  title: 'VPN connection failed',
  description: 'User cannot connect to VPN from home.',
  source: TicketSource.WEB,
  status: TicketStatus.RESOLVED,
  priority: TicketPriority.P3,
  category: 'network',
  requesterId: 'requester-001',
  assigneeId: 'agent-001',
  createdById: 'requester-001',
  updatedById: 'agent-001',
  resolvedAt: now,
  closedAt: null,
  reopenCount: 0,
  createdAt: now,
  updatedAt: now,
  messages: [
    {
      id: 'message-public',
      workspaceId: 'ws-001',
      ticketId: 'ticket-001',
      authorId: 'agent-001',
      visibility: TicketMessageVisibility.PUBLIC,
      body: 'Reset the VPN profile and confirm the user can connect.',
      createdAt: now,
    },
    {
      id: 'message-internal',
      workspaceId: 'ws-001',
      ticketId: 'ticket-001',
      authorId: 'agent-001',
      visibility: TicketMessageVisibility.INTERNAL,
      body: 'Internal escalation details must not leak.',
      createdAt: now,
    },
  ],
  events: [],
};

const draftArticle = {
  id: 'article-001',
  workspaceId: 'ws-001',
  sourceTicketId: 'ticket-001',
  sourceType: KnowledgeSourceType.TICKET,
  title: 'How to resolve: VPN connection failed',
  problem: 'User cannot connect to VPN from home.',
  resolution: 'Reset the VPN profile and confirm the user can connect.',
  verification: 'Confirm the requester can complete the affected workflow.',
  rollback: 'Reopen the source ticket if needed.',
  status: KnowledgeStatus.DRAFT,
  visibility: KnowledgeVisibility.INTERNAL,
  createdById: 'agent-001',
  publishedById: null,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
};

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let knowledgeRepository: jest.Mocked<KnowledgeRepository>;
  let ticketRepository: jest.Mocked<TicketRepository>;
  let memberService: jest.Mocked<WorkspaceMemberService>;

  beforeEach(() => {
    knowledgeRepository = {
      create: jest.fn(),
      findLatestBySourceTicket: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      publish: jest.fn(),
    } as any;
    ticketRepository = {
      findByIdWithTimeline: jest.fn(),
    } as any;
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    } as any;

    service = new KnowledgeService(knowledgeRepository, ticketRepository, memberService);
  });

  const mockMemberRole = (roleType: RoleType, userId = 'agent-001') => {
    memberService.findByUserIdAndWorkspaceId.mockImplementation((candidateUserId) => {
      if (candidateUserId === userId) {
        return Promise.resolve({ id: `member-${candidateUserId}` } as any);
      }
      return Promise.resolve(null);
    });
    memberService.findByIdWithRole.mockResolvedValue({
      id: `member-${userId}`,
      role: { roleType },
    } as any);
  };

  it('creates a staff-only draft from a resolved ticket without leaking internal notes', async () => {
    mockMemberRole(RoleType.AGENT);
    ticketRepository.findByIdWithTimeline.mockResolvedValue(resolvedTicket as any);
    knowledgeRepository.findLatestBySourceTicket.mockResolvedValue(null);
    knowledgeRepository.create.mockResolvedValue(draftArticle as any);

    const result = await service.createDraftFromTicket('ws-001', 'ticket-001', {
      id: 'agent-001',
      tenantId: 'tenant-001',
    });

    expect(knowledgeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: { connect: { id: 'ws-001' } },
        sourceTicket: { connect: { id: 'ticket-001' } },
        sourceType: KnowledgeSourceType.TICKET,
        visibility: KnowledgeVisibility.INTERNAL,
        resolution: 'Reset the VPN profile and confirm the user can connect.',
      }),
    );
    expect(JSON.stringify(knowledgeRepository.create.mock.calls[0][0])).not.toContain(
      'Internal escalation',
    );
    expect((result.data.article as any).status).toBe(KnowledgeStatus.DRAFT);
  });

  it('rejects requester draft creation', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');

    await expect(
      service.createDraftFromTicket('ws-001', 'ticket-001', {
        id: 'requester-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new ForbiddenException('Insufficient workspace role'));
  });

  it('requires source ticket to be resolved or closed before drafting', async () => {
    mockMemberRole(RoleType.AGENT);
    ticketRepository.findByIdWithTimeline.mockResolvedValue({
      ...resolvedTicket,
      status: TicketStatus.IN_PROGRESS,
    } as any);

    await expect(
      service.createDraftFromTicket('ws-001', 'ticket-001', {
        id: 'agent-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(
      new ConflictException('Knowledge drafts require a resolved or closed ticket'),
    );
  });

  it('limits requester list to published requester-visible articles', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');
    knowledgeRepository.findAll.mockResolvedValue([
      { ...draftArticle, status: KnowledgeStatus.PUBLISHED } as any,
    ]);

    await service.list(
      'ws-001',
      { id: 'requester-001', tenantId: 'tenant-001' },
      { status: KnowledgeStatus.DRAFT },
    );

    expect(knowledgeRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-001',
        status: KnowledgeStatus.PUBLISHED,
        visibility: KnowledgeVisibility.REQUESTER,
      }),
    );
  });

  it('hides internal drafts from requesters', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');
    knowledgeRepository.findById.mockResolvedValue(draftArticle as any);

    await expect(
      service.get('ws-001', 'article-001', {
        id: 'requester-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new NotFoundException('Knowledge article not found'));
  });

  it('publishes articles with requester visibility for staff', async () => {
    mockMemberRole(RoleType.AGENT);
    knowledgeRepository.findById.mockResolvedValue(draftArticle as any);
    knowledgeRepository.publish.mockResolvedValue({
      ...draftArticle,
      status: KnowledgeStatus.PUBLISHED,
      visibility: KnowledgeVisibility.REQUESTER,
      publishedById: 'agent-001',
      publishedAt: now,
    } as any);

    const result = await service.publish(
      'ws-001',
      'article-001',
      { id: 'agent-001', tenantId: 'tenant-001' },
      { visibility: KnowledgeVisibility.REQUESTER },
    );

    expect(knowledgeRepository.publish).toHaveBeenCalledWith({
      workspaceId: 'ws-001',
      articleId: 'article-001',
      actorId: 'agent-001',
      visibility: KnowledgeVisibility.REQUESTER,
    });
    expect((result.data.article as any).status).toBe(KnowledgeStatus.PUBLISHED);
  });
});
