import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [PrismaModule, WorkspaceModule, AuthModule, TicketModule, AiModule],
})
export class AppModule {}
