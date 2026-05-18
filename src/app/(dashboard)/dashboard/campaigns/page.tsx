'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

interface Campaign {
  name: string;
  message: string;
  channel: string;
  total: number;
  sent: number;
  failed: number;
  queued: number;
  created_at: string | null;
}

interface PreviewResult {
  total_recipients: number;
  sample: { name: string; phone: string; score: string; tag: string }[];
  message_preview: string;
  filter: string;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Leads' },
  { value: 'hot', label: 'Hot Leads' },
  { value: 'warm', label: 'Warm Leads' },
  { value: 'cold', label: 'Cold Leads' },
];

function StatusBar({ sent, failed, queued, total }: { sent: number; failed: number; queued: number; total: number }) {
  if (!total) return null;
  const sentPct = Math.round((sent / total) * 100);
  const failPct = Math.round((failed / total) * 100);
  const qPct = 100 - sentPct - failPct;
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100">
      <div style={{ width: `${sentPct}%` }} className="bg-green-400" />
      <div style={{ width: `${failPct}%` }} className="bg-red-400" />
      <div style={{ width: `${qPct}%` }} className="bg-gray-200" />
    </div>
  );
}

function CampaignRow({ c }: { c: Campaign }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{c.name}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.channel}</span>
          </div>
          <StatusBar sent={c.sent} failed={c.failed} queued={c.queued} total={c.total} />
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{c.sent} sent</span>
            {c.failed > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" />{c.failed} failed</span>}
            {c.queued > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" />{c.queued} queued</span>}
            <span className="ml-auto">{c.total} recipients</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.message}</p>
          {c.created_at && (
            <p className="text-xs text-gray-400 mt-2">Sent {new Date(c.created_at).toLocaleString('en-IN')}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quick Send (direct number → template) ──────────────────────────────────

function QuickSendPanel() {
  const { get, post } = useApi();
  const [phone, setPhone] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [vars, setVars] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoadingTpl(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setTemplates((r.data?.templates || []).filter((t: any) => t.status === 'APPROVED')))
      .catch(() => toast.error('Could not load templates'))
      .finally(() => setLoadingTpl(false));
  }, []); // eslint-disable-line

  const onSelect = (tpl: any) => {
    setSelected(tpl);
    const body = tpl.components?.find((c: any) => c.type === 'BODY');
    const bodyText = body?.text || '';
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    setVars(Array(matches.length).fill(''));
  };

  const handleSend = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned) { toast.error('Phone number required'); return; }
    if (!selected) { toast.error('Select a template first'); return; }
    if (vars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    setSending(true);
    try {
      await post('/api/campaigns/send', {
        name: `Quick: ${selected.name}`,
        message: selected.name,
        recipient_filter: `phone:${cleaned}`,
        channel: 'whatsapp',
        msg_type: 'template',
        template_name: selected.name,
        language_code: selected.language || 'en_US',
        template_variables: vars.length > 0 ? vars : null,
        direct_phone: cleaned,
      });
      toast.success(`Template sent to ${cleaned}`);
      setPhone(''); setSelected(null); setVars([]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const bodyText = selected?.components?.find((c: any) => c.type === 'BODY')?.text || '';

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-500" />
        <h2 className="font-semibold text-gray-900">Quick Send</h2>
        <span className="text-xs text-gray-400 ml-1">Template → direct to any number</span>
      </div>

      {/* Phone input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp Number <span className="text-gray-400 font-normal">(with country code)</span>
        </label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-400 mt-1">Example: +919876543210 (no spaces or dashes needed)</p>
      </div>

      {/* Template picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Approved Template</label>
        {loadingTpl ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            No approved templates found. Create templates in <strong>Meta Business Suite → WhatsApp Manager</strong>.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {templates.map((tpl: any) => (
              <button key={tpl.name} onClick={() => onSelect(tpl)}
                className={`w-full text-left p-3 rounded-lg border transition ${selected?.name === tpl.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">{tpl.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Variable inputs */}
      {selected && vars.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
          <div className="space-y-2">
            {vars.map((val, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 w-14 text-center flex-shrink-0">
                  {`{{${idx + 1}}}`}
                </span>
                <input
                  value={val}
                  onChange={e => { const n = [...vars]; n[idx] = e.target.value; setVars(n); }}
                  placeholder={`Value for {{${idx + 1}}}`}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {selected && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs text-gray-500 font-medium mb-1">Message Preview</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {vars.reduce((t, v, i) => t.replace(`{{${i + 1}}}`, v || `{{${i + 1}}}`), bodyText)}
          </p>
        </div>
      )}

      <Button onClick={handleSend} disabled={sending || !selected || !phone.trim()} className="flex items-center gap-2 w-full justify-center">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send Template
      </Button>
    </Card>
  );
}

// ─── Bulk Campaign form ──────────────────────────────────────────────────────

function BulkCampaignForm({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { get, post } = useApi();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [customTag, setCustomTag] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [sending, setSending] = useState(false);
  const [msgType, setMsgType] = useState<'text' | 'template'>('text');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateVars, setTemplateVars] = useState<string[]>([]);

  const loadTemplates = () => {
    setLoadingTemplates(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setTemplates(r.data?.templates || []))
      .catch(() => toast.error('Could not load templates'))
      .finally(() => setLoadingTemplates(false));
  };

  const onSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    const body = tpl.components?.find((c: any) => c.type === 'BODY');
    const bodyText = body?.text || '';
    setMessage(bodyText);
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    setTemplateVars(Array(matches.length).fill(''));
  };

  const recipientFilter = filter === 'tag' ? `tag:${customTag}` : filter;

  const handlePreview = async () => {
    if (msgType === 'text' && !message.trim()) { toast.error('Enter a message first'); return; }
    if (msgType === 'template' && !selectedTemplate) { toast.error('Select a template first'); return; }
    setPreviewing(true);
    setPreview(null);
    try {
      const r = await post('/api/campaigns/preview', { name: name || 'Preview', message: message || selectedTemplate?.name || '', recipient_filter: recipientFilter });
      setPreview(r.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!name.trim()) { toast.error('Campaign name is required'); return; }
    if (msgType === 'template') {
      if (!selectedTemplate) { toast.error('Select a template first'); return; }
      if (templateVars.some(v => !v.trim())) { toast.error('Fill all template variables'); return; }
    } else {
      if (!message.trim()) { toast.error('Message is required'); return; }
    }
    if (!preview || preview.total_recipients === 0) {
      toast.error('Preview first to check recipients');
      return;
    }
    if (!confirm(`Send to ${preview.total_recipients} lead${preview.total_recipients !== 1 ? 's' : ''}?`)) return;

    setSending(true);
    try {
      const r = await post('/api/campaigns/send', {
        name: name.trim(),
        message: msgType === 'template' ? (selectedTemplate?.name || '') : message.trim(),
        recipient_filter: recipientFilter,
        channel: 'whatsapp',
        scheduled_at: scheduledAt || null,
        msg_type: msgType,
        template_name: msgType === 'template' ? selectedTemplate?.name || null : null,
        language_code: msgType === 'template' ? (selectedTemplate?.language || 'en_US') : 'en_US',
        template_variables: msgType === 'template' && templateVars.length > 0 ? templateVars : null,
      });
      toast.success(
        r.data.scheduled_at
          ? `Campaign scheduled for ${r.data.recipient_count} recipients`
          : `Campaign started — sending to ${r.data.recipient_count} recipients`
      );
      onClose();
      setTimeout(onSent, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" /> New Broadcast Campaign
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Offer 2025"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
          <div className="flex gap-2">
            <select value={filter} onChange={e => { setFilter(e.target.value); setPreview(null); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white flex-1">
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              <option value="tag">By Tag…</option>
            </select>
            {filter === 'tag' && (
              <input value={customTag} onChange={e => { setCustomTag(e.target.value); setPreview(null); }} placeholder="tag name"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-32" />
            )}
          </div>
        </div>
      </div>

      {/* Message Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
        <div className="flex gap-2">
          <button onClick={() => setMsgType('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${msgType === 'text' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ✏️ Custom Text
          </button>
          <button onClick={() => { setMsgType('template'); loadTemplates(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${msgType === 'template' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            📋 Use Template
          </button>
        </div>
        <p className="text-xs text-amber-600 mt-1.5">
          ⚠️ For leads older than 24h, only approved Meta templates can be sent
        </p>
      </div>

      {/* Template Selector */}
      {msgType === 'template' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Approved Template</label>
          {loadingTemplates ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading templates…</div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              No approved templates found. Go to <strong>Meta Business Suite → WhatsApp Manager → Templates</strong>.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.map((tpl: any) => (
                <button key={tpl.name} onClick={() => onSelectTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-lg border transition ${selectedTemplate?.name === tpl.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tpl.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{tpl.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {tpl.components?.find((c: any) => c.type === 'BODY')?.text || ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template variable inputs */}
      {msgType === 'template' && selectedTemplate && templateVars.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
          <div className="space-y-2">
            {templateVars.map((val, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 w-16 text-center flex-shrink-0">
                  {`{{${idx + 1}}}`}
                </span>
                <input value={val}
                  onChange={e => { const n = [...templateVars]; n[idx] = e.target.value; setTemplateVars(n); }}
                  placeholder={`Value for {{${idx + 1}}}`}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">These values replace the placeholders in the template for every recipient.</p>
        </div>
      )}

      {msgType === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-gray-400 font-normal">({message.length}/1024 chars)</span>
          </label>
          <textarea value={message} onChange={e => { setMessage(e.target.value.slice(0, 1024)); setPreview(null); }}
            rows={4} placeholder="Hi {name}, we have a special offer for you…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          <p className="text-xs text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise with lead name.</p>
        </div>
      )}

      {msgType === 'template' && selectedTemplate && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500 font-medium mb-1">Preview</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {templateVars.reduce((t, v, i) => t.replace(`{{${i + 1}}}`, v || `{{${i + 1}}}`),
              selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text || '')}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        <p className="text-xs text-gray-400 mt-1">Leave blank to send immediately.</p>
      </div>

      {preview && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold text-blue-800">
            <Users className="w-4 h-4" />
            {preview.total_recipients} recipient{preview.total_recipients !== 1 ? 's' : ''} matched
          </div>
          {preview.sample.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preview.sample.map((s, i) => (
                <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                  {s.name || s.phone}
                </span>
              ))}
              {preview.total_recipients > 5 && <span className="text-xs text-blue-500">+{preview.total_recipients - 5} more</span>}
            </div>
          )}
          {preview.total_recipients === 0 && (
            <p className="text-blue-600">No leads with phone numbers match this filter. Import contacts first.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 justify-end flex-wrap">
        <Button variant="outline" onClick={handlePreview} disabled={previewing} className="flex items-center gap-2">
          {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          Preview Recipients
        </Button>
        <Button onClick={handleSend} disabled={sending || !preview || preview.total_recipients === 0} className="flex items-center gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {scheduledAt ? 'Schedule' : 'Send Now'}
        </Button>
      </div>
    </Card>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { get } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quick' | 'bulk'>('quick');
  const [showBulkForm, setShowBulkForm] = useState(false);

  const load = () => {
    setLoading(true);
    get('/api/campaigns')
      .then(r => setCampaigns(r.data?.campaigns || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Send WhatsApp templates directly or broadcast to all leads</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('quick')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Zap className="w-4 h-4" /> Quick Send
        </button>
        <button onClick={() => { setActiveTab('bulk'); setShowBulkForm(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4" /> Bulk Campaign
        </button>
      </div>

      {/* Quick Send tab */}
      {activeTab === 'quick' && <QuickSendPanel />}

      {/* Bulk Campaign tab */}
      {activeTab === 'bulk' && (
        <>
          {!showBulkForm && (
            <Button onClick={() => setShowBulkForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Bulk Campaign
            </Button>
          )}
          {showBulkForm && (
            <BulkCampaignForm onClose={() => setShowBulkForm(false)} onSent={load} />
          )}
        </>
      )}

      {/* Campaign history — shown on both tabs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Campaign History</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No campaigns yet</p>
            <p className="text-sm text-gray-400 mt-1">Use Quick Send above to send your first template</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c, i) => <CampaignRow key={i} c={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
