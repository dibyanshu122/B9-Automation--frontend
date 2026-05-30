/**
 * Cached data-fetching hooks using React Query.
 * Replaces raw useEffect+get() patterns for the 5 most-fetched endpoints.
 *
 * Benefits:
 * - 60s stale time: navigating away and back doesn't re-fetch
 * - Deduplication: multiple components requesting same data = 1 network call
 * - Background refetch: data stays fresh without blocking UI
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api';

// ── Query Keys (centralised — used for invalidation too) ─────────────────────
export const QUERY_KEYS = {
  analytics: (days: number) => ['analytics', 'dashboard', days] as const,
  leads: (params?: Record<string, string | number>) => ['leads', params ?? {}] as const,
  campaigns: () => ['campaigns'] as const,
  billing: () => ['billing', 'current-plan'] as const,
  quota: () => ['billing', 'quota'] as const,
  segments: () => ['leads', 'segments'] as const,
};

// ── Analytics dashboard ───────────────────────────────────────────────────────
export function useAnalyticsDashboard(days = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(days),
    queryFn: async () => {
      const r = await api.get(`/api/analytics/dashboard?days=${days}`);
      return r.data;
    },
    staleTime: 90_000,  // matches backend 90s cache
  });
}

// ── Leads list ────────────────────────────────────────────────────────────────
export function useLeads(params: { limit?: number; status?: string } = {}) {
  const { limit = 50, status } = params;
  const qs = new URLSearchParams({ limit: String(limit), ...(status ? { status } : {}) });
  return useQuery({
    queryKey: QUERY_KEYS.leads(params),
    queryFn: async () => {
      const r = await api.get(`/api/leads?${qs}`);
      return r.data;
    },
    staleTime: 30_000,  // leads change frequently
  });
}

// ── Campaigns list ────────────────────────────────────────────────────────────
export function useCampaigns() {
  return useQuery({
    queryKey: QUERY_KEYS.campaigns(),
    queryFn: async () => {
      const r = await api.get('/api/campaigns');
      return r.data?.campaigns ?? r.data ?? [];
    },
    staleTime: 30_000,
  });
}

// ── Billing / current plan ────────────────────────────────────────────────────
export function useBillingPlan() {
  return useQuery({
    queryKey: QUERY_KEYS.billing(),
    queryFn: async () => {
      const r = await api.get('/api/billing/current-plan');
      return r.data;
    },
    staleTime: 5 * 60_000,  // plan rarely changes
  });
}

// ── Quota / usage status ──────────────────────────────────────────────────────
export function useQuota() {
  return useQuery({
    queryKey: QUERY_KEYS.quota(),
    queryFn: async () => {
      const r = await api.get('/api/quota/status');
      return r.data;
    },
    staleTime: 60_000,
  });
}

// ── Segments ──────────────────────────────────────────────────────────────────
export function useSegments() {
  return useQuery({
    queryKey: QUERY_KEYS.segments(),
    queryFn: async () => {
      const r = await api.get('/api/leads/segments');
      return r.data ?? [];
    },
    staleTime: 2 * 60_000,
  });
}

// ── Invalidation helper ───────────────────────────────────────────────────────
// Call after mutations to refetch fresh data
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    invalidateLeads: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    invalidateCampaigns: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campaigns() }),
    invalidateAnalytics: () => qc.invalidateQueries({ queryKey: ['analytics'] }),
    invalidateBilling: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  };
}
