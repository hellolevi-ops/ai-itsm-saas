import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { ListKnowledgeQueryDto, PublishKnowledgeDto } from './dto/knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT, RoleType.REQUESTER)
@Controller('api/v1/workspaces/:workspaceId')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('tickets/:ticketId/knowledge-drafts')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT)
  createDraftFromTicket(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.knowledgeService.createDraftFromTicket(workspaceId, ticketId, user);
  }

  @Get('knowledge')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Query() query: ListKnowledgeQueryDto,
  ) {
    return this.knowledgeService.list(workspaceId, user, query);
  }

  @Get('knowledge/:articleId')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('articleId') articleId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.knowledgeService.get(workspaceId, articleId, user);
  }

  @Post('knowledge/:articleId/publish')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT)
  publish(
    @Param('workspaceId') workspaceId: string,
    @Param('articleId') articleId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: PublishKnowledgeDto,
  ) {
    return this.knowledgeService.publish(workspaceId, articleId, user, dto);
  }
}
