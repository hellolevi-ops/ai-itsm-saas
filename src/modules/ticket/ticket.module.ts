import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { ServiceCatalogModule } from '@/modules/service-catalog/service-catalog.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { TicketController } from './ticket.controller';
import { TicketRepository } from './repositories/ticket.repository';
import { TicketService } from './ticket.service';

@Module({
  imports: [PrismaModule, WorkspaceModule, ServiceCatalogModule, BillingModule],
  controllers: [TicketController],
  providers: [TicketService, TicketRepository],
  exports: [TicketService, TicketRepository],
})
export class TicketModule {}
