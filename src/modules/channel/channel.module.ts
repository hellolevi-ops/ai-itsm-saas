import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { TicketModule } from '@/modules/ticket/ticket.module';
import { ChannelController, WeComWebhookController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
  imports: [PrismaModule, WorkspaceModule, TicketModule],
  controllers: [ChannelController, WeComWebhookController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
