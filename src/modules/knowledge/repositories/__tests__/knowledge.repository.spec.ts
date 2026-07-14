import { KnowledgeStatus, KnowledgeVisibility } from '@prisma/client';
import { KnowledgeRepository } from '../knowledge.repository';

describe('KnowledgeRepository', () => {
  let repository: KnowledgeRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      knowledgeArticle: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) =>
        callback({
          knowledgeArticle: {
            updateMany: jest.fn(),
            findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'article-001' }),
          },
        }),
      ),
    };
    repository = new KnowledgeRepository(prisma);
  });

  it('findById always scopes by workspaceId', async () => {
    prisma.knowledgeArticle.findFirst.mockResolvedValue(null);

    await repository.findById('article-001', 'ws-001');

    expect(prisma.knowledgeArticle.findFirst).toHaveBeenCalledWith({
      where: { id: 'article-001', workspaceId: 'ws-001' },
    });
  });

  it('findAll always scopes by workspaceId with requester filters', async () => {
    prisma.knowledgeArticle.findMany.mockResolvedValue([]);

    await repository.findAll({
      workspaceId: 'ws-001',
      status: KnowledgeStatus.PUBLISHED,
      visibility: KnowledgeVisibility.REQUESTER,
      q: 'vpn',
      skip: 0,
      take: 20,
    });

    expect(prisma.knowledgeArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'ws-001',
          status: KnowledgeStatus.PUBLISHED,
          visibility: KnowledgeVisibility.REQUESTER,
        }),
      }),
    );
  });

  it('publish updates and reloads only within workspaceId', async () => {
    const tx = {
      knowledgeArticle: {
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'article-001' }),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await repository.publish({
      workspaceId: 'ws-001',
      articleId: 'article-001',
      actorId: 'agent-001',
      visibility: KnowledgeVisibility.REQUESTER,
    });

    expect(tx.knowledgeArticle.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-001', workspaceId: 'ws-001' },
      }),
    );
    expect(tx.knowledgeArticle.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'article-001', workspaceId: 'ws-001' },
    });
  });
});
