'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock, Loader2, MessageSquare, Phone, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

type HandoverItem = {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  lead_phone?: string;
  handover_status: string;
  handover_reason?: string;
  handover_requested_at?: string;
  assigned_to_user_id?: string;
  latest_message?: string;
  updated_at?: string;
  lead?: {
    name?: string;
    phone?: string;
    score_label?: string;
    lead_score?: number;
    ai_summary?: string;
  };
  next_action?: { label?: string; reason?: string };
};

function ageLabel(value?: string) {
  if (!value) return 'Waiting time unknown';
  const iso = value.endsWith('Z') ? value : `${value}Z`;
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m waiting`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h waiting`;
  return `${Math.floor(hours / 24)}d waiting`;
}

function priority(item: HandoverItem) {
  const label = item.lead?.score_label || 'cold';
  if (label === 'hot') return 'High';
  if (label === 'warm') return 'Medium';
  return 'Normal';
}

export default function HandoverPage() {
  const { get, post } = useApi();
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    get('/api/leads/handover-queue')
      .then((res) => setItems(res.data?.items || []))
      .catch((error: any) => toast.error(error.response?.data?.detail || 'Failed to load handover queue'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30s so waiting handovers surface without manual reload
    const interval = setInterval(() => {
      get('/api/leads/handover-queue')
        .then((res) => setItems(res.data?.items || []))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    total: items.length,
    high: items.filter((item) => priority(item) === 'High').length,
    active: items.filter((item) => item.handover_status === 'human_active').length,
  }), [items]);

  const accept = async (item: HandoverItem) => {
    setBusy(item.id);
    try {
      await post(`/api/leads/inbox/${item.id}/handover`, { status: 'human_active', reason: 'Accepted from handover queue' });
      toast.success('Conversation assigned for human handling');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to accept handover');
    } finally {
      setBusy('');
    }
  };

  const resolve = async (item: HandoverItem) => {
    setBusy(item.id);
    try {
      await post(`/api/leads/inbox/${item.id}/handover`, { status: 'resolved', reason: 'Resolved — conversation handed back to AI' });
      toast.success('Handover resolved — AI will handle this conversation again');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resolve handover');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Handover Queue</h1>
          <p className="mt-1 text-sm text-gray-600">Complaints, low-confidence AI chats, and hot leads waiting for human review.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Waiting', value: counts.total, icon: AlertTriangle, color: 'text-red-700 bg-red-50' },
          { label: 'High Priority', value: counts.high, icon: Clock, color: 'text-amber-700 bg-amber-50' },
          { label: 'Human Active', value: counts.active, icon: UserCheck, color: 'text-emerald-700 bg-emerald-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hoverable={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-950">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {loading ? (
        <Card hoverable={false}>
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading handovers...
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card className="text-center" hoverable={false}>
          <UserCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="font-semibold text-gray-900">No handovers waiting</p>
          <p className="mt-1 text-sm text-gray-500">AI is handling conversations or your team has already picked them up.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} hoverable={false} className="border-gray-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-950">{item.lead?.name || item.visitor_name || item.lead_phone || 'Unknown contact'}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{item.handover_status}</span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{ageLabel(item.handover_requested_at || item.updated_at)}</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{priority(item)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{item.handover_reason || item.latest_message || 'Review this conversation and decide the next action.'}</p>
                  {item.lead?.ai_summary && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{item.lead.ai_summary}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    {item.lead_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{item.lead_phone}</span>}
                    {item.latest_message && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{item.latest_message.slice(0, 80)}</span>}
                    {item.next_action?.label && <span className="font-semibold text-indigo-600">Next: {item.next_action.label}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/dashboard/leads">
                    Open CRM
                  </a>
                  {item.handover_status === 'human_active' ? (
                    <Button variant="secondary" onClick={() => resolve(item)} loading={busy === item.id}>
                      Resolve — back to AI
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => accept(item)} loading={busy === item.id}>
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
