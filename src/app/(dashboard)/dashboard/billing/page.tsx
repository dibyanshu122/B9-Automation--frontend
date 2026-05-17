'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PLANS } from '@/lib/constants';
import { Invoice } from '@/types';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { get, post } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [planResult, invoicesResult] = await Promise.allSettled([
        get('/api/billing/current-plan'),
        get('/api/billing/invoices'),
      ]);
      if (planResult.status === 'fulfilled') {
        setCurrentPlan(planResult.value.data);
      } else {
        toast.error('Could not load plan info');
      }
      if (invoicesResult.status === 'fulfilled') {
        setInvoices(invoicesResult.value.data);
      }
      // Invoices failure is non-critical — plan info still shown
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const response = await post(`/api/billing/create-order/${plan}`, {
        billing_cycle: billingCycle,
      });
      const { order_id, amount, razorpay_key } = response.data;

      try {
        await loadRazorpayScript();
      } catch {
        toast.error('Payment system unavailable. Please disable ad blocker and retry.');
        return;
      }

      const options = {
        key: razorpay_key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id,
        amount,
        currency: 'INR',
        name: 'B9 Automation',
        description: `${plan.charAt(0) + plan.slice(1).toLowerCase()} Plan — ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`,
        image: '/logo.png',
        handler: (_paymentResponse: any) => {
          toast.success('Payment successful! Your plan is being activated…');
          setTimeout(() => window.location.reload(), 3000);
        },
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => toast('Payment cancelled.'),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to initiate payment. Try again.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {currentPlan && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Current Plan</h2>
          <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-bold text-primary-600">
                    {currentPlan.plan}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${currentPlan.billing_cycle === 'annual' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {currentPlan.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                {currentPlan.billing_cycle === 'annual' ? (
                  <p className="mt-2 text-lg font-medium text-primary-600">
                    Rs {PLANS.find((p) => p.type === currentPlan.plan)?.annual_price || 0} / year
                    <span className="ml-2 text-sm text-emerald-600 font-semibold">2 months free</span>
                  </p>
                ) : (
                  <p className="mt-2 text-lg font-medium text-primary-600">
                    Rs {PLANS.find((p) => p.type === currentPlan.plan)?.price || 0} / month
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {currentPlan.plan !== 'FREE' && !showCancelConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 transition"
                  >
                    Cancel plan →
                  </button>
                )}
                {showCancelConfirm && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-right">
                    <p className="font-semibold text-red-800 mb-2">Cancel plan?</p>
                    <p className="text-xs text-red-700 mb-3">Your account will revert to FREE plan at the end of this billing period. Your data stays safe.</p>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowCancelConfirm(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                        Keep plan
                      </button>
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={async () => {
                          setCancelling(true);
                          try {
                            await post('/api/billing/cancel', {});
                            toast.success('Plan cancelled. You will revert to FREE at end of billing period.');
                            setShowCancelConfirm(false);
                            fetchBillingData();
                          } catch {
                            toast.error('Could not cancel — email support@b9automation.com');
                          } finally {
                            setCancelling(false);
                          }
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <PlanStat label="Storage" value={`${currentPlan.quotas?.storage_mb} MB`} />
              <PlanStat label="Queries/Month" value={currentPlan.quotas?.queries} />
              <PlanStat label="Assistants" value={currentPlan.quotas?.assistants} />
              <PlanStat
                label="Widget Domains"
                value={
                  currentPlan.quotas?.widget_domains > 1000
                    ? 'Unlimited'
                    : currentPlan.quotas?.widget_domains
                }
              />
            </div>
          </Card>
        </div>
      )}

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <p className="mt-1 text-sm text-gray-600">
              {billingCycle === 'yearly' ? 'Yearly billing selected' : 'Monthly billing selected'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-1">
              Annual = 2 months free
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                disabled={!!upgrading}
                className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                disabled={!!upgrading}
                className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((plan) => {
            const displayPrice =
              billingCycle === 'yearly' ? plan.annual_price ?? plan.price : plan.price;

            return (
              <Card
                key={plan.type}
                className={`flex flex-col ${
                  plan.type === currentPlan?.plan ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="my-2">
                  <p className="text-2xl font-bold text-primary-500">Rs {displayPrice}</p>
                  <p className="text-xs font-medium text-gray-500">
                    /{billingCycle === 'yearly' && plan.annual_price ? 'year' : 'month'}
                  </p>
                  {billingCycle === 'yearly' && plan.annual_price && plan.price > 0 && (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      Annual billing selected
                    </p>
                  )}
                </div>
                <p className="mb-4 text-sm text-gray-600">{plan.description}</p>

                {plan.type !== currentPlan?.plan && plan.price > 0 && (
                  <Button
                    variant="primary"
                    className="mb-4 w-full"
                    onClick={() => handleUpgrade(plan.type)}
                    loading={upgrading === plan.type}
                    disabled={!!upgrading}
                  >
                    {upgrading === plan.type ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
                  </Button>
                )}

                <div className="space-y-2">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Billing History</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Invoice</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Plan</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Billing</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Amount</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">{invoice.plan_type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(invoice as any).billing_cycle === 'annual' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                        {(invoice as any).billing_cycle === 'annual' ? 'Annual' : 'Monthly'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">Rs {invoice.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(invoice.billing_period_start).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-primary-600">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  );
}
