import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  RequestTemplate,
  RoleType,
  ServiceCatalogItem,
  TicketPriority,
  WorkspaceWorkingHours,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { TicketActor } from '@/modules/ticket/ticket.service';
import { CreateRequestTemplateDto, CreateServiceCatalogItemDto } from './dto/service-catalog.dto';
import { ServiceCatalogRepository } from './repositories/service-catalog.repository';

@Injectable()
export class ServiceCatalogService {
  private readonly staffRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT];

  constructor(
    private readonly repository: ServiceCatalogRepository,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async createItem(workspaceId: string, actor: TicketActor, dto: CreateServiceCatalogItemDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertStaff(roleType);

    const item = await this.repository.createItem({
      workspace: { connect: { id: workspaceId } },
      name: dto.name,
      description: dto.description,
      category: dto.category,
      defaultPriority: dto.default_priority ?? TicketPriority.P3,
      responseTargetMinutes: dto.response_target_minutes ?? 240,
      resolutionTargetMinutes: dto.resolution_target_minutes ?? 1440,
    });

    return this.wrap({ service_catalog_item: this.toItemDto(item) });
  }

  async createTemplate(workspaceId: string, actor: TicketActor, dto: CreateRequestTemplateDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertStaff(roleType);

    const item = await this.repository.findActiveItem(workspaceId, dto.service_catalog_item_id);
    if (!item) {
      throw new NotFoundException('Service catalog item not found');
    }

    const template = await this.repository.createTemplate({
      workspace: { connect: { id: workspaceId } },
      serviceCatalogItem: { connect: { id: item.id } },
      name: dto.name,
      description: dto.description,
      defaultTitle: dto.default_title,
      defaultDescription: dto.default_description,
      defaultPriority: dto.default_priority ?? item.defaultPriority,
      defaultCategory: dto.default_category ?? item.category,
    });

    return this.wrap({ request_template: this.toTemplateDto(template, item) });
  }

  async list(workspaceId: string, actor: TicketActor) {
    await this.requireMember(workspaceId, actor);
    const [items, templates] = await Promise.all([
      this.repository.listActiveItems(workspaceId),
      this.repository.listActiveTemplates(workspaceId),
    ]);

    const itemById = new Map(items.map((item) => [item.id, this.toItemDto(item)]));
    return this.wrap({
      service_catalog_items: Array.from(itemById.values()),
      request_templates: templates.map((template) =>
        this.toTemplateDto(template, template.serviceCatalogItem),
      ),
    });
  }

  async getTemplateForTicket(workspaceId: string, templateId: string) {
    const template = await this.repository.findActiveTemplate(workspaceId, templateId);
    if (!template) {
      throw new NotFoundException('Request template not found');
    }
    return template;
  }

  async getWorkingHoursForTicket(workspaceId: string) {
    const existing = await this.repository.findActiveWorkingHours(workspaceId);
    if (existing) {
      return existing;
    }
    return this.repository.upsertDefaultWorkingHours(workspaceId, 'Asia/Shanghai');
  }

  calculateDueDates(
    item: ServiceCatalogItem,
    workingHours?: WorkspaceWorkingHours,
    now = new Date(),
  ) {
    if (!workingHours) {
      return {
        responseDueAt: new Date(now.getTime() + item.responseTargetMinutes * 60_000),
        resolutionDueAt: new Date(now.getTime() + item.resolutionTargetMinutes * 60_000),
      };
    }
    return {
      responseDueAt: this.addWorkingMinutes(now, item.responseTargetMinutes, workingHours),
      resolutionDueAt: this.addWorkingMinutes(now, item.resolutionTargetMinutes, workingHours),
    };
  }

  private addWorkingMinutes(
    start: Date,
    minutes: number,
    workingHours: WorkspaceWorkingHours,
  ): Date {
    let remaining = minutes;
    let cursor = new Date(start);
    let guard = 0;
    while (remaining > 0 && guard < 370) {
      guard += 1;
      cursor = this.normalizeToWorkingTime(cursor, workingHours);
      const endOfDay = new Date(cursor);
      endOfDay.setHours(0, workingHours.endMinuteOfDay, 0, 0);
      const available = Math.max(0, Math.floor((endOfDay.getTime() - cursor.getTime()) / 60_000));
      if (remaining <= available) {
        return new Date(cursor.getTime() + remaining * 60_000);
      }
      remaining -= available;
      cursor = new Date(endOfDay.getTime() + 60_000);
    }
    return cursor;
  }

  private normalizeToWorkingTime(date: Date, workingHours: WorkspaceWorkingHours): Date {
    const cursor = new Date(date);
    while (!this.isWorkingDate(cursor, workingHours)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, workingHours.startMinuteOfDay, 0, 0);
    }
    const currentMinute = cursor.getHours() * 60 + cursor.getMinutes();
    if (currentMinute < workingHours.startMinuteOfDay) {
      cursor.setHours(0, workingHours.startMinuteOfDay, 0, 0);
      return cursor;
    }
    if (currentMinute >= workingHours.endMinuteOfDay) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, workingHours.startMinuteOfDay, 0, 0);
      return this.normalizeToWorkingTime(cursor, workingHours);
    }
    return cursor;
  }

  private isWorkingDate(date: Date, workingHours: WorkspaceWorkingHours): boolean {
    const isoDay = date.getDay() === 0 ? 7 : date.getDay();
    if (!workingHours.workdays.includes(isoDay)) {
      return false;
    }
    const day = date.toISOString().slice(0, 10);
    const holidays = Array.isArray(workingHours.holidayDates)
      ? (workingHours.holidayDates as string[])
      : [];
    return !holidays.includes(day);
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

  private toItemDto(item: ServiceCatalogItem) {
    return {
      id: item.id,
      workspace_id: item.workspaceId,
      name: item.name,
      description: item.description,
      category: item.category,
      default_priority: item.defaultPriority,
      response_target_minutes: item.responseTargetMinutes,
      resolution_target_minutes: item.resolutionTargetMinutes,
      status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private toTemplateDto(template: RequestTemplate, item: ServiceCatalogItem) {
    return {
      id: template.id,
      workspace_id: template.workspaceId,
      service_catalog_item_id: template.serviceCatalogItemId,
      name: template.name,
      description: template.description,
      default_title: template.defaultTitle,
      default_description: template.defaultDescription,
      default_priority: template.defaultPriority,
      default_category: template.defaultCategory,
      status: template.status,
      service_catalog_item: this.toItemDto(item),
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    };
  }

  private wrap(data: Record<string, unknown>) {
    return { data, request_id: randomUUID() };
  }
}
