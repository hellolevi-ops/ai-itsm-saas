import { IsEnum } from 'class-validator';
import { BillingCycle, BillingPlanCode } from '@prisma/client';

export class CreatePaymentOrderDto {
  @IsEnum(BillingPlanCode)
  plan_code!: BillingPlanCode;

  @IsEnum(BillingCycle)
  billing_cycle!: BillingCycle;
}
