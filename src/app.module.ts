import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, WorkspaceModule, AuthModule],
})
export class AppModule {}
