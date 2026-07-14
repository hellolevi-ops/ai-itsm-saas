import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { AiModule } from './modules/ai/ai.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ChannelModule } from './modules/channel/channel.module';
import { InvitationModule } from './modules/invitation/invitation.module';

@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    AuthModule,
    ServiceCatalogModule,
    TicketModule,
    AiModule,
    KnowledgeModule,
    ChannelModule,
    InvitationModule,
  ],
})
export class AppModule {}
