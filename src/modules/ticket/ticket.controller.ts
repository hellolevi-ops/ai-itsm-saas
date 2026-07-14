import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import {
  AddTicketMessageDto,
  AssignTicketDto,
  ChangeTicketStatusDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { TicketService } from './ticket.service';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT, RoleType.REQUESTER)
@Controller('api/v1/workspaces/:workspaceId/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketService.create(workspaceId, user, dto);
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Query() query: ListTicketsQueryDto,
  ) {
    return this.ticketService.list(workspaceId, user, query);
  }

  @Get(':ticketId')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.ticketService.get(workspaceId, ticketId, user);
  }

  @Patch(':ticketId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.update(workspaceId, ticketId, user, dto);
  }

  @Post(':ticketId/assign')
  assign(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketService.assign(workspaceId, ticketId, user, dto);
  }

  @Post(':ticketId/messages')
  addMessage(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.ticketService.addMessage(workspaceId, ticketId, user, dto);
  }

  @Post(':ticketId/status')
  changeStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: ChangeTicketStatusDto,
  ) {
    return this.ticketService.changeStatus(workspaceId, ticketId, user, dto);
  }

  @Post(':ticketId/close')
  close(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.ticketService.close(workspaceId, ticketId, user);
  }

  @Post(':ticketId/reopen')
  reopen(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.ticketService.reopen(workspaceId, ticketId, user);
  }
}
