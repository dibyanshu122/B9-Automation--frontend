'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { BellRing, CreditCard, HeartPulse, Megaphone, Workflow, Users, MessageCircle, RefreshCw } from 'lucide-react';

interface NotificationEvent {
  id: string;
  type: 'automation_run' | 'new_lead' | 'whatsapp_message' | 'whatsapp_inbound' | 'handover' | 'low_credit' | 'integration_health' | 'campaign';
  title: string;
  body: string;
  status: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
  const diff = Math.max(0, Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusColor(status: string) {
  if (['completed', 'sent'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  if (['failed'].includes(status)) return 'bg-red-100 text-red-700';
  if (['running'].includes(status)) return 'bg-blue-100 text-blue-700';
  if (['attention', 'warning', 'requested', 'human_active'].includes(status)) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

function EventIcon({ type }: { type: string }) {
  if (type === 'automation_run') return <Workflow className="h-4 w-4 text-violet-500" />;
  if (type === 'new_lead') return <Users className="h-4 w-4 text-blue-500" />;
  if (type === 'whatsapp_inbound') return <MessageCircle className="h-4 w-4 text-green-500" />;
  if (type === 'handover') return <BellRing className="h-4 w-4 text-amber-500" />;
  if (type === 'low_credit') return <CreditCard className="h-4 w-4 text-orange-500" />;
  if (type === 'integration_health') return <HeartPulse className="h-4 w-4 text-red-500" />;
  if (type === 'campaign') return <Megaphone className="h-4 w-4 text-sky-500" />;
  return <MessageCircle className="h-4 w-4 text-emerald-500" />;
}

export default function NotificationsPage() {
  const { get } = useApi();
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    get('/api/automation/notifications')
      .then((res) => {
        setEvents(res.data?.events || []);
        setUnread(res.data?.unread_count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [get]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-500">Business-critical alerts for handovers, leads, campaigns, credits, integrations, and WhatsApp activity</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {unread > 0 && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700 font-medium">
          {unread} unread notification{unread > 1 ? 's' : ''} need your attention.
        </div>
      )}

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">No activity in the last 7 days.</p>
            <p className="mt-1 text-sm text-gray-400">Run an automation, capture a lead, or connect WhatsApp to see events here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                  <EventIcon type={e.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(e.status)}`}>
                      {e.status}
                    </span>
                  </div>
                  {e.body && <p className="mt-0.5 truncate text-xs text-gray-500">{e.body}</p>}
                </div>
                <p className="shrink-0 text-xs text-gray-400">{timeAgo(e.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
