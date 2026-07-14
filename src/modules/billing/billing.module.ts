import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
