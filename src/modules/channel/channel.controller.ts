import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { ChannelService } from './channel.service';
import { CreateWeComChannelDto, ReceiveWeComMessageDto } from './dto/channel.dto';

@Controller('api/v1/workspaces/:workspaceId/channels')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT, RoleType.REQUESTER)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.channelService.list(workspaceId, {
      id: user.id,
      tenantId: user.tenantId,
      roleType: user.roleType,
    });
  }

  @Post('wecom')
  createWeCom(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateWeComChannelDto,
  ) {
    return this.channelService.createWeComConnection(
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

@Controller('api/v1/channels/wecom/:connectionId/messages')
export class WeComWebhookController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  receive(
    @Param('connectionId') connectionId: string,
    @Headers('x-channel-token') token: string | undefined,
    @Body() dto: ReceiveWeComMessageDto,
  ) {
    return this.channelService.receiveWeComMessage(connectionId, token, dto);
  }
}
