import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Ticket,
  TicketEvent,
  TicketEventType,
  TicketMessage,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export type TicketWithRelations = Ticket & {
  messages?: TicketMessage[];
  events?: TicketEvent[];
};

@Injectable()
export class TicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(workspaceId: string): Promise<number> {
    return this.prisma.ticket.count({ where: { workspaceId } });
  }

  async createWithEvent(
    data: Prisma.TicketCreateInput,
    event: Omit<Prisma.TicketEventCreateInput, 'ticket' | 'workspace'>,
  ): Promise<Ticket> {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({ data });
      await tx.ticketEvent.create({
        data: {
          ...event,
          ticket: { connect: { id: ticket.id } },
          workspace: { connect: { id: ticket.workspaceId } },
        },
      });
      return ticket;
    });
  }

  async findById(ticketId: string, workspaceId: string): Promise<Ticket | null> {
    return this.prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
    });
  }

  async findByIdWithTimeline(
    ticketId: string,
    workspaceId: string,
  ): Promise<TicketWithRelations | null> {
    return this.prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findAll(params: {
    workspaceId: string;
    status?: TicketStatus;
    assigneeId?: string;
    requesterId?: string;
    q?: string;
    skip?: number;
    take?: number;
  }): Promise<Ticket[]> {
    const where: Prisma.TicketWhereInput = {
      workspaceId: params.workspaceId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
      ...(params.requesterId ? { requesterId: params.requesterId } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' } },
              { description: { contains: params.q, mode: 'insensitive' } },
              { number: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.ticket.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWithEvent(
    ticketId: string,
    workspaceId: string,
    data: Prisma.TicketUpdateInput,
    event: Omit<Prisma.TicketEventCreateInput, 'ticket' | 'workspace'>,
  ): Promise<Ticket> {
    return this.prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { id: ticketId, workspaceId },
        data,
      });
      const ticket = await tx.ticket.findFirstOrThrow({ where: { id: ticketId, workspaceId } });
      await tx.ticketEvent.create({
        data: {
          ...event,
          ticket: { connect: { id: ticket.id } },
          workspace: { connect: { id: workspaceId } },
        },
      });
      return ticket;
    });
  }

  async addMessageWithEvent(params: {
    workspaceId: string;
    ticketId: string;
    message: Omit<Prisma.TicketMessageCreateInput, 'ticket' | 'workspace'>;
    event: Omit<Prisma.TicketEventCreateInput, 'ticket' | 'workspace'>;
  }): Promise<TicketMessage> {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirstOrThrow({
        where: { id: params.ticketId, workspaceId: params.workspaceId },
      });
      const message = await tx.ticketMessage.create({
        data: {
          ...params.message,
          ticket: { connect: { id: ticket.id } },
          workspace: { connect: { id: params.workspaceId } },
        },
      });
      await tx.ticketEvent.create({
        data: {
          ...params.event,
          ticket: { connect: { id: ticket.id } },
          workspace: { connect: { id: params.workspaceId } },
        },
      });
      return message;
    });
  }

  async addEvent(params: {
    workspaceId: string;
    ticketId: string;
    actorId: string;
    type: TicketEventType;
    fromValue?: string | null;
    toValue?: string | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<TicketEvent> {
    return this.prisma.ticketEvent.create({
      data: {
        type: params.type,
        fromValue: params.fromValue,
        toValue: params.toValue,
        metadata: params.metadata ?? Prisma.JsonNull,
        actor: { connect: { id: params.actorId } },
        ticket: { connect: { id: params.ticketId } },
        workspace: { connect: { id: params.workspaceId } },
      },
    });
  }
}
