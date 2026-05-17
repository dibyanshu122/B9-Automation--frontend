'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, ExternalLink, MessageSquare, XCircle } from 'lucide-react';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
  PAUSED: 'bg-gray-100 text-gray-600',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  PENDING: <Clock className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  MARKETING: 'bg-violet-50 text-violet-700',
  UTILITY: 'bg-blue-50 text-blue-700',
  AUTHENTICATION: 'bg-orange-50 text-orange-700',
};

export default function TemplatesPage() {
  const { get } = useApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  useEffect(() => {
    get('/api/automation/whatsapp/templates')
      .then(r => {
        setTemplates(r.data?.templates || []);
        if (r.data?.error) setError(r.data.error);
        if (r.data?.message) setError(r.data.message);
      })
      .catch(() => setError('Could not load templates. Check your WhatsApp connection.'))
      .finally(() => setLoading(false));
  }, [get]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === 'ALL' ? templates : templates.filter(t => t.status === filter);

  const getBodyText = (components: any[]) => {
    const body = components?.find(c => c.type === 'BODY');
    return body?.text || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Message templates approved by Meta for your WhatsApp Business account.
          </p>
        </div>
        <a
          href="https://business.facebook.com/wa/manage/message-templates/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <ExternalLink className="h-4 w-4" />
          Create Template
        </a>
      </div>

      {/* Stats */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['APPROVED', 'PENDING', 'REJECTED'] as const).map(status => (
            <Card
              key={status}
              hoverable
              className={`cursor-pointer border-gray-200 ${filter === status ? 'ring-2 ring-primary-300' : ''}`}
              onClick={() => setFilter(filter === status ? 'ALL' : status)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-600">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status]}`}>
                  {templates.filter(t => t.status === status).length}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error / empty */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Could not load templates</p>
          <p>{error}</p>
          <p className="mt-2">Make sure you have connected WhatsApp with a valid Business Account ID in <a href="/dashboard/integrations" className="font-semibold underline">Integrations</a>.</p>
        </div>
      )}

      {/* Template grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300" />
          <p className="text-lg font-semibold text-gray-500">No templates found</p>
          <p className="text-sm text-gray-400">Create templates in Meta Business Suite, then come back here.</p>
          <a
            href="https://business.facebook.com/wa/manage/message-templates/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          >
            Open Meta Business Suite →
          </a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card key={t.id || t.name} hoverable={false} className="border-gray-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_ICONS[t.status]}
                  {t.status}
                </span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                  {t.category}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  {t.language}
                </span>
              </div>
              {getBodyText(t.components) && (
                <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 rounded-lg p-2">
                  {getBodyText(t.components)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
