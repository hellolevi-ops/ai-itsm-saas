import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChannelConnection,
  ChannelConnectionStatus,
  ChannelInboundMessage,
  ChannelInboundMessageStatus,
  ChannelType,
  Prisma,
  RoleType,
  Ticket,
  TicketSource,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketActor, TicketService } from '@/modules/ticket/ticket.service';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { CreateWeComChannelDto, ReceiveWeComMessageDto } from './dto/channel.dto';

type ChannelConnectionDto = {
  id: string;
  workspace_id: string;
  type: ChannelType;
  name: string;
  status: ChannelConnectionStatus;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
};

type InboundMessageDto = {
  id: string;
  workspace_id: string;
  connection_id: string;
  ticket_id: string | null;
  external_message_id: string;
  external_user_id: string;
  external_user_name: string | null;
  subject: string;
  body: string;
  status: ChannelInboundMessageStatus;
  received_at: Date;
};

@Injectable()
export class ChannelService {
  private readonly staffRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT];

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: WorkspaceMemberService,
    private readonly ticketService: TicketService,
  ) {}

  async list(workspaceId: string, actor: TicketActor) {
    await this.requireMember(workspaceId, actor);
    const channels = await this.prisma.channelConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: { channels: channels.map((channel) => this.toConnectionDto(channel)) } };
  }

  async createWeComConnection(workspaceId: string, actor: TicketActor, dto: CreateWeComChannelDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    if (!this.staffRoles.includes(roleType)) {
      throw new ForbiddenException('Only staff can manage channels');
    }

    const channel = await this.prisma.channelConnection.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        type: ChannelType.WECOM,
        name: dto.name,
        tokenHash: this.hashSecret(dto.token),
        status: ChannelConnectionStatus.ACTIVE,
        createdBy: { connect: { id: actor.id } },
      },
    });

    return { data: { channel: this.toConnectionDto(channel) } };
  }

  async receiveWeComMessage(
    connectionId: string,
    token: string | undefined,
    dto: ReceiveWeComMessageDto,
  ) {
    const connection = await this.prisma.channelConnection.findFirst({
      where: { id: connectionId, type: ChannelType.WECOM, status: ChannelConnectionStatus.ACTIVE },
      include: { workspace: true },
    });
    if (!connection) {
      throw new NotFoundException('Channel connection not found');
    }
    if (!token || this.hashSecret(token) !== connection.tokenHash) {
      throw new UnauthorizedException('Invalid channel token');
    }

    const existing = await this.prisma.channelInboundMessage.findUnique({
      where: {
        connectionId_externalMessageId: {
          connectionId,
          externalMessageId: dto.external_message_id,
        },
      },
      include: { ticket: true },
    });
    if (existing) {
      return {
        data: {
          duplicate: true,
          inbound_message: this.toInboundMessageDto(existing),
          ticket: existing.ticket ? this.toTicketDto(existing.ticket) : null,
        },
      };
    }

    const intake = await this.prisma.$transaction(async (tx) => {
      const requester = await this.ensureChannelRequester(tx, {
        tenantId: connection.workspace.tenantId,
        workspaceId: connection.workspaceId,
        connectionId,
        externalUserId: dto.external_user_id,
        externalUserName: dto.external_user_name,
      });
      const title =
        (dto.subject || '').trim() ||
        `WeCom message from ${dto.external_user_name || dto.external_user_id}`;
      const inbound = await tx.channelInboundMessage.create({
        data: {
          workspace: { connect: { id: connection.workspaceId } },
          connection: { connect: { id: connectionId } },
          externalMessageId: dto.external_message_id,
          externalUserId: dto.external_user_id,
          externalUserName: dto.external_user_name,
          subject: title,
          body: dto.text,
          payload: dto as unknown as Prisma.InputJsonValue,
          status: ChannelInboundMessageStatus.RECEIVED,
        },
      });
      return { requester, inbound, title };
    });
    const ticketResponse = await this.ticketService.createFromChannel(connection.workspaceId, {
      title: intake.title,
      description: dto.text,
      source: TicketSource.WECOM,
      requesterId: intake.requester.id,
      createdById: intake.requester.id,
      category: 'channel:wecom',
      metadata: {
        channel_connection_id: connectionId,
        inbound_message_id: intake.inbound.id,
        external_message_id: dto.external_message_id,
        channel_type: ChannelType.WECOM,
      },
    });
    const ticket = ticketResponse.data.ticket as any;
    const updatedInbound = await this.prisma.channelInboundMessage.update({
      where: { id: intake.inbound.id },
      data: {
        ticket: { connect: { id: ticket.id } },
        status: ChannelInboundMessageStatus.TICKET_CREATED,
      },
    });

    return {
      data: {
        duplicate: false,
        inbound_message: this.toInboundMessageDto(updatedInbound),
        ticket,
      },
    };
  }

  private async requireMember(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(actor.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('Workspace access denied');
    }
    const roleType =
      actor.roleType ?? (await this.memberService.findByIdWithRole(member.id)).role?.roleType;
    if (!roleType) {
      throw new ForbiddenException('Workspace role is required');
    }
    return roleType as RoleType;
  }

  private async ensureChannelRequester(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: string;
      workspaceId: string;
      connectionId: string;
      externalUserId: string;
      externalUserName?: string;
    },
  ) {
    const externalHash = this.hashSecret(params.externalUserId).slice(0, 16);
    const email = `wecom-${params.connectionId}-${externalHash}@channel.local`.toLowerCase();
    let user = await tx.user.findFirst({
      where: { tenantId: params.tenantId, email },
    });
    if (!user) {
      user = await tx.user.create({
        data: {
          tenant: { connect: { id: params.tenantId } },
          email,
          passwordHash: `channel-user-${randomUUID()}`,
          name: params.externalUserName || params.externalUserId,
        },
      });
    }
    const existingMember = await tx.workspaceMember.findFirst({
      where: { workspaceId: params.workspaceId, userId: user.id },
    });
    if (!existingMember) {
      let role = await tx.role.findFirst({
        where: { workspaceId: params.workspaceId, roleType: RoleType.REQUESTER, isSystem: true },
      });
      if (!role) {
        role = await tx.role.create({
          data: {
            workspace: { connect: { id: params.workspaceId } },
            name: 'Requester',
            description: 'End user who submits requests',
            roleType: RoleType.REQUESTER,
            isSystem: true,
          },
        });
      }
      await tx.workspaceMember.create({
        data: {
          workspace: { connect: { id: params.workspaceId } },
          user: { connect: { id: user.id } },
          role: { connect: { id: role.id } },
        },
      });
    }
    return user;
  }

  private hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private toConnectionDto(channel: ChannelConnection): ChannelConnectionDto {
    return {
      id: channel.id,
      workspace_id: channel.workspaceId,
      type: channel.type,
      name: channel.name,
      status: channel.status,
      created_by_id: channel.createdById,
      created_at: channel.createdAt,
      updated_at: channel.updatedAt,
    };
  }

  private toInboundMessageDto(message: ChannelInboundMessage): InboundMessageDto {
    return {
      id: message.id,
      workspace_id: message.workspaceId,
      connection_id: message.connectionId,
      ticket_id: message.ticketId,
      external_message_id: message.externalMessageId,
      external_user_id: message.externalUserId,
      external_user_name: message.externalUserName,
      subject: message.subject,
      body: message.body,
      status: message.status,
      received_at: message.receivedAt,
    };
  }

  private toTicketDto(ticket: Ticket) {
    return {
      id: ticket.id,
      workspace_id: ticket.workspaceId,
      number: ticket.number,
      title: ticket.title,
      description: ticket.description,
      source: ticket.source,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      requester_id: ticket.requesterId,
      assignee_id: ticket.assigneeId,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      resolved_at: ticket.resolvedAt,
      closed_at: ticket.closedAt,
      reopen_count: ticket.reopenCount,
      service_catalog_item_id: ticket.serviceCatalogItemId,
      request_template_id: ticket.requestTemplateId,
      response_due_at: ticket.responseDueAt,
      resolution_due_at: ticket.resolutionDueAt,
    };
  }
}
