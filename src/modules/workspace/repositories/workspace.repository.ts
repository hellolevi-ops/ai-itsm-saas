import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Workspace, WorkspaceStatus, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get tenantId(): string {
    return TenantContextHolder.getTenantId();
  }

  async create(data: Prisma.WorkspaceCreateInput): Promise<Workspace> {
    return this.prisma.workspace.create({ data });
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({
      where: { slug, tenantId: this.tenantId },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: WorkspaceStatus;
  }): Promise<Workspace[]> {
    const { skip, take, status } = params;
    return this.prisma.workspace.findMany({
      skip,
      take,
      where: {
        tenantId: this.tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.WorkspaceUpdateInput): Promise<Workspace> {
    return this.prisma.workspace
      .updateMany({
        where: { id, tenantId: this.tenantId },
        data,
      })
      .then(() => this.prisma.workspace.findUniqueOrThrow({ where: { id } }));
  }

  async delete(id: string): Promise<Workspace> {
    return this.prisma.workspace
      .updateMany({
        where: { id, tenantId: this.tenantId },
        data: { status: WorkspaceStatus.DELETED },
      })
      .then(() => this.prisma.workspace.findUniqueOrThrow({ where: { id } }));
  }

  async countByStatus(status?: WorkspaceStatus): Promise<number> {
    return this.prisma.workspace.count({
      where: {
        tenantId: this.tenantId,
        ...(status ? { status } : {}),
      },
    });
  }
}

@Injectable()
export class TenantWorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workspaceId(): string {
    return TenantContextHolder.getWorkspaceId();
  }

  async findCurrent(): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({
      where: { id: this.workspaceId },
    });
  }

  async updateCurrent(data: Prisma.WorkspaceUpdateInput): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: { id: this.workspaceId },
      data,
    });
  }
}
