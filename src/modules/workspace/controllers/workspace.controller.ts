import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dto/workspace.dto';

@Controller('api/workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
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
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaceService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.workspaceService.delete(id);
  }
}
