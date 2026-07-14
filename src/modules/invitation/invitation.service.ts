import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketActor } from '@/modules/ticket/ticket.service';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { Prisma, RoleType, WorkspaceInvitation, WorkspaceInvitationStatus } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitation.dto';

@Injectable()
export class InvitationService {
  private readonly staffRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN];
  private readonly inviteableRoles: RoleType[] = [RoleType.AGENT, RoleType.REQUESTER];

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: WorkspaceMemberService,
    private readonly jwtService: JwtService,
  ) {}

  async list(workspaceId: string, actor: TicketActor) {
    await this.requireStaff(workspaceId, actor);
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: { invitations: invitations.map((invitation) => this.toDto(invitation)) } };
  }

  async create(workspaceId: string, actor: TicketActor, dto: CreateInvitationDto) {
    await this.requireStaff(workspaceId, actor);
    const roleType = dto.role_type ?? RoleType.REQUESTER;
    if (!this.inviteableRoles.includes(roleType)) {
      throw new BadRequestException('Invitations can only create agent or requester members');
    }
    const token = this.generateToken();
    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        email: dto.email?.toLowerCase(),
        roleType,
        tokenHash: this.hashToken(token),
        status: WorkspaceInvitationStatus.PENDING,
        invitedBy: { connect: { id: actor.id } },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { data: { invitation: this.toDto(invitation), token } };
  }

  async accept(dto: AcceptInvitationDto) {
    const tokenHash = this.hashToken(dto.token);
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new ConflictException('Invitation is not pending');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: WorkspaceInvitationStatus.EXPIRED },
      });
      throw new ConflictException('Invitation has expired');
    }
    const normalizedEmail = dto.email.toLowerCase();
    if (invitation.email && invitation.email.toLowerCase() !== normalizedEmail) {
      throw new ForbiddenException('Invitation email does not match');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const result = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { tenantId: invitation.workspace.tenantId, email: normalizedEmail },
      });
      if (existingUser) {
        throw new ConflictException('User already exists in this tenant');
      }
      const role = await this.ensureRole(tx, invitation.workspaceId, invitation.roleType);
      const user = await tx.user.create({
        data: {
          tenant: { connect: { id: invitation.workspace.tenantId } },
          email: normalizedEmail,
          passwordHash,
          name: dto.name,
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspace: { connect: { id: invitation.workspaceId } },
          user: { connect: { id: user.id } },
          role: { connect: { id: role.id } },
        },
      });
      const acceptedInvitation = await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: WorkspaceInvitationStatus.ACCEPTED,
          acceptedBy: { connect: { id: user.id } },
          acceptedAt: new Date(),
        },
      });
      return { user, invitation: acceptedInvitation };
    });

    return {
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          created_at: result.user.createdAt.toISOString(),
        },
        token: this.generateTokens(result.user.id, result.user.email, result.user.tenantId),
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          slug: invitation.workspace.slug,
          timezone: invitation.workspace.timezone,
          language: invitation.workspace.language,
          role: invitation.roleType.toLowerCase(),
          created_at: invitation.workspace.createdAt.toISOString(),
        },
        invitation: this.toDto(result.invitation),
      },
    };
  }

  private async requireStaff(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(actor.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('Workspace access denied');
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const roleType = memberWithRole.role?.roleType as RoleType | undefined;
    if (!roleType || !this.staffRoles.includes(roleType)) {
      throw new ForbiddenException('Only workspace owners or admins can invite members');
    }
    return roleType;
  }

  private async ensureRole(tx: Prisma.TransactionClient, workspaceId: string, roleType: RoleType) {
    let role = await tx.role.findFirst({
      where: { workspaceId, roleType, isSystem: true },
    });
    if (!role) {
      role = await tx.role.create({
        data: {
          workspace: { connect: { id: workspaceId } },
          name: this.roleName(roleType),
          description: `${this.roleName(roleType)} invited member`,
          roleType,
          isSystem: true,
        },
      });
    }
    return role;
  }

  private roleName(roleType: RoleType): string {
    const names: Record<RoleType, string> = {
      [RoleType.OWNER]: 'Owner',
      [RoleType.ADMIN]: 'Admin',
      [RoleType.AGENT]: 'Agent',
      [RoleType.REQUESTER]: 'Requester',
    };
    return names[roleType];
  }

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(userId: string, email: string, tenantId: string) {
    const payload = { sub: userId, email, tenantId };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expires_in: 3600,
    };
  }

  private toDto(invitation: WorkspaceInvitation) {
    return {
      id: invitation.id,
      workspace_id: invitation.workspaceId,
      email: invitation.email,
      role_type: invitation.roleType,
      status: invitation.status,
      invited_by_id: invitation.invitedById,
      accepted_by_id: invitation.acceptedById,
      expires_at: invitation.expiresAt,
      accepted_at: invitation.acceptedAt,
      created_at: invitation.createdAt,
      updated_at: invitation.updatedAt,
    };
  }
}
