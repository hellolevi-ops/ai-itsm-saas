import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TicketPriority } from '@prisma/client';
import {
  AiRiskLevel,
  TicketAssistInput,
  TicketAssistProvider,
  TicketAssistResult,
} from '../interfaces/ticket-assist.interface';

const PROMPT_VERSION = 'ticket-triage-v1';

@Injectable()
export class MockTicketAssistProvider implements TicketAssistProvider {
  async generateTicketAssist(input: TicketAssistInput): Promise<TicketAssistResult> {
    const startedAt = Date.now();
    const combinedText = `${input.title}\n${input.description}`.toLowerCase();
    const category = this.detectCategory(combinedText, input.category);
    const priority = this.detectPriority(combinedText, input.currentPriority);
    const riskLevel = this.detectRisk(combinedText);
    const confidence = this.confidenceFor(category, priority, riskLevel);
    const reasons = this.reasonsFor(category, priority, riskLevel);
    const suggestion = {
      summary: this.summarize(input),
      category,
      priority,
      reply_draft: this.replyDraftFor(category),
      confidence,
      risk_level: riskLevel,
      reasons,
      requires_human_review: confidence < 0.92 || riskLevel !== 'LOW',
    };
    const inputHash = createHash('sha256')
      .update(JSON.stringify({ promptVersion: PROMPT_VERSION, input }))
      .digest('hex');

    return {
      provider: 'mock',
      model: 'rules-v1',
      promptVersion: PROMPT_VERSION,
      inputHash,
      latencyMs: Math.max(Date.now() - startedAt, 1),
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostMicros: 0,
      suggestion,
    };
  }

  private detectCategory(text: string, currentCategory: string | null): string {
    if (/\b(vpn|wifi|network|internet|dns|proxy|connect|connection)\b/.test(text)) {
      return 'network';
    }
    if (/\b(password|login|permission|access|account|sso|mfa)\b/.test(text)) {
      return 'access';
    }
    if (/\b(laptop|printer|monitor|keyboard|device|hardware)\b/.test(text)) {
      return 'device';
    }
    if (/\b(payroll|invoice|expense|finance)\b/.test(text)) {
      return 'finance';
    }
    return currentCategory || 'general';
  }

  private detectPriority(text: string, currentPriority: TicketPriority): TicketPriority {
    if (/\b(all users|company-wide|outage|production down|security incident)\b/.test(text)) {
      return TicketPriority.P1;
    }
    if (/\b(cannot|unable|blocked|unavailable|failed|down)\b/.test(text)) {
      return TicketPriority.P2;
    }
    if (/\b(how to|question|request information|when convenient)\b/.test(text)) {
      return TicketPriority.P4;
    }
    return currentPriority;
  }

  private detectRisk(text: string): AiRiskLevel {
    if (/\b(delete|remove users|payment|wire transfer|legal hold)\b/.test(text)) {
      return 'HIGH';
    }
    if (/\b(payroll|salary|personal data|security incident|data leak)\b/.test(text)) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private confidenceFor(
    category: string,
    priority: TicketPriority,
    riskLevel: AiRiskLevel,
  ): number {
    if (riskLevel === 'HIGH') return 0.58;
    if (riskLevel === 'MEDIUM') return 0.68;
    if (category !== 'general' && priority !== TicketPriority.P3) return 0.82;
    if (category !== 'general') return 0.76;
    return 0.62;
  }

  private reasonsFor(category: string, priority: TicketPriority, riskLevel: AiRiskLevel): string[] {
    const reasons = [`Matched ${category} request pattern`, `Suggested ${priority} priority`];
    if (riskLevel !== 'LOW') {
      reasons.push(`${riskLevel.toLowerCase()} risk terms require human review`);
    }
    return reasons;
  }

  private summarize(input: TicketAssistInput): string {
    const text = `${input.title}. ${input.description}`.replace(/\s+/g, ' ').trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  }

  private replyDraftFor(category: string): string {
    if (category === 'network') {
      return 'Thanks for the details. Please share the error message, device type, network location and whether other users are affected.';
    }
    if (category === 'access') {
      return 'Thanks for reporting this. Please confirm the affected application, account email, last successful login time and any error text.';
    }
    if (category === 'device') {
      return 'Thanks for the report. Please provide the device model, asset tag if available, and what changed before the issue started.';
    }
    return 'Thanks for the details. Please share any screenshots, affected users and the business impact so the team can triage quickly.';
  }
}
