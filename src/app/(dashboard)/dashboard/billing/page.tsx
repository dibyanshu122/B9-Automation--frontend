'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, Loader2 } from 'lucide-react';
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
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState({ name: '', email: '', phone: '' });
  const { get, post } = useApi();
  const { user } = useAuth();

  const fetchBillingData = useCallback(async () => {
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
      // Invoices failure is non-critical - plan info still shown
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleUpgrade = (plan: string) => {
    // Pre-fill from user profile
    setBillingDetails({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
    });
    setPendingPlan(plan);
    setShowBillingForm(true);
  };

  const proceedToPayment = async () => {
    if (!billingDetails.name.trim() || !billingDetails.email.trim() || !billingDetails.phone.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (!/^\+?[0-9]{10,13}$/.test(billingDetails.phone.replace(/\s/g, ''))) {
      toast.error('Enter a valid mobile number');
      return;
    }
    setShowBillingForm(false);
    const plan = pendingPlan!;
    setUpgrading(plan);
    try {
      const response = await post(`/api/billing/create-order/${plan}`, { billing_cycle: billingCycle });
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
        description: `${plan.charAt(0) + plan.slice(1).toLowerCase()} Plan - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`,
        image: '/logo.png',
        handler: () => {
          toast.success('Payment successful! Activating your plan...');
          // Poll until plan updates in DB (webhook takes 2-5 sec)
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            try {
              const res = await get('/api/billing/current-plan');
              if (res.data?.plan && res.data.plan !== 'FREE' && res.data.plan !== currentPlan?.plan) {
                clearInterval(poll);
                toast.success(`🎉 ${res.data.plan} plan activated!`);
                setTimeout(() => window.location.reload(), 1500);
              }
            } catch { /* ignore */ }
            if (attempts >= 10) { clearInterval(poll); window.location.reload(); }
          }, 2000);
        },
        prefill: {
          name: billingDetails.name,
          email: billingDetails.email,
          contact: billingDetails.phone,
        },
        theme: { color: '#111827' },
        modal: { ondismiss: () => toast('Payment cancelled.') },
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
                    <span className="ml-2 text-sm text-emerald-600 font-semibold">yearly discount</span>
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
                    Cancel plan
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
                            toast.success('Plan cancelled. You will revert to FREE at the end of this billing period.');
                            setShowCancelConfirm(false);
                            fetchBillingData();
                          } catch {
                            toast.error('Could not cancel. Email support@b9automation.com');
                          } finally {
                            setCancelling(false);
                          }
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, cancel'}
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
                    ? 'High limit'
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
            <p className="mt-1 text-xs text-gray-500">
              AI is credit-based on every plan. Top-ups are available when credits run low.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
          {PLANS.map((plan: any) => {
            const isAnnual = billingCycle === 'yearly';
            // annual_price = total yearly amount charged by backend/Razorpay.
            const displayPrice = isAnnual && plan.annual_price ? plan.annual_price : plan.price;
            const annualMonthlyEquivalent = plan.annual_price ? Math.round(plan.annual_price / 12) : null;
            const annualSaving = plan.annual_price ? (plan.price * 12) - plan.annual_price : 0;
            const isCurrent = plan.type === currentPlan?.plan;
            const badge = (plan as any).badge as string | null | undefined;

            return (
              <Card
                key={plan.type}
                className={`relative flex flex-col ${isCurrent ? 'ring-2 ring-primary-500' : ''} ${badge === 'Most Popular' ? 'border-primary-400' : ''}`}
              >
                {/* Badge - only Most Popular */}
                {badge === 'Most Popular' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
                    Most Popular
                  </div>
                )}

                {/* Current plan indicator */}
                {isCurrent && (
                  <div className="mb-2 rounded-full bg-primary-50 px-2 py-0.5 text-center text-[10px] font-bold text-primary-600 border border-primary-200">
                    Current Plan
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

                {/* Price display */}
                <div className="my-2">
                  {plan.price === 0 ? (
                    <p className="text-2xl font-bold text-gray-900">Rs 0</p>
                  ) : (
                    <>
                      <div className="flex items-end gap-1">
                        <p className="text-2xl font-bold text-primary-500">Rs {displayPrice.toLocaleString('en-IN')}</p>
                        <p className="mb-0.5 text-xs font-medium text-gray-500">{isAnnual && plan.annual_price ? '/year' : '/month'}</p>
                      </div>
                      {isAnnual && plan.annual_price && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[11px] text-gray-500">
                            Equivalent to Rs {annualMonthlyEquivalent?.toLocaleString('en-IN')}/month
                          </p>
                          <p className="text-[11px] font-semibold text-green-600">
                            Save Rs {annualSaving.toLocaleString('en-IN')}/year
                          </p>
                        </div>
                      )}
                      {!isAnnual && plan.annual_price && (
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Annual Rs {plan.annual_price.toLocaleString('en-IN')}/year
                        </p>
                      )}
                    </>
                  )}
                </div>

                <p className="mb-3 text-xs text-gray-500 leading-relaxed">{plan.description}</p>

                {/* AI engine tag */}
                {(plan as any).ai_label && plan.price > 0 && (
                  <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                    <span className="text-[10px]">🤖</span>
                    <span className="text-[10px] font-semibold text-gray-600">{(plan as any).ai_label}</span>
                  </div>
                )}

                {/* CTA Button */}
                {!isCurrent && plan.price > 0 && (
                  <Button
                    variant="primary"
                    className={`mb-4 w-full text-sm ${badge === 'Most Popular' ? '' : 'bg-gray-900 hover:bg-gray-800'}`}
                    onClick={() => handleUpgrade(plan.type)}
                    loading={upgrading === plan.type}
                    disabled={!!upgrading}
                  >
                    {upgrading === plan.type ? 'Opening...' : plan.cta || `Upgrade to ${plan.name}`}
                  </Button>
                )}
                {isCurrent && (
                  <div className="mb-4 rounded-xl bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500">
                    Active
                  </div>
                )}
                {plan.price === 0 && !isCurrent && (
                  <div className="mb-4 rounded-xl bg-gray-100 py-2 text-center text-xs font-semibold text-gray-500">
                    Free Forever
                  </div>
                )}

                {/* Features list */}
                <div className="space-y-1.5 mt-auto">
                  {plan.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      {feature.includes('included') ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-500" />
                      ) : feature.startsWith('No ') || feature.startsWith('Without') ? (
                        <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                      ) : (
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                      )}
                      <span className="text-xs text-gray-700 leading-relaxed">{feature.replace(' included', '')}</span>
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

      {/* Billing Details Modal */}
      {showBillingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Billing Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Receipt will be sent to your email</p>
              </div>
              <button onClick={() => setShowBillingForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={billingDetails.name}
                  onChange={e => setBillingDetails(p => ({ ...p, name: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={billingDetails.email}
                  onChange={e => setBillingDetails(p => ({ ...p, email: e.target.value }))}
                  placeholder="rahul@company.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">Receipt will be sent here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={billingDetails.phone}
                  onChange={e => setBillingDetails(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowBillingForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center gap-2" onClick={proceedToPayment}>
                {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Proceed to Pay
              </Button>
            </div>
          </div>
        </div>
      )}
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
