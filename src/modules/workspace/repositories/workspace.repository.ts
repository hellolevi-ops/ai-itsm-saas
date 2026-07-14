import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Workspace, WorkspaceStatus, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantId(): string | undefined {
    try {
      return TenantContextHolder.getTenantId();
    } catch {
      return undefined;
    }
  }

  async create(data: Prisma.WorkspaceCreateInput): Promise<Workspace> {
    return this.prisma.workspace.create({ data });
  }

  async findById(id: string, tenantId?: string): Promise<Workspace | null> {
    const ctxTenantId = tenantId ?? this.getTenantId();
    if (!ctxTenantId) {
      return this.prisma.workspace.findFirst({ where: { id } });
    }
    return this.prisma.workspace.findFirst({
      where: { id, tenantId: ctxTenantId },
    });
  }

  async findBySlug(slug: string, tenantId?: string): Promise<Workspace | null> {
    const ctxTenantId = tenantId ?? this.getTenantId();
    if (!ctxTenantId) {
      return this.prisma.workspace.findFirst({ where: { slug } });
    }
    return this.prisma.workspace.findFirst({
      where: { slug, tenantId: ctxTenantId },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: WorkspaceStatus;
    tenantId?: string;
  }): Promise<Workspace[]> {
    const { skip, take, status, tenantId } = params;
    const ctxTenantId = tenantId ?? this.getTenantId();
    const where: Prisma.WorkspaceWhereInput = {
      ...(ctxTenantId ? { tenantId: ctxTenantId } : {}),
      ...(status ? { status } : {}),
    };
    return this.prisma.workspace.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: Prisma.WorkspaceUpdateInput,
    tenantId?: string,
  ): Promise<Workspace> {
    const ctxTenantId = tenantId ?? this.getTenantId();
    const where: Prisma.WorkspaceWhereInput = { id };
    if (ctxTenantId) {
      where.tenantId = ctxTenantId;
    }
    await this.prisma.workspace.updateMany({ where, data });
    return this.prisma.workspace.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string, tenantId?: string): Promise<Workspace> {
    const ctxTenantId = tenantId ?? this.getTenantId();
    const where: Prisma.WorkspaceWhereInput = { id };
    if (ctxTenantId) {
      where.tenantId = ctxTenantId;
    }
    await this.prisma.workspace.updateMany({
      where,
      data: { status: WorkspaceStatus.DELETED },
    });
    return this.prisma.workspace.findUniqueOrThrow({ where: { id } });
  }

  async countByStatus(status?: WorkspaceStatus, tenantId?: string): Promise<number> {
    const ctxTenantId = tenantId ?? this.getTenantId();
    const where: Prisma.WorkspaceWhereInput = {};
    if (ctxTenantId) {
      where.tenantId = ctxTenantId;
    }
    if (status) {
      where.status = status;
    }
    return this.prisma.workspace.count({ where });
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
