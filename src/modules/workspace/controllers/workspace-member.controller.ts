import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { AddMemberDto, UpdateMemberRoleDto } from '../dto/member.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../guards/workspace-role.guard';
import { RequiresRoles } from '../decorators/requires-roles.decorator';
import { RoleType } from '@prisma/client';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@Controller('api/workspaces/:workspaceId/members')
export class WorkspaceMemberController {
  constructor(private readonly memberService: WorkspaceMemberService) {}

  @Get()
  async findAll() {
    return this.memberService.findAll({});
  }

  @Post()
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  async add(@Body() dto: AddMemberDto) {
    return this.memberService.addMember(dto);
  }

  @Put(':userId')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  async update(@Param('userId') userId: string, @Body() dto: UpdateMemberRoleDto) {
    return this.memberService.updateRole(userId, dto);
  }

  @Delete(':userId')
  @RequiresRoles(RoleType.OWNER)
  async remove(@Param('userId') userId: string) {
    return this.memberService.removeMember(userId);
  }
}
