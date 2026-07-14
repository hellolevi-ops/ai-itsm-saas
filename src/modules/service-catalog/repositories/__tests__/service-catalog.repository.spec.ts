import { RequestTemplateStatus, ServiceCatalogStatus } from '@prisma/client';
import { ServiceCatalogRepository } from '../service-catalog.repository';

describe('ServiceCatalogRepository', () => {
  let repository: ServiceCatalogRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      serviceCatalogItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      requestTemplate: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      workspaceWorkingHours: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };
    repository = new ServiceCatalogRepository(prisma);
  });

  it('findActiveItem scopes by workspace and active status', async () => {
    prisma.serviceCatalogItem.findFirst.mockResolvedValue(null);

    await repository.findActiveItem('ws-001', 'svc-001');

    expect(prisma.serviceCatalogItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'svc-001',
        workspaceId: 'ws-001',
        status: ServiceCatalogStatus.ACTIVE,
      },
    });
  });

  it('findActiveTemplate scopes by workspace and active service item', async () => {
    prisma.requestTemplate.findFirst.mockResolvedValue(null);

    await repository.findActiveTemplate('ws-001', 'tpl-001');

    expect(prisma.requestTemplate.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'tpl-001',
        workspaceId: 'ws-001',
        status: RequestTemplateStatus.ACTIVE,
        serviceCatalogItem: { status: ServiceCatalogStatus.ACTIVE },
      },
      include: { serviceCatalogItem: true },
    });
  });

  it('listActiveTemplates never omits workspaceId', async () => {
    prisma.requestTemplate.findMany.mockResolvedValue([]);

    await repository.listActiveTemplates('ws-001');

    expect(prisma.requestTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'ws-001',
          status: RequestTemplateStatus.ACTIVE,
        }),
      }),
    );
  });
});
