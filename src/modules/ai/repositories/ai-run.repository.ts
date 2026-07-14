import { Injectable } from '@nestjs/common';
import { AiActionType, AiRun, AiRunStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketAssistResult } from '../interfaces/ticket-assist.interface';

@Injectable()
export class AiRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTicketTriageRun(params: {
    workspaceId: string;
    ticketId: string;
    actorId: string;
    result: TicketAssistResult;
  }): Promise<AiRun> {
    return this.prisma.aiRun.create({
      data: {
        workspace: { connect: { id: params.workspaceId } },
        ticket: { connect: { id: params.ticketId } },
        actor: { connect: { id: params.actorId } },
        action: AiActionType.TICKET_TRIAGE,
        provider: params.result.provider,
        model: params.result.model,
        promptVersion: params.result.promptVersion,
        status: AiRunStatus.SUCCEEDED,
        inputHash: params.result.inputHash,
        output: params.result.suggestion as unknown as Prisma.InputJsonValue,
        confidence: params.result.suggestion.confidence,
        riskLevel: params.result.suggestion.risk_level,
        latencyMs: params.result.latencyMs,
        inputTokens: params.result.inputTokens,
        outputTokens: params.result.outputTokens,
        estimatedCostMicros: params.result.estimatedCostMicros,
      },
    });
  }
}
