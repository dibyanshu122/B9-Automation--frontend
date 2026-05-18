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

export default function CampaignsPage() {
  const { get, post } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  const load = () => {
    setLoading(true);
    get('/api/campaigns')
      .then(r => setCampaigns(r.data?.campaigns || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const loadTemplates = () => {
    setLoadingTemplates(true);
    get('/api/automation/whatsapp/templates')
      .then(r => setTemplates(r.data?.templates || []))
      .catch(() => toast.error('Could not load templates'))
      .finally(() => setLoadingTemplates(false));
  };

  const onSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    // Build preview text from template components
    const body = tpl.components?.find((c: any) => c.type === 'BODY');
    if (body?.text) setMessage(body.text);
  };

  const recipientFilter = filter === 'tag' ? `tag:${customTag}` : filter;

  const handlePreview = async () => {
    if (!message.trim()) { toast.error('Enter a message first'); return; }
    setPreviewing(true);
    setPreview(null);
    try {
      const r = await post('/api/campaigns/preview', { name: name || 'Preview', message, recipient_filter: recipientFilter });
      setPreview(r.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!name.trim()) { toast.error('Campaign name is required'); return; }
    if (!message.trim()) { toast.error('Message is required'); return; }
    if (!preview || preview.total_recipients === 0) {
      toast.error('Preview first to check recipients');
      return;
    }
    if (!confirm(`Send to ${preview.total_recipients} lead${preview.total_recipients !== 1 ? 's' : ''}?`)) return;

    setSending(true);
    try {
      const r = await post('/api/campaigns/send', {
        name: name.trim(),
        message: message.trim(),
        recipient_filter: recipientFilter,
        channel: 'whatsapp',
        scheduled_at: scheduledAt || null,
      });
      toast.success(
        r.data.scheduled_at
          ? `Campaign scheduled for ${r.data.recipient_count} recipients`
          : `Campaign started — sending to ${r.data.recipient_count} recipients`
      );
      setShowForm(false);
      setName(''); setMessage(''); setFilter('all'); setCustomTag(''); setScheduledAt(''); setPreview(null);
      setTimeout(load, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Send bulk WhatsApp messages to your leads</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-500" /> New Broadcast Campaign
            </h2>
            <button onClick={() => { setShowForm(false); setPreview(null); }} className="text-gray-400 hover:text-gray-700 text-sm">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Diwali Offer 2025"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={e => { setFilter(e.target.value); setPreview(null); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white flex-1"
                >
                  {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  <option value="tag">By Tag…</option>
                </select>
                {filter === 'tag' && (
                  <input
                    value={customTag}
                    onChange={e => { setCustomTag(e.target.value); setPreview(null); }}
                    placeholder="tag name"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-32"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Message Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMsgType('text')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${msgType === 'text' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                ✏️ Custom Text
              </button>
              <button
                onClick={() => { setMsgType('template'); loadTemplates(); }}
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
                  No approved templates found. Go to <strong>Meta Business Suite → WhatsApp Manager → Templates</strong> to create and get approval.
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {msgType === 'template' ? 'Template Preview' : 'Message'} <span className="text-gray-400 font-normal">({message.length}/1024 chars)</span>
            </label>
            <textarea
              value={message}
              readOnly={msgType === 'template'}
              onChange={e => { setMessage(e.target.value.slice(0, 1024)); setPreview(null); }}
              rows={4}
              placeholder="Hi {name}, we have a special offer for you…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise with lead name.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
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
                  {preview.total_recipients > 5 && (
                    <span className="text-xs text-blue-500">+{preview.total_recipients - 5} more</span>
                  )}
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
            <Button
              onClick={handleSend}
              disabled={sending || !preview || preview.total_recipients === 0}
              className="flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {scheduledAt ? 'Schedule' : 'Send Now'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No campaigns yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first broadcast to send a message to all your leads at once</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c, i) => <CampaignRow key={i} c={c} />)}
        </div>
      )}
    </div>
  );
}
