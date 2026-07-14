import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { TicketController } from './ticket.controller';
import { TicketRepository } from './repositories/ticket.repository';
import { TicketService } from './ticket.service';

@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [TicketController],
  providers: [TicketService, TicketRepository],
  exports: [TicketService, TicketRepository],
})
export class TicketModule {}
