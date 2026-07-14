import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { AddMemberDto, UpdateMemberRoleDto } from '../dto/member.dto';

@Controller('api/workspaces/:workspaceId/members')
export class WorkspaceMemberController {
  constructor(private readonly memberService: WorkspaceMemberService) {}

  @Get()
  async findAll() {
    return this.memberService.findAll({});
  }

  @Post()
  async add(@Body() dto: AddMemberDto) {
    return this.memberService.addMember(dto);
  }

  @Put(':userId')
  async update(@Param('userId') userId: string, @Body() dto: UpdateMemberRoleDto) {
    return this.memberService.updateRole(userId, dto);
  }

  @Delete(':userId')
  async remove(@Param('userId') userId: string) {
    return this.memberService.removeMember(userId);
  }
}
