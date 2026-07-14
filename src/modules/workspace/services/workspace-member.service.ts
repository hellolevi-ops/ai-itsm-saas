import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { WorkspaceMember } from '@prisma/client';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { AddMemberDto, UpdateMemberRoleDto, WorkspaceMemberDto } from '../dto/member.dto';

@Injectable()
export class WorkspaceMemberService {
  constructor(private readonly memberRepository: WorkspaceMemberRepository) {}

  async addMember(dto: AddMemberDto): Promise<WorkspaceMember> {
    const exists = await this.memberRepository.exists(dto.userId);
    if (exists) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.memberRepository.create({
      user: { connect: { id: dto.userId } },
      role: { connect: { id: dto.roleId } },
    });
  }

  async findById(id: string): Promise<WorkspaceMember> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }
    return member;
  }

  async findByUserId(userId: string): Promise<WorkspaceMember | null> {
    return this.memberRepository.findByUserId(userId);
  }

  async findAll(params: { skip?: number; take?: number; roleId?: string }): Promise<{
    items: WorkspaceMember[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.memberRepository.findAll(params),
      this.memberRepository.count(),
    ]);
    return { items, total };
  }

  async updateRole(id: string, dto: UpdateMemberRoleDto): Promise<WorkspaceMember> {
    await this.findById(id);
    return this.memberRepository.update(id, {
      role: { connect: { id: dto.roleId } },
    });
  }

  async removeMember(id: string): Promise<WorkspaceMember> {
    await this.findById(id);
    return this.memberRepository.delete(id);
  }

  async isMember(userId: string): Promise<boolean> {
    return this.memberRepository.exists(userId);
  }

  toDto(member: WorkspaceMember & { role?: { roleType: any } }): WorkspaceMemberDto {
    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      roleId: member.roleId,
      roleType: member.role?.roleType,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
}
