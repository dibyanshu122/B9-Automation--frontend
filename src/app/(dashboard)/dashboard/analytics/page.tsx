'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { Activity, Bot, CheckCheck, Clock, IndianRupee, MessageCircle, MessageSquare, Send, Sparkles, Target, TrendingUp, Users, Zap } from 'lucide-react';

type UsageTrend = {
  date: string;
  queries: number;
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [impact, setImpact] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [templatePerf, setTemplatePerf] = useState<any>(null);
  const [waStats, setWaStats] = useState<any>(null);
  const [waDays, setWaDays] = useState(30);
  const [waLoading, setWaLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, trendsRes, impactRes, readinessRes, funnelRes, templatesRes, waRes] = await Promise.all([
          get('/api/analytics/dashboard').catch(() => ({ data: null })),
          get('/api/analytics/usage-trends').catch(() => ({ data: null })),
          get('/api/analytics/business-impact').catch(() => ({ data: null })),
          get('/api/automation/readiness').catch(() => ({ data: null })),
          get('/api/analytics/funnel').catch(() => ({ data: null })),
          get('/api/analytics/template-performance').catch(() => ({ data: null })),
          get(`/api/analytics/whatsapp?days=${waDays}`).catch(() => ({ data: null })),
        ]);
        setDashboard(dashRes.data);
        setTrends(trendsRes.data);
        setImpact(impactRes.data);
        setReadiness(readinessRes.data);
        setFunnel(funnelRes.data);
        setTemplatePerf(templatesRes.data);
        setWaStats(waRes.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [get]); // eslint-disable-line

  // Reload WA stats when date range changes
  useEffect(() => {
    if (loading) return; // skip during initial full load
    setWaLoading(true);
    get(`/api/analytics/whatsapp?days=${waDays}`)
      .then(r => setWaStats(r.data))
      .catch(() => {})
      .finally(() => setWaLoading(false));
  }, [waDays]); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
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
    { label: 'Bot Accuracy', value: `${dashboard?.bot_accuracy_score || 0}%`, icon: Bot, color: 'text-green-700 bg-green-50' },
  ];

  const leadScoreData = Object.entries(impact?.lead_score_breakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-orange-100 blur-2xl" />
        <div className="relative">
          <h1 className="text-4xl font-bold text-gray-950">Analytics</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Track conversations, leads, automations, saved time, and launch readiness in one place.
          </p>
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
                {(funnel.funnel || []).map((stage: any, i: number) => (
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
    </div>
  );
}
