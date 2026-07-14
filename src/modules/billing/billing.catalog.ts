import { BillingCycle, BillingPlanCode } from '@prisma/client';

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  limits: {
    agents: number;
    monthlyTickets: number;
    monthlyAiActions: number;
    channels: number;
  };
};

export const BILLING_PLANS: Record<BillingPlanCode, BillingPlan> = {
  [BillingPlanCode.FREE]: {
    code: BillingPlanCode.FREE,
    name: 'Free',
    monthlyAmountCents: 0,
    yearlyAmountCents: 0,
    limits: {
      agents: 3,
      monthlyTickets: 100,
      monthlyAiActions: 100,
      channels: 1,
    },
  },
  [BillingPlanCode.TEAM]: {
    code: BillingPlanCode.TEAM,
    name: 'Team',
    monthlyAmountCents: 29_900,
    yearlyAmountCents: 299_000,
    limits: {
      agents: 5,
      monthlyTickets: 1000,
      monthlyAiActions: 1500,
      channels: 2,
    },
  },
  [BillingPlanCode.GROWTH]: {
    code: BillingPlanCode.GROWTH,
    name: 'Growth',
    monthlyAmountCents: 89_900,
    yearlyAmountCents: 899_000,
    limits: {
      agents: 15,
      monthlyTickets: 5000,
      monthlyAiActions: 8000,
      channels: 4,
    },
  },
  [BillingPlanCode.BUSINESS]: {
    code: BillingPlanCode.BUSINESS,
    name: 'Business',
    monthlyAmountCents: 249_900,
    yearlyAmountCents: 2_499_000,
    limits: {
      agents: 30,
      monthlyTickets: 20_000,
      monthlyAiActions: 30_000,
      channels: 8,
    },
  },
};

export function planAmountCents(planCode: BillingPlanCode, billingCycle: BillingCycle): number {
  const plan = BILLING_PLANS[planCode];
  return billingCycle === BillingCycle.YEARLY ? plan.yearlyAmountCents : plan.monthlyAmountCents;
}
