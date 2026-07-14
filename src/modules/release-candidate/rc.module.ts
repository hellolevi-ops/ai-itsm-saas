import { Module } from '@nestjs/common';
import { ReleaseCandidateController } from './rc.controller';
import { ReleaseCandidateService } from './rc.service';

@Module({
  controllers: [ReleaseCandidateController],
  providers: [ReleaseCandidateService],
})
export class ReleaseCandidateModule {}
