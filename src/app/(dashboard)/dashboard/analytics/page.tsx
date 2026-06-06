'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { useAnalyticsDashboard } from '@/hooks/useQueryCache';
import { useAuthStore } from '@/store/authStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { Activity, Bot, CheckCheck, Clock, IndianRupee, MessageCircle, MessageSquare, Send, Target, TrendingUp, Users, Zap, Lock } from 'lucide-react';

type UsageTrend = {
  date: string;
  queries: number;
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isStarterOrFree = ['FREE', 'STARTER'].includes((user?.plan || 'FREE').toUpperCase());
  const [impact, setImpact] = useState<any>(null);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [templatePerf, setTemplatePerf] = useState<any>(null);
  const [waStats, setWaStats] = useState<any>(null);
  const [businessMetrics, setBusinessMetrics] = useState<any>(null);
  const [globalDays, setGlobalDays] = useState(30);
  const [waDays, setWaDays] = useState(30);
  const [waLoading, setWaLoading] = useState(false);
  const [waQuality, setWaQuality] = useState<{score: string; rating: string; display_phone: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaignRevenue, setCampaignRevenue] = useState<any>(null);
  const [botDeflection, setBotDeflection] = useState<any>(null);
  const [teamPerf, setTeamPerf] = useState<any>(null);
  const { get } = useApi();

  // Dashboard metrics — React Query cached (60s stale, no refetch on nav)
  const { data: dashboard, isLoading: dashLoading } = useAnalyticsDashboard(globalDays);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const safe = (p: Promise<any>) => p.catch(e => {
          const status = e?.response?.status;
          if (status === 402 || status === 403) return { data: null, _plan_locked: true };
          return { data: null };
        });
        const [trendsRes, impactRes, funnelRes, templatesRes, waRes, businessRes, campaignRevRes, deflectionRes, teamRes] = await Promise.all([
          safe(get(`/api/analytics/usage-trends?days=${globalDays}`)),
          safe(get(`/api/analytics/business-impact?days=${globalDays}`)),
          safe(get(`/api/analytics/funnel?days=${globalDays}`)),
          safe(get(`/api/analytics/template-performance?days=${globalDays}`)),
          safe(get(`/api/analytics/whatsapp?days=${globalDays}`)),
          safe(get(`/api/analytics/business-metrics?days=${globalDays}`)),
          safe(get(`/api/analytics/campaign-revenue?days=${globalDays}`)),
          safe(get(`/api/analytics/bot-deflection?days=${globalDays}`)),
          safe(get(`/api/analytics/team-performance?days=${globalDays}`)),
        ]);
        // Always use safe fallbacks — null data from 402/plan-lock would crash charts
        setTrends(trendsRes.data ?? []);
        setImpact(impactRes.data ?? null);
        setFunnel(funnelRes.data ?? null);
        setTemplatePerf(templatesRes.data ?? []);
        setWaStats(waRes.data ?? null);
        setWaDays(globalDays);
        setBusinessMetrics(businessRes.data ?? null);
        setCampaignRevenue(campaignRevRes.data ?? null);
        setBotDeflection(deflectionRes.data ?? null);
        setTeamPerf(teamRes.data ?? null);
        // Inline plan-lock indicator instead of disappearing toast
        const anyLocked = [trendsRes, impactRes, funnelRes, campaignRevRes, deflectionRes, teamRes].some((r: any) => r?._plan_locked);
        if (anyLocked) toast('Upgrade to GROWTH to unlock full analytics', { duration: 5000 });
      } catch {
        toast.error('Failed to load analytics — check your connection');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {};
  }, [globalDays]); // eslint-disable-line

  // Sync loading state with React Query
  useEffect(() => {
    if (!dashLoading) setLoading(false);
  }, [dashLoading]);

  // WA-specific reload (kept for backward compat with WA section filter)
  useEffect(() => {
    if (loading || waDays === globalDays) return;
    setWaLoading(true);
    get(`/api/analytics/whatsapp?days=${waDays}`)
      .then(r => setWaStats(r.data))
      .catch(() => {})
      .finally(() => setWaLoading(false));
  }, [waDays]); // eslint-disable-line

  // Fetch WhatsApp quality score from Meta
  useEffect(() => {
    const timer = window.setTimeout(() => {
      get('/api/analytics/whatsapp-quality')
        .then(r => { if (r.data?.score) setWaQuality(r.data); })
        .catch(() => {});
    }, 500);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line

  // While loading, show header skeleton so H1 "Analytics" is always visible
  if (loading) {
    return (
      <div className="space-y-8">
        {isStarterOrFree && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-amber-900">Analytics requires Growth plan</p>
            </div>
            <a href="/dashboard/billing" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition">Upgrade &rarr;</a>
          </div>
        )}
        <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-bold text-gray-950">Analytics</h1>
          <p className="mt-2 text-gray-600">Track conversations, leads, automations, saved time, and launch readiness.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const impactCards = [
    { label: 'Total Conversations', value: dashboard?.total_sessions || 0, icon: MessageCircle, color: 'text-sky-600 bg-sky-50' },
    { label: 'Leads Generated', value: dashboard?.leads_captured || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Hot Leads', value: dashboard?.hot_leads || 0, icon: Target, color: 'text-red-600 bg-red-50' },
    { label: 'Conversion Rate', value: `${dashboard?.lead_conversion_rate || 0}%`, icon: Activity, color: 'text-primary-600 bg-orange-50' },
    { label: 'Hours Saved', value: `${dashboard?.hours_saved || 0}h`, icon: Clock, color: 'text-violet-600 bg-violet-50' },
    { label: 'Revenue Potential', value: `Rs ${Number(dashboard?.estimated_revenue_potential || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-700 bg-amber-50' },
    { label: 'Automations Run', value: dashboard?.automations_run || 0, icon: Zap, color: 'text-primary-600 bg-orange-50' },
    { label: 'Bot Accuracy', value: dashboard?.bot_accuracy_score == null ? 'No data' : `${dashboard.bot_accuracy_score}%`, icon: Bot, color: 'text-green-700 bg-green-50' },
  ];

  const leadScoreData = Object.entries(impact?.lead_score_breakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Plan gate banner for STARTER/FREE */}
      {isStarterOrFree && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Analytics requires Growth plan</p>
              <p className="text-xs text-amber-700">You are seeing limited data (last 7 days only). Upgrade to Growth for full analytics, team performance, funnel view, and campaign revenue tracking.</p>
            </div>
          </div>
          <a href="/dashboard/billing" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition">
            Upgrade →
          </a>
        </div>
      )}
      <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-orange-100 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-gray-950">Analytics</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Track conversations, leads, automations, saved time, and launch readiness in one place.
            </p>
          </div>
          {/* Global date range selector — reloads ALL sections */}
          <div className="flex flex-col items-end gap-2 self-start mt-1">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              {[7, 14, 30, 90].map(d => (
                <button key={d}
                  onClick={() => setGlobalDays(d)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${globalDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {d}d
                </button>
              ))}
              {loading && <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin ml-1" />}
            </div>
            {/* Custom date range */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-medium">Custom:</span>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                onChange={e => {
                  if (e.target.value) {
                    const from = new Date(e.target.value);
                    if (from > new Date()) return; // reject future dates
                    const days = Math.max(1, Math.round((Date.now() - from.getTime()) / 86400000));
                    setGlobalDays(Math.min(days, 365)); // max 1 year
                  }
                }}
              />
              <span className="text-gray-400">to today</span>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {impactCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-orange-100 shadow-sm" hoverable={false}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-950">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {businessMetrics && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-indigo-100 shadow-sm" hoverable={false}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Business Performance</h2>
                <p className="mt-1 text-sm text-gray-500">Revenue, AI usage, and automation quality for the last {businessMetrics.period_days || 30} days.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {businessMetrics.flow_success_rate || 0}% automation success
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Paid Revenue', value: `Rs ${Number(businessMetrics.revenue_paid || 0).toLocaleString('en-IN')}` },
                { label: 'Pending Revenue', value: `Rs ${Number(businessMetrics.revenue_pending || 0).toLocaleString('en-IN')}` },
                { label: 'AI Units Used', value: Number(businessMetrics.ai_usage_total || 0).toLocaleString('en-IN') },
                { label: 'Payments', value: businessMetrics.payment_count || 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-gray-950">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-indigo-100 shadow-sm" hoverable={false}>
            <h2 className="text-xl font-bold text-gray-950">Agent Performance</h2>
            <div className="mt-4 space-y-2">
              {(businessMetrics.agent_performance || []).length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No assigned agent data yet.</p>
              ) : (
                businessMetrics.agent_performance.map((agent: any) => (
                  <div key={agent.agent_id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{agent.name}</p>
                      <p className="text-xs capitalize text-gray-500">{agent.role}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p><strong className="text-gray-900">{agent.assigned_leads}</strong> leads</p>
                      <p><strong className="text-emerald-700">{agent.won_leads}</strong> won</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-1">
        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <h2 className="mb-6 text-xl font-bold text-gray-950">Conversation Trend</h2>
          {trends.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50">
              <div className="text-center">
                <p className="font-semibold text-gray-500">No data yet</p>
                <p className="mt-1 text-sm text-gray-400">Start by connecting a channel in <a href="/dashboard/integrations" className="text-primary-600 underline">Integrations</a> or testing your widget.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="queries" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <h2 className="mb-6 text-xl font-bold text-gray-950">Lead Quality</h2>
          {leadScoreData.every((d: any) => d.value === 0) ? (
            <div className="flex h-[260px] items-center justify-center rounded-xl bg-gray-50">
              <div className="text-center">
                <p className="font-semibold text-gray-500">No lead data yet</p>
                <p className="mt-1 text-sm text-gray-400">Leads will appear here once your widget or integrations start capturing contacts.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">AI Insights</h2>
          <div className="mt-5 space-y-3">
            {(impact?.insights || []).map((insight: string) => (
              <div key={insight} className="rounded-lg bg-gradient-to-r from-orange-50 to-sky-50 px-4 py-3 text-sm font-medium text-gray-700">
                {insight}
              </div>
            ))}
          </div>
          <h3 className="mt-6 font-bold text-gray-950">Top Questions</h3>
          <div className="mt-3 space-y-2">
            {(impact?.top_questions || []).length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No customer questions yet. Test your widget to populate this list.</p>
            ) : (
              impact.top_questions.map((item: any) => (
                <div key={item.question} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                  <p className="line-clamp-1 text-sm text-gray-700">{item.question}</p>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-primary-700">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Lead Conversion Funnel */}
      {funnel && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-950">Lead Conversion Funnel</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-indigo-100 shadow-sm" hoverable={false}>
              <h3 className="text-sm font-bold text-gray-950 mb-4">
                Funnel — Last {funnel.period_days} Days
                <span className="ml-2 text-xs font-normal text-indigo-600">Conversion: {funnel.conversion_rate}%</span>
              </h3>
              <div className="space-y-3">
                {(funnel.funnel || []).map((stage: any) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>{stage.stage}</span>
                      <span>{stage.count}</span>
                    </div>
                    <div className="h-6 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(4, (stage.count / Math.max((funnel.funnel[0]?.count || 1), 1)) * 100)}%`,
                          background: stage.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-indigo-100 shadow-sm" hoverable={false}>
              <h3 className="text-sm font-bold text-gray-950 mb-4">Leads by Source</h3>
              {(funnel.by_source || []).length === 0 ? (
                <p className="text-sm text-gray-500">No lead source data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={funnel.by_source} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* WhatsApp Analytics */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-950">WhatsApp Analytics</h2>
            {waLoading && <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            {[7, 14, 30, 90].map(d => (
              <button key={d}
                onClick={() => setWaDays(d)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${waDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Quality Score badge */}
        {waQuality && (
          <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
            waQuality.rating === 'GREEN' ? 'border-emerald-200 bg-emerald-50' :
            waQuality.rating === 'YELLOW' ? 'border-amber-200 bg-amber-50' :
            'border-red-200 bg-red-50'
          }`}>
            <span className="text-xl">{waQuality.rating === 'GREEN' ? '🟢' : waQuality.rating === 'YELLOW' ? '🟡' : '🔴'}</span>
            <div>
              <p className={`text-sm font-bold ${waQuality.rating === 'GREEN' ? 'text-emerald-800' : waQuality.rating === 'YELLOW' ? 'text-amber-800' : 'text-red-800'}`}>
                WhatsApp Quality: {waQuality.rating === 'GREEN' ? 'High' : waQuality.rating === 'YELLOW' ? 'Medium' : 'Low'} — Score {waQuality.score}
              </p>
              <p className={`text-xs mt-0.5 ${waQuality.rating === 'GREEN' ? 'text-emerald-700' : waQuality.rating === 'YELLOW' ? 'text-amber-700' : 'text-red-700'}`}>
                {waQuality.rating === 'GREEN' ? 'Your account has a good quality rating. Keep it up!' :
                 waQuality.rating === 'YELLOW' ? 'Quality is medium. Reduce spam complaints to improve.' :
                 '⚠️ Low quality — risk of messaging limits. Review opt-outs and template quality.'}
              </p>
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          {[
            { label: 'Messages Sent', value: waStats?.total_sent ?? '—', icon: Send, color: 'text-blue-600 bg-blue-50' },
            { label: 'Delivery Rate', value: waStats ? `${waStats.delivery_rate}%` : '—', icon: CheckCheck, color: 'text-green-600 bg-green-50' },
            { label: 'Read Rate', value: waStats ? `${waStats.read_rate}%` : '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
            { label: 'Messages Received', value: waStats?.total_inbound ?? '—', icon: MessageCircle, color: 'text-orange-600 bg-orange-50' },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="border-green-100 shadow-sm" hoverable={false}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-950">{kpi.value}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily volume chart */}
          <Card className="border-green-100 shadow-sm" hoverable={false}>
            <h3 className="text-sm font-bold text-gray-950 mb-4">Daily Message Volume (last {Math.min(waDays, 14)} days)</h3>
            {(waStats?.daily_chart || []).length === 0 ? (
              <div className="flex h-48 items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">No WhatsApp messages in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={waStats.daily_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sent" name="Sent" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="received" name="Received" fill="#86efac" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Delivery funnel */}
          <Card className="border-green-100 shadow-sm" hoverable={false}>
            <h3 className="text-sm font-bold text-gray-950 mb-4">Delivery Funnel</h3>
            {!waStats || waStats.total_sent === 0 ? (
              <div className="flex h-48 items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Send messages to see delivery stats</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Sent', count: waStats.total_sent, color: '#3b82f6', pct: 100 },
                  { label: 'Delivered', count: waStats.delivered, color: '#22c55e', pct: waStats.delivery_rate },
                  { label: 'Read', count: waStats.read, color: '#a855f7', pct: waStats.read_rate },
                  { label: 'Failed', count: waStats.failed, color: '#ef4444', pct: waStats.fail_rate },
                ].map(step => (
                  <div key={step.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>{step.label}</span>
                      <span>{step.count} <span className="text-gray-400 font-normal">({step.pct}%)</span></span>
                    </div>
                    <div className="h-5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(2, step.pct)}%`, backgroundColor: step.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Top templates */}
            {(waStats?.templates || []).length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Top Templates</h4>
                <div className="space-y-1">
                  {waStats.templates.map((t: any) => (
                    <div key={t.name} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-gray-700 truncate max-w-[140px]">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{t.total} sent</span>
                        <span className={`font-bold ${t.rate >= 80 ? 'text-green-600' : t.rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{t.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Automation Template Performance */}
      {templatePerf && (templatePerf.workflows || []).length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-950">Automation Performance</h2>
          <Card className="border-indigo-100 shadow-sm overflow-hidden" hoverable={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-600">Workflow</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600">Runs</th>
                  <th className="text-right py-2 pr-4 font-semibold text-gray-600">Completed</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(templatePerf.workflows || []).map((wf: any) => (
                  <tr key={wf.workflow_id} className="hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <span className="font-medium text-gray-950">{wf.workflow_name}</span>
                      <span className={`ml-2 text-[10px] font-bold uppercase rounded-full px-1.5 py-0.5 ${wf.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{wf.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-600">{wf.total_runs}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{wf.completed_runs}</td>
                    <td className="py-2 text-right">
                      <span className={`font-bold ${wf.completion_rate >= 80 ? 'text-emerald-600' : wf.completion_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {wf.completion_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── Sprint 4: Revenue Attribution ── */}
      {campaignRevenue && (
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span>💰</span> Revenue Attribution
            </h2>
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-emerald-700">₹{Number(campaignRevenue.total_inr || 0).toLocaleString('en-IN')}</span> from campaigns
            </div>
          </div>
          {(campaignRevenue.campaigns || []).length === 0 ? (
            <Card hoverable={false}><p className="text-sm text-gray-500 text-center py-4">No campaign revenue tracked yet. Run campaigns with Razorpay payments to see attribution.</p></Card>
          ) : (
            <Card hoverable={false}>
              <div className="space-y-3">
                {(campaignRevenue.campaigns || []).slice(0, 10).map((c: any) => (
                  <div key={c.campaign} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800 min-w-0 flex-1 truncate">{c.campaign}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (c.revenue_inr / (campaignRevenue.total_inr || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-emerald-700 shrink-0">₹{Number(c.revenue_inr).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      {/* ── Sprint 4: Bot Deflection + Team Performance ── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {botDeflection && (
          <Card hoverable={false}>
            <h2 className="mb-4 font-bold text-gray-950">🤖 Bot Deflection Rate</h2>
            <div className="text-center py-2">
              <div className="text-5xl font-black text-indigo-600 mb-1">{botDeflection.deflection_rate_pct ?? 0}%</div>
              <p className="text-sm text-gray-500">conversations handled by AI without human</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="font-bold text-gray-900">{botDeflection.total_sessions ?? 0}</p>
                <p className="text-gray-500">Total chats</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <p className="font-bold text-emerald-700">{botDeflection.deflected ?? 0}</p>
                <p className="text-gray-500">Bot handled</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <p className="font-bold text-amber-700">{botDeflection.handover_sessions ?? 0}</p>
                <p className="text-gray-500">Escalated</p>
              </div>
            </div>
          </Card>
        )}

        {teamPerf && (teamPerf.members || []).length > 0 && (
          <Card hoverable={false}>
            <h2 className="mb-4 font-bold text-gray-950">👥 Team Performance</h2>
            <div className="space-y-2">
              {(teamPerf.members || []).map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3 text-sm rounded-lg border border-gray-100 px-3 py-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                    {(m.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-gray-700 truncate min-w-0">{m.email}</span>
                  <span className="text-xs text-gray-500">{m.leads_assigned} leads</span>
                  <span className="text-xs font-bold text-emerald-700">{m.tasks_completed} tasks</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* ── Export Button ── */}
      <section className="flex flex-wrap gap-3 pt-2">
        {(['dashboard', 'leads', 'campaigns'] as const).map(type => (
          <button
            key={type}
            onClick={async () => {
              try {
                const token = useAuthStore.getState().token;
                const base = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${base}/api/analytics/export?type=${type}&days=${globalDays}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error(`Export failed (${res.status})`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_${globalDays}d.csv`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (err: any) {
                toast.error(err.message || 'Export failed — check your connection');
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          >
            ↓ Export {type} CSV
          </button>
        ))}
      </section>
    </div>
  );
}
