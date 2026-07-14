import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { BetaPublicController, BetaWorkspaceController } from './beta.controller';
import { BetaService } from './beta.service';

@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [BetaPublicController, BetaWorkspaceController],
  providers: [BetaService],
})
export class BetaModule {}
