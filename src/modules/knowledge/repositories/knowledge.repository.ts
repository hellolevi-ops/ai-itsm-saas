import { Injectable } from '@nestjs/common';
import { KnowledgeArticle, KnowledgeStatus, KnowledgeVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.KnowledgeArticleCreateInput): Promise<KnowledgeArticle> {
    return this.prisma.knowledgeArticle.create({ data });
  }

  findLatestBySourceTicket(
    workspaceId: string,
    ticketId: string,
  ): Promise<KnowledgeArticle | null> {
    return this.prisma.knowledgeArticle.findFirst({
      where: {
        workspaceId,
        sourceTicketId: ticketId,
        status: { not: KnowledgeStatus.ARCHIVED },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(articleId: string, workspaceId: string): Promise<KnowledgeArticle | null> {
    return this.prisma.knowledgeArticle.findFirst({
      where: { id: articleId, workspaceId },
    });
  }

  findAll(params: {
    workspaceId: string;
    status?: KnowledgeStatus;
    visibility?: KnowledgeVisibility;
    q?: string;
    skip?: number;
    take?: number;
  }): Promise<KnowledgeArticle[]> {
    const where: Prisma.KnowledgeArticleWhereInput = {
      workspaceId: params.workspaceId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' } },
              { problem: { contains: params.q, mode: 'insensitive' } },
              { resolution: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.knowledgeArticle.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  publish(params: {
    workspaceId: string;
    articleId: string;
    actorId: string;
    visibility: KnowledgeVisibility;
  }): Promise<KnowledgeArticle> {
    return this.prisma.$transaction(async (tx) => {
      await tx.knowledgeArticle.updateMany({
        where: { id: params.articleId, workspaceId: params.workspaceId },
        data: {
          status: KnowledgeStatus.PUBLISHED,
          visibility: params.visibility,
          publishedAt: new Date(),
          publishedById: params.actorId,
        },
      });
      return tx.knowledgeArticle.findFirstOrThrow({
        where: { id: params.articleId, workspaceId: params.workspaceId },
      });
    });
  }
}
