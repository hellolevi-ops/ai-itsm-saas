import { Controller, Get } from '@nestjs/common';
import { ReleaseCandidateService } from './rc.service';

@Controller('api/v1/release-candidate')
export class ReleaseCandidateController {
  constructor(private readonly rcService: ReleaseCandidateService) {}

  @Get('public')
  publicPackage() {
    return this.rcService.publicPackage();
  }
}
