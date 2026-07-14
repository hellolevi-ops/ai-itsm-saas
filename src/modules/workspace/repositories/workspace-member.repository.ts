import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WorkspaceMember, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workspaceId(): string {
    return TenantContextHolder.getWorkspaceId();
  }

  async create(
    data: Omit<Prisma.WorkspaceMemberCreateInput, 'workspace'>,
  ): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.create({
      data: {
        ...data,
        workspace: { connect: { id: this.workspaceId } },
      } as Prisma.WorkspaceMemberCreateInput,
    });
  }

  async findById(id: string): Promise<(WorkspaceMember & { role?: { roleType: string } }) | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { id, workspaceId: this.workspaceId },
      include: { role: { select: { roleType: true } } },
    });
  }

  async findByIdWithRole(
    id: string,
  ): Promise<(WorkspaceMember & { role?: { roleType: string } }) | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { id, workspaceId: this.workspaceId },
      include: { role: { select: { roleType: true } } },
    });
  }

  async findByUserId(userId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: this.workspaceId },
    });
  }

  async findByUserIdAndWorkspaceId(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    roleId?: string;
  }): Promise<WorkspaceMember[]> {
    const { skip, take, roleId } = params;
    return this.prisma.workspaceMember.findMany({
      skip,
      take,
      where: {
        workspaceId: this.workspaceId,
        ...(roleId ? { roleId } : {}),
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.WorkspaceMemberUpdateInput): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId: this.workspaceId },
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({
      where: { userId, workspaceId: this.workspaceId },
    });
    return count > 0;
  }
}
