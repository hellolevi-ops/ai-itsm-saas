import { TicketPriority } from '@prisma/client';
import { MockTicketAssistProvider } from '../mock-ticket-assist.provider';

describe('MockTicketAssistProvider', () => {
  const provider = new MockTicketAssistProvider();

  it('generates structured ticket triage suggestions without external calls', async () => {
    const result = await provider.generateTicketAssist({
      ticketId: 'ticket-001',
      number: 'TCK-000001',
      title: 'VPN access is unavailable',
      description: 'Remote users cannot connect to the VPN from Windows laptops.',
      currentPriority: TicketPriority.P3,
      category: null,
    });

    expect(result.provider).toBe('mock');
    expect(result.model).toBe('rules-v1');
    expect(result.promptVersion).toBe('ticket-triage-v1');
    expect(result.estimatedCostMicros).toBe(0);
    expect(result.suggestion).toMatchObject({
      category: 'network',
      priority: TicketPriority.P2,
      risk_level: 'LOW',
      requires_human_review: true,
    });
    expect(result.inputHash).toHaveLength(64);
    expect(result.suggestion.reply_draft).not.toMatch(/resolved|closed|deleted/i);
  });

  it('marks risky requests for human review with lower confidence', async () => {
    const result = await provider.generateTicketAssist({
      ticketId: 'ticket-002',
      number: 'TCK-000002',
      title: 'Delete users after payroll issue',
      description: 'Need to delete users and review salary data.',
      currentPriority: TicketPriority.P3,
      category: null,
    });

    expect(result.suggestion.risk_level).toBe('HIGH');
    expect(result.suggestion.confidence).toBeLessThan(0.75);
    expect(result.suggestion.requires_human_review).toBe(true);
  });
});
