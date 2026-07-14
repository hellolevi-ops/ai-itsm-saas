import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogRepository } from './repositories/service-catalog.repository';
import { ServiceCatalogService } from './service-catalog.service';

@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [ServiceCatalogController],
  providers: [ServiceCatalogService, ServiceCatalogRepository],
  exports: [ServiceCatalogService, ServiceCatalogRepository],
})
export class ServiceCatalogModule {}
