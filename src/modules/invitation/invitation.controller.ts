import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { AcceptInvitationDto, CreateInvitationDto } from './dto/invitation.dto';
import { InvitationService } from './invitation.service';

@Controller('api/v1/workspaces/:workspaceId/invitations')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.invitationService.list(workspaceId, {
      id: user.id,
      tenantId: user.tenantId,
      roleType: user.roleType,
    });
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationService.create(
      workspaceId,
      {
        id: user.id,
        tenantId: user.tenantId,
        roleType: user.roleType,
      },
      dto,
    );
  }
}

@Controller('api/v1/invitations')
export class PublicInvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationService.accept(dto);
  }
}
