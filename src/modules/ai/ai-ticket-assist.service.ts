import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiActionType, AiRun, RoleType, Ticket } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { TicketRepository } from '@/modules/ticket/repositories/ticket.repository';
import { TicketActor } from '@/modules/ticket/ticket.service';
import { AiGatewayService } from './ai-gateway.service';
import { AiRunRepository } from './repositories/ai-run.repository';

@Injectable()
export class AiTicketAssistService {
  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly aiRunRepository: AiRunRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async generateTicketSuggestions(workspaceId: string, ticketId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor.id);
    const ticket = await this.ticketRepository.findById(ticketId, workspaceId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    this.assertCanGenerate(ticket, actor, roleType);

    const result = await this.aiGateway.generateTicketAssist({
      ticketId: ticket.id,
      number: ticket.number,
      title: ticket.title,
      description: ticket.description,
      currentPriority: ticket.priority,
      category: ticket.category,
    });
    const run = await this.aiRunRepository.createTicketTriageRun({
      workspaceId,
      ticketId: ticket.id,
      actorId: actor.id,
      result,
    });

    return {
      data: {
        ai_run: this.toAiRunDto(run),
        suggestion: result.suggestion,
      },
      request_id: randomUUID(),
    };
  }

  private async requireMember(workspaceId: string, userId: string): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(userId, workspaceId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const roleType = memberWithRole.role?.roleType as RoleType | undefined;
    if (!roleType) {
      throw new ForbiddenException('Workspace role is missing');
    }
    return roleType;
  }

  private assertCanGenerate(ticket: Ticket, actor: TicketActor, roleType: RoleType): void {
    if (roleType !== RoleType.REQUESTER) {
      return;
    }
    if (ticket.requesterId !== actor.id) {
      throw new ForbiddenException('Cannot generate suggestions for another requester ticket');
    }
  }

  private toAiRunDto(run: AiRun) {
    return {
      id: run.id,
      action: AiActionType.TICKET_TRIAGE,
      provider: run.provider,
      model: run.model,
      prompt_version: run.promptVersion,
      status: run.status,
      confidence: run.confidence,
      latency_ms: run.latencyMs,
      risk_level: run.riskLevel,
      created_at: run.createdAt,
    };
  }
}
