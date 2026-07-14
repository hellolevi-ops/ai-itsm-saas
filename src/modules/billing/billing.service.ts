import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  BillingPlanCode,
  PaymentOrder,
  PaymentOrderStatus,
  RoleType,
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import type { TicketActor } from '@/modules/ticket/ticket.service';
import { WorkspaceMemberService } from '@/modules/workspace/services/workspace-member.service';
import { BILLING_PLANS, BillingPlan, planAmountCents } from './billing.catalog';
import { CreatePaymentOrderDto } from './dto/billing.dto';

type UsageSnapshot = {
  monthly_tickets_used: number;
};

@Injectable()
export class BillingService {
  private readonly commercialRoles: RoleType[] = [RoleType.OWNER, RoleType.ADMIN];

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: WorkspaceMemberService,
  ) {}

  async overview(workspaceId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    const subscription = await this.findActiveSubscription(workspaceId);
    const plan = this.planFor(subscription?.planCode ?? BillingPlanCode.FREE);
    const usage = await this.currentUsage(workspaceId);
    const orders = this.commercialRoles.includes(roleType)
      ? await this.prisma.paymentOrder.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : [];

    return this.wrap({
      plans: Object.values(BILLING_PLANS).map((candidate) => this.toPlanDto(candidate)),
      subscription: this.toSubscriptionDto(subscription),
      current_plan: this.toPlanDto(plan),
      entitlements: this.toEntitlementDto(plan, usage),
      orders: orders.map((order) => this.toOrderDto(order)),
    });
  }

  async createOrder(workspaceId: string, actor: TicketActor, dto: CreatePaymentOrderDto) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertCommercialRole(roleType);
    if (dto.plan_code === BillingPlanCode.FREE) {
      throw new BadRequestException('Free plan does not require a payment order');
    }

    const order = await this.prisma.paymentOrder.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        planCode: dto.plan_code,
        billingCycle: dto.billing_cycle,
        amountCents: planAmountCents(dto.plan_code, dto.billing_cycle),
        currency: 'CNY',
        status: PaymentOrderStatus.PENDING,
        requestedBy: { connect: { id: actor.id } },
      },
    });

    return this.wrap({ order: this.toOrderDto(order) });
  }

  async activateOrder(workspaceId: string, orderId: string, actor: TicketActor) {
    const roleType = await this.requireMember(workspaceId, actor);
    this.assertCommercialRole(roleType);
    const order = await this.prisma.paymentOrder.findFirst({
      where: { id: orderId, workspaceId },
    });
    if (!order) {
      throw new NotFoundException('Payment order not found');
    }
    if (order.status !== PaymentOrderStatus.PENDING) {
      throw new ConflictException('Payment order is not pending');
    }

    const now = new Date();
    const periodEnd = this.periodEnd(now, order.billingCycle);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.workspaceSubscription.updateMany({
        where: { workspaceId, status: WorkspaceSubscriptionStatus.ACTIVE },
        data: { status: WorkspaceSubscriptionStatus.CANCELED, canceledAt: now },
      });
      const subscription = await tx.workspaceSubscription.create({
        data: {
          workspace: { connect: { id: workspaceId } },
          planCode: order.planCode,
          billingCycle: order.billingCycle,
          status: WorkspaceSubscriptionStatus.ACTIVE,
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          createdBy: { connect: { id: actor.id } },
        },
      });
      const activatedOrder = await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          subscription: { connect: { id: subscription.id } },
          status: PaymentOrderStatus.ACTIVATED,
          activatedBy: { connect: { id: actor.id } },
          activatedAt: now,
        },
      });
      return { subscription, order: activatedOrder };
    });

    const usage = await this.currentUsage(workspaceId);
    const plan = this.planFor(result.subscription.planCode);
    return this.wrap({
      order: this.toOrderDto(result.order),
      subscription: this.toSubscriptionDto(result.subscription),
      current_plan: this.toPlanDto(plan),
      entitlements: this.toEntitlementDto(plan, usage),
    });
  }

  async assertTicketCreationAllowed(workspaceId: string) {
    const subscription = await this.findActiveSubscription(workspaceId);
    const plan = this.planFor(subscription?.planCode ?? BillingPlanCode.FREE);
    const usage = await this.currentUsage(workspaceId);
    if (usage.monthly_tickets_used >= plan.limits.monthlyTickets) {
      throw new ConflictException('Plan ticket limit reached');
    }
  }

  async currentUsage(workspaceId: string): Promise<UsageSnapshot> {
    return {
      monthly_tickets_used: await this.prisma.ticket.count({
        where: {
          workspaceId,
          createdAt: { gte: this.monthStart(new Date()) },
        },
      }),
    };
  }

  private async requireMember(workspaceId: string, actor: TicketActor): Promise<RoleType> {
    const member = await this.memberService.findByUserIdAndWorkspaceId(actor.id, workspaceId);
    if (!member) {
      throw new ForbiddenException('Workspace access denied');
    }
    const memberWithRole = await this.memberService.findByIdWithRole(member.id);
    const roleType = memberWithRole.role?.roleType as RoleType | undefined;
    if (!roleType) {
      throw new ForbiddenException('Workspace role is required');
    }
    actor.roleType = roleType;
    return roleType;
  }

  private assertCommercialRole(roleType: RoleType) {
    if (!this.commercialRoles.includes(roleType)) {
      throw new ForbiddenException('Only workspace owners or admins can manage billing');
    }
  }

  private async findActiveSubscription(workspaceId: string) {
    return this.prisma.workspaceSubscription.findFirst({
      where: {
        workspaceId,
        status: WorkspaceSubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private planFor(planCode: BillingPlanCode): BillingPlan {
    return BILLING_PLANS[planCode] ?? BILLING_PLANS[BillingPlanCode.FREE];
  }

  private monthStart(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  private periodEnd(start: Date, billingCycle: BillingCycle) {
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + (billingCycle === BillingCycle.YEARLY ? 12 : 1));
    return end;
  }

  private toPlanDto(plan: BillingPlan) {
    return {
      code: plan.code,
      name: plan.name,
      monthly_amount_cents: plan.monthlyAmountCents,
      yearly_amount_cents: plan.yearlyAmountCents,
      currency: 'CNY',
      limits: {
        agents: plan.limits.agents,
        monthly_tickets: plan.limits.monthlyTickets,
        monthly_ai_actions: plan.limits.monthlyAiActions,
        channels: plan.limits.channels,
      },
    };
  }

  private toEntitlementDto(plan: BillingPlan, usage: UsageSnapshot) {
    return {
      plan_code: plan.code,
      limits: this.toPlanDto(plan).limits,
      usage,
      remaining: {
        monthly_tickets: Math.max(0, plan.limits.monthlyTickets - usage.monthly_tickets_used),
      },
    };
  }

  private toSubscriptionDto(subscription: WorkspaceSubscription | null) {
    if (!subscription) {
      return null;
    }
    return {
      id: subscription.id,
      workspace_id: subscription.workspaceId,
      plan_code: subscription.planCode,
      billing_cycle: subscription.billingCycle,
      status: subscription.status,
      current_period_start: subscription.currentPeriodStart,
      current_period_end: subscription.currentPeriodEnd,
      canceled_at: subscription.canceledAt,
      created_at: subscription.createdAt,
      updated_at: subscription.updatedAt,
    };
  }

  private toOrderDto(order: PaymentOrder) {
    return {
      id: order.id,
      workspace_id: order.workspaceId,
      subscription_id: order.subscriptionId,
      plan_code: order.planCode,
      billing_cycle: order.billingCycle,
      amount_cents: order.amountCents,
      currency: order.currency,
      status: order.status,
      requested_by_id: order.requestedById,
      activated_by_id: order.activatedById,
      activated_at: order.activatedAt,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  private wrap(data: Record<string, unknown>) {
    return { data, request_id: randomUUID() };
  }
}
