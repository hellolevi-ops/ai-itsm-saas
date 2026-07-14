-- CreateEnum
CREATE TYPE "BillingPlanCode" AS ENUM ('FREE', 'TEAM', 'GROWTH', 'BUSINESS');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "WorkspaceSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'ACTIVATED', 'CANCELED');

-- CreateTable
CREATE TABLE "workspace_subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "plan_code" "BillingPlanCode" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "status" "WorkspaceSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "plan_code" "BillingPlanCode" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" TEXT NOT NULL,
    "activated_by_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_subscriptions_workspace_id_idx" ON "workspace_subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_workspace_id_status_idx" ON "workspace_subscriptions"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_workspace_id_plan_code_idx" ON "workspace_subscriptions"("workspace_id", "plan_code");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_created_by_id_idx" ON "workspace_subscriptions"("created_by_id");

-- CreateIndex
CREATE INDEX "payment_orders_workspace_id_idx" ON "payment_orders"("workspace_id");

-- CreateIndex
CREATE INDEX "payment_orders_workspace_id_status_idx" ON "payment_orders"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "payment_orders_workspace_id_plan_code_idx" ON "payment_orders"("workspace_id", "plan_code");

-- CreateIndex
CREATE INDEX "payment_orders_subscription_id_idx" ON "payment_orders"("subscription_id");

-- CreateIndex
CREATE INDEX "payment_orders_requested_by_id_idx" ON "payment_orders"("requested_by_id");

-- CreateIndex
CREATE INDEX "payment_orders_activated_by_id_idx" ON "payment_orders"("activated_by_id");

-- AddForeignKey
ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "workspace_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "workspace_subscriptions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "workspace_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_activated_by_id_fkey" FOREIGN KEY ("activated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
