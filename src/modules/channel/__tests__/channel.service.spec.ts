import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  ChannelConnectionStatus,
  ChannelInboundMessageStatus,
  ChannelType,
  RoleType,
  TicketPriority,
  TicketSource,
  TicketStatus,
} from '@prisma/client';
import { ChannelService } from '../channel.service';

describe('ChannelService', () => {
  const now = new Date('2026-07-15T02:30:00.000Z');
  const channel = {
    id: 'channel-001',
    workspaceId: 'ws-001',
    type: ChannelType.WECOM,
    name: 'WeCom support',
    tokenHash: 'token-hash',
    status: ChannelConnectionStatus.ACTIVE,
    createdById: 'owner-001',
    createdAt: now,
    updatedAt: now,
    workspace: { id: 'ws-001', tenantId: 'tenant-001' },
  };
  const ticket = {
    id: 'ticket-001',
    workspaceId: 'ws-001',
    number: 'TCK-000001',
    title: 'Printer is offline',
    description: 'The finance printer cannot print.',
    source: TicketSource.WECOM,
    status: TicketStatus.NEW,
    priority: TicketPriority.P3,
    category: 'channel:wecom',
    requesterId: 'requester-001',
    assigneeId: null,
    createdById: 'requester-001',
    updatedById: null,
    resolvedAt: null,
    closedAt: null,
    reopenCount: 0,
    createdAt: now,
    updatedAt: now,
    serviceCatalogItemId: null,
    requestTemplateId: null,
    responseDueAt: null,
    resolutionDueAt: null,
  };
  const inbound = {
    id: 'inbound-001',
    workspaceId: 'ws-001',
    connectionId: 'channel-001',
    ticketId: 'ticket-001',
    externalMessageId: 'msg-001',
    externalUserId: 'zhangsan',
    externalUserName: 'Zhang San',
    subject: 'Printer is offline',
    body: 'The finance printer cannot print.',
    payload: {},
    status: ChannelInboundMessageStatus.TICKET_CREATED,
    receivedAt: now,
  };

  let prisma: any;
  let memberService: any;
  let ticketService: any;
  let service: ChannelService;

  beforeEach(() => {
    prisma = {
      channelConnection: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      channelInboundMessage: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    };
    ticketService = {
      createFromChannel: jest.fn(),
    };
    service = new ChannelService(prisma, memberService, ticketService);
  });

  const mockMemberRole = (roleType: RoleType) => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' });
    memberService.findByIdWithRole.mockResolvedValue({ id: 'member-001', role: { roleType } });
  };

  it('creates a WeCom channel for staff without returning the token hash', async () => {
    mockMemberRole(RoleType.ADMIN);
    prisma.channelConnection.create.mockResolvedValue(channel);

    const result = await service.createWeComConnection(
      'ws-001',
      { id: 'owner-001', tenantId: 'tenant-001' },
      { name: 'WeCom support', token: 'secret-token' },
    );

    expect(prisma.channelConnection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: ChannelType.WECOM,
          tokenHash: expect.any(String),
        }),
      }),
    );
    expect((result.data.channel as any).tokenHash).toBeUndefined();
    expect(result.data.channel.name).toBe('WeCom support');
  });

  it('rejects requester channel management', async () => {
    mockMemberRole(RoleType.REQUESTER);

    await expect(
      service.createWeComConnection(
        'ws-001',
        { id: 'requester-001', tenantId: 'tenant-001' },
        { name: 'WeCom support', token: 'secret-token' },
      ),
    ).rejects.toThrow(new ForbiddenException('Only staff can manage channels'));
  });

  it('fails closed when the channel token is invalid', async () => {
    prisma.channelConnection.findFirst.mockResolvedValue({
      ...channel,
      tokenHash: '930bbdc51b6aed5c2a5678fd6e28dee7a05e8a4b643cfc0b4427c3efb86c0d94',
    });

    await expect(
      service.receiveWeComMessage('channel-001', 'wrong-token', {
        external_message_id: 'msg-001',
        external_user_id: 'zhangsan',
        text: 'The finance printer cannot print.',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid channel token'));
  });

  it('creates a ticket and audit message from a WeCom inbound message', async () => {
    prisma.channelConnection.findFirst.mockResolvedValue({
      ...channel,
      tokenHash: '930bbdc51b6aed5c2a5678fd6e28dee7a05e8a4b643cfc0b4427c3efb86c0d94',
    });
    prisma.channelInboundMessage.findUnique.mockResolvedValue(null);
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'requester-001' }),
        create: jest.fn(),
      },
      workspaceMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'member-001' }),
        create: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      channelInboundMessage: {
        create: jest.fn().mockResolvedValue({ ...inbound, ticketId: null }),
      },
    };
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    ticketService.createFromChannel.mockResolvedValue({ data: { ticket } });
    prisma.channelInboundMessage.update.mockResolvedValue(inbound);

    const result = await service.receiveWeComMessage('channel-001', 'secret-token', {
      external_message_id: 'msg-001',
      external_user_id: 'zhangsan',
      external_user_name: 'Zhang San',
      subject: 'Printer is offline',
      text: 'The finance printer cannot print.',
    });

    expect(ticketService.createFromChannel).toHaveBeenCalledWith(
      'ws-001',
      expect.objectContaining({
        source: TicketSource.WECOM,
        category: 'channel:wecom',
        title: 'Printer is offline',
        metadata: expect.objectContaining({
          channel_type: ChannelType.WECOM,
          external_message_id: 'msg-001',
        }),
      }),
    );
    expect(prisma.channelInboundMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ChannelInboundMessageStatus.TICKET_CREATED,
          ticket: { connect: { id: 'ticket-001' } },
        }),
      }),
    );
    expect(result.data.duplicate).toBe(false);
    expect(result.data.ticket?.source).toBe(TicketSource.WECOM);
    expect(result.data.inbound_message.status).toBe(ChannelInboundMessageStatus.TICKET_CREATED);
  });

  it('returns the existing ticket for duplicate external messages', async () => {
    prisma.channelConnection.findFirst.mockResolvedValue({
      ...channel,
      tokenHash: '930bbdc51b6aed5c2a5678fd6e28dee7a05e8a4b643cfc0b4427c3efb86c0d94',
    });
    prisma.channelInboundMessage.findUnique.mockResolvedValue({ ...inbound, ticket });

    const result = await service.receiveWeComMessage('channel-001', 'secret-token', {
      external_message_id: 'msg-001',
      external_user_id: 'zhangsan',
      text: 'The finance printer cannot print.',
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.data.duplicate).toBe(true);
    expect(result.data.ticket?.id).toBe('ticket-001');
  });

  it('returns 404 for unknown channel connections', async () => {
    prisma.channelConnection.findFirst.mockResolvedValue(null);

    await expect(
      service.receiveWeComMessage('missing', 'secret-token', {
        external_message_id: 'msg-001',
        external_user_id: 'zhangsan',
        text: 'The finance printer cannot print.',
      }),
    ).rejects.toThrow(new NotFoundException('Channel connection not found'));
  });
});
