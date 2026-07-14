import { TicketRepository } from '../ticket.repository';

describe('TicketRepository', () => {
  let repository: TicketRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      ticket: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    repository = new TicketRepository(prisma);
  });

  it('findById always scopes by workspaceId', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await repository.findById('ticket-001', 'ws-001');

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: { id: 'ticket-001', workspaceId: 'ws-001' },
    });
  });

  it('findAll always scopes by workspaceId even with filters', async () => {
    prisma.ticket.findMany.mockResolvedValue([]);

    await repository.findAll({
      workspaceId: 'ws-001',
      requesterId: 'user-001',
      q: 'vpn',
      skip: 0,
      take: 20,
    });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'ws-001',
          requesterId: 'user-001',
        }),
      }),
    );
  });
});
