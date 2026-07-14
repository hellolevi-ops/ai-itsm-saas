import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  KnowledgeArticle,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeVisibility,
  RoleType,
  TicketMessageVisibility,
  TicketStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { TicketRepository } from '@/modules/ticket/repositories/ticket.repository';
import { TicketActor } from '@/modules/ticket/ticket.service';
import { ListKnowledgeQueryDto, PublishKnowledgeDto } from './dto/knowledge.dto';
import { KnowledgeRepository } from './repositories/knowledge.repository';

@Injectable()
export class KnowledgeService {
  private readonly staffRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT];

  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async createDraftFromTicket(workspaceId: string, ticketId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertStaff(roleType);

    const ticket = await this.ticketRepository.findByIdWithTimeline(ticketId, workspaceId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new ConflictException('Knowledge drafts require a resolved or closed ticket');
    }

    const existing = await this.knowledgeRepository.findLatestBySourceTicket(workspaceId, ticketId);
    if (existing) {
      return this.wrap({ article: this.toArticleDto(existing) });
    }

    const publicMessages = (ticket.messages ?? []).filter(
      (message) => message.visibility === TicketMessageVisibility.PUBLIC,
    );
    const lastPublicReply = [...publicMessages]
      .reverse()
      .find((message) => message.authorId !== ticket.requesterId);

    const article = await this.knowledgeRepository.create({
      workspace: { connect: { id: workspaceId } },
      sourceTicket: { connect: { id: ticket.id } },
      sourceType: KnowledgeSourceType.TICKET,
      title: this.truncate(`How to resolve: ${ticket.title}`, 160),
      problem: this.truncate(ticket.description, 4000),
      resolution: this.truncate(
        lastPublicReply?.body ??
          'Resolution details need owner review before this article can be published.',
        4000,
      ),
      verification:
        'Confirm the requester can complete the affected workflow and no new error is reported.',
      rollback: 'Reopen the source ticket if the requester reports the issue is not resolved.',
      status: KnowledgeStatus.DRAFT,
      visibility: KnowledgeVisibility.INTERNAL,
      createdBy: { connect: { id: actor.id } },
    });

    return this.wrap({ article: this.toArticleDto(article) });
  }

  async list(workspaceId: string, actor: TicketActor, query: ListKnowledgeQueryDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    const requester = roleType === RoleType.REQUESTER;
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;

    const articles = await this.knowledgeRepository.findAll({
      workspaceId,
      status: requester ? KnowledgeStatus.PUBLISHED : query.status,
      visibility: requester ? KnowledgeVisibility.REQUESTER : undefined,
      q: query.q,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return this.wrap({
      articles: articles.map((article) => this.toArticleDto(article)),
      page,
      page_size: pageSize,
    });
  }

  async get(workspaceId: string, articleId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    const article = await this.knowledgeRepository.findById(articleId, workspaceId);
    if (!article) {
      throw new NotFoundException('Knowledge article not found');
    }
    this.assertCanView(article, roleType);
    return this.wrap({ article: this.toArticleDto(article) });
  }

  async publish(
    workspaceId: string,
    articleId: string,
    actor: TicketActor,
    dto: PublishKnowledgeDto,
  ) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertStaff(roleType);
    const existing = await this.knowledgeRepository.findById(articleId, workspaceId);
    if (!existing) {
      throw new NotFoundException('Knowledge article not found');
    }
    if (existing.status === KnowledgeStatus.ARCHIVED) {
      throw new ConflictException('Archived knowledge cannot be published');
    }

    const article = await this.knowledgeRepository.publish({
      workspaceId,
      articleId,
      actorId: actor.id,
      visibility: dto.visibility ?? existing.visibility,
    });
    return this.wrap({ article: this.toArticleDto(article) });
  }

  private async requireMember(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(actor.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const roleType = memberWithRole.role?.roleType as RoleType | undefined;
    if (!roleType) {
      throw new ForbiddenException('Member role not found');
    }
    actor.roleType = roleType;
    return roleType;
  }

  private assertStaff(roleType: RoleType): void {
    if (!this.staffRoles.includes(roleType)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
  }

  private assertCanView(article: KnowledgeArticle, roleType: RoleType): void {
    if (roleType !== RoleType.REQUESTER) {
      return;
    }
    const visible =
      article.status === KnowledgeStatus.PUBLISHED &&
      article.visibility === KnowledgeVisibility.REQUESTER;
    if (!visible) {
      throw new NotFoundException('Knowledge article not found');
    }
  }

  private truncate(value: string, max: number): string {
    return value.length <= max ? value : value.slice(0, max - 1).trimEnd();
  }

  private toArticleDto(article: KnowledgeArticle) {
    return {
      id: article.id,
      workspace_id: article.workspaceId,
      source_ticket_id: article.sourceTicketId,
      source_type: article.sourceType,
      title: article.title,
      problem: article.problem,
      resolution: article.resolution,
      verification: article.verification,
      rollback: article.rollback,
      status: article.status,
      visibility: article.visibility,
      created_by_id: article.createdById,
      published_by_id: article.publishedById,
      published_at: article.publishedAt,
      created_at: article.createdAt,
      updated_at: article.updatedAt,
    };
  }

  private wrap(data: Record<string, unknown>) {
    return { data, request_id: randomUUID() };
  }
}
