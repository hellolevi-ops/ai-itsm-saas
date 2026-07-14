import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { TicketModule } from '@/modules/ticket/ticket.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './repositories/knowledge.repository';

@Module({
  imports: [PrismaModule, WorkspaceModule, TicketModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository],
})
export class KnowledgeModule {}
