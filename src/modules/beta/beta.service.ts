import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { BetaFeedback, BetaFeedbackSeverity, RoleType, WorkspaceFeatureFlag } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import type { TicketActor } from '@/modules/ticket/ticket.service';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { betaPublicPackage, BETA_FEATURE_FLAGS } from './beta.package';
import { CreateBetaFeedbackDto } from './dto/beta.dto';

@Injectable()
export class BetaService {
  private readonly betaManagerRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN];

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  publicPackage() {
    return this.wrap(betaPublicPackage());
  }

  async workspaceReadiness(workspaceId: string, actor: TicketActor) {
    await this.requireMember(workspaceId, actor);
    const [flags, feedback] = await Promise.all([
      this.featureFlags(workspaceId),
      this.prisma.betaFeedback.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return this.wrap({
      ...betaPublicPackage(),
      workspace_id: workspaceId,
      feature_flags: flags,
      feedback: feedback.map((item) => this.toFeedbackDto(item)),
      feedback_summary: this.feedbackSummary(feedback),
    });
  }

  async createFeedback(workspaceId: string, actor: TicketActor, dto: CreateBetaFeedbackDto) {
    await this.requireMember(workspaceId, actor);
    const feedback = await this.prisma.betaFeedback.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        reporter: { connect: { id: actor.id } },
        type: dto.type,
        severity: dto.severity ?? BetaFeedbackSeverity.MEDIUM,
        title: dto.title.trim(),
        description: dto.description.trim(),
      },
    });

    return this.wrap({ feedback: this.toFeedbackDto(feedback) });
  }

  async updateFeatureFlag(workspaceId: string, key: string, enabled: boolean, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    if (!this.betaManagerRoles.includes(roleType)) {
      throw new ForbiddenException('Only workspace owners or admins can manage beta flags');
    }

    const definition = BETA_FEATURE_FLAGS.find((flag) => flag.key === key);
    if (!definition) {
      throw new BadRequestException('Unknown beta feature flag');
    }

    const flag = await this.prisma.workspaceFeatureFlag.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      update: {
        enabled,
        description: definition.description,
        changedByUser: { connect: { id: actor.id } },
        changedAt: new Date(),
      },
      create: {
        workspace: { connect: { id: workspaceId } },
        key,
        enabled,
        description: definition.description,
        changedByUser: { connect: { id: actor.id } },
      },
    });

    return this.wrap({ feature_flag: this.toFeatureFlagDto(flag) });
  }

  private async featureFlags(workspaceId: string) {
    const overrides = await this.prisma.workspaceFeatureFlag.findMany({
      where: { workspaceId },
    });
    const overrideByKey = new Map(overrides.map((flag) => [flag.key, flag]));

    return BETA_FEATURE_FLAGS.map((definition) => {
      const override = overrideByKey.get(definition.key);
      return {
        key: definition.key,
        description: definition.description,
        enabled: override?.enabled ?? definition.default_enabled,
        default_enabled: definition.default_enabled,
        changed_by_user_id: override?.changedByUserId ?? null,
        changed_at: override?.changedAt ?? null,
      };
    });
  }

  private async requireMember(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(actor.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('Workspace access denied');
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const roleType = memberWithRole.role?.roleType as RoleType | undefined;
    if (!roleType) {
      throw new ForbiddenException('Workspace role is required');
    }
    actor.roleType = roleType;
    return roleType;
  }

  private feedbackSummary(feedback: BetaFeedback[]) {
    return {
      total: feedback.length,
      open: feedback.filter((item) => item.status === 'OPEN').length,
      bugs: feedback.filter((item) => item.type === 'BUG').length,
      high_or_critical: feedback.filter(
        (item) => item.severity === 'HIGH' || item.severity === 'CRITICAL',
      ).length,
    };
  }

  private toFeedbackDto(feedback: BetaFeedback) {
    return {
      id: feedback.id,
      workspace_id: feedback.workspaceId,
      reporter_id: feedback.reporterId,
      type: feedback.type,
      severity: feedback.severity,
      title: feedback.title,
      description: feedback.description,
      status: feedback.status,
      created_at: feedback.createdAt,
      updated_at: feedback.updatedAt,
    };
  }

  private toFeatureFlagDto(flag: WorkspaceFeatureFlag) {
    return {
      key: flag.key,
      description: flag.description,
      enabled: flag.enabled,
      changed_by_user_id: flag.changedByUserId,
      changed_at: flag.changedAt,
    };
  }

  private wrap(data: Record<string, unknown>) {
    return { data, request_id: randomUUID() };
  }
}
