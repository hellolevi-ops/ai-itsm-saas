import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AiActionType, AiRunStatus, RoleType, TicketPriority, TicketStatus } from '@prisma/client';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { TicketRepository } from '@/modules/ticket/repositories/ticket.repository';
import { AiGatewayService } from '../ai-gateway.service';
import { AiTicketAssistService } from '../ai-ticket-assist.service';
import { AiRunRepository } from '../repositories/ai-run.repository';

const now = new Date('2026-07-15T00:00:00.000Z');

const baseTicket = {
  id: 'ticket-001',
  workspaceId: 'ws-001',
  number: 'TCK-000001',
  title: 'VPN issue',
  description: 'Cannot connect to VPN',
  source: 'WEB',
  status: TicketStatus.NEW,
  priority: TicketPriority.P3,
  category: null,
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

const suggestionResult = {
  provider: 'mock',
  model: 'rules-v1',
  promptVersion: 'ticket-triage-v1',
  inputHash: 'a'.repeat(64),
  latencyMs: 3,
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostMicros: 0,
  suggestion: {
    summary: 'VPN issue. Cannot connect to VPN',
    category: 'network',
    priority: TicketPriority.P2,
    reply_draft: 'Please share the VPN error message.',
    confidence: 0.82,
    risk_level: 'LOW' as const,
    reasons: ['Matched network request pattern'],
    requires_human_review: true,
  },
};

describe('AiTicketAssistService', () => {
  let service: AiTicketAssistService;
  let aiGateway: jest.Mocked<AiGatewayService>;
  let aiRunRepository: jest.Mocked<AiRunRepository>;
  let ticketRepository: jest.Mocked<TicketRepository>;
  let memberService: jest.Mocked<WorkspaceMemberService>;

  beforeEach(() => {
    aiGateway = {
      generateTicketAssist: jest.fn(),
    } as any;
    aiRunRepository = {
      createTicketTriageRun: jest.fn(),
    } as any;
    ticketRepository = {
      findById: jest.fn(),
    } as any;
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    } as any;

    service = new AiTicketAssistService(
      aiGateway,
      aiRunRepository,
      ticketRepository,
      memberService,
    );
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

  it('generates suggestions through the gateway and creates an ai run audit record', async () => {
    mockMemberRole(RoleType.AGENT, 'agent-001');
    ticketRepository.findById.mockResolvedValue(baseTicket);
    aiGateway.generateTicketAssist.mockResolvedValue(suggestionResult);
    aiRunRepository.createTicketTriageRun.mockResolvedValue({
      id: 'run-001',
      action: AiActionType.TICKET_TRIAGE,
      provider: 'mock',
      model: 'rules-v1',
      promptVersion: 'ticket-triage-v1',
      status: AiRunStatus.SUCCEEDED,
      confidence: 0.82,
      latencyMs: 3,
      riskLevel: 'LOW',
      createdAt: now,
    } as any);

    const result = await service.generateTicketSuggestions('ws-001', 'ticket-001', {
      id: 'agent-001',
      tenantId: 'tenant-001',
    });

    expect(aiGateway.generateTicketAssist).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: 'ticket-001',
        title: 'VPN issue',
      }),
    );
    expect(aiRunRepository.createTicketTriageRun).toHaveBeenCalledWith({
      workspaceId: 'ws-001',
      ticketId: 'ticket-001',
      actorId: 'agent-001',
      result: suggestionResult,
    });
    expect(result.data.suggestion).toMatchObject({
      category: 'network',
      priority: TicketPriority.P2,
    });
  });

  it('does not update ticket fields when suggestions are generated', async () => {
    mockMemberRole(RoleType.AGENT, 'agent-001');
    ticketRepository.findById.mockResolvedValue(baseTicket);
    aiGateway.generateTicketAssist.mockResolvedValue(suggestionResult);
    aiRunRepository.createTicketTriageRun.mockResolvedValue({ id: 'run-001' } as any);

    await service.generateTicketSuggestions('ws-001', 'ticket-001', {
      id: 'agent-001',
      tenantId: 'tenant-001',
    });

    expect((ticketRepository as any).updateWithEvent).toBeUndefined();
  });

  it('prevents requesters from generating suggestions for another requester ticket', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');
    ticketRepository.findById.mockResolvedValue({
      ...baseTicket,
      requesterId: 'other-requester',
    });

    await expect(
      service.generateTicketSuggestions('ws-001', 'ticket-001', {
        id: 'requester-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(
      new ForbiddenException('Cannot generate suggestions for another requester ticket'),
    );
  });

  it('fails closed when the actor is not a workspace member', async () => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue(null);

    await expect(
      service.generateTicketSuggestions('ws-001', 'ticket-001', {
        id: 'agent-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new ForbiddenException('User is not a member of this workspace'));
    expect(ticketRepository.findById).not.toHaveBeenCalled();
  });

  it('returns not found for missing workspace-scoped tickets', async () => {
    mockMemberRole(RoleType.AGENT, 'agent-001');
    ticketRepository.findById.mockResolvedValue(null);

    await expect(
      service.generateTicketSuggestions('ws-001', 'ticket-404', {
        id: 'agent-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new NotFoundException('Ticket not found'));
  });
});
