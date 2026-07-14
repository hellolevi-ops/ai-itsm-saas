import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { RoleService } from './services/role.service';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceMemberController } from './controllers/workspace-member.controller';
import {
  WorkspaceRepository,
  TenantWorkspaceRepository,
} from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { RoleRepository } from './repositories/role.repository';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantContextHolder } from './tenant/tenant-context';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController, WorkspaceMemberController],
  providers: [
    WorkspaceService,
    WorkspaceMemberService,
    RoleService,
    WorkspaceRepository,
    TenantWorkspaceRepository,
    WorkspaceMemberRepository,
    RoleRepository,
    TenantContextHolder,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: WorkspaceRoleGuard,
    },
  ],
  exports: [
    WorkspaceService,
    WorkspaceMemberService,
    RoleService,
    WorkspaceRepository,
    TenantWorkspaceRepository,
    WorkspaceMemberRepository,
    RoleRepository,
    TenantContextHolder,
  ],
})
export class WorkspaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
