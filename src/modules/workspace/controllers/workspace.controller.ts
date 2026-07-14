import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dto/workspace.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../guards/workspace-role.guard';
import { RequiresRoles } from '../decorators/requires-roles.decorator';
import { RoleType } from '@prisma/client';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@Controller('api/v1/workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  async create(@Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(dto);
  }

  @Get()
  async findAll() {
    return this.workspaceService.findAll({});
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.workspaceService.findById(id);
  }

  @Put(':id')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaceService.update(id, dto);
  }

  @Delete(':id')
  @RequiresRoles(RoleType.OWNER)
  async delete(@Param('id') id: string) {
    return this.workspaceService.delete(id);
  }
}
