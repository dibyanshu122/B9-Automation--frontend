'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Check, Clock, Code2, Copy, ExternalLink, Key, Loader2, Plus, Shield, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

interface ApiKey { id: string; name: string; prefix: string; scopes: string[]; last_used_at: string | null; expires_at: string | null; created_at: string; }
interface LogEntry { id: string; method: string; path: string; status_code: number | null; scope_used: string | null; response_ms: number | null; created_at: string; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

const ALL_SCOPES: { value: string; label: string; desc: string; group: string }[] = [
  { value: 'leads:read',      label: 'Read Leads',        desc: 'View contacts and conversation data',      group: 'Leads' },
  { value: 'leads:write',     label: 'Write Leads',       desc: 'Create and update contacts',               group: 'Leads' },
  { value: 'contacts:read',   label: 'Read Contacts',     desc: 'List all contacts',                        group: 'Leads' },
  { value: 'contacts:write',  label: 'Write Contacts',    desc: 'Create and update contacts',               group: 'Leads' },
  { value: 'messages:read',   label: 'Read Messages',     desc: 'View conversation history',                group: 'Messages' },
  { value: 'messages:send',   label: 'Send Messages',     desc: 'Send WhatsApp messages and templates',     group: 'Messages' },
  { value: 'templates:read',  label: 'Read Templates',    desc: 'List approved WhatsApp templates',         group: 'Templates' },
  { value: 'templates:write', label: 'Write Templates',   desc: 'Create and submit templates',              group: 'Templates' },
  { value: 'flows:read',      label: 'Read Flows',        desc: 'List WhatsApp Flows',                      group: 'Flows' },
  { value: 'flows:write',     label: 'Write Flows',       desc: 'Create and publish Flows',                 group: 'Flows' },
  { value: 'catalog:read',    label: 'Read Catalog',      desc: 'List products in catalog',                 group: 'Catalog' },
  { value: 'catalog:write',   label: 'Write Catalog',     desc: 'Add/update/delete products',               group: 'Catalog' },
  { value: 'payments:read',   label: 'Read Payments',     desc: 'View payment links and records',           group: 'Payments' },
  { value: 'payments:write',  label: 'Write Payments',    desc: 'Create customer payment links',            group: 'Payments' },
  { value: 'campaigns:read',  label: 'Read Campaigns',    desc: 'List campaigns and stats',                 group: 'Campaigns' },
  { value: 'campaigns:write', label: 'Write Campaigns',   desc: 'Create and send campaigns',                group: 'Campaigns' },
  { value: 'automations:read','label': 'Read Automations','desc': 'View workflows and run history',         group: 'Automation' },
  { value: 'automations:run', label: 'Run Automations',   desc: 'Trigger workflow execution',               group: 'Automation' },
  { value: 'analytics:read',  label: 'Read Analytics',    desc: 'View usage analytics and reports',         group: 'Analytics' },
  { value: 'webhooks:read',   label: 'Read Webhooks',     desc: 'List webhook subscriptions',               group: 'Webhooks' },
  { value: 'webhooks:write',  label: 'Write Webhooks',    desc: 'Create webhook subscriptions',             group: 'Webhooks' },
  { value: 'integrations:read','label': 'Read Integrations','desc': 'Read integration status',             group: 'Integrations' },
];

const SCOPE_GROUPS = [...new Set(ALL_SCOPES.map(s => s.group))];

const V1_ENDPOINTS = [
  { method: 'GET',   path: '/api/v1/',                      scope: 'none',              desc: 'API info + endpoint list',             body: null },
  { method: 'GET',   path: '/api/v1/leads',                 scope: 'leads:read',        desc: 'List leads (status, tag, phone filters)', body: null, params: '?status=hot&limit=20' },
  { method: 'POST',  path: '/api/v1/leads',                 scope: 'leads:write',       desc: 'Create a new lead',                    body: { name: 'Rahul Sharma', phone: '91XXXXXXXXXX', email: 'rahul@example.com', source: 'shopify' } },
  { method: 'GET',   path: '/api/v1/leads/{id}',            scope: 'leads:read',        desc: 'Get lead by ID',                       body: null },
  { method: 'PATCH', path: '/api/v1/leads/{id}',            scope: 'leads:write',       desc: 'Update lead status/tag/score',         body: { status: 'hot', tag: 'interested', score: 8 } },
  { method: 'POST',  path: '/api/v1/whatsapp/send-template',scope: 'messages:send',     desc: 'Send approved template (any time)',    body: { phone: '91XXXXXXXXXX', template_name: 'order_confirmed', language_code: 'en_US', variables: ['Rahul', 'ORD-123'] } },
  { method: 'POST',  path: '/api/v1/whatsapp/send-text',    scope: 'messages:send',     desc: 'Send plain text (24h window only)',    body: { phone: '91XXXXXXXXXX', message: 'Hi! Your order is ready.' } },
  { method: 'GET',   path: '/api/v1/whatsapp/status',       scope: 'integrations:read', desc: 'WhatsApp connection health',           body: null },
  { method: 'GET',   path: '/api/v1/messages',              scope: 'messages:read',     desc: 'List outbound messages',               body: null, params: '?status=sent&limit=20' },
  { method: 'GET',   path: '/api/v1/templates',             scope: 'templates:read',    desc: 'List APPROVED WhatsApp templates',     body: null },
  { method: 'GET',   path: '/api/v1/catalog',               scope: 'catalog:read',      desc: 'List products',                        body: null },
  { method: 'GET',   path: '/api/v1/campaigns',             scope: 'campaigns:read',    desc: 'List campaigns + stats',               body: null },
  { method: 'GET',   path: '/api/v1/automations',           scope: 'automations:read',  desc: 'List workflows',                       body: null },
  { method: 'POST',  path: '/api/v1/automations/{id}/run',  scope: 'automations:run',   desc: 'Trigger a workflow',                   body: { context: { lead_id: 'lead_abc123', message: 'interested in product' } } },
  { method: 'GET',   path: '/api/v1/payments',              scope: 'payments:read',     desc: 'List customer payment records',        body: null },
  { method: 'POST',  path: '/api/v1/payments/link',         scope: 'payments:write',    desc: 'Create Razorpay payment link',         body: { phone: '91XXXXXXXXXX', amount: 49900, description: 'Coaching fee - June batch', lead_id: 'lead_abc123' } },
  { method: 'GET',   path: '/api/v1/analytics',             scope: 'analytics:read',    desc: '30-day usage summary',                 body: null },
];

function formatDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-amber-100 text-amber-700', DELETE: 'bg-red-100 text-red-700',
};

function WebhookSigningCard() {
  const { get, post } = useApi();
  const [secret, setSecret] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadSecret = async () => {
    setLoading(true);
    try {
      const r = await get('/api/auth/webhook-secret');
      setSecret(r.data?.webhook_secret || '');
      setLoaded(true);
    } catch { setSecret(''); setLoaded(true); }
    finally { setLoading(false); }
  };

  const regenerate = async () => {
    if (!confirm('Regenerate webhook secret? Your existing integrations will break until updated.')) return;
    setLoading(true);
    try {
      const r = await post('/api/auth/webhook-secret/regenerate', {});
      setSecret(r.data?.webhook_secret || '');
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Webhook Signing Secret</h2>
          <p className="text-xs text-gray-400 mt-0.5">Use this to verify that webhook payloads come from B9 (HMAC-SHA256 signature)</p>
        </div>
        {!loaded && (
          <button onClick={loadSecret} disabled={loading}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50">
            {loading ? 'Loading…' : 'Reveal Secret'}
          </button>
        )}
      </div>
      {loaded && (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-3">
            <code className="flex-1 text-xs font-mono text-emerald-400 truncate">{secret || 'No secret set yet'}</code>
            <button onClick={copy} className="text-xs font-semibold text-gray-400 hover:text-white transition shrink-0">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={regenerate} disabled={loading}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition disabled:opacity-40">
            ↻ Regenerate secret
          </button>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-1.5">
            <p className="font-bold text-gray-700">Verify in your backend:</p>
            <pre className="bg-gray-900 text-emerald-400 rounded-lg p-2.5 overflow-x-auto text-[11px]">{`import hmac, hashlib

def verify_b9_webhook(payload_bytes, signature_header, secret):
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)`}</pre>
          </div>
        </>
      )}
    </div>
  );
}

export default function ApiKeysPage() {
  const { get, post, delete: del } = useApi();
  const [tab, setTab] = useState<'keys' | 'docs' | 'logs'>('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [docsFilter, setDocsFilter] = useState<string>('all');
  const [expandedEp, setExpandedEp] = useState<number | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try { setKeys((await get('/api/keys')).data || []); }
    catch { toast.error('Failed to load API keys'); }
    finally { setLoading(false); }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try { setLogs((await get('/api/keys/logs?limit=20')).data || []); }
    catch { /* ignore */ }
    finally { setLogsLoading(false); }
  };

  useEffect(() => { loadKeys(); }, []); // eslint-disable-line
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab]); // eslint-disable-line

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Key name is required'); return; }
    if (selectedScopes.length === 0) { toast.error('Select at least one permission'); return; }
    setCreating(true);
    try {
      const res = await post('/api/keys', { name: newKeyName.trim(), scopes: selectedScopes });
      setNewKeyValue(res.data.key);
      setShowForm(false); setNewKeyName(''); setSelectedScopes([]);
      loadKeys();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create key');
    } finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try { await del(`/api/keys/${id}`); toast.success('API key revoked'); setKeys(prev => prev.filter(k => k.id !== id)); }
    catch { toast.error('Failed to revoke key'); }
    finally { setRevoking(null); }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const TABS = [
    { id: 'keys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'docs', label: 'API Docs', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'logs', label: 'Request Logs', icon: <Clock className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">API Access</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Programmatic access to your B9 workspace - leads, messages, automations, catalog, payments.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2 mt-2 w-fit">
            <span className="font-mono font-semibold">{API_BASE}/api/v1/</span>
            <CopyButton text={`${API_BASE}/api/v1/`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`${API_BASE}/docs`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors">
            <ExternalLink className="w-4 h-4" /> Open Swagger
          </a>
          <Button onClick={() => { setTab('keys'); setShowForm(true); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New API Key
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.label}
            {t.id === 'keys' && keys.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'keys' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>{keys.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── KEYS TAB ── */}
      {tab === 'keys' && (
        <div className="space-y-4">
          {newKeyValue && (
            <Card className="p-5 border-amber-300 bg-amber-50 ring-2 ring-amber-400/30">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-base">⚠️ Copy your API key now — it will never be shown again</p>
                  <p className="text-sm text-amber-800 mt-0.5">Once you close this banner, the full key is gone forever. Store it in a secure place.</p>
                  <div className="mt-3 flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2.5">
                    <code className="text-sm font-mono text-gray-800 flex-1 break-all select-all">{newKeyValue}</code>
                    <CopyButton text={newKeyValue} />
                  </div>
                  <button onClick={() => setNewKeyValue(null)}
                    className="mt-3 w-full rounded-lg bg-amber-700 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition">
                    I&apos;ve copied my key — close
                  </button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            {!showForm && (
              <Button onClick={() => {
                setShowForm(true);
                // Default to Full Access — most common use case
                setSelectedScopes(ALL_SCOPES.map(s => s.value));
              }} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> New API Key
              </Button>
            )}
          </div>

          {showForm && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Create New API Key</h2>
              <p className="text-xs text-gray-500 mb-4">One key works for all APIs. Choose a preset or customize permissions.</p>
              <div className="space-y-5">
                {/* Step 1: Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold mr-1.5">1</span>
                    Key Name
                  </label>
                  <input type="text" placeholder="e.g. My App, Shopify Sync, CRM Integration"
                    value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" maxLength={100} />
                </div>

                {/* Step 2: Access Level Preset */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold mr-1.5">2</span>
                    Access Level
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { id: 'full', label: 'Full Access', desc: 'All APIs — recommended', icon: '🔓', scopes: ALL_SCOPES.map(s => s.value) },
                      { id: 'read', label: 'Read Only',  desc: 'View data, no sends',   icon: '👁️', scopes: ALL_SCOPES.filter(s => s.value.endsWith(':read')).map(s => s.value) },
                      { id: 'custom', label: 'Custom',   desc: 'Pick manually below',   icon: '⚙️', scopes: [] },
                    ].map(preset => {
                      const isActive = preset.id === 'custom'
                        ? selectedScopes.length > 0 && !ALL_SCOPES.every(s => selectedScopes.includes(s.value)) && !selectedScopes.every(s => s.endsWith(':read'))
                        : preset.id === 'full'
                        ? ALL_SCOPES.every(s => selectedScopes.includes(s.value))
                        : selectedScopes.length > 0 && selectedScopes.every(s => s.endsWith(':read'));
                      return (
                        <button key={preset.id}
                          onClick={() => { if (preset.id !== 'custom') setSelectedScopes(preset.scopes); }}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-base">{preset.icon}</span>
                          <p className={`text-xs font-bold ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>{preset.label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">{preset.desc}</p>
                          {isActive && <span className="text-[9px] font-bold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full mt-0.5">Selected</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scope count summary */}
                  {selectedScopes.length > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {selectedScopes.length} of {ALL_SCOPES.length} permissions selected
                      <button onClick={() => setSelectedScopes([])} className="ml-2 text-red-400 hover:text-red-600">Clear</button>
                    </p>
                  )}

                  {/* Custom scope selector — collapsed by default */}
                  <details className="mt-1">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                      Customize individual permissions ↓
                    </summary>
                    <div className="mt-3 space-y-3">
                      {SCOPE_GROUPS.map(group => (
                        <div key={group}>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{group}</p>
                            <button onClick={() => {
                              const groupScopes = ALL_SCOPES.filter(s => s.group === group).map(s => s.value);
                              const allSelected = groupScopes.every(s => selectedScopes.includes(s));
                              setSelectedScopes(prev => allSelected
                                ? prev.filter(s => !groupScopes.includes(s))
                                : [...new Set([...prev, ...groupScopes])]
                              );
                            }} className="text-[10px] text-primary-500 hover:text-primary-700 font-medium">
                              {ALL_SCOPES.filter(s => s.group === group).every(s => selectedScopes.includes(s.value)) ? 'Deselect all' : 'Select all'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {ALL_SCOPES.filter(s => s.group === group).map(scope => (
                              <button key={scope.value} onClick={() => toggleScope(scope.value)}
                                className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors ${selectedScopes.includes(scope.value) ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 border-2 flex items-center justify-center ${selectedScopes.includes(scope.value) ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                                  {selectedScopes.includes(scope.value) && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">{scope.label}</p>
                                  <p className="text-[10px] text-gray-500">{scope.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                <div className="flex gap-3 justify-end pt-1">
                  <Button variant="outline" onClick={() => { setShowForm(false); setNewKeyName(''); setSelectedScopes([]); }}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating} className="flex items-center gap-2">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Key className="w-4 h-4" /> Generate Key
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : keys.length === 0 ? (
            <Card className="p-12 text-center">
              <Key className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No API keys yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a key to connect B9 with your apps, CRMs, and automations</p>
              <Button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Create First Key
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-100">
              {keys.map(key => (
                <div key={key.id} className="flex items-start gap-4 p-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{key.name}</span>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{key.prefix}********</code>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(key.scopes || []).map(s => (
                        <span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {!key.scopes?.length && <span className="text-xs text-gray-400">No scopes</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-gray-400">
                        Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                      </p>
                      <a href={`${API_BASE}/docs`} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-0.5 transition-colors">
                        Test in Swagger <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                  <button onClick={() => handleRevoke(key.id)} disabled={revoking === key.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50" title="Revoke key">
                    {revoking === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── DOCS TAB ── */}
      {tab === 'docs' && (
        <div className="space-y-5">
          {/* Auth */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary-600" /> Authentication</h2>
            <p className="text-sm text-gray-600 mb-4">Pass your API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header on every request:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { lang: 'cURL', color: 'from-orange-500/10 to-orange-500/5 border-orange-200', labelColor: 'text-orange-600 bg-orange-50 border-orange-200', textColor: 'text-orange-900',
                  code: `curl ${API_BASE}/api/v1/leads \\\n  -H "Authorization: Bearer YOUR_API_KEY"` },
                { lang: 'JavaScript', color: 'from-yellow-500/10 to-yellow-500/5 border-yellow-200', labelColor: 'text-yellow-700 bg-yellow-50 border-yellow-200', textColor: 'text-yellow-900',
                  code: `const res = await fetch(\n  '${API_BASE}/api/v1/leads',\n  { headers: { Authorization:\n    'Bearer YOUR_API_KEY' } }\n);\nconst data = await res.json();` },
                { lang: 'Python', color: 'from-blue-500/10 to-blue-500/5 border-blue-200', labelColor: 'text-blue-700 bg-blue-50 border-blue-200', textColor: 'text-blue-900',
                  code: `import requests\nr = requests.get(\n  '${API_BASE}/api/v1/leads',\n  headers={'Authorization':\n    'Bearer YOUR_API_KEY'})\nprint(r.json())` },
              ].map(ex => (
                <div key={ex.lang} className={`relative rounded-xl border bg-gradient-to-br ${ex.color} overflow-hidden`}>
                  <div className={`flex items-center justify-between px-3 py-1.5 border-b ${ex.color.split(' ').find(c => c.startsWith('border-')) || 'border-gray-200'}`}>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${ex.labelColor}`}>{ex.lang}</span>
                    <CopyButton text={ex.code} />
                  </div>
                  <pre className={`text-[11px] font-mono p-3 whitespace-pre-wrap leading-relaxed ${ex.textColor}`}>{ex.code}</pre>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-blue-100 bg-blue-50">
            <h2 className="font-semibold text-blue-950 mb-2">API Safety Rules</h2>
            <div className="grid gap-3 text-xs text-blue-800 md:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-white/70 p-3">
                <p className="font-bold">Scopes are enforced</p>
                <p className="mt-1">Every key can only access the scopes selected during creation.</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white/70 p-3">
                <p className="font-bold">Workspace permissions still apply</p>
                <p className="mt-1">API keys cannot bypass owner/admin permissions or workspace boundaries.</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white/70 p-3">
                <p className="font-bold">WhatsApp rules still apply</p>
                <p className="mt-1">Opt-out, 24-hour window, template, and rate-limit guards apply to API sends.</p>
              </div>
            </div>
          </Card>

          {/* Endpoints */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-primary-600" /> Endpoints</h2>
                <p className="text-xs text-gray-400 mt-0.5">Click any row to see the full curl command</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'Leads', 'Messages', 'Templates', 'Campaigns', 'Payments', 'Automation', 'Analytics'].map(g => (
                  <button key={g} onClick={() => setDocsFilter(g)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${docsFilter === g ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {g === 'all' ? 'All' : g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {V1_ENDPOINTS
                .filter(ep => docsFilter === 'all' || ep.scope.split(':')[0].toLowerCase() === docsFilter.toLowerCase() || (docsFilter === 'Leads' && (ep.scope.startsWith('leads') || ep.scope.startsWith('contacts'))) || (docsFilter === 'Automation' && ep.scope.startsWith('automations')))
                .map((ep, i) => {
                  const fullUrl = `${API_BASE}${ep.path}${(ep as any).params || ''}`;
                  const isOpen = expandedEp === i;
                  const curlBody = ep.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.body, null, 2)}'` : '';
                  const curlCmd = `curl -X ${ep.method} ${fullUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY"${curlBody}`;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedEp(isOpen ? null : i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isOpen ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-14 text-center flex-shrink-0 ${METHOD_COLORS[ep.method] || 'bg-gray-100 text-gray-600'}`}>{ep.method}</span>
                        <code className="text-xs text-gray-700 font-mono flex-1 text-left truncate">{ep.path}</code>
                        {ep.scope !== 'none' && <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline">{ep.scope}</span>}
                        <span className="text-xs text-gray-400 flex-shrink-0 hidden md:inline">{ep.desc}</span>
                        <span className={`text-gray-400 flex-shrink-0 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </button>
                      {isOpen && (
                        <div className="mx-1 mb-2 rounded-xl border border-primary-100 bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200">
                            <span className="text-[11px] font-bold text-slate-500">cURL</span>
                            <CopyButton text={curlCmd} />
                          </div>
                          <pre className="text-[11px] font-mono text-slate-700 p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{curlCmd}</pre>
                          {ep.body && (
                            <div className="border-t border-slate-200 px-3 py-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Request Body</p>
                              <pre className="text-[11px] font-mono text-emerald-700 whitespace-pre-wrap">{JSON.stringify(ep.body, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* WhatsApp-specific docs */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3">WhatsApp Messaging Rules</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-amber-600 font-bold text-xs mt-0.5">Warning</span>
                <div>
                  <p className="font-semibold text-amber-800">24-Hour Window</p>
                  <p className="text-xs text-amber-700 mt-0.5">Plain text messages (<code>/whatsapp/send-text</code>) only work within 24 hours of the customer&apos;s last WhatsApp message to you. After that, use <code>/whatsapp/send-template</code> with an approved template.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-green-600 font-bold text-xs mt-0.5">OK</span>
                <div>
                  <p className="font-semibold text-green-800">Templates Work Any Time</p>
                  <p className="text-xs text-green-700 mt-0.5">Approved WhatsApp templates can be sent at any time. Use <code>/api/v1/templates</code> to list your APPROVED templates first.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── WEBHOOK SIGNING ── */}
      {tab === 'keys' && (
        <WebhookSigningCard />
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Last 20 API v1 requests from your API keys</p>
            <Button variant="ghost" size="sm" onClick={loadLogs} disabled={logsLoading}>
              {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
          {logsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : logs.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No API requests yet</p>
              <p className="text-sm text-gray-400 mt-1">API v1 request logs will appear here once you start using your keys</p>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-100">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-14 text-center flex-shrink-0 ${METHOD_COLORS[log.method] || 'bg-gray-100 text-gray-600'}`}>{log.method}</span>
                  <code className="text-xs text-gray-700 font-mono flex-1 truncate">{log.path}</code>
                  {log.scope_used && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">{log.scope_used}</span>}
                  <span className={`text-[11px] font-bold flex-shrink-0 ${(log.status_code || 0) >= 400 ? 'text-red-600' : 'text-emerald-600'}`}>{log.status_code || '-'}</span>
                  {log.response_ms != null && <span className="text-[11px] text-gray-400 flex-shrink-0">{log.response_ms}ms</span>}
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
