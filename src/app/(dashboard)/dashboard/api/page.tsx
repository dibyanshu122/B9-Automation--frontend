'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, Key, Loader2, Plus, Shield, Trash2, X } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { value: 'leads:read', label: 'Read Leads', desc: 'View contacts and conversation data' },
  { value: 'leads:write', label: 'Write Leads', desc: 'Create and update contacts' },
  { value: 'automations:read', label: 'Read Automations', desc: 'View workflows and run history' },
  { value: 'automations:run', label: 'Run Automations', desc: 'Trigger automation workflows' },
  { value: 'messages:send', label: 'Send Messages', desc: 'Send WhatsApp/outbound messages' },
  { value: 'analytics:read', label: 'Read Analytics', desc: 'View analytics and reports' },
];

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function ApiKeysPage() {
  const api = useApi();
  const { get, post } = api;
  const del = api.delete;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await get('/api/keys');
      setKeys(res.data || []);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Key name is required'); return; }
    if (selectedScopes.length === 0) { toast.error('Select at least one permission'); return; }
    setCreating(true);
    try {
      const res = await post('/api/keys', { name: newKeyName.trim(), scopes: selectedScopes });
      setNewKeyValue(res.data.key);
      setShowForm(false);
      setNewKeyName('');
      setSelectedScopes([]);
      loadKeys();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await del(`/api/keys/${id}`);
      toast.success('API key revoked');
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch {
      toast.error('Failed to revoke key');
    } finally {
      setRevoking(null);
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Programmatic access to your B9 Automation workspace</p>
        </div>
        {!showForm && !newKeyValue && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New API Key
          </Button>
        )}
      </div>

      {newKeyValue && (
        <Card className="p-5 border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-800">API key created — copy it now</p>
              <p className="text-sm text-green-700 mt-0.5">This key will not be shown again for security reasons.</p>
              <div className="mt-3 flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                <code className="text-sm font-mono text-gray-800 flex-1 truncate">{newKeyValue}</code>
                <CopyButton text={newKeyValue} />
              </div>
            </div>
            <button onClick={() => setNewKeyValue(null)} className="text-green-600 hover:text-green-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create New API Key</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input
                type="text"
                placeholder="e.g. My Integration, Production Bot"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions (Scopes)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_SCOPES.map(scope => (
                  <button
                    key={scope.value}
                    onClick={() => toggleScope(scope.value)}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                      selectedScopes.includes(scope.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 border-2 flex items-center justify-center ${
                      selectedScopes.includes(scope.value) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedScopes.includes(scope.value) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{scope.label}</p>
                      <p className="text-xs text-gray-500">{scope.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setNewKeyName(''); setSelectedScopes([]); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex items-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Key
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No API keys yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a key to integrate B9 Automation with your apps</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create First Key
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
                    <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                  {!key.scopes?.length && <span className="text-xs text-gray-400">No scopes</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={revoking === key.id}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Revoke key"
              >
                {revoking === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-5 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          Using the API
        </h3>
        <p className="text-sm text-gray-600 mb-3">Pass your API key in the Authorization header:</p>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400">{`curl https://api.b9automation.com/api/leads \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
        </div>
      </Card>
    </div>
  );
}
