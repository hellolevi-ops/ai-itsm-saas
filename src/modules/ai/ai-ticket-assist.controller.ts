import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { AiTicketAssistService } from './ai-ticket-assist.service';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT, RoleType.REQUESTER)
@Controller('api/v1/workspaces/:workspaceId/tickets/:ticketId/ai-suggestions')
export class AiTicketAssistController {
  constructor(private readonly aiTicketAssistService: AiTicketAssistService) {}

  @Post()
  generateSuggestions(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.aiTicketAssistService.generateTicketSuggestions(workspaceId, ticketId, user);
  }
}
