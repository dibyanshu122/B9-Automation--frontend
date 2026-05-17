import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from './useApi';
import { FEATURE_RULES, FeatureKey, PLAN_LIMITS_UI, isPlanAtLeast, normalizePlan } from '@/lib/billing/features';
import { useAuthStore } from '@/store/authStore';

export interface BillingPlanState {
  plan: string;
  name: string;
  usage?: any;
  quotas?: any;
  features?: Record<string, boolean>;
}

let billingRequest: Promise<any> | null = null;

export function usePlanAccess(featureKey?: FeatureKey, requiredPlanOverride?: string) {
  const { user } = useAuthStore();
  const { get } = useApi();
  const [billing, setBilling] = useState<BillingPlanState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      billingRequest = billingRequest || get('/api/billing/plan');
      const response = await billingRequest;
      setBilling(response.data);
    } catch {
      if (user) setBilling({ plan: user.plan, name: user.plan });
    } finally {
      billingRequest = null;
      setLoading(false);
    }
  }, [get, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const plan = normalizePlan(billing?.plan || user?.plan);
  const rule = featureKey ? FEATURE_RULES[featureKey] : null;
  const requiredPlan = normalizePlan(requiredPlanOverride || rule?.requiredPlan || 'FREE');
  const allowed = isPlanAtLeast(plan, requiredPlan);

  return useMemo(() => ({
    billing,
    loading,
    currentPlan: plan,
    requiredPlan,
    allowed,
    rule,
    limits: PLAN_LIMITS_UI[plan],
    refresh,
    canUse: (feature: FeatureKey, override?: string) => {
      const nextRule = FEATURE_RULES[feature];
      return isPlanAtLeast(plan, normalizePlan(override || nextRule.requiredPlan));
    },
    getRule: (feature: FeatureKey) => FEATURE_RULES[feature],
  }), [allowed, billing, loading, plan, refresh, requiredPlan, rule]);
}
