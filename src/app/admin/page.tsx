'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { useApi, getApiClient } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

type AdminMe = {
  is_platform_admin: boolean;
  email: string;
  name?: string;
};

type Overview = {
  users?: Record<string, any>;
  plans?: Record<string, any>;
  revenue?: Record<string, any>;
  usage?: Record<string, any>;
  integrations?: Record<string, any>;
  risk?: Record<string, any>;
  generated_at?: string;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  company_name?: string | null;
  workspace_name?: string | null;
  plan: string;
  subscription_status?: string;
  email_verified: boolean;
  created_at?: string;
  last_login_at?: string | null;
  ai_credits_used: number;
  leads_count: number;
  automation_runs: number;
  failed_runs: number;
  low_credit: boolean;
  whatsapp?: {
    connected: boolean;
    method?: string | null;
    display_phone_number?: string | null;
  };
  facebook_connected?: boolean;
  instagram_connected?: boolean;
  latest_invoice?: {
    status: string;
    amount_inr: number;
    created_at?: string;
  } | null;
};

type UserDetail = Record<string, any>;
type AiCost = Record<string, any>;
type IntegrationHealth = {
  summary?: Record<string, any>;
  items?: Array<Record<string, any>>;
  generated_at?: string;
};
type RiskQueue = {
  summary?: Record<string, any>;
  items?: Array<Record<string, any>>;
  generated_at?: string;
};
type AuditEvents = {
  summary?: Record<string, any>;
  items?: Array<Record<string, any>>;
  generated_at?: string;
};
type SystemHealth = Record<string, any>;

const numberFmt = new Intl.NumberFormat('en-IN');
const moneyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function n(value: any) {
  return numberFmt.format(Number(value || 0));
}

function inr(value: any) {
  return moneyFmt.format(Number(value || 0));
}

function shortDate(value?: string | null) {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function StatCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)]">
      <div className="relative z-10">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <p className="mt-2.5 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {help && <p className="mt-2 text-[13px] text-slate-400">{help}</p>}
      </div>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 opacity-60 blur-2xl"></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4">
        <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-3">
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
      </div>
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

function HealthBadge({ status }: { status?: string }) {
  const value = status || 'not_connected';
  const classes: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-700 ring-emerald-500/20',
    needs_attention: 'bg-amber-50 text-amber-700 ring-amber-500/20',
    not_connected: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${classes[value] || classes.not_connected}`}>
      {value.split('_').join(' ')}
    </span>
  );
}

function CheckPill({ label, value }: { label: string; value: boolean | null | undefined }) {
  const state = value === true ? 'ok' : value === false ? 'missing' : 'unknown';
  const classes = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-500/20',
    missing: 'bg-red-50 text-red-700 ring-red-500/20',
    unknown: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${classes[state]}`}>
      {label}: {state}
    </span>
  );
}

function ProofText({ proof }: { proof?: Record<string, any> }) {
  if (!proof || !Object.keys(proof).length) return null;
  const entries = Object.entries(proof)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 3);
  if (!entries.length) return null;
  return (
    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
      {entries.map(([key, value]) => `${key.split('_').join(' ')}: ${String(value)}`).join(' • ')}
    </p>
  );
}

function SeverityBadge({ severity }: { severity?: string }) {
  const value = severity || 'medium';
  const classes: Record<string, string> = {
    high: 'bg-red-50 text-red-700 ring-red-500/20',
    medium: 'bg-amber-50 text-amber-700 ring-amber-500/20',
    low: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${classes[value] || classes.medium}`}>
      {value}
    </span>
  );
}

const ADMIN_EMAIL = 'ddibyanshu2@gmail.com';
const ADMIN_PASS = 'Rishusingh@7753';
const ADMIN_SESSION_KEY = 'b9_admin_session';

function AdminLoginGate({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASS) {
      setErr('Invalid admin credentials.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await getApiClient().post('/api/platform-admin/token', { email: email.trim(), password });
      const tok: string = res.data?.access_token || res.data?.token || '';
      if (!tok) { setErr('Login succeeded but no token returned.'); return; }
      useAuthStore.getState().setToken(tok);
      if (typeof window !== 'undefined') sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      onSuccess(tok);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/3 -left-24 h-96 w-96 rounded-full bg-indigo-200/40 mix-blend-multiply blur-3xl filter"></div>
      <div className="absolute bottom-1/3 -right-24 h-96 w-96 rounded-full bg-blue-200/40 mix-blend-multiply blur-3xl filter"></div>
      
      <div className="relative z-10 w-full max-w-[400px] rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-inner mb-4">
             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Portal</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">Restricted owner control panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          {err && <p className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">{err}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-60 active:scale-[0.98]"
          >
            {submitting ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function PlatformAdminPage() {
  const api = useApi();
  const { logout } = useAuthStore();
  const [adminReady, setAdminReady] = useState(false);
  const [token, setToken] = useState<string | null>(() => useAuthStore.getState().token);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
      setAdminReady(true);
    }
  }, []);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [whatsappFilter, setWhatsappFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [aiCost, setAiCost] = useState<AiCost | null>(null);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [providerFilter, setProviderFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [riskQueue, setRiskQueue] = useState<RiskQueue | null>(null);
  const [riskQueueFilter, setRiskQueueFilter] = useState('all');
  const [auditEvents, setAuditEvents] = useState<AuditEvents | null>(null);
  const [auditStatusFilter, setAuditStatusFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '25',
        offset: '0',
        plan: planFilter,
        whatsapp: whatsappFilter,
        risk: riskFilter,
      });
      if (userSearch.trim()) params.set('search', userSearch.trim());
      const res = await api.get(`/api/platform-admin/users?${params.toString()}`);
      setUsers(res.data?.items || []);
      setUsersTotal(res.data?.total || 0);
    } finally {
      setUsersLoading(false);
    }
  }, [api, planFilter, riskFilter, token, userSearch, whatsappFilter]);

  const openUserDetail = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedUser(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/platform-admin/users/${userId}`);
      setSelectedUser(res.data || null);
    } finally {
      setDetailLoading(false);
    }
  }, [api]);

  const reloadSelectedUser = useCallback(async () => {
    if (!selectedUserId) return;
    const res = await api.get(`/api/platform-admin/users/${selectedUserId}`);
    setSelectedUser(res.data || null);
  }, [api, selectedUserId]);

  const runUserAction = useCallback(async (action: string, payload?: any) => {
    if (!selectedUserId) return;
    await api.post(`/api/platform-admin/users/${selectedUserId}/${action}`, payload || {});
    await Promise.all([reloadSelectedUser(), loadUsers()]);
  }, [api, loadUsers, reloadSelectedUser, selectedUserId]);

  const loadIntegrationHealth = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({
      provider: providerFilter,
      status: healthFilter,
      limit: '100',
      offset: '0',
    });
    const res = await api.get(`/api/platform-admin/integration-health?${params.toString()}`);
    setIntegrationHealth(res.data || {});
  }, [api, healthFilter, providerFilter, token]);

  const loadRiskQueue = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({
      risk_type: riskQueueFilter,
      limit: '100',
    });
    const res = await api.get(`/api/platform-admin/risk-queue?${params.toString()}`);
    setRiskQueue(res.data || {});
  }, [api, riskQueueFilter, token]);

  const loadAuditEvents = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({
      status: auditStatusFilter,
      limit: '100',
      offset: '0',
    });
    if (auditSearch.trim()) params.set('search', auditSearch.trim());
    if (auditActionFilter.trim()) params.set('action', auditActionFilter.trim());
    const res = await api.get(`/api/platform-admin/audit-events?${params.toString()}`);
    setAuditEvents(res.data || {});
  }, [api, auditActionFilter, auditSearch, auditStatusFilter, token]);

  const loadSystemHealth = useCallback(async () => {
    if (!token) return;
    const res = await api.get('/api/platform-admin/system-health');
    setSystemHealth(res.data || {});
  }, [api, token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: fetch /me first — show panel as soon as this resolves
      const meRes = await api.get('/api/platform-admin/me', { timeout: 10000 });
      setMe(meRes.data);
      setLoading(false); // ← Panel visible NOW, no more waiting
      // Step 2: load all secondary data in background (non-blocking)
      Promise.allSettled([
        api.get('/api/platform-admin/overview', { timeout: 30000 }),
        api.get('/api/platform-admin/ai-cost?days=30&limit=25', { timeout: 30000 }),
        api.get('/api/platform-admin/integration-health?limit=100', { timeout: 30000 }),
        api.get('/api/platform-admin/risk-queue?limit=100', { timeout: 30000 }),
        api.get('/api/platform-admin/audit-events?limit=100', { timeout: 30000 }),
        api.get('/api/platform-admin/system-health', { timeout: 30000 }),
      ]).then(([overviewRes, aiCostRes, healthRes, riskRes, auditRes, systemRes]) => {
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data || {});
        if (aiCostRes.status === 'fulfilled') setAiCost(aiCostRes.value.data || {});
        if (healthRes.status === 'fulfilled') setIntegrationHealth(healthRes.value.data || {});
        if (riskRes.status === 'fulfilled') setRiskQueue(riskRes.value.data || {});
        if (auditRes.status === 'fulfilled') setAuditEvents(auditRes.value.data || {});
        if (systemRes.status === 'fulfilled') setSystemHealth(systemRes.value.data || {});
      }).catch(() => undefined);
      loadUsers().catch(() => undefined);
    } catch (err: any) {
      const status = err?.response?.status || err?.status;
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      if (isTimeout) {
        setError('Backend is not responding. Make sure the backend server is running on localhost:8000.');
      } else if (status === 403) {
        setError('Not authorized for B9 Admin. Your email must be in PLATFORM_ADMIN_EMAILS.');
      } else {
        setError(err?.message || 'Failed to load B9 Admin.');
      }
      setLoading(false);
    }
  }, [api, loadUsers, token]);

  useEffect(() => {
    if (!adminReady || !token) return;
    load();
  }, [adminReady, load, token]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Check that the backend is running at localhost:8000.');
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!me) return;
    const timer = window.setTimeout(() => {
      loadUsers().catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers, me]);

  useEffect(() => {
    if (!me) return;
    loadIntegrationHealth().catch(() => undefined);
  }, [loadIntegrationHealth, me]);

  useEffect(() => {
    if (!me) return;
    loadRiskQueue().catch(() => undefined);
  }, [loadRiskQueue, me]);

  useEffect(() => {
    if (!me) return;
    const timer = window.setTimeout(() => {
      loadAuditEvents().catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadAuditEvents, me]);

  const topCards = useMemo(() => {
    const users = overview?.users || {};
    const plans = overview?.plans || {};
    const revenue = overview?.revenue || {};
    const usage = overview?.usage || {};
    const integrations = overview?.integrations || {};
    const risk = overview?.risk || {};
    return [
      { label: 'Total Users', value: n(users.total_users), help: `${n(users.new_users_30d)} new in 30d` },
      { label: 'Paid Subscriptions', value: n(plans.paid_users_total), help: `${n(plans.free_users)} free users` },
      { label: 'Revenue (30d)', value: inr(revenue.revenue_30d_inr), help: `${inr(revenue.total_invoice_revenue_inr)} lifetime` },
      { label: 'AI Operations', value: n(usage.total_ai_credits_used), help: `${n(usage.ai_credits_used_30d)} in 30d` },
      { label: 'Active WhatsApp', value: n(integrations.whatsapp_connected_users), help: `${n(integrations.users_with_no_whatsapp)} pending setup` },
      { label: 'System Errors', value: n(risk.failed_automation_runs_30d), help: 'Failed runs (30d)' },
    ];
  }, [overview]);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
    { id: 'system-health', label: 'System Health', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { id: 'user-growth', label: 'User Growth', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
    { id: 'revenue', label: 'Revenue', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: 'ai-usage', label: 'AI Usage', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> },
    { id: 'integrations', label: 'Integrations', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="8" y="14" rx="2"/></svg> },
    { id: 'risk-queue', label: 'Risk Queue', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> },
    { id: 'audit', label: 'Audit Log', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/></svg> },
    { id: 'users', label: 'User Directory', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </main>
    );
  }

  if (!adminReady) {
    return (
      <AdminLoginGate
        onSuccess={(tok) => {
          setToken(tok);
          setAdminReady(true);
          setLoading(true);
        }}
      />
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Connecting to B9 Core…</p>
          <p className="text-xs text-slate-400 mt-1">Fetching telemetry from localhost:8000</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Connection Failed</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
            <p className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider">Troubleshooting steps</p>
            <ul className="text-[13px] text-slate-600 space-y-2 list-disc list-inside">
              <li>Ensure backend is running: <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[11px]">uvicorn app.main:app</code></li>
              <li>Check your email is in <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[11px]">PLATFORM_ADMIN_EMAILS</code></li>
            </ul>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-xl" onClick={load}>Retry Connection</Button>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
              if (typeof window !== 'undefined') sessionStorage.removeItem(ADMIN_SESSION_KEY);
              setAdminReady(false);
              setMe(null);
              setToken(null);
            }}>Sign Out</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 border-r border-slate-200/80 bg-white flex flex-col z-20">
        <div className="flex h-16 items-center px-6 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-inner">
               <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-[15px] font-bold tracking-wide text-slate-900">B9 Admin</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 shrink-0 mx-3 mb-3 mt-auto rounded-xl bg-slate-50/80 border border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Authenticated</p>
          <p className="text-[13px] font-medium text-slate-800 truncate">{me?.email}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-8 shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="text-[16px] font-semibold text-slate-900">{TABS.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" className="rounded-lg shadow-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50">App Dashboard</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shadow-sm text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-red-600"
              onClick={() => {
                if (typeof window !== 'undefined') sessionStorage.removeItem(ADMIN_SESSION_KEY);
                setAdminReady(false);
                setMe(null);
                setToken(null);
                logout();
              }}
            >
              Sign Out
            </Button>
          </div>
        </header>

        <div key={activeTab} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-white px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[13px] font-medium text-slate-600">Last synchronized: {shortDate(overview?.generated_at)}</p>
            </div>
            <Button variant="secondary" size="sm" className="rounded-lg border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-none" onClick={load}>Refresh Data</Button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
              {topCards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>
          )}

          {activeTab === 'system-health' && (
            <Section title="System Diagnostics">
              <div className="grid gap-4 md:grid-cols-5">
                <StatCard label="Status" value={String(systemHealth?.status || 'unknown')} help={systemHealth?.environment || 'environment unknown'} />
                <StatCard label="Readiness" value={`${n(systemHealth?.readiness_score)}%`} />
                <StatCard label="Failed runs 24h" value={n(systemHealth?.incidents?.failed_runs_24h)} />
                <StatCard label="Failed messages 24h" value={n(systemHealth?.incidents?.failed_messages_24h)} />
                <StatCard label="Webhook errors 24h" value={n(systemHealth?.incidents?.webhook_errors_24h)} />
              </div>
              <div className="mt-5 flex justify-end">
                <Button variant="secondary" size="sm" className="rounded-lg shadow-sm" onClick={loadSystemHealth}>Rerun Diagnostics</Button>
              </div>
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200/60">
                {(systemHealth?.checks || []).length ? (
                  <table className="min-w-[850px] w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Check Identifier</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Severity</th>
                        <th className="px-5 py-3 w-full">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(systemHealth?.checks || []).map((check: any) => (
                        <tr key={check.name} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-800">{check.name}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${check.ok ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20' : 'bg-red-50 text-red-700 ring-red-500/20'}`}>
                              {check.ok ? 'Operational' : 'Failing'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5"><SeverityBadge severity={check.severity} /></td>
                          <td className="px-5 py-3.5 text-slate-500 truncate max-w-sm">{check.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState text="System health telemetry is currently unavailable." />
                )}
              </div>
            </Section>
          )}

          {activeTab === 'user-growth' && (
            <Section title="Acquisition Metrics">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="New Today" value={n(overview?.users?.new_users_today)} />
                <StatCard label="Trailing 7 Days" value={n(overview?.users?.new_users_7d)} />
                <StatCard label="Trailing 30 Days" value={n(overview?.users?.new_users_30d)} />
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/60">
                {(overview?.users?.recent_signups || []).length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Account Profile</th>
                        <th className="px-5 py-3">Tier</th>
                        <th className="px-5 py-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {overview.users.recent_signups.map((user: any) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-[12px] text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 uppercase tracking-wider">{user.plan}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-500">{shortDate(user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState text="No recent acquisition data found." />}
              </div>
            </Section>
          )}

          {activeTab === 'revenue' && (
            <Section title="Financial Overview">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Lifetime Revenue" value={inr(overview?.revenue?.total_invoice_revenue_inr)} />
                <StatCard label="Trailing 30 Days" value={inr(overview?.revenue?.revenue_30d_inr)} />
                <StatCard label="Failed Transactions" value={n(overview?.revenue?.failed_payments)} />
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/60">
                {(overview?.revenue?.recent_invoices || []).length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Invoice Ref</th>
                        <th className="px-5 py-3">Customer</th>
                        <th className="px-5 py-3">Value</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {overview.revenue.recent_invoices.map((invoice: any) => (
                        <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-800">{invoice.invoice_number}</td>
                          <td className="px-5 py-3.5 text-slate-500">{invoice.email || invoice.user_id}</td>
                          <td className="px-5 py-3.5 font-medium">{inr(invoice.amount_inr)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">{invoice.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState text="No financial transactions recorded yet." />}
              </div>
            </Section>
          )}

          {activeTab === 'ai-usage' && (
            <Section title="Compute & AI Resources">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Credits Consumed" value={n(overview?.usage?.total_ai_credits_used)} />
                <StatCard label="30d Tracked Queries" value={n(aiCost?.summary?.estimated_cost_inr ? aiCost?.summary?.lifetime_ai_credits_top_users : overview?.usage?.ai_credits_used_30d)} />
                <StatCard label="Est. Provider Cost (30d)" value={inr(aiCost?.summary?.estimated_cost_inr)} help="Provisional projection" />
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/60">
                {(aiCost?.users || overview?.usage?.top_ai_users || []).length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Account</th>
                        <th className="px-5 py-3">Tier</th>
                        <th className="px-5 py-3 text-right">Credits</th>
                        <th className="px-5 py-3 text-right">Raw Tokens</th>
                        <th className="px-5 py-3 text-right">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(aiCost?.users || overview?.usage?.top_ai_users).map((user: any) => (
                        <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-[12px] text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 uppercase text-[11px] tracking-wider">{user.plan}</td>
                          <td className="px-5 py-3.5 text-right font-medium">{n(user.ai_credits_30d ?? user.ai_credits_used ?? user.lifetime_ai_credits)}</td>
                          <td className="px-5 py-3.5 text-right text-slate-500">{n(user.chat_tokens_30d)}</td>
                          <td className="px-5 py-3.5 text-right text-slate-600">{user.estimated_cost_inr != null ? inr(user.estimated_cost_inr) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState text="No resource usage logged." />}
              </div>
              {aiCost?.summary?.note && <p className="mt-4 text-[12px] text-slate-400 text-center">{aiCost.summary.note}</p>}
            </Section>
          )}

          {activeTab === 'integrations' && (
            <Section title="3rd Party Connector Health">
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard label="Healthy Connections" value={n(integrationHealth?.summary?.healthy)} />
                <StatCard label="Degraded / Attn Req" value={n(integrationHealth?.summary?.needs_attention)} />
                <StatCard label="Unconfigured" value={n(integrationHealth?.summary?.not_connected)} />
                <StatCard label="Webhook Drop Rate" value={n(overview?.integrations?.failed_webhooks)} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] bg-slate-50 p-2 rounded-xl border border-slate-100">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Providers</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="gmail">Gmail</option>
                  <option value="google_sheets">Google Sheets</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="shopify">Shopify</option>
                  <option value="indiamart">IndiaMART</option>
                  <option value="catalog">Catalog</option>
                </select>
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All States</option>
                  <option value="healthy">Healthy</option>
                  <option value="needs_attention">Needs Attention</option>
                  <option value="not_connected">Not Connected</option>
                </select>
                <Button variant="secondary" size="sm" className="rounded-lg shadow-sm" onClick={loadIntegrationHealth}>Filter Registry</Button>
              </div>
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200/60">
                {(integrationHealth?.items || []).length ? (
                  <table className="min-w-[1050px] w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Tenant Profile</th>
                        <th className="px-5 py-3">Service</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Diagnostic Checks</th>
                        <th className="px-5 py-3">Linked Account</th>
                        <th className="px-5 py-3">Sync Horizon</th>
                        <th className="px-5 py-3">Last Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(integrationHealth?.items || []).map((item: any, index: number) => (
                        <tr key={`${item.user_id}-${item.provider}-${index}`} className="align-top hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">{item.name || 'Anonymous'}</p>
                            <p className="text-[12px] text-slate-500">{item.email}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">{item.workspace_name || item.plan}</p>
                          </td>
                          <td className="px-5 py-4 font-medium capitalize text-slate-800">{String(item.provider || '').split('_').join(' ')}</td>
                          <td className="px-5 py-4"><HealthBadge status={item.health} /></td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              <CheckPill label="Auth" value={item.checks?.token_saved} />
                              <CheckPill label="Hook" value={item.checks?.webhook_subscribed} />
                              <CheckPill label="Asset" value={item.checks?.asset_selected} />
                              <CheckPill label="Ping" value={item.checks?.test_passed} />
                            </div>
                            <ProofText proof={item.proof} />
                          </td>
                          <td className="px-5 py-4 text-[13px] text-slate-500 font-mono">{item.account || 'N/A'}</td>
                          <td className="px-5 py-4 text-[13px] text-slate-400">{shortDate(item.last_sync_at || item.updated_at)}</td>
                          <td className="px-5 py-4 text-[12px] text-red-600 max-w-[200px] truncate">{item.last_error || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState text="No integrations match the current criteria." />
                )}
              </div>
            </Section>
          )}

          {activeTab === 'risk-queue' && (
            <Section title="Account Risk & Mitigation">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Total Open Flags" value={n(riskQueue?.summary?.total)} />
                <StatCard label="Critical Severity" value={n(riskQueue?.summary?.high)} />
                <StatCard label="Moderate Severity" value={n(riskQueue?.summary?.medium)} />
                <StatCard label="Failed Executions" value={n(overview?.risk?.failed_automation_runs_30d)} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] bg-slate-50 p-2 rounded-xl border border-slate-100">
                <select
                  value={riskQueueFilter}
                  onChange={(e) => setRiskQueueFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Warning Types</option>
                  <option value="low_credit">Quota Depletion</option>
                  <option value="onboarding_incomplete">Stalled Onboarding</option>
                  <option value="no_whatsapp">Missing Channel</option>
                  <option value="failed_automation">Pipeline Failure</option>
                  <option value="failed_payment">Billing Default</option>
                  <option value="integration_error">Connector Fault</option>
                </select>
                <Button variant="secondary" size="sm" className="rounded-lg shadow-sm" onClick={loadRiskQueue}>Refresh Scanner</Button>
              </div>
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200/60">
                {(riskQueue?.items || []).length ? (
                  <table className="min-w-[1050px] w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Tenant Profile</th>
                        <th className="px-5 py-3">Flag Vector</th>
                        <th className="px-5 py-3">Severity Level</th>
                        <th className="px-5 py-3">Diagnostic Context</th>
                        <th className="px-5 py-3">Recommended SOP</th>
                        <th className="px-5 py-3 text-right">Discovery Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(riskQueue?.items || []).map((item: any) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer align-top hover:bg-slate-50 transition-colors"
                          onClick={() => openUserDetail(item.user_id)}
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">{item.name || 'Anonymous'}</p>
                            <p className="text-[12px] text-slate-500">{item.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">{item.title}</p>
                            <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{String(item.type || '').split('_').join(' ')}</p>
                          </td>
                          <td className="px-5 py-4"><SeverityBadge severity={item.severity} /></td>
                          <td className="px-5 py-4 text-[13px] text-red-600 max-w-[200px] truncate">{item.detail || '-'}</td>
                          <td className="px-5 py-4 text-[13px] text-slate-600">{item.action_hint}</td>
                          <td className="px-5 py-4 text-[12px] text-slate-400 text-right">{shortDate(item.last_seen_at || item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState text="No risk flags identified. System is optimal." />}
              </div>
            </Section>
          )}

          {activeTab === 'audit' && (
            <Section title="Security & Governance Ledger">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Recorded Transactions" value={n(auditEvents?.summary?.total)} />
                <StatCard label="Successful Commits" value={n(auditEvents?.summary?.success)} />
                <StatCard label="Exceptions / Drops" value={n(auditEvents?.summary?.failed)} />
                <StatCard label="Privileged Interventions" value={n(auditEvents?.summary?.admin_actions)} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_180px_auto] bg-slate-50 p-2 rounded-xl border border-slate-100">
                <input
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Query actors, commands, keys"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Outcomes</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="error">Error</option>
                </select>
                <input
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  placeholder="Filter by directive"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <Button variant="secondary" size="sm" className="rounded-lg shadow-sm" onClick={loadAuditEvents}>Poll Ledger</Button>
              </div>
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200/60">
                {(auditEvents?.items || []).length ? (
                  <table className="min-w-[1050px] w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Principal</th>
                        <th className="px-5 py-3">Directive</th>
                        <th className="px-5 py-3">Outcome</th>
                        <th className="px-5 py-3">Target Node</th>
                        <th className="px-5 py-3">Payload Snapshot</th>
                        <th className="px-5 py-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(auditEvents?.items || []).map((event: any) => (
                        <tr
                          key={event.id}
                          className="cursor-pointer align-top hover:bg-slate-50 transition-colors"
                          onClick={() => event.user_id && openUserDetail(event.user_id)}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">{event.name || 'System Auto'}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{event.email || event.user_id || 'unauthenticated'}</p>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-800">{event.action}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${event.status === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20' : 'bg-red-50 text-red-700 ring-red-500/20'}`}>
                              {event.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] text-slate-700">{event.resource_type || '-'}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{event.resource_id || ''}</p>
                          </td>
                          <td className="px-5 py-3.5 text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                            {event.metadata && Object.keys(event.metadata).length
                              ? Object.entries(event.metadata).slice(0, 3).map(([key, value]) => `${key}:${String(value)}`).join(' ')
                              : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-[12px] text-slate-400 text-right">{shortDate(event.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState text="No governance records match the current query." />
                )}
              </div>
            </Section>
          )}

          {activeTab === 'users' && (
            <Section title="Directory & Provisioning">
              <div className="grid gap-3 md:grid-cols-[1fr_160px_180px_190px_auto] bg-slate-50 p-2 rounded-xl border border-slate-100">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Lookup identity or domain"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
                <select
                  value={whatsappFilter}
                  onChange={(e) => setWhatsappFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Routing Any</option>
                  <option value="connected">Active WhatsApp</option>
                  <option value="not_connected">Orphaned / No WA</option>
                </select>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Health Profiles</option>
                  <option value="low_credit">Quota Depletion</option>
                  <option value="failed_runs">Execution Errors</option>
                  <option value="onboarding_incomplete">Stalled Onboarding</option>
                </select>
                <Button variant="secondary" size="sm" className="rounded-lg shadow-sm" onClick={loadUsers} loading={usersLoading}>Scan</Button>
              </div>
              <p className="mt-3 px-1 text-[12px] font-medium text-slate-400 uppercase tracking-wider">{n(usersTotal)} identities localized</p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                {users.length ? (
                  <table className="min-w-[1100px] w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Principal Identity</th>
                        <th className="px-5 py-3">Licensing</th>
                        <th className="px-5 py-3">Consumption</th>
                        <th className="px-5 py-3">Endpoints</th>
                        <th className="px-5 py-3">Ledger</th>
                        <th className="px-5 py-3">Telemetry Flags</th>
                        <th className="px-5 py-3 text-right">Last Pulse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="cursor-pointer align-top hover:bg-slate-50 transition-colors"
                          onClick={() => openUserDetail(user.id)}
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">{user.email}</p>
                            <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">{user.workspace_name || user.company_name || 'Unbound Tenant'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10 uppercase tracking-wider">{user.plan}</span>
                            <p className="mt-1.5 text-[11px] text-slate-500 capitalize">{user.subscription_status || 'unknown'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{user.email_verified ? 'verified' : 'unverified'}</p>
                          </td>
                          <td className="px-5 py-4 text-[12px] text-slate-600 space-y-1">
                            <p className="flex justify-between w-24"><span className="text-slate-400">AI</span><span className="font-semibold text-slate-800">{n(user.ai_credits_used)}</span></p>
                            <p className="flex justify-between w-24"><span className="text-slate-400">Leads</span><span className="font-semibold text-slate-800">{n(user.leads_count)}</span></p>
                            <p className="flex justify-between w-24"><span className="text-slate-400">Flows</span><span className="font-semibold text-slate-800">{n(user.automation_runs)}</span></p>
                          </td>
                          <td className="px-5 py-4 text-[12px] space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.whatsapp?.connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                              <span className={user.whatsapp?.connected ? 'font-medium text-slate-800' : 'text-slate-400'}>WhatsApp</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.facebook_connected ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                              <span className={user.facebook_connected ? 'font-medium text-slate-800' : 'text-slate-400'}>Facebook</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.instagram_connected ? 'bg-pink-500' : 'bg-slate-300'}`}></div>
                              <span className={user.instagram_connected ? 'font-medium text-slate-800' : 'text-slate-400'}>Instagram</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[12px]">
                            {user.latest_invoice ? (
                              <div>
                                <p className="font-semibold text-slate-800">{inr(user.latest_invoice.amount_inr)}</p>
                                <p className="text-slate-500 mt-0.5 capitalize">{user.latest_invoice.status}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No history</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                              {user.low_credit && <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">LOW QUOTA</span>}
                              {user.failed_runs > 0 && <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/10">{user.failed_runs} FAULTS</span>}
                              {!user.whatsapp?.connected && <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">NO ROUTE</span>}
                              {!user.workspace_name && <span className="inline-flex rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/10">PENDING SETUP</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[12px] text-slate-400 text-right">{shortDate(user.last_login_at || user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : usersLoading ? (
                  <div className="py-12"><EmptyState text="Scanning directory structure..." /></div>
                ) : (
                  <div className="py-12"><EmptyState text="No identities localized with these parameters." /></div>
                )}
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Slide-over User Detail Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedUserId(null)}>
          <aside
            className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl rounded-l-3xl border-l border-slate-200/80 animate-in slide-in-from-right-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Identity Inspector</p>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {selectedUser?.profile?.name || selectedUser?.user?.name || 'Resolving profile...'}
                </h2>
                <p className="text-[13px] text-slate-500">{selectedUser?.profile?.email || selectedUser?.user?.email || selectedUserId}</p>
              </div>
              <button onClick={() => setSelectedUserId(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-5 p-8">
                <div className="h-24 animate-pulse rounded-2xl bg-slate-100/60" />
                <div className="h-48 animate-pulse rounded-2xl bg-slate-100/60" />
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100/60" />
              </div>
            ) : selectedUser ? (
              <div className="space-y-6 p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Licensing Tier" value={selectedUser.plan?.plan || selectedUser.user?.plan || 'Unknown'} help={selectedUser.plan?.subscription_status} />
                  <StatCard label="Compute Burn" value={n(selectedUser.quota?.queries_used || selectedUser.user?.ai_credits_used)} help="Cycle billing allocation" />
                  <StatCard label="Pipeline Output" value={n(selectedUser.activity?.leads_total)} help={`${n(selectedUser.activity?.automation_runs_total)} executions`} />
                </div>

                <Section title="Elevated Interventions">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg shadow-sm bg-white border-slate-200"
                      onClick={() => {
                        if (window.confirm('Send a password reset email to this user?')) {
                          runUserAction('send-password-reset').catch(() => undefined);
                        }
                      }}
                    >
                      Trigger Auth Reset
                    </Button>
                    {(selectedUser.profile?.account_status || selectedUser.user?.account_status) === 'suspended' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-lg shadow-sm border-slate-200 text-indigo-600 bg-indigo-50"
                        onClick={() => {
                          if (window.confirm('Unsuspend this user account?')) {
                            runUserAction('unsuspend').catch(() => undefined);
                          }
                        }}
                      >
                        Restore Privileges
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        className="rounded-lg shadow-sm"
                        onClick={() => {
                          if (window.confirm('Suspend this user account? They will lose dashboard access.')) {
                            runUserAction('suspend').catch(() => undefined);
                          }
                        }}
                      >
                        Revoke Access
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg shadow-sm bg-white border-slate-200"
                      onClick={() => {
                        const amount = window.prompt('How many AI credits should be granted?', '500');
                        if (!amount) return;
                        const reason = window.prompt('Reason for this credit grant?', 'Support adjustment') || 'Support adjustment';
                        runUserAction('grant-credits', { amount: Number(amount), reason }).catch(() => undefined);
                      }}
                    >
                      Inject Quota
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg shadow-sm bg-white border-slate-200"
                      onClick={() => {
                        const plan = window.prompt('Set plan: FREE, STARTER, GROWTH, PRO, BUSINESS', selectedUser.plan?.plan || 'STARTER');
                        if (!plan) return;
                        const reason = window.prompt('Reason for plan change?', 'Manual admin adjustment') || 'Manual admin adjustment';
                        runUserAction('change-plan', { plan, reason }).catch(() => undefined);
                      }}
                    >
                      Override License
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg shadow-sm bg-white border-slate-200"
                      onClick={() => {
                        const note = window.prompt('Support note');
                        if (!note) return;
                        runUserAction('support-note', { note }).catch(() => undefined);
                      }}
                    >
                      Attach Ticket Note
                    </Button>
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400">All interventions are immutably written to the governance ledger.</p>
                </Section>

                <Section title="Identity Core">
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="State" value={selectedUser.profile?.account_status || 'active'} />
                    <Info label="Organization" value={selectedUser.profile?.company_name || 'Not localized'} />
                    <Info label="Finance Contact" value={selectedUser.profile?.billing_email || 'Not localized'} />
                    <Info label="Comms Line" value={selectedUser.profile?.phone || 'Not localized'} />
                    <Info label="Platform Tenant ID" value={selectedUser.profile?.tenant_id || 'Not localized'} mono />
                    <Info label="Genesis Time" value={shortDate(selectedUser.profile?.created_at)} />
                    <Info label="Last Check-in" value={shortDate(selectedUser.profile?.last_login_at)} />
                  </div>
                </Section>

                <Section title="Provisioned Namespaces">
                  {(selectedUser.workspaces || []).length ? (
                    <div className="space-y-2">
                      {selectedUser.workspaces.map((workspace: any) => (
                        <div key={workspace.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm">
                          <p className="font-semibold text-slate-900">{workspace.name}</p>
                          <p className="text-[12px] font-mono text-slate-500 mt-1">{workspace.id}</p>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="Tenant lacks bound namespaces." />}
                </Section>

                <Section title="Edge Endpoints">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(selectedUser.integrations || []).map((item: any) => (
                      <div key={item.provider} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-slate-800 capitalize">{item.provider}</p>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${item.connected ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}>
                            {item.connected ? 'Active' : 'Unlinked'}
                          </span>
                        </div>
                        <p className="text-[12px] font-mono text-slate-500 truncate">{item.account || 'Void identifier'}</p>
                        <p className="text-[11px] text-slate-400 mt-2">Pinged {shortDate(item.updated_at || item.last_synced_at)}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Ledger & Quota Txs">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="mb-3 text-[13px] font-semibold text-slate-800 uppercase tracking-wide">Settled Invoices</p>
                      {(selectedUser.billing?.invoices || []).length ? (
                        <div className="space-y-2">
                          {selectedUser.billing.invoices.map((invoice: any) => (
                            <div key={invoice.id} className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold text-slate-900">{inr(invoice.amount_inr)}</p>
                                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{invoice.status}</span>
                              </div>
                              <p className="text-[12px] font-mono text-slate-400">{invoice.invoice_number}</p>
                              <p className="text-[11px] text-slate-400 mt-1">{shortDate(invoice.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="Empty ledger." />}
                    </div>
                    <div>
                      <p className="mb-3 text-[13px] font-semibold text-slate-800 uppercase tracking-wide">Manual Injections</p>
                      {(selectedUser.billing?.topups || []).length ? (
                        <div className="space-y-2">
                          {selectedUser.billing.topups.map((topup: any) => (
                            <div key={topup.id} className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold text-slate-900">{topup.type}</p>
                                <span className="text-[11px] text-slate-500 font-mono">{n(topup.remaining)} bal</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-2">Executed {shortDate(topup.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No external injections." />}
                    </div>
                  </div>
                </Section>

                <Section title="Delegated Actors">
                  {(selectedUser.team || []).length ? (
                    <div className="space-y-2">
                      {selectedUser.team.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                          <div>
                            <p className="font-medium text-slate-900">{member.display_name || member.email}</p>
                            <p className="text-[12px] text-slate-500">{member.email}</p>
                          </div>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-500/10 uppercase tracking-wider">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="Sole proprietor / No delegates." />}
                </Section>

                <Section title="Telemetry Faults">
                  {(selectedUser.recent_errors || []).length ? (
                    <div className="space-y-2">
                      {selectedUser.recent_errors.map((run: any) => (
                        <div key={run.id} className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
                          <p className="font-semibold text-red-800">{run.intent || 'Pipeline Sequence'} Interrupted</p>
                          <p className="text-[13px] text-red-600 mt-1 font-mono">{run.error_message || run.status}</p>
                          <p className="text-[11px] text-red-400 mt-2">{shortDate(run.started_at)}</p>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="Zero faults isolated." />}
                </Section>

                <Section title="Operation Stream">
                  {(selectedUser.audit_events || []).length ? (
                    <div className="space-y-2">
                      {selectedUser.audit_events.map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
                          <div>
                            <p className="font-semibold text-slate-800 text-[13px]">{event.action}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{event.resource_type || 'platform.core'}</p>
                          </div>
                          <p className="text-[11px] text-slate-400">{shortDate(event.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="Stream silent." />}
                </Section>
              </div>
            ) : (
              <div className="p-8"><EmptyState text="Entity resolution failed." /></div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{label}</p>
      <p className={`text-sm font-medium text-slate-900 ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</p>
    </div>
  );
}
