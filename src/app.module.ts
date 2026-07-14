import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketModule } from './modules/ticket/ticket.module';

@Module({
  imports: [PrismaModule, WorkspaceModule, AuthModule, TicketModule],
})
export class AppModule {}
