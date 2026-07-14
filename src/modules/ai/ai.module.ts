import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { TicketModule } from '@/modules/ticket/ticket.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { AiGatewayService } from './ai-gateway.service';
import { AiTicketAssistController } from './ai-ticket-assist.controller';
import { AiTicketAssistService } from './ai-ticket-assist.service';
import { MockTicketAssistProvider } from './providers/mock-ticket-assist.provider';
import { AiRunRepository } from './repositories/ai-run.repository';

@Module({
  imports: [PrismaModule, TicketModule, WorkspaceModule],
  controllers: [AiTicketAssistController],
  providers: [AiGatewayService, AiTicketAssistService, MockTicketAssistProvider, AiRunRepository],
  exports: [AiGatewayService, AiTicketAssistService],
})
export class AiModule {}
