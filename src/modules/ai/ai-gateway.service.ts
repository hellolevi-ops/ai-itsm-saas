import { Injectable } from '@nestjs/common';
import { TicketAssistInput, TicketAssistResult } from './interfaces/ticket-assist.interface';
import { MockTicketAssistProvider } from './providers/mock-ticket-assist.provider';

@Injectable()
export class AiGatewayService {
  constructor(private readonly ticketAssistProvider: MockTicketAssistProvider) {}

  generateTicketAssist(input: TicketAssistInput): Promise<TicketAssistResult> {
    return this.ticketAssistProvider.generateTicketAssist(input);
  }
}
