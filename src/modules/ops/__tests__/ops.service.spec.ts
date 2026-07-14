import { OpsService } from '../ops.service';

describe('OpsService', () => {
  let prisma: any;
  let service: OpsService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    };
    service = new OpsService(prisma);
  });

  it('returns live status without external dependencies', () => {
    const result = service.live();

    expect(result.data.status).toBe('ok');
    expect(result.data.service).toBe('lingxi-service-desk-api');
    expect(result.data.uptime_seconds).toEqual(expect.any(Number));
  });

  it('returns ready status when database check succeeds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.ready();

    expect(result.data.status).toBe('ok');
    expect(result.data.checks.database.status).toBe('ok');
  });

  it('returns error status when database check fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await service.ready();

    expect(result.data.status).toBe('error');
    expect(result.data.checks.database.status).toBe('error');
    expect(result.data.checks.database.message).toBe('connection refused');
  });
});
