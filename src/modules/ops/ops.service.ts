import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

type CheckStatus = 'ok' | 'error';

@Injectable()
export class OpsService {
  private readonly startedAt = new Date();

  constructor(private readonly prisma: PrismaService) {}

  live() {
    return {
      data: {
        status: 'ok' as CheckStatus,
        service: 'lingxi-service-desk-api',
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        started_at: this.startedAt.toISOString(),
      },
    };
  }

  async ready() {
    const checks = {
      database: await this.databaseCheck(),
    };
    const status: CheckStatus = checks.database.status === 'ok' ? 'ok' : 'error';
    return {
      data: {
        status,
        service: 'lingxi-service-desk-api',
        timestamp: new Date().toISOString(),
        checks,
      },
    };
  }

  private async databaseCheck() {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok' as CheckStatus,
        latency_ms: Date.now() - started,
      };
    } catch (error) {
      return {
        status: 'error' as CheckStatus,
        latency_ms: Date.now() - started,
        message: error instanceof Error ? error.message : 'Database readiness check failed',
      };
    }
  }
}
