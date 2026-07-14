import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  RequestTemplateStatus,
  RoleType,
  ServiceCatalogStatus,
  TicketPriority,
} from '@prisma/client';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { ServiceCatalogRepository } from '../repositories/service-catalog.repository';
import { ServiceCatalogService } from '../service-catalog.service';

const now = new Date('2026-07-15T02:00:00.000Z');

const catalogItem = {
  id: 'svc-001',
  workspaceId: 'ws-001',
  name: 'Account access',
  description: 'Access and permission requests',
  category: 'access',
  defaultPriority: TicketPriority.P3,
  responseTargetMinutes: 60,
  resolutionTargetMinutes: 480,
  status: ServiceCatalogStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
};

const requestTemplate = {
  id: 'tpl-001',
  workspaceId: 'ws-001',
  serviceCatalogItemId: 'svc-001',
  name: 'Reset payroll access',
  description: 'Payroll account access reset',
  defaultTitle: 'Payroll access reset',
  defaultDescription: 'Please describe the affected user and error.',
  defaultPriority: TicketPriority.P2,
  defaultCategory: 'access',
  status: RequestTemplateStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
  serviceCatalogItem: catalogItem,
};

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;
  let repository: jest.Mocked<ServiceCatalogRepository>;
  let memberService: jest.Mocked<WorkspaceMemberService>;

  beforeEach(() => {
    repository = {
      createItem: jest.fn(),
      createTemplate: jest.fn(),
      findActiveItem: jest.fn(),
      findActiveTemplate: jest.fn(),
      listActiveItems: jest.fn(),
      listActiveTemplates: jest.fn(),
      findActiveWorkingHours: jest.fn(),
      upsertDefaultWorkingHours: jest.fn(),
    } as any;
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    } as any;
    service = new ServiceCatalogService(repository, memberService);
  });

  const mockMemberRole = (roleType: RoleType, userId = 'agent-001') => {
    memberService.findByUserIdAndWorkspaceId.mockImplementation((candidateUserId) => {
      if (candidateUserId === userId) {
        return Promise.resolve({ id: `member-${candidateUserId}` } as any);
      }
      return Promise.resolve(null);
    });
    memberService.findByIdWithRole.mockResolvedValue({
      id: `member-${userId}`,
      role: { roleType },
    } as any);
  };

  it('creates catalog items for staff with SLA targets', async () => {
    mockMemberRole(RoleType.AGENT);
    repository.createItem.mockResolvedValue(catalogItem as any);

    const result = await service.createItem(
      'ws-001',
      { id: 'agent-001', tenantId: 'tenant-001' },
      {
        name: 'Account access',
        description: 'Access and permission requests',
        category: 'access',
        default_priority: TicketPriority.P3,
        response_target_minutes: 60,
        resolution_target_minutes: 480,
      },
    );

    expect(repository.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: { connect: { id: 'ws-001' } },
        responseTargetMinutes: 60,
        resolutionTargetMinutes: 480,
      }),
    );
    expect((result.data.service_catalog_item as any).name).toBe('Account access');
  });

  it('rejects requester catalog management', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');

    await expect(
      service.createItem(
        'ws-001',
        { id: 'requester-001', tenantId: 'tenant-001' },
        { name: 'Access', description: 'Access requests' },
      ),
    ).rejects.toThrow(new ForbiddenException('Insufficient workspace role'));
  });

  it('requires templates to reference an active same-workspace catalog item', async () => {
    mockMemberRole(RoleType.AGENT);
    repository.findActiveItem.mockResolvedValue(null);

    await expect(
      service.createTemplate(
        'ws-001',
        { id: 'agent-001', tenantId: 'tenant-001' },
        {
          service_catalog_item_id: 'svc-other',
          name: 'Reset payroll access',
          default_title: 'Payroll access reset',
          default_description: 'Please describe the affected user and error.',
        },
      ),
    ).rejects.toThrow(new NotFoundException('Service catalog item not found'));
  });

  it('lists only active catalog data for workspace members', async () => {
    mockMemberRole(RoleType.REQUESTER, 'requester-001');
    repository.listActiveItems.mockResolvedValue([catalogItem] as any);
    repository.listActiveTemplates.mockResolvedValue([requestTemplate] as any);

    const result = await service.list('ws-001', {
      id: 'requester-001',
      tenantId: 'tenant-001',
    });

    expect(repository.listActiveItems).toHaveBeenCalledWith('ws-001');
    expect(repository.listActiveTemplates).toHaveBeenCalledWith('ws-001');
    expect((result.data.request_templates as any[])[0].service_catalog_item.id).toBe('svc-001');
  });

  it('calculates response and resolution due dates from working hours', () => {
    const dueDates = service.calculateDueDates(
      catalogItem as any,
      {
        id: 'hours-001',
        workspaceId: 'ws-001',
        timezone: 'Asia/Shanghai',
        workdays: [1, 2, 3, 4, 5],
        startMinuteOfDay: 9 * 60,
        endMinuteOfDay: 18 * 60,
        holidayDates: [],
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      } as any,
      now,
    );

    expect(dueDates.responseDueAt.toISOString()).toBe('2026-07-15T03:00:00.000Z');
    expect(dueDates.resolutionDueAt.toISOString()).toBe('2026-07-15T10:00:00.000Z');
  });

  it('rolls SLA due dates across non-working time', () => {
    const dueDates = service.calculateDueDates(
      { ...catalogItem, responseTargetMinutes: 120, resolutionTargetMinutes: 540 } as any,
      {
        id: 'hours-001',
        workspaceId: 'ws-001',
        timezone: 'Asia/Shanghai',
        workdays: [1, 2, 3, 4, 5],
        startMinuteOfDay: 9 * 60,
        endMinuteOfDay: 18 * 60,
        holidayDates: [],
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      } as any,
      new Date('2026-07-17T17:30:00.000Z'),
    );

    expect(dueDates.responseDueAt.toISOString()).toBe('2026-07-20T03:00:00.000Z');
    expect(dueDates.resolutionDueAt.toISOString()).toBe('2026-07-20T10:00:00.000Z');
  });
});
