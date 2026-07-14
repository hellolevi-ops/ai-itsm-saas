import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  RoleType,
  TicketEventType,
  TicketMessageVisibility,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { ServiceCatalogService } from '@/modules/service-catalog/service-catalog.service';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketService } from '../ticket.service';

const now = new Date('2026-07-14T00:00:00.000Z');

const baseTicket = {
  id: 'ticket-001',
  workspaceId: 'ws-001',
  number: 'TCK-000001',
  title: 'VPN issue',
  description: 'Cannot connect',
  source: 'WEB',
  status: TicketStatus.NEW,
  priority: TicketPriority.P3,
  category: 'network',
  requesterId: 'requester-001',
  assigneeId: null,
  createdById: 'requester-001',
  updatedById: null,
  resolvedAt: null,
  closedAt: null,
  reopenCount: 0,
  createdAt: now,
  updatedAt: now,
} as any;

describe('TicketService', () => {
  let service: TicketService;
  let ticketRepository: jest.Mocked<TicketRepository>;
  let memberService: jest.Mocked<WorkspaceMemberService>;
  let serviceCatalogService: jest.Mocked<ServiceCatalogService>;

  beforeEach(() => {
    ticketRepository = {
      count: jest.fn(),
      createWithEvent: jest.fn(),
      findById: jest.fn(),
      findByIdWithTimeline: jest.fn(),
      findAll: jest.fn(),
      updateWithEvent: jest.fn(),
      addMessageWithEvent: jest.fn(),
      addEvent: jest.fn(),
    } as any;
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    } as any;
    serviceCatalogService = {
      getTemplateForTicket: jest.fn(),
      getWorkingHoursForTicket: jest.fn(),
      calculateDueDates: jest.fn(),
    } as any;

    service = new TicketService(ticketRepository, memberService, serviceCatalogService);
  });

  const mockMemberRole = (roleType: RoleType, userId = 'requester-001') => {
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

  it('creates a workspace-scoped ticket and CREATED event', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.count.mockResolvedValue(0);
    ticketRepository.createWithEvent.mockResolvedValue(baseTicket);

    const result = await service.create(
      'ws-001',
      { id: 'requester-001', tenantId: 'tenant-001' },
      {
        title: 'VPN issue',
        description: 'Cannot connect',
        priority: TicketPriority.P3,
        category: 'network',
      },
    );

    expect(ticketRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: { connect: { id: 'ws-001' } },
        number: 'TCK-000001',
        requester: { connect: { id: 'requester-001' } },
      }),
      expect.objectContaining({
        type: TicketEventType.CREATED,
        toValue: 'TCK-000001',
      }),
    );
    expect((result.data.ticket as any).number).toBe('TCK-000001');
  });

  it('creates a ticket from a same-workspace request template with SLA due dates', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.count.mockResolvedValue(0);
    ticketRepository.createWithEvent.mockResolvedValue({
      ...baseTicket,
      serviceCatalogItemId: 'svc-001',
      requestTemplateId: 'tpl-001',
      responseDueAt: new Date('2026-07-15T03:00:00.000Z'),
      resolutionDueAt: new Date('2026-07-15T10:00:00.000Z'),
    });
    serviceCatalogService.getTemplateForTicket.mockResolvedValue({
      id: 'tpl-001',
      serviceCatalogItemId: 'svc-001',
      defaultPriority: TicketPriority.P2,
      defaultCategory: 'access',
      serviceCatalogItem: {
        id: 'svc-001',
        responseTargetMinutes: 60,
        resolutionTargetMinutes: 480,
      },
    } as any);
    serviceCatalogService.getWorkingHoursForTicket.mockResolvedValue({
      id: 'hours-001',
      workspaceId: 'ws-001',
    } as any);
    serviceCatalogService.calculateDueDates.mockReturnValue({
      responseDueAt: new Date('2026-07-15T03:00:00.000Z'),
      resolutionDueAt: new Date('2026-07-15T10:00:00.000Z'),
    });

    const result = await service.create(
      'ws-001',
      { id: 'requester-001', tenantId: 'tenant-001' },
      {
        title: 'Payroll access reset',
        description: 'Cannot access payroll.',
        request_template_id: 'tpl-001',
      },
    );

    expect(serviceCatalogService.getTemplateForTicket).toHaveBeenCalledWith('ws-001', 'tpl-001');
    expect(serviceCatalogService.getWorkingHoursForTicket).toHaveBeenCalledWith('ws-001');
    expect(ticketRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceCatalogItem: { connect: { id: 'svc-001' } },
        requestTemplate: { connect: { id: 'tpl-001' } },
        priority: TicketPriority.P2,
        category: 'access',
        responseDueAt: new Date('2026-07-15T03:00:00.000Z'),
        resolutionDueAt: new Date('2026-07-15T10:00:00.000Z'),
      }),
      expect.any(Object),
    );
    expect((result.data.ticket as any).request_template_id).toBe('tpl-001');
  });

  it('limits requester list to own tickets even when mine=false', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.findAll.mockResolvedValue([baseTicket]);

    await service.list(
      'ws-001',
      { id: 'requester-001', tenantId: 'tenant-001' },
      {
        mine: 'false',
      },
    );

    expect(ticketRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-001',
        requesterId: 'requester-001',
      }),
    );
  });

  it('prevents requester from viewing another requester ticket', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.findById.mockResolvedValue({
      ...baseTicket,
      requesterId: 'other-user',
    });

    await expect(
      service.get('ws-001', 'ticket-001', { id: 'requester-001', tenantId: 'tenant-001' }),
    ).rejects.toThrow(new ForbiddenException('Cannot access another requester ticket'));
  });

  it('hides internal notes from requester detail', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.findById.mockResolvedValue(baseTicket);
    ticketRepository.findByIdWithTimeline.mockResolvedValue({
      ...baseTicket,
      messages: [
        {
          id: 'msg-public',
          workspaceId: 'ws-001',
          ticketId: 'ticket-001',
          authorId: 'agent-001',
          visibility: TicketMessageVisibility.PUBLIC,
          body: 'Public reply',
          createdAt: now,
        },
        {
          id: 'msg-internal',
          workspaceId: 'ws-001',
          ticketId: 'ticket-001',
          authorId: 'agent-001',
          visibility: TicketMessageVisibility.INTERNAL,
          body: 'Internal note',
          createdAt: now,
        },
      ] as any,
      events: [],
    });

    const result = await service.get('ws-001', 'ticket-001', {
      id: 'requester-001',
      tenantId: 'tenant-001',
    });

    expect(result.data.messages).toHaveLength(1);
    expect((result.data.messages as any[])[0].id).toBe('msg-public');
  });

  it('rejects internal notes from requesters', async () => {
    mockMemberRole(RoleType.REQUESTER);
    ticketRepository.findById.mockResolvedValue(baseTicket);

    await expect(
      service.addMessage(
        'ws-001',
        'ticket-001',
        { id: 'requester-001', tenantId: 'tenant-001' },
        { visibility: TicketMessageVisibility.INTERNAL, body: 'secret' },
      ),
    ).rejects.toThrow(new ForbiddenException('Requester cannot create internal notes'));
  });

  it('requires assignee to be eligible same-workspace staff', async () => {
    mockMemberRole(RoleType.AGENT, 'agent-001');
    ticketRepository.findById.mockResolvedValue(baseTicket);
    memberService.findByUserIdAndWorkspaceId.mockImplementation((userId) => {
      if (userId === 'agent-001') return Promise.resolve({ id: 'member-agent' } as any);
      if (userId === 'requester-001') return Promise.resolve({ id: 'member-requester' } as any);
      return Promise.resolve(null);
    });
    memberService.findByIdWithRole.mockImplementation((memberId) => {
      if (memberId === 'member-agent') {
        return Promise.resolve({ id: memberId, role: { roleType: RoleType.AGENT } } as any);
      }
      return Promise.resolve({ id: memberId, role: { roleType: RoleType.REQUESTER } } as any);
    });

    await expect(
      service.assign(
        'ws-001',
        'ticket-001',
        { id: 'agent-001', tenantId: 'tenant-001' },
        { assignee_id: 'requester-001' },
      ),
    ).rejects.toThrow(new NotFoundException('Assignee is not an eligible workspace member'));
  });

  it('rejects invalid status transitions', async () => {
    mockMemberRole(RoleType.AGENT, 'agent-001');
    ticketRepository.findById.mockResolvedValue({ ...baseTicket, status: TicketStatus.NEW });

    await expect(
      service.changeStatus(
        'ws-001',
        'ticket-001',
        { id: 'agent-001', tenantId: 'tenant-001' },
        { status: TicketStatus.RESOLVED },
      ),
    ).rejects.toThrow(new ConflictException('Invalid ticket status transition'));
  });
});
