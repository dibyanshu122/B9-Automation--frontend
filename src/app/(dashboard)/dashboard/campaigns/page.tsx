'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, BarChart2, CheckCircle2, ChevronDown, ChevronRight,
  Clock, Loader2, MessageSquare, Plus, RefreshCw, Send, Users,
  X, XCircle, Zap, FileText, Calendar, Ban, ChevronLeft,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  name: string; message: string; channel: string; msg_type: string;
  template_name: string | null; total: number; sent: number; failed: number;
  queued: number; cancelled: number; status: string;
  scheduled_at: string | null; created_at: string | null;
}
interface PreviewResult {
  total_recipients: number;
  sample: { name: string; phone: string; score: string; tag: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; dot?: string }> = {
  sending:               { label: 'Sending',       color: 'bg-blue-100 text-blue-700',    icon: <Loader2 className="w-3 h-3 animate-spin" />, dot: 'bg-blue-500' },
  scheduled:             { label: 'Scheduled',     color: 'bg-amber-100 text-amber-700',  icon: <Clock className="w-3 h-3" /> },
  draft:                 { label: 'Draft',         color: 'bg-gray-100 text-gray-600',    icon: <FileText className="w-3 h-3" /> },
  completed:             { label: 'Completed',     color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  completed_with_errors: { label: 'With Errors',   color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="w-3 h-3" /> },
  failed:                { label: 'Failed',        color: 'bg-red-100 text-red-700',      icon: <XCircle className="w-3 h-3" /> },
  cancelled:             { label: 'Cancelled',     color: 'bg-gray-100 text-gray-500',    icon: <Ban className="w-3 h-3" /> },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Leads' },
  { value: 'hot', label: '🔥 Hot Leads' },
  { value: 'warm', label: '☀️ Warm Leads' },
  { value: 'cold', label: '❄️ Cold Leads' },
];

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatScheduled(iso: string): string {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

function StatusBar({ sent, failed, queued, total }: { sent: number; failed: number; queued: number; total: number }) {
  if (!total) return null;
  const sp = Math.round((sent / total) * 100);
  const fp = Math.round((failed / total) * 100);
  const qp = 100 - sp - fp;
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
      <div style={{ width: `${sp}%` }} className="bg-emerald-400 transition-all" />
      <div style={{ width: `${fp}%` }} className="bg-red-400 transition-all" />
      <div style={{ width: `${qp}%` }} className="bg-gray-200 transition-all" />
    </div>
  );
}

// ─── Campaign Detail Drawer ───────────────────────────────────────────────────

function DetailDrawer({ name, onClose, onRefresh }: { name: string; onClose: () => void; onRefresh: () => void }) {
  const { get, post } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    get(`/api/campaigns/${encodeURIComponent(name)}/detail?page=${p}`)
      .then(r => { setData(r.data); setPage(p); })
      .catch(() => toast.error('Failed to load campaign details'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const cancel = async () => {
    if (!confirm('Cancel all pending messages in this campaign?')) return;
    setActing('cancel');
    try {
      await post(`/api/campaigns/${encodeURIComponent(name)}/cancel`, {});
      toast.success('Campaign cancelled');
      load(); onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Cancel failed'); }
    finally { setActing(null); }
  };

  const retry = async () => {
    setActing('retry');
    try {
      const r = await post(`/api/campaigns/${encodeURIComponent(name)}/retry-failed`, {});
      toast.success(`Retrying ${r.data.retrying} failed messages`);
      load(); onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Retry failed'); }
    finally { setActing(null); }
  };

  const sendDraft = async () => {
    setActing('draft');
    try {
      const r = await post(`/api/campaigns/${encodeURIComponent(name)}/send-draft`, {});
      toast.success(`Sending to ${r.data.queued} recipients`);
      load(); onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setActing(null); }
  };

  const statusCfg = data ? STATUS_CONFIG[data.status] || STATUS_CONFIG.completed : null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 truncate max-w-xs">{name}</h2>
            {statusCfg && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${statusCfg.color}`}>
                {statusCfg.icon}{statusCfg.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {loading && !data ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : data ? (
          <>
            {/* Stats */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[
                  { label: 'Sent', val: data.sent, color: 'text-emerald-600' },
                  { label: 'Failed', val: data.failed, color: 'text-red-500' },
                  { label: 'Pending', val: data.queued, color: 'text-amber-500' },
                  { label: 'Total', val: data.total, color: 'text-gray-700' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <StatusBar sent={data.sent} failed={data.failed} queued={data.queued} total={data.total} />
              <p className="text-xs text-gray-400 mt-1.5">{data.delivery_rate}% delivery rate</p>
            </div>

            {/* Action buttons */}
            <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
              {data.status === 'draft' && (
                <Button size="sm" onClick={sendDraft} disabled={acting === 'draft'} className="flex items-center gap-1.5">
                  {acting === 'draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send Now
                </Button>
              )}
              {data.failed > 0 && (
                <Button size="sm" variant="secondary" onClick={retry} disabled={acting === 'retry'} className="flex items-center gap-1.5">
                  {acting === 'retry' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Retry {data.failed} Failed
                </Button>
              )}
              {(data.status === 'sending' || data.status === 'scheduled') && (
                <Button size="sm" variant="danger" onClick={cancel} disabled={acting === 'cancel'} className="flex items-center gap-1.5">
                  {acting === 'cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Cancel
                </Button>
              )}
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto">
              {data.messages.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.lead_name}</p>
                    <p className="text-xs text-gray-400">{m.phone}</p>
                    {m.error && <p className="text-xs text-red-400 truncate mt-0.5">{m.error}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                      m.status === 'failed' ? 'bg-red-50 text-red-600' :
                      m.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-600'}`}>
                      {m.status}
                    </span>
                    {m.sent_at && <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(m.sent_at)}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <button onClick={() => load(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-500">Page {page} of {data.total_pages}</p>
                <button onClick={() => load(page + 1)} disabled={page === data.total_pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ c, onDetail, onRefresh }: { c: Campaign; onDetail: () => void; onRefresh: () => void }) {
  const { post } = useApi();
  const [acting, setActing] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.completed;
  const deliveryRate = c.total ? Math.round((c.sent / c.total) * 100) : 0;

  const quickAction = async (action: string) => {
    setActing(action);
    try {
      if (action === 'cancel') {
        if (!confirm('Cancel this campaign?')) return;
        await post(`/api/campaigns/${encodeURIComponent(c.name)}/cancel`, {});
        toast.success('Campaign cancelled');
      } else if (action === 'retry') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/retry-failed`, {});
        toast.success(`Retrying ${r.data.retrying} messages`);
      } else if (action === 'send-draft') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/send-draft`, {});
        toast.success(`Sending to ${r.data.queued} recipients`);
      }
      onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Action failed'); }
    finally { setActing(null); }
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition bg-white group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm truncate">{c.name}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">
              {c.msg_type === 'template' ? `📋 ${c.template_name || 'Template'}` : '✏️ Custom text'}
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 capitalize">{c.channel}</span>
            {c.created_at && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled info */}
      {c.scheduled_at && c.status === 'scheduled' && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          Scheduled for {formatScheduled(c.scheduled_at)}
        </div>
      )}

      {/* Stats */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex gap-3 text-xs">
            <span className="text-emerald-600 font-semibold">{c.sent} sent</span>
            {c.failed > 0 && <span className="text-red-500 font-semibold">{c.failed} failed</span>}
            {c.queued > 0 && <span className="text-amber-500">{c.queued} pending</span>}
          </div>
          <span className="text-xs text-gray-400">{c.total} total · {deliveryRate}%</span>
        </div>
        <StatusBar sent={c.sent} failed={c.failed} queued={c.queued} total={c.total} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap mt-3">
        <button onClick={onDetail} className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition flex items-center gap-1">
          <BarChart2 className="w-3.5 h-3.5" /> View Details
        </button>
        {c.status === 'draft' && (
          <button onClick={() => quickAction('send-draft')} disabled={acting === 'send-draft'}
            className="text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition flex items-center gap-1 disabled:opacity-50">
            {acting === 'send-draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send Draft
          </button>
        )}
        {c.failed > 0 && c.status !== 'draft' && (
          <button onClick={() => quickAction('retry')} disabled={acting === 'retry'}
            className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition flex items-center gap-1 disabled:opacity-50">
            {acting === 'retry' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Retry {c.failed}
          </button>
        )}
        {(c.status === 'sending' || c.status === 'scheduled') && (
          <button onClick={() => quickAction('cancel')} disabled={acting === 'cancel'}
            className="text-xs font-semibold text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition flex items-center gap-1 disabled:opacity-50">
            {acting === 'cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── New Campaign Slide-over ──────────────────────────────────────────────────

function NewCampaignPanel({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { get, post } = useApi();
  const [tab, setTab] = useState<'quick' | 'bulk'>('quick');

  // Quick Send state
  const [qPhone, setQPhone] = useState('');
  const [qTemplates, setQTemplates] = useState<any[]>([]);
  const [qLoadingTpl, setQLoadingTpl] = useState(false);
  const [qSelected, setQSelected] = useState<any>(null);
  const [qVars, setQVars] = useState<string[]>([]);
  const [qSending, setQSending] = useState(false);

  // Bulk state
  const [bName, setBName] = useState('');
  const [bMessage, setBMessage] = useState('');
  const [bFilter, setBFilter] = useState('all');
  const [bCustomTag, setBCustomTag] = useState('');
  const [bMsgType, setBMsgType] = useState<'text' | 'template'>('text');
  const [bTemplates, setBTemplates] = useState<any[]>([]);
  const [bSelected, setBSelected] = useState<any>(null);
  const [bVars, setBVars] = useState<string[]>([]);
  const [bLoadingTpl, setBLoadingTpl] = useState(false);
  const [bScheduled, setBScheduled] = useState('');
  const [bPreviewing, setBPreviewing] = useState(false);
  const [bPreview, setBPreview] = useState<PreviewResult | null>(null);
  const [bSending, setBSending] = useState(false);

  // Load templates for Quick Send
  useEffect(() => {
    setQLoadingTpl(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setQTemplates((r.data?.templates || []).filter((t: any) => t.status === 'APPROVED')))
      .catch(() => {})
      .finally(() => setQLoadingTpl(false));
  }, []); // eslint-disable-line

  const loadBulkTemplates = () => {
    setBLoadingTpl(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setBTemplates(r.data?.templates || []))
      .catch(() => toast.error('Could not load templates'))
      .finally(() => setBLoadingTpl(false));
  };

  const onSelectQ = (tpl: any) => {
    setQSelected(tpl);
    const bodyText = tpl.components?.find((c: any) => c.type === 'BODY')?.text || '';
    const count = new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map((m: string) => m.replace(/\D/g, ''))).size;
    setQVars(Array(count).fill(''));
  };

  const onSelectB = (tpl: any) => {
    setBSelected(tpl);
    const bodyText = tpl.components?.find((c: any) => c.type === 'BODY')?.text || '';
    setBMessage(bodyText);
    const count = new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map((m: string) => m.replace(/\D/g, ''))).size;
    setBVars(Array(count).fill(''));
  };

  const handleQuickSend = async () => {
    if (!qPhone.trim()) { toast.error('Phone number required'); return; }
    if (!qSelected) { toast.error('Select a template'); return; }
    if (qVars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    setQSending(true);
    try {
      await post('/api/campaigns/send', {
        name: `Quick: ${qSelected.name}`,
        message: qSelected.name,
        channel: 'whatsapp',
        msg_type: 'template',
        template_name: qSelected.name,
        language_code: qSelected.language || 'en_US',
        template_variables: qVars.length ? qVars : null,
        direct_phone: qPhone.replace(/\s/g, ''),
      });
      toast.success(`Template sent to ${qPhone}`);
      setQPhone(''); setQSelected(null); setQVars([]);
      onSent();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Send failed'); }
    finally { setQSending(false); }
  };

  const recipientFilter = bFilter === 'tag' ? `tag:${bCustomTag}` : bFilter;

  const handlePreview = async () => {
    if (bMsgType === 'text' && !bMessage.trim()) { toast.error('Enter a message'); return; }
    if (bMsgType === 'template' && !bSelected) { toast.error('Select a template'); return; }
    setBPreviewing(true); setBPreview(null);
    try {
      const r = await post('/api/campaigns/preview', { name: bName || 'Preview', message: bMessage || bSelected?.name || '', recipient_filter: recipientFilter });
      setBPreview(r.data);
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Preview failed'); }
    finally { setBPreviewing(false); }
  };

  const handleBulkSend = async (saveAsDraft = false) => {
    if (!bName.trim()) { toast.error('Campaign name required'); return; }
    if (bMsgType === 'template' && !bSelected) { toast.error('Select a template'); return; }
    if (bMsgType === 'text' && !bMessage.trim()) { toast.error('Message required'); return; }
    if (bVars.some(v => !v.trim()) && bMsgType === 'template') { toast.error('Fill all template variables'); return; }
    if (!saveAsDraft && (!bPreview || bPreview.total_recipients === 0)) {
      toast.error('Preview recipients first'); return;
    }
    if (!saveAsDraft && !confirm(`Send to ${bPreview!.total_recipients} lead${bPreview!.total_recipients !== 1 ? 's' : ''}?`)) return;

    setBSending(true);
    try {
      const r = await post('/api/campaigns/send', {
        name: bName.trim(),
        message: bMsgType === 'template' ? (bSelected?.name || '') : bMessage.trim(),
        recipient_filter: recipientFilter,
        channel: 'whatsapp',
        scheduled_at: bScheduled || null,
        msg_type: bMsgType,
        template_name: bMsgType === 'template' ? bSelected?.name : null,
        language_code: bMsgType === 'template' ? (bSelected?.language || 'en_US') : 'en_US',
        template_variables: bMsgType === 'template' && bVars.length ? bVars : null,
        save_as_draft: saveAsDraft,
      });
      if (saveAsDraft) toast.success('Draft saved');
      else if (r.data.scheduled_at) toast.success(`Scheduled for ${bPreview?.total_recipients} recipients`);
      else toast.success(`Sending to ${r.data.recipient_count} recipients`);
      onClose(); onSent();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setBSending(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">New Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Tab */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mx-5 mt-4 flex-shrink-0">
          <button onClick={() => setTab('quick')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${tab === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            <Zap className="w-3.5 h-3.5" /> Quick Send
          </button>
          <button onClick={() => { setTab('bulk'); if (!bTemplates.length) loadBulkTemplates(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${tab === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            <Users className="w-3.5 h-3.5" /> Bulk Campaign
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">

          {/* ── QUICK SEND ── */}
          {tab === 'quick' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                <input value={qPhone} onChange={e => setQPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Approved Template</label>
                {qLoadingTpl ? <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                  : qTemplates.length === 0 ? <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3">No approved templates. Create in WA Templates section.</p>
                  : <div className="space-y-2 max-h-48 overflow-y-auto">
                    {qTemplates.map(tpl => (
                      <button key={tpl.name} onClick={() => onSelectQ(tpl)}
                        className={`w-full text-left p-3 rounded-xl border transition ${qSelected?.name === tpl.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">{tpl.status}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}</p>
                      </button>
                    ))}
                  </div>
                }
              </div>
              {qVars.length > 0 && (
                <div className="space-y-2">
                  {qVars.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded w-14 text-center flex-shrink-0">{`{{${i+1}}}`}</span>
                      <input value={v} onChange={e => setQVars(qVars.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Value for {{${i+1}}}`} className={inputCls} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── BULK CAMPAIGN ── */}
          {tab === 'bulk' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                  <input value={bName} onChange={e => setBName(e.target.value)} placeholder="e.g. Diwali Offer 2025" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Recipients</label>
                  <div className="flex gap-2">
                    <select value={bFilter} onChange={e => { setBFilter(e.target.value); setBPreview(null); }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                      {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      <option value="tag">By Tag…</option>
                    </select>
                    {bFilter === 'tag' && (
                      <input value={bCustomTag} onChange={e => setBCustomTag(e.target.value)} placeholder="tag name"
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Message type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setBMsgType('text')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${bMsgType === 'text' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    ✏️ Custom Text
                  </button>
                  <button onClick={() => { setBMsgType('template'); if (!bTemplates.length) loadBulkTemplates(); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${bMsgType === 'template' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    📋 Template
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1.5">⚠️ For leads outside 24h window, use approved templates only</p>
              </div>

              {bMsgType === 'text' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                  <textarea value={bMessage} onChange={e => { setBMessage(e.target.value.slice(0, 1024)); setBPreview(null); }}
                    rows={3} placeholder="Hi {name}, special offer just for you! 🎉"
                    className={`${inputCls} resize-none`} />
                  <p className="text-xs text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise with lead name</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Template</label>
                  {bLoadingTpl ? <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                    : bTemplates.length === 0 ? <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3">No templates found.</p>
                    : <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bTemplates.map(tpl => (
                        <button key={tpl.name} onClick={() => onSelectB(tpl)}
                          className={`w-full text-left p-3 rounded-xl border transition ${bSelected?.name === tpl.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tpl.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{tpl.status}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}</p>
                        </button>
                      ))}
                    </div>
                  }
                  {bVars.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {bVars.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded w-14 text-center flex-shrink-0">{`{{${i+1}}}`}</span>
                          <input value={v} onChange={e => setBVars(bVars.map((x, j) => j === i ? e.target.value : x))}
                            placeholder={`Value for {{${i+1}}}`} className={inputCls} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="datetime-local" value={bScheduled} onChange={e => setBScheduled(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <p className="text-xs text-gray-400 mt-1">Leave blank to send immediately</p>
              </div>

              {/* Preview result */}
              {bPreview && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
                    <Users className="w-4 h-4" /> {bPreview.total_recipients} recipients matched
                  </div>
                  {bPreview.sample.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bPreview.sample.map((s, i) => (
                        <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{s.name || s.phone}</span>
                      ))}
                      {bPreview.total_recipients > 5 && <span className="text-xs text-blue-400">+{bPreview.total_recipients - 5} more</span>}
                    </div>
                  )}
                  {bPreview.total_recipients === 0 && <p className="text-blue-600">No leads matched. Add phone numbers to leads first.</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
          {tab === 'quick' ? (
            <Button onClick={handleQuickSend} disabled={qSending} className="w-full justify-center flex items-center gap-2">
              {qSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Template
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleBulkSend(true)} disabled={bSending} className="flex items-center gap-1.5 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" /> Save Draft
              </Button>
              <Button variant="outline" onClick={handlePreview} disabled={bPreviewing} className="flex items-center gap-1.5 flex-shrink-0">
                {bPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} Preview
              </Button>
              <Button onClick={() => handleBulkSend(false)} disabled={bSending || !bPreview || bPreview.total_recipients === 0}
                className="flex-1 justify-center flex items-center gap-1.5">
                {bSending ? <Loader2 className="w-4 h-4 animate-spin" /> : bScheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {bScheduled ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'sending', label: 'Sending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'draft', label: 'Drafts' },
  { key: 'completed', label: 'Completed' },
  { key: 'completed_with_errors', label: 'With Errors' },
];

export default function CampaignsPage() {
  const { get } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [detailName, setDetailName] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    get('/api/campaigns')
      .then(r => setCampaigns(r.data?.campaigns || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = tab === 'all' ? campaigns : campaigns.filter(c => c.status === tab);

  const tabCounts = Object.fromEntries(
    STATUS_TABS.slice(1).map(t => [t.key, campaigns.filter(c => c.status === t.key).length])
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send WhatsApp broadcasts to your leads</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-gray-200 pb-0">
        {STATUS_TABS.map(t => {
          const count = t.key === 'all' ? campaigns.length : tabCounts[t.key] || 0;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition -mb-px ${tab === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300" />
          <p className="font-semibold text-gray-500">{tab === 'all' ? 'No campaigns yet' : `No ${tab} campaigns`}</p>
          {tab === 'all' && <p className="text-sm text-gray-400">Create your first campaign to send bulk WhatsApp messages</p>}
          {tab === 'all' && (
            <Button onClick={() => setShowNew(true)} className="mt-2 flex items-center gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <CampaignCard key={i} c={c} onDetail={() => setDetailName(c.name)} onRefresh={load} />
          ))}
        </div>
      )}

      {/* New campaign panel */}
      <AnimatePresence>
        {showNew && <NewCampaignPanel onClose={() => setShowNew(false)} onSent={() => { setShowNew(false); setTimeout(load, 1000); }} />}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailName && <DetailDrawer name={detailName} onClose={() => setDetailName(null)} onRefresh={load} />}
      </AnimatePresence>
    </div>
  );
}
