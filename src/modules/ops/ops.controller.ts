import { Controller, Get } from '@nestjs/common';
import { OpsService } from './ops.service';

@Controller('api/v1/health')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('live')
  live() {
    return this.opsService.live();
  }

  @Get('ready')
  ready() {
    return this.opsService.ready();
  }
}
