import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Team, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workspaceId(): string {
    return TenantContextHolder.getWorkspaceId();
  }

  async create(data: Omit<Prisma.TeamCreateInput, 'workspace'>): Promise<Team> {
    return this.prisma.team.create({
      data: {
        ...data,
        workspace: { connect: { id: this.workspaceId } },
      } as Prisma.TeamCreateInput,
    });
  }

  async findById(id: string): Promise<Team | null> {
    return this.prisma.team.findFirst({
      where: { id, workspaceId: this.workspaceId },
    });
  }

  async findByName(name: string): Promise<Team | null> {
    return this.prisma.team.findFirst({
      where: { name, workspaceId: this.workspaceId },
    });
  }

  async findAll(): Promise<Team[]> {
    return this.prisma.team.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, data: Prisma.TeamUpdateInput): Promise<Team> {
    return this.prisma.team.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Team> {
    return this.prisma.team.delete({ where: { id } });
  }

  async exists(name: string): Promise<boolean> {
    const count = await this.prisma.team.count({
      where: { name, workspaceId: this.workspaceId },
    });
    return count > 0;
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        workspaceId: this.workspaceId,
      },
    });
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId },
      },
    });
  }

  async getTeamMembers(teamId: string): Promise<string[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { teamId, workspaceId: this.workspaceId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }
}
