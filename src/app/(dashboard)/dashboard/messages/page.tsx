'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, KeyRound, Send, Server, ShieldCheck, Smartphone, Webhook, XCircle, Inbox, MessageCircle } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { HelpTip } from '@/components/help-tip';
import { useApi } from '@/hooks/useApi';
import { OutboundMessage } from '@/types';

const CHANNEL_BADGE: Record<string, { label: string; color: string; emoji: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: 'bg-emerald-50 text-emerald-700',  emoji: '💬' },
  instagram: { label: 'Instagram', color: 'bg-pink-50 text-pink-700',        emoji: '📸' },
  facebook:  { label: 'Facebook',  color: 'bg-blue-50 text-blue-700',        emoji: '📘' },
};

function timeAgo(iso: string) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function UnifiedInbox() {
  const { get } = useApi();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'facebook'>('all');

  useEffect(() => {
    get('/api/automation/inbox')
      .then(res => setItems(res.data?.items || []))
      .catch(() => toast.error('Failed to load inbox'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === 'all' ? items : items.filter(i => i.channel === filter);

  return (
    <Card hoverable={false} className="border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-slate-500" />
          <h2 className="font-bold text-gray-950">Unified Inbox</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{items.length}</span>
        </div>
        <div className="flex gap-1">
          {(['all', 'whatsapp', 'instagram', 'facebook'] as const).map(ch => (
            <button key={ch} onClick={() => setFilter(ch)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === ch ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {ch === 'all' ? 'All' : CHANNEL_BADGE[ch]?.emoji + ' ' + CHANNEL_BADGE[ch]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No messages yet. Connect WhatsApp, Instagram, or Facebook to see your inbox here.</p>
      ) : (
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {filtered.map(item => {
            const badge = CHANNEL_BADGE[item.channel] || { label: item.channel, color: 'bg-gray-100 text-gray-600', emoji: '💬' };
            return (
              <div key={item.id} className="flex items-start gap-3 py-3 hover:bg-gray-50 rounded-lg px-2">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base">
                  {badge.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.sender_name || item.sender_id}</p>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.color}`}>{badge.label}</span>
                    {item.read_at && <span className="text-[10px] text-blue-500">●●</span>}
                    {item.delivery_status === 'delivered' && !item.read_at && <span className="text-[10px] text-gray-400">✓✓</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.text || `[${item.message_type}]`}</p>
                </div>
                <p className="shrink-0 text-[10px] text-gray-400">{timeAgo(item.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const providers = [
  { key: 'draft', label: 'Draft Mode', help: 'No live sending. Creates messages for manual review.' },
  { key: 'meta', label: 'Meta WhatsApp Cloud API', help: 'Official API. Best for production sending.' },
];

export default function MessagesPage() {
  const { get, post } = useApi();
  const [messages, setMessages] = useState<OutboundMessage[]>([]);
  const [setup, setSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({
    provider: 'meta',
    status: 'draft',
    mode: 'draft',
    phone_number_id: '',
    waba_id: '',
    permanent_access_token: '',
    access_token_last4: '',
    verify_token: '',
    webhook_url: '',
    test_recipient: '',
    test_message: 'B9 Automation WhatsApp test message. Your automation channel is connected.',
  });

  const refresh = () => {
    setLoading(true);
    Promise.all([
      get('/api/automation/outbound-messages'),
      get('/api/automation/whatsapp/setup'),
    ])
      .then(([messagesResponse, setupResponse]) => {
        setMessages(messagesResponse.data);
        setSetup(setupResponse.data);
        setForm((current) => ({
          ...current,
          provider: setupResponse.data.provider || current.provider,
          status: setupResponse.data.status || current.status,
          mode: setupResponse.data.mode || setupResponse.data.status || current.mode,
          phone_number_id: setupResponse.data.config?.phone_number_id || current.phone_number_id,
          waba_id: setupResponse.data.config?.waba_id || setupResponse.data.config?.business_account_id || current.waba_id,
          access_token_last4: setupResponse.data.config?.access_token_last4 || current.access_token_last4,
          verify_token: setupResponse.data.config?.verify_token || current.verify_token,
          webhook_url: setupResponse.data.config?.webhook_url || setupResponse.data.webhook_url || current.webhook_url,
        }));
      })
      .catch((error) => toast.error(error.response?.data?.detail || 'Failed to load WhatsApp setup'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied');
    setTimeout(() => setCopied(''), 1600);
  };

  const saveSetup = async () => {
    if (form.phone_number_id && !/^\d{10,20}$/.test(form.phone_number_id.trim())) {
      toast.error('Phone Number ID must be 10–20 digits (numeric only)');
      return;
    }
    if (form.waba_id && !/^\d{10,20}$/.test(form.waba_id.trim())) {
      toast.error('WABA ID must be 10–20 digits (numeric only)');
      return;
    }
    if (form.permanent_access_token && form.permanent_access_token.trim().length < 50) {
      toast.error('Access Token looks invalid — Meta tokens are typically 100+ characters');
      return;
    }
    setSaving(true);
    try {
      await post('/api/automation/whatsapp/setup', {
        provider: form.provider,
        status: form.status,
        mode: form.mode,
        phone_number_id: form.phone_number_id,
        waba_id: form.waba_id,
        business_account_id: form.waba_id,
        permanent_access_token: form.permanent_access_token,
        access_token_last4: form.access_token_last4,
        verify_token: form.verify_token,
        webhook_url: form.webhook_url,
      });
      toast.success('WhatsApp setup saved');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save setup');
    } finally {
      setSaving(false);
    }
  };

  const testMessage = async (forceSend: boolean) => {
    if (!form.test_recipient.trim()) {
      toast.error('Enter a recipient phone number with country code (e.g. 919876543210 for India)');
      return;
    }
    const digits = form.test_recipient.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Phone number too short. Include country code — e.g. 919876543210 for an Indian number.');
      return;
    }
    setSendingId(forceSend ? 'live-test' : 'draft-test');
    try {
      const response = await post('/api/automation/whatsapp/test', {
        recipient: form.test_recipient,
        message: form.test_message,
        force_send: forceSend,
      });
      toast.success(response.data.status === 'sent' ? 'Test message sent' : 'Test draft created');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Test failed');
    } finally {
      setSendingId('');
    }
  };

  const sendMessage = async (messageId: string) => {
    setSendingId(messageId);
    try {
      const response = await post(`/api/automation/outbound-messages/${messageId}/send`, {});
      toast.success(response.data.status === 'sent' ? 'WhatsApp message sent' : 'Message kept ready to send');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSendingId('');
    }
  };

  if (loading) {
    return <Card className="text-gray-600">Loading WhatsApp setup...</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">WhatsApp, Instagram & Facebook inbox — all channels in one place.</p>
        </div>
      </div>

      {/* Unified Inbox — all channels */}
      <UnifiedInbox />

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-100">
              <Smartphone className="h-3.5 w-3.5" />
              WhatsApp automation channel
            </p>
            <h1 className="text-3xl font-bold">Connect WhatsApp for follow-ups, alerts, and handover.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              Start in draft mode. Add Meta Cloud API credentials securely when you are ready for live sending.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
            <p className="font-semibold">Mode: {setup?.send_enabled ? 'Live sending' : 'Draft mode'}</p>
            <p className="mt-1 text-gray-300">Provider: {setup?.provider || 'draft'} / Status: {setup?.status || 'draft'}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        {(setup?.steps || []).map((step: any, index: number) => (
          <Card key={step.key} className="border-gray-200 shadow-sm" hoverable={false}>
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {step.done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {step.done ? 'Done' : 'Pending'}
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-gray-950">{step.label}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-950">Connection Wizard</h2>
            <HelpTip text="These settings save setup metadata only. Full secrets stay secure on the server." />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {providers.map((provider) => (
              <button
                key={provider.key}
                type="button"
                onClick={() => setForm({ ...form, provider: provider.key })}
                className={`rounded-xl border p-4 text-left transition ${
                  form.provider === provider.key
                    ? 'border-primary-300 bg-orange-50 ring-2 ring-primary-100'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-950">{provider.label}</p>
                  {form.provider === provider.key && <Check className="h-4 w-4 text-primary-600" />}
                </div>
                <p className="mt-2 text-sm text-gray-600">{provider.help}</p>
              </button>
            ))}
          </div>

          <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${form.provider === 'draft' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            {form.provider === 'draft'
              ? '✓ Draft Only — no real messages will be sent to customers'
              : '⚠ Live Mode — real WhatsApp messages will be sent to customers'}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Phone Number ID
              <input value={form.phone_number_id} onChange={(event) => setForm({ ...form, phone_number_id: event.target.value })} className="input-field mt-2" placeholder="Meta phone number ID" />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              WABA ID
              <input value={form.waba_id} onChange={(event) => setForm({ ...form, waba_id: event.target.value })} className="input-field mt-2" placeholder="WhatsApp Business Account ID" />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Permanent Access Token
              <input
                value={form.permanent_access_token}
                onChange={(event) => setForm({ ...form, permanent_access_token: event.target.value })}
                className="input-field mt-2"
                placeholder={form.access_token_last4 ? `Saved token ending ${form.access_token_last4}` : 'Paste Meta permanent access token'}
                type="password"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Verify Token
              <input value={form.verify_token} onChange={(event) => setForm({ ...form, verify_token: event.target.value })} className="input-field mt-2" placeholder="Webhook verify token" />
            </label>
          </div>

          <div className="mt-5 rounded-xl bg-orange-50 p-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary-600" />
              <p className="font-bold text-gray-950">Webhook URL</p>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={form.webhook_url} onChange={(event) => setForm({ ...form, webhook_url: event.target.value })} className="input-field font-mono text-xs" />
              <Button type="button" variant="secondary" onClick={() => copyText(form.webhook_url, 'webhook')}>
                {copied === 'webhook' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button className="mt-5" onClick={saveSetup} loading={saving}>
            <ShieldCheck className="h-4 w-4" />
            Save WhatsApp Setup
          </Button>
        </Card>

        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-950">Live Connection Checklist</h2>
            <HelpTip text="Use secure server-side credentials for live sending." />
          </div>
          <div className="mt-5 space-y-3">
            {['Meta business account', 'Phone number connection', 'Webhook verification', 'Access token security'].map((label) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <KeyRound className="h-4 w-4 text-primary-600" />
                <span className="text-xs font-bold text-gray-800">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-bold">
              <Server className="h-4 w-4" />
              Live ready: {setup?.env_ready ? 'Yes' : 'No'}
            </div>
            <p className="mt-2">If live connection is not ready, all messages stay as drafts or ready-to-send records.</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Send Test Message</h2>
          <p className="mt-1 text-sm text-gray-600">Use draft test first. Live test needs PRO plan and a ready Meta connection.</p>
          <div className="mt-5 space-y-4">
            <input value={form.test_recipient} onChange={(event) => setForm({ ...form, test_recipient: event.target.value })} className="input-field" placeholder="Recipient phone with country code" />
            <textarea value={form.test_message} onChange={(event) => setForm({ ...form, test_message: event.target.value })} className="input-field min-h-24" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => testMessage(false)} loading={sendingId === 'draft-test'}>
                <Send className="h-4 w-4" />
                Create Draft Test
              </Button>
              <Button onClick={() => testMessage(true)} loading={sendingId === 'live-test'} disabled={!setup?.send_enabled}>
                <Send className="h-4 w-4" />
                Send Live Test
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Latest WhatsApp Drafts</h2>
          <div className="mt-5 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-xl bg-orange-50 p-5 text-sm text-gray-600">
                No WhatsApp drafts yet. Run a lead follow-up workflow from Automations.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-3xl">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{message.channel}</span>
                        <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-primary-700">{message.status}</span>
                        {message.recipient && <span className="text-sm text-gray-500">{message.recipient}</span>}
                        {/* 24-hour window expired warning */}
                        {(message as any).message_metadata?.window_expired && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                            ⚠️ 24h window expired — send approved template
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{message.message}</p>
                      {message.error_message && (
                        <p className="mt-2 inline-flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          {message.error_message}
                        </p>
                      )}
                    </div>
                    <Button
                      disabled={!message.recipient || sendingId === message.id || message.status === 'sent'}
                      onClick={() => sendMessage(message.id)}
                      className="justify-center"
                    >
                      <Send className="h-4 w-4" />
                      {sendingId === message.id ? 'Sending...' : message.status === 'sent' ? 'Sent' : 'Send'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
