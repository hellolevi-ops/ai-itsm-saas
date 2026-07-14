import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Workspace, WorkspaceStatus } from '@prisma/client';
import {
  WorkspaceRepository,
  TenantWorkspaceRepository,
} from '../repositories/workspace.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceDto } from '../dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly tenantWorkspaceRepository: TenantWorkspaceRepository,
  ) {}

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const existing = await this.workspaceRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('Workspace slug already exists');
    }

    return this.workspaceRepository.create({
      name: dto.name,
      slug: dto.slug,
      timezone: dto.timezone ?? 'Asia/Shanghai',
      language: dto.language ?? 'zh-CN',
    });
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepository.findBySlug(slug);
  }

  async findAll(params: { skip?: number; take?: number; status?: WorkspaceStatus }): Promise<{
    items: Workspace[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.workspaceRepository.findAll(params),
      this.workspaceRepository.countByStatus(params.status),
    ]);
    return { items, total };
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    await this.findById(id);
    return this.workspaceRepository.update(id, dto);
  }

  async delete(id: string): Promise<Workspace> {
    await this.findById(id);
    return this.workspaceRepository.delete(id);
  }

  async getCurrentWorkspace(): Promise<Workspace> {
    const workspace = await this.tenantWorkspaceRepository.findCurrent();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async updateCurrentWorkspace(dto: UpdateWorkspaceDto): Promise<Workspace> {
    return this.tenantWorkspaceRepository.updateCurrent(dto);
  }

  toDto(workspace: Workspace): WorkspaceDto {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
      language: workspace.language,
      status: workspace.status,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
