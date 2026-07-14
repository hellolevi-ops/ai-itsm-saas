import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { RequiresRoles } from '@/modules/workspace/decorators/requires-roles.decorator';
import { BillingService } from './billing.service';
import { CreatePaymentOrderDto } from './dto/billing.dto';

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@Controller('api/v1/workspaces/:workspaceId/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  overview(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.billingService.overview(workspaceId, {
      id: user.id,
      tenantId: user.tenantId,
    });
  }

  @Post('orders')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  createOrder(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.billingService.createOrder(
      workspaceId,
      { id: user.id, tenantId: user.tenantId },
      dto,
    );
  }

  @Post('orders/:orderId/activate')
  @RequiresRoles(RoleType.OWNER, RoleType.ADMIN)
  activateOrder(
    @Param('workspaceId') workspaceId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.billingService.activateOrder(workspaceId, orderId, {
      id: user.id,
      tenantId: user.tenantId,
    });
  }
}
