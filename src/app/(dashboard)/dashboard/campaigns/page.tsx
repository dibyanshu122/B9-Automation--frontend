'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, BarChart2, CheckCircle2,
  Clock, Loader2, MessageSquare, Plus, RefreshCw, Send, Users,
  X, XCircle, FileText, Calendar, Ban, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/button';
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

  const [name, setName] = useState('');
  const [recipientMode, setRecipientMode] = useState<'leads' | 'excel'>('leads');
  const [filter, setFilter] = useState('all');
  const [customTag, setCustomTag] = useState('');
  const [excelPhones, setExcelPhones] = useState<string[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [vars, setVars] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoadingTpl(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setTemplates(r.data?.templates || []))
      .catch(() => toast.error('Could not load templates'))
      .finally(() => setLoadingTpl(false));
  }, []); // eslint-disable-line

  const onSelect = (tpl: any) => {
    setSelected(tpl);
    const bodyText = tpl.components?.find((c: any) => c.type === 'BODY')?.text || '';
    const count = new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map((m: string) => m.replace(/\D/g, ''))).size;
    setVars(Array(count).fill(''));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      const phones: string[] = [];
      for (const row of rows) {
        for (const cell of row) {
          const val = String(cell ?? '').trim().replace(/[\s\-\(\)\.]/g, '');
          if (/^\+?\d{8,15}$/.test(val)) {
            phones.push(val.startsWith('+') ? val : val);
          }
        }
      }
      const unique = [...new Set(phones)];
      setExcelPhones(unique);
      setParsedCount(unique.length);
      setPreview(null);
      toast.success(`${unique.length} phone numbers loaded from ${file.name}`);
    } catch {
      toast.error('Could not read file. Please use .xlsx or .csv format');
    }
    e.target.value = '';
  };

  const recipientFilter = filter === 'tag' ? `tag:${customTag}` : filter;

  const handlePreview = async () => {
    if (recipientMode === 'leads') {
      if (!selected) { toast.error('Select a template first'); return; }
      setPreviewing(true); setPreview(null);
      try {
        const r = await post('/api/campaigns/preview', { name: name || 'Preview', message: selected?.name || '', recipient_filter: recipientFilter });
        setPreview(r.data);
      } catch (e: any) { toast.error(e.response?.data?.detail || 'Preview failed'); }
      finally { setPreviewing(false); }
    } else {
      if (!excelPhones.length) { toast.error('Upload an Excel/CSV file first'); return; }
      setPreview({ total_recipients: excelPhones.length, sample: excelPhones.slice(0, 5).map(p => ({ name: p, phone: p, score: '', tag: '' })) });
    }
  };

  const handleSend = async (saveAsDraft = false) => {
    if (!name.trim()) { toast.error('Campaign name required'); return; }
    if (!selected) { toast.error('Select a template first'); return; }
    if (vars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    if (recipientMode === 'excel' && !excelPhones.length) { toast.error('Upload a file with phone numbers'); return; }
    if (!saveAsDraft) {
      const count = recipientMode === 'excel' ? excelPhones.length : preview?.total_recipients;
      if (!count) { toast.error('Preview recipients first'); return; }
      if (!confirm(`Send to ${count} recipient${count !== 1 ? 's' : ''}?`)) return;
    }
    setSending(true);
    try {
      const payload: any = {
        name: name.trim(), message: selected?.name || '',
        channel: 'whatsapp', scheduled_at: scheduled || null,
        msg_type: 'template', template_name: selected?.name || null,
        language_code: selected?.language || 'en_US',
        template_variables: vars.length ? vars : null,
        save_as_draft: saveAsDraft,
      };
      if (recipientMode === 'excel') {
        payload.phone_list = excelPhones;
        payload.recipient_filter = 'phone_list';
      } else {
        payload.recipient_filter = recipientFilter;
      }
      const r = await post('/api/campaigns/send', payload);
      if (saveAsDraft) toast.success('Draft saved');
      else if (r.data.scheduled_at) toast.success(`Campaign scheduled for ${r.data.recipient_count} recipients`);
      else toast.success(`Campaign started — sending to ${r.data.recipient_count} recipients`);
      onClose(); onSent();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSending(false); }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-10 pb-6 px-4 overflow-y-auto"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col"
          onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Campaign</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select an approved template and send to your leads</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">

          {/* Campaign name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Offer 2025" className={inputCls} />
          </div>

          {/* Recipients source toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setRecipientMode('leads'); setPreview(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${recipientMode === 'leads' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                <Users className="w-3.5 h-3.5" /> From Leads
              </button>
              <button onClick={() => { setRecipientMode('excel'); setPreview(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${recipientMode === 'excel' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                📊 Upload Excel / CSV
              </button>
            </div>

            {recipientMode === 'leads' && (
              <div className="flex gap-2">
                <select value={filter} onChange={e => { setFilter(e.target.value); setPreview(null); }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  <option value="tag">By Tag…</option>
                </select>
                {filter === 'tag' && (
                  <input value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="tag name"
                    className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                )}
              </div>
            )}

            {recipientMode === 'excel' && (
              <div className="space-y-2">
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition ${parsedCount > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/30'}`}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  {parsedCount > 0 ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <p className="text-sm font-semibold text-green-700">{parsedCount} numbers loaded</p>
                      <p className="text-xs text-green-600">{excelFileName}</p>
                      <p className="text-xs text-gray-400">Click to replace file</p>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📊</span>
                      <p className="text-sm font-semibold text-gray-700">Click to upload Excel or CSV</p>
                      <p className="text-xs text-gray-400">Phone numbers will be extracted automatically</p>
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-400">File should have phone numbers with country code (+91XXXXXXXXXX). One number per row or in any column.</p>
              </div>
            )}
          </div>

          {/* Template dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Template <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-amber-600 mb-2">⚠️ Use APPROVED templates for leads outside 24h window</p>
            <div className="relative">
              {/* Dropdown trigger */}
              <button type="button" onClick={() => setDropdownOpen(o => !o)}
                className={`w-full text-left border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white ${dropdownOpen ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-400'}`}>
                {loadingTpl ? (
                  <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading templates…</span>
                ) : selected ? (
                  <span className="flex items-center gap-2 truncate">
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${selected.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selected.status}</span>
                    <span className="font-semibold text-gray-800 truncate">{selected.name}</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Click to choose a template…</span>
                )}
                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="p-3 text-sm text-amber-600">
                      No templates found. <a href="/dashboard/templates" className="font-semibold underline" onClick={() => setDropdownOpen(false)}>Create templates →</a>
                    </div>
                  ) : (
                    templates.map(tpl => (
                      <button key={tpl.name} onClick={() => { onSelect(tpl); setDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${selected?.name === tpl.name ? 'bg-green-50' : ''}`}>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${tpl.status === 'APPROVED' ? 'bg-green-100 text-green-700' : tpl.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                          {tpl.status}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">{tpl.name}</p>
                          <p className="text-xs text-gray-400 truncate">{tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}</p>
                        </div>
                        {selected?.name === tpl.name && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Template variable inputs */}
          {vars.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Template Variables <span className="text-red-500">*</span></label>
              {vars.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded w-14 text-center flex-shrink-0">{`{{${i+1}}}`}</span>
                  <input value={v} onChange={e => setVars(vars.map((x, j) => j === i ? e.target.value : x))}
                    placeholder={`Value for {{${i+1}}}`} className={inputCls} />
                </div>
              ))}
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          {/* Preview result */}
          {preview && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
                <Users className="w-4 h-4" /> {preview.total_recipients} recipients
              </div>
              <div className="flex flex-wrap gap-1">
                {preview.sample.map((s, i) => (
                  <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{s.name || s.phone}</span>
                ))}
                {preview.total_recipients > 5 && <span className="text-xs text-blue-400">+{preview.total_recipients - 5} more</span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSend(true)} disabled={sending} className="flex items-center gap-1.5 flex-shrink-0">
              <FileText className="w-3.5 h-3.5" /> Save Draft
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={previewing} className="flex items-center gap-1.5 flex-shrink-0">
              {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} Preview
            </Button>
            <Button onClick={() => handleSend(false)} disabled={sending || (!preview && recipientMode !== 'excel')}
              className="flex-1 justify-center flex items-center gap-1.5">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {scheduled ? 'Schedule' : 'Send Now'}
            </Button>
          </div>
        </div>
        </motion.div>
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
