import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { AiModule } from './modules/ai/ai.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ChannelModule } from './modules/channel/channel.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { BillingModule } from './modules/billing/billing.module';
import { OpsModule } from './modules/ops/ops.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

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
    BillingModule,
    OpsModule,
    ComplianceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, SecurityHeadersMiddleware).forRoutes('*');
  }
}
