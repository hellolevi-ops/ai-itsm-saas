import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getRequiredEnv } from '@/config/env';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { InvitationController, PublicInvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';

@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    JwtModule.register({
      secret: getRequiredEnv('JWT_SECRET'),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [InvitationController, PublicInvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
