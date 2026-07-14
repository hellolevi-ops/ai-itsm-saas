import { TicketPriority } from '@prisma/client';

export type AiRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TicketAssistInput {
  ticketId: string;
  number: string;
  title: string;
  description: string;
  currentPriority: TicketPriority;
  category: string | null;
}

export interface TicketAssistSuggestion {
  summary: string;
  category: string;
  priority: TicketPriority;
  reply_draft: string;
  confidence: number;
  risk_level: AiRiskLevel;
  reasons: string[];
  requires_human_review: boolean;
}

export interface TicketAssistResult {
  provider: string;
  model: string;
  promptVersion: string;
  inputHash: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostMicros: number;
  suggestion: TicketAssistSuggestion;
}

export interface TicketAssistProvider {
  generateTicketAssist(input: TicketAssistInput): Promise<TicketAssistResult>;
}
