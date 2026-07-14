import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [PrismaModule, WorkspaceModule],
})
export class AppModule {}
