import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Invitation, InvitationStatus } from '@prisma/client';
import { InvitationRepository } from '../repositories/invitation.repository';
import { CreateInvitationDto, InvitationDto } from '../dto/team-invitation.dto';

@Injectable()
export class InvitationService {
  constructor(private readonly invitationRepository: InvitationRepository) {}

  async create(dto: CreateInvitationDto, invitedById: string): Promise<Invitation> {
    const pending = await this.invitationRepository.findByEmail(
      dto.email,
      InvitationStatus.PENDING,
    );
    if (pending) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    return this.invitationRepository.create({
      email: dto.email,
      roleId: dto.roleId,
      invitedById,
      status: InvitationStatus.PENDING,
      expiresAt,
    });
  }

  async findById(id: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return invitation;
  }

  async findAll(params: { skip?: number; take?: number; status?: InvitationStatus }): Promise<{
    items: Invitation[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.invitationRepository.findAll(params),
      this.invitationRepository.count(params.status),
    ]);
    return { items, total };
  }

  async revoke(id: string): Promise<Invitation> {
    const invitation = await this.findById(id);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('Only pending invitations can be revoked');
    }

    return this.invitationRepository.update(id, {
      status: InvitationStatus.REVOKED,
    });
  }

  async accept(id: string): Promise<Invitation> {
    const invitation = await this.findById(id);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('Invitation is not pending');
    }

    if (new Date() > invitation.expiresAt) {
      return this.invitationRepository.update(id, {
        status: InvitationStatus.EXPIRED,
      });
    }

    return this.invitationRepository.update(id, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });
  }

  isExpired(invitation: Invitation): boolean {
    return new Date() > invitation.expiresAt;
  }

  toDto(invitation: Invitation): InvitationDto {
    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      status: invitation.status,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
