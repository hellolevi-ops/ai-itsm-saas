import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RoleType,
  Ticket,
  TicketEventType,
  TicketMessage,
  TicketMessageVisibility,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import {
  AddTicketMessageDto,
  AssignTicketDto,
  ChangeTicketStatusDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { TicketRepository } from './repositories/ticket.repository';

export interface TicketActor {
  id: string;
  tenantId: string;
  roleType?: RoleType;
}

@Injectable()
export class TicketService {
  private readonly staffRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT];

  private readonly allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.NEW]: [TicketStatus.TRIAGE, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
    [TicketStatus.TRIAGE]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
    [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
    [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  };

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async create(workspaceId: string, actor: TicketActor, dto: CreateTicketDto) {
    await this.requireMember(workspaceId, actor);
    const number = await this.nextTicketNumber(workspaceId);
    const ticket = await this.ticketRepository.createWithEvent(
      {
        workspace: { connect: { id: workspaceId } },
        number,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? TicketPriority.P3,
        category: dto.category,
        requester: { connect: { id: actor.id } },
        createdBy: { connect: { id: actor.id } },
      },
      this.eventInput(actor.id, TicketEventType.CREATED, null, number),
    );

    return this.wrap({ ticket: this.toTicketDto(ticket) });
  }

  async list(workspaceId: string, actor: TicketActor, query: ListTicketsQueryDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    const requesterOnly = roleType === RoleType.REQUESTER || query.mine === 'true';
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const tickets = await this.ticketRepository.findAll({
      workspaceId,
      status: query.status,
      assigneeId: query.assignee_id,
      requesterId: requesterOnly ? actor.id : undefined,
      q: query.q,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return this.wrap({
      tickets: tickets.map((ticket) => this.toTicketDto(ticket)),
      page,
      page_size: pageSize,
    });
  }

  async get(workspaceId: string, ticketId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    const ticket = await this.findTicket(workspaceId, ticketId);
    this.assertCanView(ticket, actor, roleType);

    const detail = await this.ticketRepository.findByIdWithTimeline(ticketId, workspaceId);
    if (!detail) {
      throw new NotFoundException('Ticket not found');
    }

    return this.wrap({
      ticket: this.toTicketDto(detail),
      messages: (detail.messages ?? [])
        .filter((message) => this.canSeeMessage(message, actor, roleType))
        .map((message) => this.toMessageDto(message)),
      events: (detail.events ?? []).map((event) => ({
        id: event.id,
        type: event.type,
        actor_id: event.actorId,
        from_value: event.fromValue,
        to_value: event.toValue,
        metadata: event.metadata,
        created_at: event.createdAt,
      })),
    });
  }

  async update(workspaceId: string, ticketId: string, actor: TicketActor, dto: UpdateTicketDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    const ticket = await this.findTicket(workspaceId, ticketId);
    this.assertCanUpdate(ticket, actor, roleType);

    const updated = await this.ticketRepository.updateWithEvent(
      ticketId,
      workspaceId,
      {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        category: dto.category,
        updatedBy: { connect: { id: actor.id } },
      },
      this.eventInput(actor.id, TicketEventType.UPDATED, null, 'fields'),
    );

    return this.wrap({ ticket: this.toTicketDto(updated) });
  }

  async assign(workspaceId: string, ticketId: string, actor: TicketActor, dto: AssignTicketDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertStaff(roleType);
    const ticket = await this.findTicket(workspaceId, ticketId);
    const assigneeRole = await this.getMemberRole(workspaceId, dto.assignee_id);
    if (!assigneeRole || !this.staffRoles.includes(assigneeRole)) {
      throw new NotFoundException('Assignee is not an eligible workspace member');
    }

    const updated = await this.ticketRepository.updateWithEvent(
      ticket.id,
      workspaceId,
      {
        assignee: { connect: { id: dto.assignee_id } },
        updatedBy: { connect: { id: actor.id } },
      },
      this.eventInput(actor.id, TicketEventType.ASSIGNED, ticket.assigneeId, dto.assignee_id),
    );

    return this.wrap({ ticket: this.toTicketDto(updated) });
  }

  async addMessage(
    workspaceId: string,
    ticketId: string,
    actor: TicketActor,
    dto: AddTicketMessageDto,
  ) {
    const roleType = await this.requireMember(workspaceId, actor);
    const ticket = await this.findTicket(workspaceId, ticketId);
    this.assertCanView(ticket, actor, roleType);
    if (dto.visibility === TicketMessageVisibility.INTERNAL && roleType === RoleType.REQUESTER) {
      throw new ForbiddenException('Requester cannot create internal notes');
    }

    const message = await this.ticketRepository.addMessageWithEvent({
      workspaceId,
      ticketId: ticket.id,
      message: {
        visibility: dto.visibility,
        body: dto.body,
        author: { connect: { id: actor.id } },
      },
      event: this.eventInput(actor.id, TicketEventType.MESSAGE_ADDED, null, dto.visibility),
    });

    return this.wrap({ message: this.toMessageDto(message) });
  }

  async changeStatus(
    workspaceId: string,
    ticketId: string,
    actor: TicketActor,
    dto: ChangeTicketStatusDto,
  ) {
    const roleType = await this.requireMember(workspaceId, actor);
    const ticket = await this.findTicket(workspaceId, ticketId);
    this.assertCanChangeStatus(ticket, actor, roleType, dto.status);
    this.assertTransition(ticket.status, dto.status);

    const updated = await this.ticketRepository.updateWithEvent(
      ticket.id,
      workspaceId,
      {
        status: dto.status,
        resolvedAt: dto.status === TicketStatus.RESOLVED ? new Date() : ticket.resolvedAt,
        closedAt: dto.status === TicketStatus.CLOSED ? new Date() : ticket.closedAt,
        reopenCount: dto.status === TicketStatus.REOPENED ? { increment: 1 } : ticket.reopenCount,
        updatedBy: { connect: { id: actor.id } },
      },
      this.eventInput(
        actor.id,
        this.eventTypeForStatus(dto.status),
        ticket.status,
        dto.status,
        dto.reason ? { reason: dto.reason } : undefined,
      ),
    );

    return this.wrap({ ticket: this.toTicketDto(updated) });
  }

  async close(workspaceId: string, ticketId: string, actor: TicketActor) {
    return this.changeStatus(workspaceId, ticketId, actor, { status: TicketStatus.CLOSED });
  }

  async reopen(workspaceId: string, ticketId: string, actor: TicketActor) {
    return this.changeStatus(workspaceId, ticketId, actor, { status: TicketStatus.REOPENED });
  }

  private async findTicket(workspaceId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(ticketId, workspaceId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  private async requireMember(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const roleType = await this.getMemberRole(workspaceId, actor.id);
    if (!roleType) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
    actor.roleType = roleType;
    return roleType;
  }

  private async getMemberRole(workspaceId: string, userId: string): Promise<RoleType | null> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(userId, workspaceId);
    if (!member) {
      return null;
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    return (memberWithRole.role?.roleType as RoleType | undefined) ?? null;
  }

  private assertStaff(roleType: RoleType): void {
    if (!this.staffRoles.includes(roleType)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
  }

  private assertCanView(ticket: Ticket, actor: TicketActor, roleType: RoleType): void {
    if (roleType !== RoleType.REQUESTER) {
      return;
    }
    if (ticket.requesterId !== actor.id) {
      throw new ForbiddenException('Cannot access another requester ticket');
    }
  }

  private assertCanUpdate(ticket: Ticket, actor: TicketActor, roleType: RoleType): void {
    if (roleType !== RoleType.REQUESTER) {
      return;
    }
    if (ticket.requesterId !== actor.id || ticket.assigneeId) {
      throw new ForbiddenException('Requester cannot update this ticket');
    }
  }

  private assertCanChangeStatus(
    ticket: Ticket,
    actor: TicketActor,
    roleType: RoleType,
    nextStatus: TicketStatus,
  ): void {
    if (roleType !== RoleType.REQUESTER) {
      return;
    }
    const ownTicket = ticket.requesterId === actor.id;
    const allowedRequesterStatus =
      nextStatus === TicketStatus.CLOSED || nextStatus === TicketStatus.REOPENED;
    if (!ownTicket || !allowedRequesterStatus) {
      throw new ForbiddenException('Requester cannot change this ticket status');
    }
  }

  private assertTransition(from: TicketStatus, to: TicketStatus): void {
    if (from === to) {
      return;
    }
    if (!this.allowedTransitions[from].includes(to)) {
      throw new ConflictException('Invalid ticket status transition');
    }
  }

  private canSeeMessage(message: TicketMessage, _actor: TicketActor, roleType: RoleType): boolean {
    return roleType !== RoleType.REQUESTER || message.visibility === TicketMessageVisibility.PUBLIC;
  }

  private async nextTicketNumber(workspaceId: string): Promise<string> {
    const count = await this.ticketRepository.count(workspaceId);
    return `TCK-${String(count + 1).padStart(6, '0')}`;
  }

  private eventInput(
    actorId: string,
    type: TicketEventType,
    fromValue?: string | null,
    toValue?: string | null,
    metadata?: Prisma.InputJsonValue,
  ): Omit<Prisma.TicketEventCreateInput, 'ticket' | 'workspace'> {
    return {
      type,
      fromValue,
      toValue,
      metadata: metadata ?? Prisma.JsonNull,
      actor: { connect: { id: actorId } },
    };
  }

  private eventTypeForStatus(status: TicketStatus): TicketEventType {
    if (status === TicketStatus.CLOSED) {
      return TicketEventType.CLOSED;
    }
    if (status === TicketStatus.REOPENED) {
      return TicketEventType.REOPENED;
    }
    return TicketEventType.STATUS_CHANGED;
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
    };
  }

  private toMessageDto(message: TicketMessage) {
    return {
      id: message.id,
      ticket_id: message.ticketId,
      author_id: message.authorId,
      visibility: message.visibility,
      body: message.body,
      created_at: message.createdAt,
    };
  }

  private wrap(data: Record<string, unknown>) {
    return { data, request_id: randomUUID() };
  }
}
