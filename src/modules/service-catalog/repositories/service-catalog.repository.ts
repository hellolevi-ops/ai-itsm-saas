import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RequestTemplate,
  RequestTemplateStatus,
  ServiceCatalogItem,
  ServiceCatalogStatus,
  WorkingHoursStatus,
  WorkspaceWorkingHours,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export type RequestTemplateWithService = RequestTemplate & {
  serviceCatalogItem: ServiceCatalogItem;
};

@Injectable()
export class ServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  createItem(data: Prisma.ServiceCatalogItemCreateInput): Promise<ServiceCatalogItem> {
    return this.prisma.serviceCatalogItem.create({ data });
  }

  createTemplate(data: Prisma.RequestTemplateCreateInput): Promise<RequestTemplate> {
    return this.prisma.requestTemplate.create({ data });
  }

  findActiveItem(workspaceId: string, itemId: string): Promise<ServiceCatalogItem | null> {
    return this.prisma.serviceCatalogItem.findFirst({
      where: {
        id: itemId,
        workspaceId,
        status: ServiceCatalogStatus.ACTIVE,
      },
    });
  }

  findActiveTemplate(
    workspaceId: string,
    templateId: string,
  ): Promise<RequestTemplateWithService | null> {
    return this.prisma.requestTemplate.findFirst({
      where: {
        id: templateId,
        workspaceId,
        status: RequestTemplateStatus.ACTIVE,
        serviceCatalogItem: { status: ServiceCatalogStatus.ACTIVE },
      },
      include: { serviceCatalogItem: true },
    });
  }

  listActiveItems(workspaceId: string): Promise<ServiceCatalogItem[]> {
    return this.prisma.serviceCatalogItem.findMany({
      where: { workspaceId, status: ServiceCatalogStatus.ACTIVE },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  listActiveTemplates(workspaceId: string): Promise<RequestTemplateWithService[]> {
    return this.prisma.requestTemplate.findMany({
      where: {
        workspaceId,
        status: RequestTemplateStatus.ACTIVE,
        serviceCatalogItem: { status: ServiceCatalogStatus.ACTIVE },
      },
      include: { serviceCatalogItem: true },
      orderBy: [{ name: 'asc' }],
    });
  }

  findActiveWorkingHours(workspaceId: string): Promise<WorkspaceWorkingHours | null> {
    return this.prisma.workspaceWorkingHours.findFirst({
      where: { workspaceId, status: WorkingHoursStatus.ACTIVE },
    });
  }

  upsertDefaultWorkingHours(workspaceId: string, timezone: string): Promise<WorkspaceWorkingHours> {
    return this.prisma.workspaceWorkingHours.upsert({
      where: { workspaceId },
      update: {},
      create: {
        workspace: { connect: { id: workspaceId } },
        timezone,
      },
    });
  }
}
