import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { CreateRequestTemplateDto, CreateServiceCatalogItemDto } from './dto/service-catalog.dto';
import { ServiceCatalogService } from './service-catalog.service';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT, RoleType.REQUESTER)
@Controller('api/v1/workspaces/:workspaceId/service-catalog')
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.serviceCatalogService.list(workspaceId, user);
  }

  @Post('items')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT)
  createItem(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreateServiceCatalogItemDto,
  ) {
    return this.serviceCatalogService.createItem(workspaceId, user, dto);
  }

  @Post('templates')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN, RoleType.AGENT)
  createTemplate(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreateRequestTemplateDto,
  ) {
    return this.serviceCatalogService.createTemplate(workspaceId, user, dto);
  }
}
