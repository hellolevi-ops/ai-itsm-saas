import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Invitation, InvitationStatus, Prisma } from '@prisma/client';
import { TenantContextHolder } from '../tenant/tenant-context';

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workspaceId(): string {
    return TenantContextHolder.getWorkspaceId();
  }

  async create(
    data: Omit<Prisma.InvitationCreateInput, 'workspace' | 'invitedBy' | 'role'> & {
      invitedById: string;
      roleId: string;
    },
  ): Promise<Invitation> {
    return this.prisma.invitation.create({
      data: {
        email: data.email,
        status: data.status,
        expiresAt: data.expiresAt,
        workspace: { connect: { id: this.workspaceId } },
        invitedBy: { connect: { id: data.invitedById } },
        role: { connect: { id: data.roleId } },
      },
    });
  }

  async findById(id: string): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: { id, workspaceId: this.workspaceId },
    });
  }

  async findByEmail(email: string, status?: InvitationStatus): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: {
        email,
        workspaceId: this.workspaceId,
        ...(status ? { status } : {}),
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: InvitationStatus;
  }): Promise<Invitation[]> {
    const { skip, take, status } = params;
    return this.prisma.invitation.findMany({
      skip,
      take,
      where: {
        workspaceId: this.workspaceId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.InvitationUpdateInput): Promise<Invitation> {
    return this.prisma.invitation.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Invitation> {
    return this.prisma.invitation.delete({ where: { id } });
  }

  async count(status?: InvitationStatus): Promise<number> {
    return this.prisma.invitation.count({
      where: {
        workspaceId: this.workspaceId,
        ...(status ? { status } : {}),
      },
    });
  }
}
