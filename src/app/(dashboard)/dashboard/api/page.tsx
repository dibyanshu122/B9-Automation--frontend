'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Check, Clock, Code2, Copy, ExternalLink, Key, Loader2, Plus, Shield, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

interface ApiKey { id: string; name: string; prefix: string; scopes: string[]; last_used_at: string | null; expires_at: string | null; created_at: string; }
interface LogEntry { id: string; method: string; path: string; status_code: number | null; scope_used: string | null; response_ms: number | null; created_at: string; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.b9automation.com';

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
  { method: 'GET',   path: '/api/v1/',                      scope: 'none',              desc: 'API info + endpoint list' },
  { method: 'GET',   path: '/api/v1/leads',                 scope: 'leads:read',        desc: 'List leads (status, tag, phone filters)' },
  { method: 'POST',  path: '/api/v1/leads',                 scope: 'leads:write',       desc: 'Create a new lead' },
  { method: 'GET',   path: '/api/v1/leads/{id}',            scope: 'leads:read',        desc: 'Get lead by ID' },
  { method: 'PATCH', path: '/api/v1/leads/{id}',            scope: 'leads:write',       desc: 'Update lead status/tag/score' },
  { method: 'POST',  path: '/api/v1/whatsapp/send-template',scope: 'messages:send',     desc: 'Send approved template (any time)' },
  { method: 'POST',  path: '/api/v1/whatsapp/send-text',    scope: 'messages:send',     desc: 'Send plain text (24h window required)' },
  { method: 'GET',   path: '/api/v1/whatsapp/status',       scope: 'integrations:read', desc: 'WhatsApp connection health' },
  { method: 'GET',   path: '/api/v1/messages',              scope: 'messages:read',     desc: 'List outbound messages' },
  { method: 'GET',   path: '/api/v1/templates',             scope: 'templates:read',    desc: 'List APPROVED WhatsApp templates' },
  { method: 'GET',   path: '/api/v1/catalog',               scope: 'catalog:read',      desc: 'List products' },
  { method: 'GET',   path: '/api/v1/campaigns',             scope: 'campaigns:read',    desc: 'List campaigns + stats' },
  { method: 'GET',   path: '/api/v1/automations',           scope: 'automations:read',  desc: 'List workflows' },
  { method: 'POST',  path: '/api/v1/automations/{id}/run',  scope: 'automations:run',   desc: 'Trigger a workflow' },
  { method: 'GET',   path: '/api/v1/payments',              scope: 'payments:read',     desc: 'List customer payment records' },
  { method: 'POST',  path: '/api/v1/payments/link',         scope: 'payments:write',    desc: 'Create Razorpay payment link' },
  { method: 'GET',   path: '/api/v1/analytics',             scope: 'analytics:read',    desc: '30-day usage summary' },
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
            Programmatic access to your B9 workspace — leads, messages, automations, catalog, payments.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
          <span className="font-mono font-semibold">{API_BASE}/api/v1/</span>
          <CopyButton text={`${API_BASE}/api/v1/`} />
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
            <Card className="p-5 border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-800">API key created — copy it now</p>
                  <p className="text-sm text-green-700 mt-0.5">This key will not be shown again.</p>
                  <div className="mt-3 flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                    <code className="text-sm font-mono text-gray-800 flex-1 break-all">{newKeyValue}</code>
                    <CopyButton text={newKeyValue} />
                  </div>
                </div>
                <button onClick={() => setNewKeyValue(null)} className="text-green-600 hover:text-green-800 p-1"><X className="w-4 h-4" /></button>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            {!showForm && <Button onClick={() => setShowForm(true)} className="flex items-center gap-2"><Plus className="w-4 h-4" /> New API Key</Button>}
          </div>

          {showForm && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Create New API Key</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                  <input type="text" placeholder="e.g. CRM Integration, Shopify Sync"
                    value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" maxLength={100} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions (Scopes)</label>
                  {SCOPE_GROUPS.map(group => (
                    <div key={group} className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{group}</p>
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
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => { setShowForm(false); setNewKeyName(''); setSelectedScopes([]); }}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating} className="flex items-center gap-2">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create Key
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
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{key.prefix}••••••••</code>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(key.scopes || []).map(s => (
                        <span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {!key.scopes?.length && <span className="text-xs text-gray-400">No scopes</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                    </p>
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
            <p className="text-sm text-gray-600 mb-3">Pass your API key in the <code className="bg-gray-100 px-1 rounded">Authorization</code> header:</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto mb-3">
              <pre className="text-sm text-green-400 whitespace-pre-wrap">{`curl ${API_BASE}/api/v1/leads \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {[
                { lang: 'JavaScript', code: `const res = await fetch('${API_BASE}/api/v1/leads', {\n  headers: { Authorization: 'Bearer YOUR_API_KEY' }\n});\nconst data = await res.json();` },
                { lang: 'Python', code: `import requests\nr = requests.get('${API_BASE}/api/v1/leads',\n  headers={'Authorization': 'Bearer YOUR_API_KEY'})\nprint(r.json())` },
                { lang: 'cURL', code: `curl ${API_BASE}/api/v1/leads \\\n  -H "Authorization: Bearer YOUR_API_KEY"` },
              ].map(ex => (
                <div key={ex.lang}>
                  <p className="text-xs font-bold text-gray-500 mb-1.5">{ex.lang}</p>
                  <div className="relative bg-gray-900 rounded-xl p-3 overflow-x-auto">
                    <pre className="text-[11px] text-green-400 whitespace-pre-wrap">{ex.code}</pre>
                    <div className="absolute top-2 right-2"><CopyButton text={ex.code} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Endpoints */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-primary-600" /> Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Path</th>
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Scope Required</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {V1_ENDPOINTS.map((ep, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 pr-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method] || 'bg-gray-100 text-gray-600'}`}>{ep.method}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <code className="text-xs text-gray-700 font-mono">{ep.path}</code>
                      </td>
                      <td className="py-2 pr-3">
                        {ep.scope !== 'none' ? <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{ep.scope}</span> : <span className="text-xs text-gray-400">public</span>}
                      </td>
                      <td className="py-2 text-xs text-gray-600">{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* WhatsApp-specific docs */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3">WhatsApp Messaging Rules</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-amber-600 font-bold text-xs mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-800">24-Hour Window</p>
                  <p className="text-xs text-amber-700 mt-0.5">Plain text messages (<code>/whatsapp/send-text</code>) only work within 24 hours of the customer&apos;s last WhatsApp message to you. After that, use <code>/whatsapp/send-template</code> with an approved template.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-green-600 font-bold text-xs mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-green-800">Templates Work Any Time</p>
                  <p className="text-xs text-green-700 mt-0.5">Approved WhatsApp templates can be sent at any time. Use <code>/api/v1/templates</code> to list your APPROVED templates first.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
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
                  <span className={`text-[11px] font-bold flex-shrink-0 ${(log.status_code || 0) >= 400 ? 'text-red-600' : 'text-emerald-600'}`}>{log.status_code || '—'}</span>
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
