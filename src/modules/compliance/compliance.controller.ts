import { Controller, Get, Param } from '@nestjs/common';
import { ComplianceService } from './compliance.service';

@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('public')
  publicPackage() {
    return this.complianceService.listPublicPackage();
  }

  @Get('documents/:slug')
  document(@Param('slug') slug: string) {
    return this.complianceService.getDocument(slug);
  }
}
