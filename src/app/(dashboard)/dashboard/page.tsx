'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  ChevronRight,
  FileText,
  Globe,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { HelpTip } from '@/components/help-tip';
import { TopUpModal } from '@/components/top-up-modal';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { useQuota } from '@/hooks/useQuota';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { BusinessProfile } from '@/types';
import { IndustryPack } from '@/lib/industry-packs';

interface OnboardingStatus {
  is_complete: boolean;
  profile?: BusinessProfile | null;
  industry_pack?: IndustryPack;
  health?: {
    score: number;
    completed: number;
    total: number;
    checks: Array<{ key: string; label: string; done: boolean }>;
  };
}

// Plan limits lookup — used as fallback when quota API returns 0 or fails
const PLAN_LIMITS_FALLBACK: Record<string, { queries: number; storage_mb: number; automations_day: number; leads_day: number }> = {
  FREE:     { queries: 30,    storage_mb: 50,     automations_day: 0,      leads_day: 0 },
  STARTER:  { queries: 1000,  storage_mb: 2048,   automations_day: 1000,   leads_day: 100 },
  GROWTH:   { queries: 5000,  storage_mb: 10240,  automations_day: 5000,   leads_day: 1000 },
  PRO:      { queries: 20000, storage_mb: 25600,  automations_day: 25000,  leads_day: 5000 },
  BUSINESS: { queries: 50000, storage_mb: 102400, automations_day: 999999, leads_day: 999999 },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { quota } = useQuota();
  const planAccess = usePlanAccess();
  const push = usePushNotifications();

  // Derive plan limits — prefer live API limits, fall back to static map
  const planKey = ((quota?.plan || user?.plan || 'FREE') as string).toUpperCase();
  const planFallback = PLAN_LIMITS_FALLBACK[planKey] ?? PLAN_LIMITS_FALLBACK.FREE;
  const { get } = useApi();
  const [apiLimits, setApiLimits] = useState<any>(null);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [automationStats, setAutomationStats] = useState({
    leads_captured: 0,
    automations_run: 0,
    pending_tasks: 0,
    whatsapp_drafts: 0,
    whatsapp_sent: 0,
    hot_leads: 0,
    warm_leads: 0,
    cold_leads: 0,
    website_leads: 0,
    whatsapp_leads: 0,
    hours_saved: 0,
    revenue_potential: 0,
    latest_conversations: [] as any[],
    widget_status: null as any,
    whatsapp_connection_status: null as any,
  });
  const [readiness, setReadiness] = useState<any>(null);
  const [command, setCommand] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('push_banner_dismissed') === 'true'
  );
  const [hotLeadDismissed, setHotLeadDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ts = localStorage.getItem('hot_lead_banner_dismissed_at');
    if (!ts) return false;
    // Auto-show again after 8 hours so user sees new hot leads
    return Date.now() - parseInt(ts) < 8 * 3600 * 1000;
  });
  const [getStartedDismissed, setGetStartedDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('get_started_dismissed') === 'true'
  );
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return false;
    return searchParams?.get('welcome') === '1' && !localStorage.getItem('welcome_dismissed');
  });
  const [liveStats, setLiveStats] = useState<{
    leads_hour?: number; leads_today?: number;
    wa_messages_hour?: number; automations_today?: number; pending_tasks?: number;
  }>({});
  const [teamMe, setTeamMe] = useState<{ role?: string; is_owner?: boolean; assigned_only?: boolean; permissions?: string[] } | null>(null);

  const health = onboarding?.health;
  const readinessScore = readiness?.score ?? health?.score ?? 0;
  const readinessChecks = readiness?.checks || health?.checks || [];
  const nextFix = readinessChecks.find((item: any) => !item.done);
  const nextFixHref = getFixHref(nextFix?.key);
  const hasNoBusinessData =
    (quota?.queries_used ?? 0) === 0 &&
    automationStats.leads_captured === 0 &&
    automationStats.automations_run === 0 &&
    automationStats.whatsapp_drafts === 0 &&
    automationStats.pending_tasks === 0;

  const loadDashboard = () => {
    setStatsError(false);
    // Silence network errors for these background fetches — the statsError banner handles it
    const silentGet = (url: string) => get(url).catch((e: any) => {
      if (!e.response) return { data: null }; // network error — handled by banner
      throw e;
    }).catch(() => ({ data: null }));

    // Fetch live plan limits from backend (replaces hardcoded PLAN_LIMITS_FALLBACK)
    silentGet('/api/billing/limits').then(r => { if (r?.data?.limits) setApiLimits(r.data.limits); });

    Promise.allSettled([
      silentGet('/api/analytics/dashboard'),
      silentGet('/api/automation/onboarding/status'),
      silentGet('/api/automation/readiness'),
      silentGet('/api/team/me'),
    ]).then(([statsResult, onbResult, readResult, teamResult]) => {
      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : { data: null };
      const onbRes   = onbResult.status === 'fulfilled'   ? onbResult.value   : { data: null };
      const readRes  = readResult.status === 'fulfilled'  ? readResult.value  : { data: null };
      const teamRes  = teamResult.status === 'fulfilled'  ? teamResult.value  : { data: null };
      if (statsRes.data) {
        const d = statsRes.data;
        setAutomationStats({
          leads_captured: d.leads_captured || 0,
          automations_run: d.automations_run || 0,
          pending_tasks: d.pending_tasks || 0,
          whatsapp_drafts: d.whatsapp_drafts || 0,
          whatsapp_sent: d.whatsapp_sent || 0,
          hot_leads: d.hot_leads || 0,
          warm_leads: d.warm_leads || 0,
          cold_leads: d.cold_leads || 0,
          website_leads: d.website_leads || 0,
          whatsapp_leads: d.whatsapp_leads || 0,
          hours_saved: d.hours_saved || 0,
          revenue_potential: d.estimated_revenue_potential || 0,
          latest_conversations: d.latest_conversations || [],
          widget_status: d.widget_status || null,
          whatsapp_connection_status: d.whatsapp_connection_status || null,
        });
      } else {
        // Don't block the page — just mark for retry
        setStatsError(true);
      }
      if (onbRes.data) {
        setOnboarding(onbRes.data);
      } else {
        setOnboarding({ is_complete: false });
      }
      if (readRes.data) setReadiness(readRes.data);
      if (teamRes.data) setTeamMe(teamRes.data);
      // Fetch Meta Status if WhatsApp is connected
      if (statsRes.data?.whatsapp_connection_status?.send_enabled) {
        silentGet('/api/integrations/whatsapp/meta-status').then(r => {
          if (r?.data?.connected) setMetaStatus(r.data);
        });
      }
    });
  };

  useEffect(() => {
    loadDashboard();

    // Live SSE counter — auth-cookie is sent automatically (no token in URL)
    // Note: EventSource API doesn't support custom headers; cookie-based auth is the safe alternative
    const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    // Use withCredentials so the auth-token cookie is sent — avoids JWT exposure in URL/logs
    const es = new EventSource(`${base}/api/analytics/live`, { withCredentials: true });
    es.onmessage = (e) => {
      try { setLiveStats(JSON.parse(e.data)); } catch { /* ignore */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runCommand = () => {
    if (!command.trim()) {
      toast.error('Type a command first — e.g. "Send follow-up to today\'s leads"');
      return;
    }
    // Navigate to AI Chat in automation mode with the typed command pre-filled
    router.push(`/dashboard/chat?mode=automation&q=${encodeURIComponent(command.trim())}`);
  };

  return (
    <div className="space-y-6">
      {/* Persistent setup banner — shown until all 4 steps done */}
      {readinessScore < 100 && (
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {readiness === null
                  ? 'Checking setup status…'
                  : readinessScore === 0
                  ? 'Setup not started yet'
                  : `Setup ${readinessScore}% complete${readinessChecks.filter((c: any) => !c.done).length > 0 ? ` — ${readinessChecks.filter((c: any) => !c.done).length} steps remaining` : ''}`
                }
              </p>
              <p className="text-xs text-gray-400">Complete setup to start receiving automated leads and messages</p>
            </div>
          </div>
          <Link
            href="/dashboard/onboarding"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
          >
            Continue Setup <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Get Started card — shown to new users with no data, dismissable */}
      {hasNoBusinessData && !getStartedDismissed && (
        <div className="relative rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
          <button
            onClick={() => { setGetStartedDismissed(true); if(typeof window!=='undefined') localStorage.setItem('get_started_dismissed','true'); }}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-orange-100 hover:text-gray-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold text-gray-900">WhatsApp bot 5 minute mein ready karo</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', icon: '🔗', title: 'Connect WhatsApp', desc: 'Connect your Meta account to get started', href: '/dashboard/integrations', cta: 'Connect →' },
              { step: '2', icon: '⚡', title: 'Build Automation', desc: 'Generate a flow in 2 minutes with AI', href: '/dashboard/automations', cta: 'Build Flow →' },
              { step: '3', icon: '✅', title: 'Test It', desc: 'Send a test message to your number', href: '/dashboard/messages', cta: 'Test Now →' },
            ].map(s => (
              <Link key={s.step} href={s.href}
                className="flex items-start gap-3 rounded-xl bg-white border border-orange-100 p-3.5 hover:border-orange-300 hover:shadow-sm transition group">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-black text-white">{s.step}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{s.icon} {s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  <p className="text-xs font-semibold text-orange-600 mt-1.5 group-hover:underline">{s.cta} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Welcome checklist shown once after onboarding. */}
      {showWelcome && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-indigo-800">Workspace ready. Here are your next 4 steps:</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  { step: '1', label: 'Test your AI assistant', href: '/dashboard/chat' },
                  { step: '2', label: 'Upload business knowledge', href: '/dashboard/documents' },
                  { step: '3', label: 'Connect WhatsApp', href: '/dashboard/integrations' },
                  { step: '4', label: 'Build your first automation', href: '/dashboard/automations' },
                ].map((item) => (
                  <Link key={item.step} href={item.href}
                    className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition">
                    <span>{item.step}. {item.label}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Link>
                ))}
              </div>
            </div>
            <button onClick={() => {
              setShowWelcome(false);
              if (typeof window !== 'undefined') localStorage.setItem('welcome_dismissed', 'true');
            }} className="shrink-0 text-indigo-400 hover:text-indigo-700 text-lg leading-none">✕</button>
          </div>
        </div>
      )}
      {/* Push notification opt-in banner. */}
      {teamMe && ['agent', 'senior_agent', 'viewer'].includes(teamMe.role || '') && (
        <Card className="border-indigo-100 bg-indigo-50/70 shadow-sm" hoverable={false}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-indigo-950">Agent workspace</p>
              <p className="mt-1 text-sm text-indigo-700">
                Role: <span className="font-semibold capitalize">{teamMe.role || 'agent'}</span>
                {teamMe.assigned_only ? ' - assigned customer work only' : ' - broader workspace access enabled'}
              </p>
            </div>
            <Link href="/dashboard/leads" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100">
              Open my leads
            </Link>
          </div>
        </Card>
      )}
      {push.supported && !push.subscribed && push.permission !== 'denied' && !pushDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="font-medium">Get instant alerts for new leads and payments, even when the tab is closed.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={push.subscribe}
              disabled={push.loading}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {push.loading ? 'Enabling...' : 'Enable'}
            </button>
            <button onClick={() => {
              setPushDismissed(true);
              if (typeof window !== 'undefined') localStorage.setItem('push_banner_dismissed', 'true');
            }} className="text-blue-400 hover:text-blue-700 text-base leading-none px-1">x</button>
          </div>
        </div>
      )}

      {statsError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-800">
          <span>Stats could not load. Showing cached data.</span>
          <button type="button" className="shrink-0 font-semibold underline" onClick={loadDashboard}>Retry</button>
        </div>
      )}

      {/* 🔥 Hot Lead Alert Banner */}
      {automationStats.hot_leads > 0 && !hotLeadDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 text-sm text-red-800 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="font-bold">🔥 {automationStats.hot_leads} hot lead{automationStats.hot_leads > 1 ? 's' : ''} need attention!</span>
            <span className="hidden sm:inline text-red-600 text-xs">Follow up now while they're still warm.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/leads?score=hot" className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition">
              View Hot Leads →
            </Link>
            <button
              type="button"
              onClick={() => {
                setHotLeadDismissed(true);
                if (typeof window !== 'undefined') localStorage.setItem('hot_lead_banner_dismissed_at', Date.now().toString());
              }}
              className="text-xs text-red-400 hover:text-red-600 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Low AI credit warning banner. */}
      {(() => {
        const remaining = planFallback.queries - (quota?.queries_used ?? 0);
        if (!quota || remaining > 100) return null;
        const isCritical = remaining <= 20;
        return (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${isCritical ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full animate-pulse ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="font-semibold">
                {isCritical ? 'Critical:' : 'Low credits:'} Only {Math.max(0, remaining).toLocaleString('en-IN')} AI credits left this month.
              </span>
              <Link href="/dashboard/settings" className="hidden text-xs font-semibold underline opacity-75 hover:opacity-100 sm:inline">Add BYOK key</Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${isCritical ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
              >
                Buy top-up
              </button>
            </div>
          </div>
        );
      })()}

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 p-5 text-white shadow-xl shadow-black/30 lg:p-6">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-28 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.28fr_0.72fr]">
          <div>
            <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
              Manage customer conversations, leads, and follow-ups from one AI command center.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
              Welcome back, {user?.name || 'there'}. Your B9 workspace is ready to answer customers, capture leads, and prepare next actions.
            </p>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-2.5 backdrop-blur md:flex-row">
              <label className="group flex min-w-0 flex-1 cursor-text items-center gap-3 rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white shadow-inner shadow-black/30 transition-all hover:border-white/20 focus-within:border-white/20 focus-within:bg-slate-950">
                <Search className="h-5 w-5 shrink-0 text-cyan-300 transition-transform group-focus-within:scale-105" />
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="b9-command-input block min-w-0 flex-1 bg-transparent text-sm text-white caret-cyan-300 outline-none ring-0 selection:bg-cyan-500/20 selection:text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  placeholder="Ask B9 to draft follow-ups, create a proposal, summarize leads, or test WhatsApp..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <Link href={`/dashboard/chat${command ? `?mode=automation&q=${encodeURIComponent(command)}` : ''}`}>
                <Button onClick={runCommand} className="h-full w-full justify-center md:w-auto" title="Open Automation Chat with this command">
                  <Sparkles className="h-4 w-4" />
                  Open in AI Chat {'->'}
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-300">Launch readiness</p>
                <p className="mt-1 text-5xl font-black">
                  {readiness === null ? <span className="text-3xl text-gray-400">-</span> : `${readinessScore}%`}
                </p>
              </div>
              <ShieldCheck className="h-11 w-11 text-emerald-300" />
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400" style={{ width: `${Math.min(readinessScore, 100)}%` }} />
            </div>
            <p className="mt-4 text-sm font-semibold capitalize text-cyan-100">
              {(readiness?.launch_status || 'setup_needed').split('_').join(' ')}
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-300">
              Complete documents, widget, WhatsApp, and automation checks before going live.
            </p>
            {nextFix && (
              <Link href={nextFixHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20">
                Fix next: {nextFix.action || nextFix.label || 'Open setup'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Current plan</p>
              <h2 className="mt-1 text-3xl font-black text-gray-950">{planAccess.currentPlan}</h2>
            </div>
            <div className="flex gap-2">
              {/* Show Buy top-up only when credits are low */}
              {quota && (quota.queries_used / (quota.queries_limit || planFallback.queries)) > 0.7 && (
                <Button variant="secondary" onClick={() => setTopUpOpen(true)}>Buy top-up</Button>
              )}
              {/* Show Upgrade only when not on top plan */}
              {planAccess.currentPlan !== 'BUSINESS' && (
                <Link href="/dashboard/billing"><Button variant="secondary">Upgrade</Button></Link>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <UsageMeter label="AI queries" used={quota?.queries_used || 0} limit={quota?.queries_limit || apiLimits?.queries || planFallback.queries} />
            <UsageMeter label="Automation runs" used={quota?.automation_executions_used || quota?.usage?.automation_executions_used || 0} limit={quota?.automation_executions_limit || apiLimits?.automation_executions_day || planAccess.billing?.quotas?.automation_executions_day || planFallback.automations_day} />
            <UsageMeter label="Leads today" used={quota?.leads_today || quota?.usage?.leads_today || 0} limit={quota?.leads_limit || apiLimits?.leads_day || planAccess.billing?.quotas?.leads_day || planFallback.leads_day} />
            <UsageMeter label="Storage" used={Math.round(quota?.storage_used_mb || 0)} limit={quota?.storage_limit_mb || apiLimits?.storage_mb || planFallback.storage_mb} suffix="MB" />
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Plan guidance</h2>
          <p className="mt-2 text-sm text-gray-600">
            Upgrade only when your AI starts generating leads. Top-ups help when one usage metric spikes without changing plan.
          </p>
          <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-white">
            <p className="font-bold">WhatsApp note</p>
            <p className="mt-1 text-slate-300">Meta conversation charges are not included and are paid directly to Meta.</p>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Conversations', value: quota?.queries_used ?? 0, icon: MessageCircle, href: '/dashboard/chat', help: 'Customer conversations handled by your AI.', action: 'Open Chat' },
          { label: 'Leads Captured', value: automationStats.leads_captured, icon: Users, href: '/dashboard/leads', help: 'Contacts captured from chatbot, widget, or automation.', action: 'View Leads', badge: liveStats.leads_hour ? `🔴 ${liveStats.leads_hour} last hour` : quota?.leads_today ? `${quota.leads_today} today` : null },
          { label: 'Leads Breakdown', value: automationStats.hot_leads, icon: Target, href: '/dashboard/leads', help: `Hot: ${automationStats.hot_leads} | Web: ${automationStats.website_leads} | WhatsApp: ${automationStats.whatsapp_leads}`, action: 'View All Leads', sublabel: `${automationStats.hot_leads} hot · ${automationStats.website_leads} web · ${automationStats.whatsapp_leads} WA` },
          { label: 'Automations Run', value: liveStats.automations_today ?? automationStats.automations_run, icon: Workflow, href: '/dashboard/automations', help: 'AI workflows executed for leads, content, tasks, and follow-ups.', action: 'Build Workflow', badge: liveStats.wa_messages_hour ? `💬 ${liveStats.wa_messages_hour} WA msgs/hr` : null },
          { label: 'WhatsApp Drafts', value: automationStats.whatsapp_drafts, icon: MessageCircle, href: '/dashboard/messages', help: 'Messages ready to send once WhatsApp is connected or approved.', action: 'Review Drafts' },
          { label: 'Pending Tasks', value: automationStats.pending_tasks, icon: CheckSquare, href: '/dashboard/tasks', help: 'Follow-up tasks waiting for owner or team action.', action: 'Open Tasks' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} title={stat.help} className="block h-full">
              <Card className="flex h-full min-h-40 flex-col justify-between border-gray-200 shadow-sm" hoverable>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-500">{stat.label}</p>
                      {(stat as any).badge && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {(stat as any).badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-4xl font-black leading-none text-gray-950">{stat.value}</p>
                    {(stat as any).sublabel && (
                      <p className="mt-1 text-xs text-gray-400">{(stat as any).sublabel}</p>
                    )}
                    {stat.value === 0 && (
                      <p className="mt-2 text-xs font-medium text-gray-400">Waiting for first activity</p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-primary-600 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <div className="min-w-0 text-xs text-gray-500 line-clamp-2">
                    {stat.value === 0 ? getZeroStateCopy(stat.label) : stat.help}
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary-600">
                    {stat.action}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-950">Channel Status</h2>
            <HelpTip text="Website widget and WhatsApp bot readiness for Phase 1 channels." />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/widgets" className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50">
              <div className="flex items-center justify-between">
                <Globe className="h-5 w-5 text-primary-600" />
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${automationStats.widget_status?.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {automationStats.widget_status?.enabled ? 'Live-ready' : 'Setup needed'}
                </span>
              </div>
              <p className="mt-4 font-bold text-gray-950">Website Widget</p>
              <p className="mt-1 text-sm text-gray-600">{automationStats.widget_status?.active_domains || 0} allowed domains active</p>
            </Link>
            {/* WhatsApp Status / Meta Status Card */}
            {automationStats.whatsapp_connection_status?.send_enabled && metaStatus ? (
              /* ── Connected: Show Meta Status ── */
              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-700">WhatsApp Live</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meta Status</span>
                </div>

                {/* Tier */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tier</span>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">{metaStatus.tier?.label ?? 'N/A'}</span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 rounded-full" />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 rounded-full transition-all"
                      style={{ width: `calc(${Math.max(0, ((metaStatus.tier?.step ?? 0) / 5) * 100)}% - 4px)` }} />
                    {['N/A','250','2K','10K','100K','∞'].map((t, i) => (
                      <div key={t} className="relative z-10 flex flex-col items-center" style={{ flex: 1 }}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold border transition-all ${
                          i < (metaStatus.tier?.step ?? 0) ? 'border-blue-500 bg-blue-500 text-white' :
                          i === (metaStatus.tier?.step ?? 0) ? 'border-blue-500 bg-white text-blue-600 ring-1 ring-blue-200' :
                          'border-gray-300 bg-white text-gray-400'}`}>
                          {i < (metaStatus.tier?.step ?? 0) ? '✓' : i + 1}
                        </div>
                        <p className="mt-0.5 text-[8px] text-gray-400">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating + Verification row */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Quality Rating</p>
                    <span className={`text-xs font-black ${metaStatus.rating?.color === 'green' ? 'text-emerald-600' : metaStatus.rating?.color === 'yellow' ? 'text-amber-600' : metaStatus.rating?.color === 'red' ? 'text-red-500' : 'text-gray-500'}`}>
                      {metaStatus.rating?.label ?? 'NA'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Verification</p>
                    <span className="text-[10px] font-black text-gray-700 leading-tight">{metaStatus.verification?.label ?? 'Not Verified'}</span>
                  </div>
                </div>

                {/* 24h stats + actions */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                  <span>📤 {metaStatus.messageSent24h ?? 0} sent</span>
                  <span>📥 {metaStatus.msgReceived24h ?? 0} received</span>
                  <span className="text-gray-300">last 24h</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/messages" className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                    Inbox
                  </Link>
                  <Link href="/dashboard/integrations" className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                    Full Details
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Not Connected: Simple connect card ── */
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Not connected</span>
                </div>
                <p className="mt-3 font-bold text-gray-950">WhatsApp Bot</p>
                <p className="mt-1 text-sm text-gray-500">Connect your WhatsApp Business number to enable live messaging and see Meta Status here.</p>
                <Link href="/dashboard/integrations" className="mt-3 block w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-700 hover:bg-orange-100 transition">
                  Connect WhatsApp →
                </Link>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-3 text-center text-white">
            <div><p className="text-2xl font-black">{automationStats.hot_leads}</p><p className="text-xs text-red-200">Hot</p></div>
            <div><p className="text-2xl font-black">{automationStats.warm_leads}</p><p className="text-xs text-amber-200">Warm</p></div>
            <div><p className="text-2xl font-black">{automationStats.cold_leads}</p><p className="text-xs text-sky-200">Cold</p></div>
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-950">Latest Conversations</h2>
            <Link href="/dashboard/leads" className="text-sm font-bold text-primary-600">Open Inbox</Link>
          </div>
          <div className="mt-5 space-y-3">
            {automationStats.latest_conversations.length === 0 ? (
              <div className="rounded-xl bg-blue-50 p-5 text-sm text-gray-700">
                <p className="font-semibold mb-1">No conversations yet</p>
                <p className="text-gray-500">Add your widget embed code to your website (go to <a href="/dashboard/widgets" className="text-primary-600 font-semibold underline">Widgets</a>), or connect Facebook Lead Ads / WhatsApp in <a href="/dashboard/integrations" className="text-primary-600 font-semibold underline">Integrations</a> to start capturing leads here.</p>
              </div>
            ) : (
              automationStats.latest_conversations.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold capitalize text-gray-700">{item.channel}</span>
                    <span className="text-xs text-gray-500">{new Date(item.updated_at).toLocaleString()}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-700">{item.latest_message || 'No message yet'}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {hasNoBusinessData && (
        <section>
          <Card className="border-gray-200 shadow-sm" hoverable={false}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start here
                </div>
                <h2 className="mt-3 text-2xl font-bold text-gray-950">Your dashboard is ready. Add your first business signal.</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Start with documents, test chat, then enable a lead automation. This turns the dashboard from empty metrics into useful business activity.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { href: '/dashboard/documents', icon: FileText, title: 'Upload Knowledge', text: 'Add fees, services, pricing, policies, FAQs, or brochures.' },
                { href: '/dashboard/chat', icon: MessageCircle, title: 'Test AI Chat', text: 'Ask a real customer question and check the answer quality.' },
                { href: '/dashboard/automations', icon: Workflow, title: 'Enable Lead Flow', text: 'Create a follow-up workflow for new website leads.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-blue-50 p-2 text-primary-600 ring-1 ring-blue-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="mt-4 font-bold text-gray-950">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.text}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        </section>
      )}

    </div>
  );
}

function UsageMeter({ label, used, limit, suffix = '' }: { label: string; used: number; limit: number; suffix?: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isBlocked = limit === 0;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        <p className="text-xs font-semibold text-gray-500">{isBlocked ? 'Locked' : `${pct}%`}</p>
      </div>
      <p className="mt-2 text-lg font-black text-gray-950">
        {used.toLocaleString('en-IN')}{suffix ? ` ${suffix}` : ''} / {limit ? limit.toLocaleString('en-IN') : 0}{suffix ? ` ${suffix}` : ''}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${pct > 85 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


function getZeroStateCopy(label: string) {
  const copy: Record<string, string> = {
    Conversations: 'Start by testing your AI chat.',
    'Leads Captured': 'Enable widget or lead capture first.',
    'Hot Leads': 'Hot leads appear after lead scoring.',
    'Website Leads': 'Website widget leads appear here.',
    'WhatsApp Leads': 'WhatsApp bot leads appear here.',
    'Automations Run': 'Run or test your first workflow.',
    'WhatsApp Drafts': 'Create follow-up drafts from leads.',
    'Pending Tasks': 'Tasks appear after follow-up actions.',
  };
  return copy[label] || 'No activity yet.';
}

function getFixHref(key?: string) {
  if (!key) return '/dashboard/launch';
  if (key.includes('document')) return '/dashboard/documents';
  if (key.includes('widget')) return '/dashboard/widgets';
  if (key.includes('whatsapp')) return '/dashboard/messages';
  if (key.includes('automation') || key.includes('workflow')) return '/dashboard/automations';
  if (key.includes('lead')) return '/dashboard/leads';
  if (key.includes('integration')) return '/dashboard/integrations';
  return '/dashboard/launch';
}
