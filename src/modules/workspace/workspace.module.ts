import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { RoleService } from './services/role.service';
import { TeamService } from './services/team.service';
import { InvitationService } from './services/invitation.service';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceMemberController } from './controllers/workspace-member.controller';
import {
  WorkspaceRepository,
  TenantWorkspaceRepository,
} from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { RoleRepository } from './repositories/role.repository';
import { TeamRepository } from './repositories/team.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantContextHolder } from './tenant/tenant-context';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController, WorkspaceMemberController],
  providers: [
    WorkspaceService,
    WorkspaceMemberService,
    RoleService,
    TeamService,
    InvitationService,
    WorkspaceRepository,
    TenantWorkspaceRepository,
    WorkspaceMemberRepository,
    RoleRepository,
    TeamRepository,
    InvitationRepository,
    TenantContextHolder,
  ],
  exports: [
    WorkspaceService,
    WorkspaceMemberService,
    RoleService,
    TeamService,
    InvitationService,
    WorkspaceRepository,
    TenantWorkspaceRepository,
    WorkspaceMemberRepository,
    RoleRepository,
    TeamRepository,
    InvitationRepository,
    TenantContextHolder,
  ],
})
export class WorkspaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
