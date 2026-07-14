import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  BillingPlanCode,
  PaymentOrderStatus,
  RoleType,
  WorkspaceSubscriptionStatus,
} from '@prisma/client';
import { BillingService } from '../billing.service';

describe('BillingService', () => {
  const now = new Date('2026-07-15T05:30:00.000Z');
  const order = {
    id: 'order-001',
    workspaceId: 'ws-001',
    subscriptionId: null,
    planCode: BillingPlanCode.TEAM,
    billingCycle: BillingCycle.MONTHLY,
    amountCents: 29_900,
    currency: 'CNY',
    status: PaymentOrderStatus.PENDING,
    requestedById: 'owner-001',
    activatedById: null,
    activatedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const subscription = {
    id: 'subscription-001',
    workspaceId: 'ws-001',
    planCode: BillingPlanCode.TEAM,
    billingCycle: BillingCycle.MONTHLY,
    status: WorkspaceSubscriptionStatus.ACTIVE,
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: new Date('2026-08-15T05:30:00.000Z'),
    canceledAt: null,
    createdById: 'owner-001',
    createdAt: now,
    updatedAt: now,
  };

  let prisma: any;
  let memberService: any;
  let service: BillingService;

  beforeEach(() => {
    jest.useRealTimers();
    prisma = {
      paymentOrder: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      workspaceSubscription: {
        findFirst: jest.fn(),
      },
      ticket: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    memberService = {
      findByUserIdAndWorkspaceId: jest.fn(),
      findByIdWithRole: jest.fn(),
    };
    service = new BillingService(prisma, memberService);
  });

  const mockMemberRole = (roleType: RoleType) => {
    memberService.findByUserIdAndWorkspaceId.mockResolvedValue({ id: 'member-001' });
    memberService.findByIdWithRole.mockResolvedValue({ id: 'member-001', role: { roleType } });
  };

  it('returns Free entitlements when no active subscription exists', async () => {
    mockMemberRole(RoleType.OWNER);
    prisma.workspaceSubscription.findFirst.mockResolvedValue(null);
    prisma.ticket.count.mockResolvedValue(7);
    prisma.paymentOrder.findMany.mockResolvedValue([]);

    const result = await service.overview('ws-001', { id: 'owner-001', tenantId: 'tenant-001' });

    expect(result.data.current_plan).toEqual(
      expect.objectContaining({
        code: BillingPlanCode.FREE,
        monthly_amount_cents: 0,
      }),
    );
    expect((result.data.entitlements as any).usage.monthly_tickets_used).toBe(7);
    expect((result.data.entitlements as any).remaining.monthly_tickets).toBe(93);
  });

  it('creates a pending manual payment order for workspace owners', async () => {
    mockMemberRole(RoleType.OWNER);
    prisma.paymentOrder.create.mockResolvedValue(order);

    const result = await service.createOrder(
      'ws-001',
      { id: 'owner-001', tenantId: 'tenant-001' },
      { plan_code: BillingPlanCode.TEAM, billing_cycle: BillingCycle.MONTHLY },
    );

    expect(prisma.paymentOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planCode: BillingPlanCode.TEAM,
          amountCents: 29_900,
          status: PaymentOrderStatus.PENDING,
        }),
      }),
    );
    expect((result.data.order as any).status).toBe(PaymentOrderStatus.PENDING);
  });

  it('rejects requester payment order creation', async () => {
    mockMemberRole(RoleType.REQUESTER);

    await expect(
      service.createOrder(
        'ws-001',
        { id: 'requester-001', tenantId: 'tenant-001' },
        { plan_code: BillingPlanCode.TEAM, billing_cycle: BillingCycle.MONTHLY },
      ),
    ).rejects.toThrow(new ForbiddenException('Only workspace owners or admins can manage billing'));
  });

  it('rejects Free payment orders', async () => {
    mockMemberRole(RoleType.ADMIN);

    await expect(
      service.createOrder(
        'ws-001',
        { id: 'admin-001', tenantId: 'tenant-001' },
        { plan_code: BillingPlanCode.FREE, billing_cycle: BillingCycle.MONTHLY },
      ),
    ).rejects.toThrow(new BadRequestException('Free plan does not require a payment order'));
  });

  it('activates a pending order and creates the subscription', async () => {
    mockMemberRole(RoleType.OWNER);
    prisma.paymentOrder.findFirst.mockResolvedValue(order);
    prisma.ticket.count.mockResolvedValue(12);
    const tx = {
      workspaceSubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue(subscription),
      },
      paymentOrder: {
        update: jest.fn().mockResolvedValue({
          ...order,
          subscriptionId: subscription.id,
          status: PaymentOrderStatus.ACTIVATED,
          activatedById: 'owner-001',
          activatedAt: now,
        }),
      },
    };
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    const result = await service.activateOrder('ws-001', 'order-001', {
      id: 'owner-001',
      tenantId: 'tenant-001',
    });

    expect(tx.workspaceSubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'ws-001', status: WorkspaceSubscriptionStatus.ACTIVE },
      }),
    );
    expect(tx.workspaceSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planCode: BillingPlanCode.TEAM,
          billingCycle: BillingCycle.MONTHLY,
        }),
      }),
    );
    expect((result.data.order as any).status).toBe(PaymentOrderStatus.ACTIVATED);
    expect((result.data.current_plan as any).code).toBe(BillingPlanCode.TEAM);
  });

  it('rejects missing payment orders during activation', async () => {
    mockMemberRole(RoleType.OWNER);
    prisma.paymentOrder.findFirst.mockResolvedValue(null);

    await expect(
      service.activateOrder('ws-001', 'missing-order', {
        id: 'owner-001',
        tenantId: 'tenant-001',
      }),
    ).rejects.toThrow(new NotFoundException('Payment order not found'));
  });

  it('rejects ticket creation when the monthly ticket limit is exhausted', async () => {
    prisma.workspaceSubscription.findFirst.mockResolvedValue(null);
    prisma.ticket.count.mockResolvedValue(100);

    await expect(service.assertTicketCreationAllowed('ws-001')).rejects.toThrow(
      new ConflictException('Plan ticket limit reached'),
    );
  });
});
