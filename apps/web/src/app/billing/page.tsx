'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { billingApi, extractApiError } from '@/lib/api';
import { useCurrentWorkspace } from '@/lib/workspace-store';
import type {
  BillingOverviewResponse,
  BillingPlan,
  BillingPlanCode,
  PaymentOrder,
  Workspace,
} from '@/types/api';
import type { FormEvent } from 'react';

function formatCny(cents: number) {
  return `¥${(cents / 100).toLocaleString('zh-CN')}`;
}

export default function BillingPage() {
  const workspace: Workspace | null = useCurrentWorkspace();
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activatingOrderId, setActivatingOrderId] = useState<string | null>(null);

  const loadBilling = async () => {
    if (!workspace) return;
    const response = await billingApi.overview(workspace.id);
    setOverview(response.data);
  };

  useEffect(() => {
    if (!workspace) return;
    billingApi
      .overview(workspace.id)
      .then((response) => setOverview(response.data))
      .catch((err) => setError(extractApiError(err)));
  }, [workspace]);

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setIsCreating(true);
    try {
      await billingApi.createOrder(workspace.id, {
        plan_code: String(data.get('plan_code') || 'TEAM') as Exclude<BillingPlanCode, 'FREE'>,
        billing_cycle: String(data.get('billing_cycle') || 'MONTHLY') as 'MONTHLY' | 'YEARLY',
      });
      await loadBilling();
      form.reset();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const activateOrder = async (order: PaymentOrder) => {
    if (!workspace) return;
    setError(null);
    setActivatingOrderId(order.id);
    try {
      await billingApi.activateOrder(workspace.id, order.id);
      await loadBilling();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setActivatingOrderId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
            <p className="mt-1 text-sm text-gray-500">Plan, quota and manual order controls.</p>
          </div>
          <Link className="text-sm font-medium text-blue-700" href="/tickets">
            Queue
          </Link>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {!workspace && (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Create or select a workspace before managing billing.
          </div>
        )}

        {workspace && overview && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3" data-testid="billing-overview">
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Current plan</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {overview.current_plan.name}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {overview.subscription
                    ? `${overview.subscription.billing_cycle} / ${overview.subscription.status}`
                    : 'Free workspace'}
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">Monthly tickets</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {overview.entitlements.usage.monthly_tickets_used} /{' '}
                  {overview.entitlements.limits.monthly_tickets}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {overview.entitlements.remaining.monthly_tickets} remaining
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-5">
                <div className="text-xs font-medium uppercase text-gray-500">AI actions</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {overview.entitlements.limits.monthly_ai_actions}
                </div>
                <div className="mt-2 text-sm text-gray-600">monthly allowance</div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <form
                onSubmit={createOrder}
                className="border border-gray-200 bg-white p-5"
                data-testid="billing-order-form"
              >
                <h2 className="text-sm font-semibold text-gray-900">Manual order</h2>
                <div className="mt-4 space-y-3">
                  <select
                    name="plan_code"
                    defaultValue="TEAM"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Billing plan"
                  >
                    <option value="TEAM">Team</option>
                    <option value="GROWTH">Growth</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  <select
                    name="billing_cycle"
                    defaultValue="MONTHLY"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Billing cycle"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                  <Button type="submit" loading={isCreating} className="w-full">
                    Create order
                  </Button>
                </div>
              </form>

              <section className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="plan-list">
                  {overview.plans.map((plan: BillingPlan) => (
                    <article
                      key={plan.code}
                      className="border border-gray-200 bg-white p-4 text-sm"
                    >
                      <div className="font-semibold text-gray-900">{plan.name}</div>
                      <div className="mt-2 text-lg font-semibold text-gray-900">
                        {formatCny(plan.monthly_amount_cents)}
                      </div>
                      <div className="mt-3 space-y-1 text-gray-600">
                        <div>{plan.limits.agents} agents</div>
                        <div>{plan.limits.monthly_tickets} tickets/month</div>
                        <div>{plan.limits.monthly_ai_actions} AI actions/month</div>
                        <div>{plan.limits.channels} channels</div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="border border-gray-200 bg-white p-5">
                  <h2 className="text-sm font-semibold text-gray-900">Orders</h2>
                  <div className="mt-4 space-y-3" data-testid="billing-orders">
                    {overview.orders.length === 0 ? (
                      <p className="text-sm text-gray-500">No orders yet.</p>
                    ) : (
                      overview.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between gap-4 border border-gray-200 p-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.plan_code} / {order.billing_cycle}
                            </div>
                            <div className="mt-1 text-gray-600">
                              {formatCny(order.amount_cents)} / {order.status}
                            </div>
                          </div>
                          {order.status === 'PENDING' && (
                            <Button
                              type="button"
                              onClick={() => activateOrder(order)}
                              loading={activatingOrderId === order.id}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
