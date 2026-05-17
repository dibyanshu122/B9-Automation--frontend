'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { useApi } from '@/hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { Activity, Bot, Clock, IndianRupee, MessageCircle, Sparkles, Target, Users, Zap } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, trendsRes, impactRes, readinessRes, funnelRes, templatesRes] = await Promise.all([
          get('/api/analytics/dashboard'),
          get('/api/analytics/usage-trends'),
          get('/api/analytics/business-impact').catch(() => ({ data: null })),
          get('/api/automation/readiness').catch(() => ({ data: null })),
          get('/api/analytics/funnel').catch(() => ({ data: null })),
          get('/api/analytics/template-performance').catch(() => ({ data: null })),
        ]);
        setDashboard(dashRes.data);
        setTrends(trendsRes.data);
        setImpact(impactRes.data);
        setReadiness(readinessRes.data);
        setFunnel(funnelRes.data);
        setTemplatePerf(templatesRes.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [get]);

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
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Business impact dashboard
          </p>
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

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Launch Readiness</h2>
          <div className="mt-4 rounded-lg bg-orange-50 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{readiness?.launch_status?.split('_').join(' ') || 'setup needed'}</p>
              <p className="text-2xl font-bold text-primary-700">{readiness?.score || 0}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={readiness?.score || 0} color="primary" showLabel={false} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {(readiness?.checks || []).map((check: any) => (
              <div key={check.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                <span className="text-sm font-medium text-gray-700">{check.label}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${check.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {check.done ? 'Done' : check.action}
                </span>
              </div>
            ))}
          </div>
        </Card>

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
