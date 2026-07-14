import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { WorkspaceRoleGuard } from '@/modules/workspace/guards/workspace-role.guard';
import { BetaService } from './beta.service';
import { CreateBetaFeedbackDto, UpdateFeatureFlagDto } from './dto/beta.dto';

@Controller('api/v1/beta')
export class BetaPublicController {
  constructor(private readonly betaService: BetaService) {}

  @Get('public')
  publicPackage() {
    return this.betaService.publicPackage();
  }
}

@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@Controller('api/v1/workspaces/:workspaceId/beta')
export class BetaWorkspaceController {
  constructor(private readonly betaService: BetaService) {}

  @Get()
  readiness(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.betaService.workspaceReadiness(workspaceId, {
      id: user.id,
      tenantId: user.tenantId,
    });
  }

  @Post('feedback')
  createFeedback(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreateBetaFeedbackDto,
  ) {
    return this.betaService.createFeedback(
      workspaceId,
      { id: user.id, tenantId: user.tenantId },
      dto,
    );
  }

  @Post('feature-flags/:key')
  updateFeatureFlag(
    @Param('workspaceId') workspaceId: string,
    @Param('key') key: string,
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.betaService.updateFeatureFlag(workspaceId, key, dto.enabled, {
      id: user.id,
      tenantId: user.tenantId,
    });
  }
}
