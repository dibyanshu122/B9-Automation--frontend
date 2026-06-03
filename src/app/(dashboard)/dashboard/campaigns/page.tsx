'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, BarChart2, CheckCircle2,
  Clock, Loader2, MessageSquare, Plus, RefreshCw, Send, Users,
  X, XCircle, FileText, Calendar, Ban, ChevronLeft, ChevronRight,
  Globe, Smartphone, Trash2, Eye, Upload, Download, Filter,
  MoreVertical, Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useCampaigns, useInvalidate } from '@/hooks/useQueryCache';
import { useQuota } from '@/hooks/useQuota';

//  Types 

interface Campaign {
  name: string; message: string; channel: string; msg_type: string;
  template_name: string | null; total: number; sent: number; failed: number;
  queued: number; cancelled: number; status: string;
  delivered?: number; read?: number;
  scheduled_at: string | null; created_at: string | null;
}
interface PreviewResult {
  total_recipients: number;
  sample: { name: string; phone: string; score: string; tag: string }[];
}

//  Constants 

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
  { value: 'hot', label: 'Hot Leads' },
  { value: 'warm', label: 'Warm Leads' },
  { value: 'cold', label: 'Cold Leads' },
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

//  Country detection 

const COUNTRY_MAP: { prefix: string; flag: string; name: string }[] = [
  { prefix: '+91',  flag: '', name: 'India' },
  { prefix: '+1',   flag: '', name: 'USA / Canada' },
  { prefix: '+44',  flag: '', name: 'UK' },
  { prefix: '+971', flag: '', name: 'UAE' },
  { prefix: '+966', flag: '', name: 'Saudi Arabia' },
  { prefix: '+974', flag: '', name: 'Qatar' },
  { prefix: '+65',  flag: '', name: 'Singapore' },
  { prefix: '+61',  flag: '', name: 'Australia' },
  { prefix: '+60',  flag: '', name: 'Malaysia' },
  { prefix: '+880', flag: '', name: 'Bangladesh' },
  { prefix: '+92',  flag: '', name: 'Pakistan' },
  { prefix: '+977', flag: '', name: 'Nepal' },
];

function detectCountry(phone: string): string {
  // Sort by prefix length desc so +974 matches before +97
  const sorted = [...COUNTRY_MAP].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find(c => phone.startsWith(c.prefix));
  return match ? match.name : 'International';
}

interface ParseResult {
  valid: string[];
  invalidCount: number;
  duplicateCount: number;
  countryBreakdown: Record<string, number>;
  fileName: string;
}

//  WhatsApp Preview Bubble 

function WaPreview({ template, vars }: { template: any; vars: string[] }) {
  if (!template) return null;
  const body = template.components?.find((c: any) => c.type === 'BODY')?.text || '';
  const header = template.components?.find((c: any) => c.type === 'HEADER');
  const footer = template.components?.find((c: any) => c.type === 'FOOTER')?.text;
  const buttons = template.components?.find((c: any) => c.type === 'BUTTONS')?.buttons || [];

  const rendered = body.replace(/\{\{(\d+)\}\}/g, (_: string, n: string) => {
    const val = vars[parseInt(n) - 1];
    return val ? `*${val}*` : `{{${n}}}`;
  });

  const renderSafeWhatsAppText = (text: string) => {
    const parts = text.split(/(\*[^*\n]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="rounded-xl bg-[#e5ddd5] p-3">
      <p className="text-[10px] text-gray-500 text-center mb-2">WhatsApp Preview</p>
      <div className="bg-white rounded-xl shadow-sm max-w-[280px] mx-auto overflow-hidden">
        {header?.format === 'IMAGE' && (
          <div className="h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs border-b">
             Image Header
          </div>
        )}
        {header?.format === 'TEXT' && (
          <div className="px-3 pt-3 pb-1 font-bold text-sm text-gray-900">{header.text}</div>
        )}
        <div className="px-3 py-2.5">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {renderSafeWhatsAppText(rendered)}
          </p>
          {footer && <p className="text-[10px] text-gray-400 mt-1.5">{footer}</p>}
          <p className="text-[9px] text-gray-400 text-right mt-1">12:30 </p>
        </div>
        {buttons.length > 0 && (
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {buttons.map((b: any, i: number) => (
              <div key={i} className="px-3 py-2 text-center text-xs font-semibold text-blue-500">
                {b.type === 'URL' ? ' ' : b.type === 'PHONE_NUMBER' ? ' ' : ''}{b.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

//  Campaign Table 

const COL = '36px minmax(150px,1fr) 88px 96px 68px 108px 44px 48px 52px 48px 48px 40px';

// WhatsApp-style tick SVGs
const TickSent     = () => <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L5.5 10L15 1" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TickDelivered= () => <svg width="20" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5.5 10L15 1" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10.5 10L20 1" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TickRead     = () => <svg width="20" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5.5 10L15 1" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10.5 10L20 1" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function ReceiptTicks({ status }: { status: string }) {
  if (status === 'read') return <span className="inline-flex items-center gap-1 text-cyan-700"><TickRead /> Read</span>;
  if (status === 'delivered') return <span className="inline-flex items-center gap-1 text-gray-600"><TickDelivered /> Delivered</span>;
  if (status === 'sent') return <span className="inline-flex items-center gap-1 text-gray-600"><TickSent /> Sent</span>;
  return null;
}

function exportToExcel(campaigns: Campaign[]) {
  const rows = campaigns.map((c, i) => [
    i + 1, c.name, c.msg_type === 'template' ? 'Template' : 'Text',
    c.created_at ? new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z').toLocaleDateString('en-IN') : '',
    c.total, c.status, c.sent, c.delivered || 0, c.read || 0, c.failed,
  ]);
  const header = ['Sr', 'Campaign Name', 'Category', 'Created Date', 'Contacts', 'Status', 'Sent', 'Delivered', 'Read', 'Failed'];
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'campaigns.csv'; a.click();
  URL.revokeObjectURL(url);
}

function CampaignTable({ campaigns, onDetail, onRefresh }: { campaigns: Campaign[]; onDetail: (name: string) => void; onRefresh: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
      {/* Premium dark header */}
      <div className="grid text-white text-[11px] font-semibold px-4 py-3 select-none rounded-t-2xl"
        style={{ gridTemplateColumns: COL, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
        <div className="text-slate-400">Sr</div>
        <div>Campaign Name</div>
        <div>Category</div>
        <div>Created Date</div>
        <div className="text-center">Contacts</div>
        <div>Status</div>
        <div className="flex justify-center" title="View Details"><Eye className="w-3.5 h-3.5 text-slate-400" /></div>
        <div className="flex justify-center items-center gap-0.5" title="Sent"><TickSent /></div>
        <div className="flex justify-center items-center gap-0.5" title="Delivered"><TickDelivered /></div>
        <div className="flex justify-center items-center gap-0.5" title="Read"><TickRead /></div>
        <div className="flex justify-center" title="Failed"><AlertCircle className="w-3.5 h-3.5 text-red-400" /></div>
        <div className="text-center text-slate-400">More</div>
      </div>
      {/* Rows */}
      {campaigns.map((c, i) => (
        <CampaignRow key={i} idx={i} c={c} onDetail={onDetail} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function CampaignRow({ idx, c, onDetail, onRefresh }: { idx: number; c: Campaign; onDetail: (name: string) => void; onRefresh: () => void }) {
  const { post, get } = useApi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [abModal, setAbModal] = useState(false);
  const [abData, setAbData] = useState<any>(null);
  const [abLoading, setAbLoading] = useState(false);

  const openAbResults = async () => {
    setMenuOpen(false);
    setAbModal(true);
    setAbLoading(true);
    try {
      const r = await get(`/api/campaigns/${encodeURIComponent(c.name)}/ab-results`);
      setAbData(r.data);
    } catch { setAbData(null); }
    finally { setAbLoading(false); }
  };
  const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.completed;

  const doAction = async (action: string) => {
    setMenuOpen(false); setActing(action);
    try {
      if (action === 'cancel') {
        if (!confirm('Cancel this campaign?')) return;
        await post(`/api/campaigns/${encodeURIComponent(c.name)}/cancel`, {});
        toast.success('Cancelled');
      } else if (action === 'retry') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/retry-failed`, {});
        toast.success(`Retrying ${r.data.retrying} messages`);
      } else if (action === 'send-draft') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/send-draft`, {});
        toast.success(`Sending to ${r.data.queued} recipients`);
      } else if (action === 'pause') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/pause`, {});
        toast.success(`Paused ${r.data.paused} messages`);
      } else if (action === 'resume') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/resume`, {});
        toast.success(`Resumed ${r.data.resumed} messages`);
      } else if (action === 'clone') {
        const r = await post(`/api/campaigns/${encodeURIComponent(c.name)}/clone`, {});
        toast.success(`Cloned as draft: ${r.data.new_name}`);
      }
      onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setActing(null); }
  };

  const delivered = c.delivered ?? 0;
  const read = c.read ?? 0;

  return (
    <>
    <div className={`relative grid px-4 py-3 items-center text-sm transition border-t border-gray-100 hover:bg-slate-50/60 ${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'}`}
      style={{ gridTemplateColumns: COL }}>
      <div className="text-xs text-gray-400">{idx + 1}</div>
      <div className="min-w-0 pr-2">
        <p className="font-semibold text-gray-900 truncate text-sm">{c.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{c.template_name || 'Custom text'}</p>
      </div>
      <div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.msg_type === 'template' ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
          {c.msg_type === 'template' ? 'Template' : 'Text'}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {c.created_at ? new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
      </div>
      <div className="text-center text-sm font-semibold text-gray-700">{c.total}</div>
      <div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
          {cfg.icon}{cfg.label}
        </span>
      </div>
      {/* Preview */}
      <div className="flex justify-center">
        <button onClick={() => onDetail(c.name)} className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-slate-700 transition" title="View Details">
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Sent */}
      <div className="flex justify-center items-center gap-1">
        <TickSent />
        <span className="text-xs font-bold text-gray-600">{c.sent}</span>
      </div>
      {/* Delivered */}
      <div className="flex justify-center items-center gap-1">
        <TickDelivered />
        <span className={`text-xs font-bold ${delivered > 0 ? 'text-gray-600' : 'text-gray-300'}`}>{delivered || ''}</span>
      </div>
      {/* Read */}
      <div className="flex justify-center items-center gap-1">
        <TickRead />
        <span className={`text-xs font-bold ${read > 0 ? 'text-cyan-600' : 'text-gray-300'}`}>{read || ''}</span>
      </div>
      {/* Failed */}
      <div className="flex justify-center items-center gap-1">
        <AlertCircle className={`w-3 h-3 ${c.failed > 0 ? 'text-red-400' : 'text-gray-200'}`} />
        <span className={`text-xs font-bold ${c.failed > 0 ? 'text-red-500' : 'text-gray-300'}`}>{c.failed > 0 ? c.failed : ''}</span>
      </div>
      {/* More menu */}
      <div className="relative flex justify-center">
        <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }} disabled={!!acting}
          aria-label="Open campaign actions"
          title="More actions"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
          {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]">
              <button onClick={() => { setMenuOpen(false); onDetail(c.name); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 flex items-center gap-2"><BarChart2 className="w-3.5 h-3.5" /> View Details</button>
              {c.status === 'draft' && <button onClick={() => doAction('send-draft')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-emerald-600 flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Send Draft</button>}
              {c.failed > 0 && <button onClick={() => doAction('retry')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-blue-600 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Retry Failed ({c.failed})</button>}
              {c.status === 'sending' && <button onClick={() => doAction('pause')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-amber-600 flex items-center gap-2">⏸ Pause Campaign</button>}
              {c.status === 'paused' && <button onClick={() => doAction('resume')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-emerald-600 flex items-center gap-2">▶ Resume Campaign</button>}
              {(c.status === 'sending' || c.status === 'scheduled') && <button onClick={() => doAction('cancel')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-red-500 flex items-center gap-2"><Ban className="w-3.5 h-3.5" /> Cancel</button>}
              <button onClick={() => doAction('clone')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-violet-600 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Clone as Draft</button>
              <button onClick={openAbResults} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-indigo-600 flex items-center gap-2"><BarChart2 className="w-3.5 h-3.5" /> A/B Test Results</button>
            </div>
          </>
        )}
      </div>
    </div>

    {/* A/B Results Modal — rendered as sibling via fragment */}

    {abModal && (
      <>
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setAbModal(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">A/B Test Results — {c.name}</h2>
              <button onClick={() => setAbModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5">
              {abLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}
              {!abLoading && (!abData?.ab_test || !abData?.variants?.length) && (
                <div className="text-center py-8 text-gray-400">
                  <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No A/B test data found for this campaign.</p>
                  <p className="text-xs mt-1">Enable A/B testing when creating a campaign.</p>
                </div>
              )}
              {!abLoading && abData?.ab_test && abData?.variants?.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {abData.variants.map((v: any) => {
                      const deliveryRate = v.total ? Math.round((v.delivered / v.total) * 100) : 0;
                      const readRate = v.total ? Math.round((v.read / v.total) * 100) : 0;
                      const isWinner = abData.variants.length === 2 &&
                        v.read >= Math.max(...abData.variants.map((x: any) => x.read));
                      return (
                        <div key={v.variant_key}
                          className={`rounded-xl border-2 p-4 ${isWinner ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.variant_key === 'A' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                              Variant {v.variant_key}
                            </span>
                            {isWinner && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">🏆 Winner</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-3">{v.template_name || '—'}</p>
                          <div className="space-y-2">
                            {[
                              { label: 'Sent', value: v.total, color: 'bg-gray-400' },
                              { label: 'Delivered', value: v.delivered, pct: deliveryRate, color: 'bg-blue-400' },
                              { label: 'Read', value: v.read, pct: readRate, color: 'bg-emerald-400' },
                            ].map(stat => (
                              <div key={stat.label}>
                                <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
                                  <span>{stat.label}</span>
                                  <span className="font-bold text-gray-800">{stat.value}{stat.pct !== undefined ? ` (${stat.pct}%)` : ''}</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${stat.color} rounded-full transition-all`}
                                    style={{ width: `${stat.pct ?? (v.total ? (stat.value / v.total) * 100 : 0)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">
                    Winner determined by read rate. Minimum 100 sends needed for statistical significance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}

//  Status Bar (keep for detail drawer)

function StatusBar({ sent, failed, queued, total }: { sent: number; failed: number; queued: number; total: number }) {
  void queued;
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

//  Campaign Detail Drawer 

function DetailDrawer({ name, onClose, onRefresh }: { name: string; onClose: () => void; onRefresh: () => void }) {
  const { get, post } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    get(`/api/campaigns/detail?name=${encodeURIComponent(name)}&page=${p}`)
      .then(r => { setData(r.data); setPage(p); })
      .catch((e: any) => toast.error(e?.response?.data?.detail || 'Failed to load campaign details'))
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
    <>
      {/* Backdrop */}
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <motion.div
        key="detail-panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
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
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                {[
                  { label: 'Sent', val: data.sent, color: 'text-emerald-600' },
                  { label: 'Delivered', val: data.delivered ?? 0, color: 'text-blue-600' },
                  { label: 'Read', val: data.read ?? 0, color: 'text-cyan-600' },
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
                      m.status === 'read' ? 'bg-cyan-50 text-cyan-700' :
                      m.status === 'delivered' ? 'bg-blue-50 text-blue-700' :
                      m.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                      m.status === 'failed' ? 'bg-red-50 text-red-600' :
                      m.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-600'}`}>
                      <ReceiptTicks status={m.status} />
                      {!['sent', 'delivered', 'read'].includes(m.status) && m.status}
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
    </>
  );
}

//  Campaign Card 

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              {c.msg_type === 'template' ? ` ${c.template_name || 'Template'}` : ' Custom text'}
            </span>
            <span className="text-gray-200"></span>
            <span className="text-xs text-gray-400 capitalize">{c.channel}</span>
            {c.created_at && (
              <>
                <span className="text-gray-200"></span>
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
          <span className="text-xs text-gray-400">{c.total} total  {deliveryRate}%</span>
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

//  New Campaign Slide-over 

function NewCampaignPanel({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { get, post } = useApi();

  const [sendMode, setSendMode] = useState<'single' | 'bulk'>('bulk');
  const [singlePhone, setSinglePhone] = useState('');
  const [name, setName] = useState('');
  const [recipientMode, setRecipientMode] = useState<'leads' | 'excel'>('leads');
  const [filter, setFilter] = useState('all');
  const [customTag, setCustomTag] = useState('');
  const [leadLabels, setLeadLabels] = useState<{ id: string; name: string }[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [excelPhones, setExcelPhones] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [tplLoadError, setTplLoadError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [vars, setVars] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState('');
  const [ltoExpiry, setLtoExpiry] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoadingTpl(true);
    setTplLoadError('');
    const timeout = setTimeout(() => setTplLoadError('Taking too long  check your WhatsApp connection.'), 15000);
    get('/api/automation/whatsapp/templates')
      .then(r => {
        clearTimeout(timeout);
        setTemplates((r.data?.templates || []).filter((t: any) => t.status === 'APPROVED'));
      })
      .catch((e: any) => {
        clearTimeout(timeout);
        const msg = e?.response?.data?.detail || 'Could not load templates. Check WhatsApp connection.';
        setTplLoadError(msg);
      })
      .finally(() => setLoadingTpl(false));
    get('/api/leads/labels')
      .then(r => setLeadLabels(r.data?.labels || []))
      .catch(() => {});
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line

  const onSelect = (tpl: any) => {
    setSelected(tpl);
    setLtoExpiry('');
    const bodyText = tpl.components?.find((c: any) => c.type === 'BODY')?.text || '';
    const count = new Set((bodyText.match(/\{\{(\d+)\}\}/g) || []).map((m: string) => m.replace(/\D/g, ''))).size;
    setVars(Array(count).fill(''));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const raw: string[] = [];
      let invalidCount = 0;

      for (const row of rows) {
        for (const cell of row) {
          const original = String(cell ?? '').trim();
          if (!original) continue;
          const val = original.replace(/[\s\-\(\)\+\.]/g, '');
          if (!/^\d{8,15}$/.test(val)) {
            // Skip obvious non-phone values (headers, names, emails etc.)
            if (val.length > 3) invalidCount++;
            continue;
          }
          let normalized: string;
          if (val.startsWith('91') && val.length === 12) normalized = '+' + val;
          else if (val.length === 10) normalized = '+91' + val;
          else if (val.startsWith('0') && val.length === 11) normalized = '+91' + val.slice(1);
          else normalized = '+' + val;
          raw.push(normalized);
        }
      }

      const unique = [...new Set(raw)];
      const duplicateCount = raw.length - unique.length;

      // Country breakdown
      const countryBreakdown: Record<string, number> = {};
      for (const p of unique) {
        const country = detectCountry(p);
        countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
      }

      const result: ParseResult = {
        valid: unique, invalidCount, duplicateCount,
        countryBreakdown, fileName: file.name,
      };
      setParseResult(result);
      setExcelPhones(unique);
      setPreview(null);
    } catch {
      toast.error('Could not read file. Please use .xlsx or .csv format');
    }
    e.target.value = '';
  };

  const recipientFilter = filter === 'tag' ? `tag:${customTag}` : filter;

  const handlePreview = async () => {
    if (recipientMode === 'leads') {
      if (!selected) { toast.error('Select a template first'); return; }
      if (filter === 'tag' && !customTag) { toast.error('Select a lead label first'); return; }
      setPreviewing(true); setPreview(null);
      try {
        const r = await post('/api/campaigns/preview', { name: name || 'Preview', message: selected?.name || '', recipient_filter: recipientFilter });
        setPreview(r.data);
      } catch (e: any) { toast.error(e.response?.data?.detail || 'Preview failed'); }
      finally { setPreviewing(false); }
    } else {
      if (!excelPhones.length) { toast.error('Upload an Excel/CSV file first'); return; }
      setPreview({ total_recipients: excelPhones.length, sample: excelPhones.slice(0, 5).map(p => ({ name: p, phone: p, score: '', tag: '' })) });
      return;
    }
  };

  const handleSingleSend = async () => {
    if (!singlePhone.trim()) { toast.error('Phone number required'); return; }
    if (!selected) { toast.error('Select a template first'); return; }
    if (vars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    if (isLimitedTimeOffer && (!ltoExpiry || new Date(ltoExpiry).getTime() <= Date.now())) {
      toast.error('Select a future offer expiry time');
      return;
    }
    if (recipientMode === 'leads' && filter === 'tag' && !customTag) { toast.error('Select a lead label first'); return; }
    setSending(true);
    try {
      await post('/api/campaigns/send', {
        name: `Test: ${selected.name}`,
        message: selected.name,
        channel: 'whatsapp',
        msg_type: 'template',
        template_name: selected.name,
        language_code: selected.language || 'en_US',
        template_variables: vars.length ? vars : null,
        lto_expiration_time_ms: isLimitedTimeOffer ? new Date(ltoExpiry).getTime() : null,
        direct_phone: singlePhone.replace(/\s/g, ''),
      });
      toast.success(`Template sent to ${singlePhone}`);
      setSinglePhone(''); onSent();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Send failed'); }
    finally { setSending(false); }
  };

  const handleSend = async (saveAsDraft = false) => {
    if (!name.trim()) { toast.error('Campaign name required'); return; }
    if (!selected) { toast.error('Select a template first'); return; }
    if (abEnabled && selectedB && selectedB.name === selected.name) { toast.error('A/B test variants must use different templates'); return; }
    if (vars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    if (isLimitedTimeOffer && (!ltoExpiry || new Date(ltoExpiry).getTime() <= Date.now())) {
      toast.error('Select a future offer expiry time');
      return;
    }
    if (recipientMode === 'excel' && !excelPhones.length) { toast.error('Upload a file with valid phone numbers'); return; }
    if (!saveAsDraft) {
      const count = recipientMode === 'excel' ? excelPhones.length : preview?.total_recipients;
      if (!count && recipientMode === 'leads') { toast.error('Click Preview to see recipients first'); return; }
    }
    setSending(true);
    try {
      const payload: any = {
        name: name.trim(), message: selected?.name || '',
        channel: 'whatsapp', scheduled_at: scheduled || null,
        msg_type: 'template', template_name: selected?.name || null,
        language_code: selected?.language || 'en_US',
        template_variables: vars.length ? vars : null,
        lto_expiration_time_ms: isLimitedTimeOffer ? new Date(ltoExpiry).getTime() : null,
        save_as_draft: saveAsDraft,
        // A/B test
        ...(abEnabled && selectedB ? {
          ab_test: true,
          ab_variant_a_template: selected?.name,
          ab_variant_b_template: selectedB?.name,
          ab_split: abSplit,
        } : {}),
      };
      if (recipientMode === 'excel') {
        payload.phone_list = excelPhones;
        payload.recipient_filter = 'phone_list';
      } else {
        payload.recipient_filter = recipientFilter;
      }
      const r = await post('/api/campaigns/send', payload);
      if (saveAsDraft) {
        toast.success('Draft saved');
      } else if (r.data.scheduled_at) {
        toast.success(`Campaign scheduled for ${r.data.recipient_count} recipients`);
      } else {
        toast((t) => (
          <div className="flex items-center gap-3">
            <span>✅ Campaign started — sending to {r.data.recipient_count} recipients</span>
            <a href="/dashboard/analytics" className="text-xs font-bold text-blue-600 underline whitespace-nowrap" onClick={() => toast.dismiss(t.id)}>View analytics →</a>
          </div>
        ), { duration: 6000 });
      }
      onClose(); onSent();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSending(false); }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'send'>('setup');
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
  // A/B test state
  const [abEnabled, setAbEnabled] = useState(false);
  const [selectedB, setSelectedB] = useState<any>(null);
  const [abSplit, setAbSplit] = useState(50);
  const isLimitedTimeOffer = Boolean(selected?.components?.some((component: any) => component.type === 'LIMITED_TIME_OFFER'));

  const canProceed = selected && name.trim() &&
    !vars.some(v => !v.trim()) &&
    (recipientMode === 'excel' ? excelPhones.length > 0 : true) &&
    (!isLimitedTimeOffer || (ltoExpiry && new Date(ltoExpiry).getTime() > Date.now())) &&
    (!abEnabled || selectedB);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 overflow-y-auto py-6"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[88vh]"
          onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">New Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* 2-Tab nav */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-5">
          {[
            { key: 'setup', label: '1  Template & Recipients' },
            { key: 'send',  label: '2  Preview & Send' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => { if (tab.key === 'send' && !canProceed) { toast.error('Fill campaign name, select template, fill variables'); return; } if (tab.key === 'send') handlePreview(); setActiveTab(tab.key as any); }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">

          {/* Single / Bulk toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setSendMode('single')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${sendMode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
               Single Number
            </button>
            <button onClick={() => setSendMode('bulk')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${sendMode === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Users className="w-3.5 h-3.5" /> Bulk Campaign
            </button>
          </div>

          {/* Single: just phone input */}
          {sendMode === 'single' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                WhatsApp Number <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal"> for testing templates</span>
              </label>
              <input value={singlePhone} onChange={e => setSinglePhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Send directly to one number — great for testing before bulk send</p>
              {selected && vars.length > 0 && (
                <p className="text-xs text-violet-600 mt-1">⚡ Dynamic template — fill variable values above before sending</p>
              )}
            </div>
          )}

          {/* Bulk: campaign name */}
          {sendMode === 'bulk' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Offer 2025" className={inputCls} />
          </div>
          )}

          {/* Recipients source toggle (bulk only) */}
          {sendMode === 'bulk' && <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setRecipientMode('leads'); setPreview(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${recipientMode === 'leads' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                <Users className="w-3.5 h-3.5" /> From Leads
              </button>
              <button onClick={() => { setRecipientMode('excel'); setPreview(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${recipientMode === 'excel' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                Upload Excel / CSV
              </button>
            </div>

            {recipientMode === 'leads' && (
              <div className="flex gap-2">
                <select value={filter} onChange={e => { setFilter(e.target.value); setPreview(null); }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  <option value="tag">By Tag</option>
                </select>
                {filter === 'tag' && (
                  <select value={customTag} onChange={e => setCustomTag(e.target.value)} className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">Select label</option>
                    {leadLabels.map((label) => <option key={label.id} value={label.name}>{label.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {recipientMode === 'excel' && (
              <div className="space-y-3">
                {/* Upload zone */}
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 cursor-pointer transition ${parseResult ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  {parseResult ? (
                    <>
                      <Upload className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-semibold text-green-700">{parseResult.fileName}</p>
                      <p className="text-xs text-green-600">{parseResult.valid.length} valid numbers found</p>
                      <p className="text-xs text-gray-400 underline">Click to replace file</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">Upload Excel (.xlsx) or CSV</p>
                      <p className="text-xs text-gray-400">Phone numbers extracted automatically from any column</p>
                    </>
                  )}
                </label>

                {/* Validation Summary */}
                {parseResult && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50">
                      <div className="px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-emerald-600">{parseResult.valid.length}</p>
                        <p className="text-[10px] text-gray-500">Valid Numbers</p>
                      </div>
                      <div className="px-3 py-2.5 text-center">
                        <p className={`text-lg font-bold ${parseResult.duplicateCount > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{parseResult.duplicateCount}</p>
                        <p className="text-[10px] text-gray-500">Duplicates Removed</p>
                      </div>
                      <div className="px-3 py-2.5 text-center">
                        <p className={`text-lg font-bold ${parseResult.invalidCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>{parseResult.invalidCount}</p>
                        <p className="text-[10px] text-gray-500">Invalid Skipped</p>
                      </div>
                    </div>

                    {/* Country breakdown */}
                    <div className="px-3 py-2.5 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Country Breakdown
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(parseResult.countryBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([country, count]) => (
                            <span key={country} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5" />
                              {country} <strong>{count}</strong>
                            </span>
                          ))
                        }
                      </div>
                    </div>

                    {/* Warnings */}
                    {(parseResult.duplicateCount > 0 || parseResult.invalidCount > 0) && (
                      <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
                        {parseResult.duplicateCount > 0 && (
                          <p className="text-[10px] text-amber-700 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            {parseResult.duplicateCount} duplicate number{parseResult.duplicateCount > 1 ? 's' : ''} removed automatically
                          </p>
                        )}
                        {parseResult.invalidCount > 0 && (
                          <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                            <XCircle className="w-3 h-3" />
                            {parseResult.invalidCount} invalid cell{parseResult.invalidCount > 1 ? 's' : ''} skipped (non-phone values)
                          </p>
                        )}
                      </div>
                    )}

                    {parseResult.valid.length === 0 && (
                      <div className="px-3 py-2.5 bg-red-50 border-t border-red-100">
                        <p className="text-xs text-red-600 font-semibold"> No valid phone numbers found. Please check your file format.</p>
                        <p className="text-[10px] text-red-500 mt-0.5">Expected: +91XXXXXXXXXX or 10-digit numbers</p>
                      </div>
                    )}
                  </div>
                )}

                {!parseResult && (
                  <p className="text-[10px] text-gray-400">
                    Supports any column layout. Numbers auto-normalized to E.164 format. Duplicates removed automatically.
                  </p>
                )}
              </div>
            )}
          </div>}

          {/* Meta compliance notice  bulk only */}
          {sendMode === 'bulk' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1"> Meta WhatsApp Compliance</p>
              <ul className="space-y-0.5 opacity-90">
                <li> Only <strong>APPROVED templates</strong> can be used for bulk campaigns</li>
                <li> Free-form text can only be sent within the 24-hour window after a customer messages you</li>
                <li> Sending to opted-out contacts is automatically blocked</li>
              </ul>
            </div>
          )}

          {/* Template dropdown  for single always show; for Excel bulk only after valid upload */}
          {(sendMode === 'single' || recipientMode === 'leads' || (recipientMode === 'excel' && parseResult && parseResult.valid.length > 0)) && (
          <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Template <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* Dropdown trigger */}
              <button type="button" onClick={() => setDropdownOpen(o => !o)}
                className={`w-full text-left border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white ${dropdownOpen ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-400'}`}>
                {loadingTpl ? (
                  <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading templates</span>
                ) : selected ? (
                  <span className="flex items-center gap-2 truncate">
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${selected.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selected.status}</span>
                    <span className="font-semibold text-gray-800 truncate">{selected.name}</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Click to choose a template</span>
                )}
                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {tplLoadError ? (
                    <div className="p-3 text-sm text-red-600">
                      <p className="font-semibold">Failed to load templates</p>
                      <p className="text-xs mt-1">{tplLoadError}</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-3 text-sm text-amber-600">
                      No approved templates found. <a href="/dashboard/templates" className="font-semibold underline" onClick={() => setDropdownOpen(false)}>Create templates </a>
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

          {/* Template variable inputs — dynamic template */}
          {vars.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">⚡ Dynamic Template</span>
                <span className="text-xs text-violet-700">{vars.length} variable{vars.length > 1 ? 's' : ''} — personalized per lead</span>
              </div>
              <p className="text-xs text-gray-500">
                Type a fixed value (same for all) or use a lead field:
              </p>
              {/* Smart lead field suggestions */}
              <div className="flex flex-wrap gap-1 mb-2">
                {['{{lead.name}}','{{lead.phone}}','{{lead.email}}','{{lead.message}}'].map(tag => (
                  <button key={tag} type="button"
                    onClick={() => {
                      const emptyIdx = vars.findIndex(v => !v.trim());
                      if (emptyIdx >= 0) setVars(vars.map((x, j) => j === emptyIdx ? tag : x));
                    }}
                    className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-violet-700 hover:bg-violet-200 transition">
                    {tag}
                  </button>
                ))}
              </div>
              {vars.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-white border border-violet-200 text-violet-700 px-2 py-1.5 rounded-lg w-14 text-center flex-shrink-0">{`{{${i+1}}}`}</span>
                  <input value={v} onChange={e => setVars(vars.map((x, j) => j === i ? e.target.value : x))}
                    placeholder={i === 0 ? '{{lead.name}} — customer name' : i === 1 ? '{{lead.phone}} or fixed value' : `Value for {{${i+1}}}`}
                    className={inputCls} />
                </div>
              ))}
              <p className="text-[11px] text-gray-400 mt-1">Lead fields are replaced per-customer when bulk sending. Fixed text is same for everyone.</p>
            </div>
          )}

          {/* Static template indicator */}
          {vars.length === 0 && selected && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <span className="text-[11px] font-bold text-gray-500">📌 Static Template</span>
              <span className="text-xs text-gray-400">Same message sent to all recipients. No variables.</span>
            </div>
          )}

          {isLimitedTimeOffer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <label className="mb-1 block text-sm font-semibold text-amber-900">
                Offer expiry date and time <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" value={ltoExpiry} onChange={e => setLtoExpiry(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <p className="mt-1 text-xs text-amber-700">WhatsApp uses this timestamp for the live countdown. Choose a future time for each send.</p>
            </div>
          )}

          {/* A/B Test Toggle */}
          {activeTab === 'setup' && selected && recipientMode === 'leads' && (
            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-3">
              <div className="flex items-center justify-between mb-0">
                <div>
                  <p className="text-sm font-bold text-violet-900">A/B Testing</p>
                  <p className="text-[11px] text-violet-600">Send two template variants, compare which performs better</p>
                </div>
                <button
                  onClick={() => {
                    const alternates = templates.filter(t => t.name !== selected?.name);
                    if (!abEnabled && alternates.length === 0) { toast.error('A/B test needs at least 2 approved templates'); return; }
                    setAbEnabled(v => !v); setSelectedB(null);
                  }}
                  title={templates.filter(t => t.name !== selected?.name).length === 0 ? 'Need 2+ approved templates for A/B test' : undefined}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${abEnabled ? 'bg-violet-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${abEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {abEnabled && (
                <div className="mt-3 space-y-3">
                  {/* Variant A label */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">A</span>
                    <span className="text-xs text-gray-600 font-medium">{selected?.name}</span>
                    <span className="text-[10px] text-gray-400">(already selected above)</span>
                  </div>

                  {/* Variant B selector */}
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">B</span>
                      <label className="text-xs font-semibold text-gray-700">Select Variant B template</label>
                    </div>
                    <button type="button" onClick={() => setDropdownBOpen(o => !o)}
                      className={`w-full text-left border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between bg-white transition ${dropdownBOpen ? 'border-violet-400 ring-2 ring-violet-200' : 'border-gray-200 hover:border-gray-400'}`}>
                      {selectedB ? (
                        <span className="font-semibold text-gray-800 truncate">{selectedB.name}</span>
                      ) : (
                        <span className="text-gray-400">Choose a different template for B…</span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${dropdownBOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {dropdownBOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {templates.filter(t => t.name !== selected?.name).map(tpl => (
                          <button key={tpl.name} onClick={() => { setSelectedB(tpl); setDropdownBOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 ${selectedB?.name === tpl.name ? 'bg-violet-50' : ''}`}>
                            <p className="font-semibold text-gray-800 truncate">{tpl.name}</p>
                            <p className="text-xs text-gray-400 truncate">{tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}</p>
                          </button>
                        ))}
                        {templates.filter(t => t.name !== selected?.name).length === 0 && (
                          <p className="p-3 text-xs text-gray-400">No other approved templates available</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Split % */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Split ratio — <span className="text-violet-700">A: {abSplit}%</span> · <span className="text-orange-600">B: {100 - abSplit}%</span>
                    </label>
                    <input type="range" min={10} max={90} step={5} value={abSplit}
                      onChange={e => setAbSplit(Number(e.target.value))}
                      className="w-full accent-violet-600" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>10%</span><span>50/50</span><span>90%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp Preview — always visible in Tab 1 */}
          {activeTab === 'setup' && selected && (
            <WaPreview template={abEnabled && selectedB ? null : selected} vars={vars} />
          )}

          {/* TAB 2: Preview + Schedule */}
          {activeTab === 'send' && (
            <>
              {/* Recipient count */}
              {previewing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading recipient count...
                </div>
              )}
              {preview && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm mb-2">
                    <Users className="w-4 h-4" /> {preview.total_recipients} recipients will receive this campaign
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preview.sample.map((s: any, i: number) => (
                      <span key={i} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">{s.name || s.phone}</span>
                    ))}
                    {preview.total_recipients > 5 && <span className="text-xs text-emerald-400">+{preview.total_recipients - 5} more</span>}
                  </div>
                </div>
              )}

              {/* Template preview */}
              {selected && <WaPreview template={selected} vars={vars} />}

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Schedule <span className="text-gray-400 font-normal">(optional — leave blank to send now)</span>
                </label>
                <input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </>
          )}
          </>
          )}
        </div>

        {/* Footer — tab-aware */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          {sendMode === 'single' ? (
            <Button onClick={handleSingleSend} disabled={sending || !selected || !singlePhone.trim()}
              className="w-full justify-center flex items-center gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Template
            </Button>
          ) : activeTab === 'setup' ? (
            /* Tab 1 footer: Next → */
            <Button onClick={() => { if (!canProceed) { toast.error('Fill name, select template, fill all variables'); return; } handlePreview(); setActiveTab('send'); }}
              disabled={!canProceed} className="w-full justify-center flex items-center gap-2">
              Next: Preview & Send →
            </Button>
          ) : (
            /* Tab 2 footer: Save Draft + Send */
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('setup')} className="flex items-center gap-1.5 flex-shrink-0">
                ← Back
              </Button>
              <Button variant="outline" onClick={() => handleSend(true)} disabled={sending} className="flex items-center gap-1.5 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" /> Save Draft
              </Button>
              <Button onClick={() => handleSend(false)} disabled={sending || (recipientMode === 'leads' && !preview) || (recipientMode === 'excel' && !excelPhones.length)}
                className="flex-1 justify-center flex items-center gap-1.5">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {scheduled ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

//  Main Page 

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'sending', label: 'Sending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'draft', label: 'Drafts' },
  { key: 'completed', label: 'Completed' },
  { key: 'completed_with_errors', label: 'With Errors' },
];

export default function CampaignsPage() {
  const { isExpired } = useQuota();
  const [tab, setTab] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  // React Query — cached 30s, no refetch on nav away/back
  const { data: campaignData, isLoading: loading, refetch: load } = useCampaigns();
  const { invalidateCampaigns } = useInvalidate();
  const campaigns: Campaign[] = Array.isArray(campaignData) ? campaignData : (campaignData?.campaigns ?? []);

  useEffect(() => { /* React Query handles initial fetch */ }, []);

  const filtered = campaigns.filter(c => {
    if (tab !== 'all' && c.status !== tab) return false;
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.template_name || '').toLowerCase().includes(q)) return false;
    }
    if (templateFilter !== 'all' && (c.template_name || '') !== templateFilter) return false;
    if (dateFrom && c.created_at) {
      const d = new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z');
      if (d < new Date(dateFrom)) return false;
    }
    if (dateTo && c.created_at) {
      const d = new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z');
      if (d > new Date(dateTo + 'T23:59:59Z')) return false;
    }
    return true;
  });

  const tabCounts = Object.fromEntries(
    STATUS_TABS.slice(1).map(t => [t.key, campaigns.filter(c => c.status === t.key).length])
  );
  const templateOptions = Array.from(new Set(campaigns.map(c => c.template_name).filter(Boolean))) as string[];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send WhatsApp broadcasts to your leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exportToExcel(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Button onClick={() => isExpired ? toast.error('Plan expired — renew to create campaigns') : setShowNew(true)} disabled={isExpired} className="flex items-center gap-2" title={isExpired ? 'Plan expired' : undefined}>
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Search name or template…"
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          {nameSearch && <button onClick={() => setNameSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
        </div>
        <select value={templateFilter} onChange={e => setTemplateFilter(e.target.value)}
          aria-label="Filter campaigns by template"
          className="min-w-[160px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
          <option value="all">All templates</option>
          {templateOptions.map(template => <option key={template} value={template}>{template}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter className="w-3.5 h-3.5" /> Date:
        </div>
        <div className="relative">
          <input ref={dateFromRef} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white [&::-webkit-calendar-picker-indicator]:opacity-0" />
          <button type="button" aria-label="Open start date picker"
            onClick={() => { dateFromRef.current?.focus(); dateFromRef.current?.showPicker?.(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
            <Calendar className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-xs text-gray-400">to</span>
        <div className="relative">
          <input ref={dateToRef} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white [&::-webkit-calendar-picker-indicator]:opacity-0" />
          <button type="button" aria-label="Open end date picker"
            onClick={() => { dateToRef.current?.focus(); dateToRef.current?.showPicker?.(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
            <Calendar className="h-3.5 w-3.5" />
          </button>
        </div>
        {(nameSearch || templateFilter !== 'all' || dateFrom || dateTo) && (
          <button onClick={() => { setNameSearch(''); setTemplateFilter('all'); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
        {filtered.length < campaigns.length && (
          <span className="text-xs text-gray-400">{filtered.length} of {campaigns.length} shown</span>
        )}
        </div>
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
        <CampaignTable campaigns={filtered} onDetail={setDetailName} onRefresh={() => { invalidateCampaigns(); load(); }} />
      )}

      {/* New campaign panel */}
      <AnimatePresence>
        {showNew && <NewCampaignPanel onClose={() => setShowNew(false)} onSent={() => { setShowNew(false); setTimeout(load, 1000); }} />}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailName && <DetailDrawer name={detailName} onClose={() => setDetailName(null)} onRefresh={() => { invalidateCampaigns(); load(); }} />}
      </AnimatePresence>
    </div>
  );
}
