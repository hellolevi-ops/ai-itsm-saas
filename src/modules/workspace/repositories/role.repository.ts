import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, RoleType, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workspaceId(): string {
    return TenantContextHolder.getWorkspaceId();
  }

  async create(data: Omit<Prisma.RoleCreateInput, 'workspace'>): Promise<Role> {
    return this.prisma.role.create({
      data: {
        ...data,
        workspace: { connect: { id: this.workspaceId } },
      } as Prisma.RoleCreateInput,
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { id, workspaceId: this.workspaceId },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { name, workspaceId: this.workspaceId },
    });
  }

  async findByRoleType(roleType: RoleType): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { roleType, workspaceId: this.workspaceId, isSystem: true },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, data: Prisma.RoleUpdateInput): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Role> {
    return this.prisma.role.delete({ where: { id } });
  }

  async exists(name: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { name, workspaceId: this.workspaceId },
    });
    return count > 0;
  }
}
