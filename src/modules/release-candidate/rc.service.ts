import { Injectable } from '@nestjs/common';
import { rcReadinessPackage } from './rc.package';

@Injectable()
export class ReleaseCandidateService {
  publicPackage() {
    return {
      data: rcReadinessPackage(),
    };
  }
}
