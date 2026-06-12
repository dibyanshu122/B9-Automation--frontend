'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Phone, RotateCcw, Search, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi, getApiClient } from '@/hooks/useApi';

interface OptedOutLead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  source?: string;
  tag?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export default function OptedOutPage() {
  const { get } = useApi();
  const api = getApiClient();
  const [leads, setLeads] = useState<OptedOutLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resubscribing, setResubscribing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    get('/api/leads?opted_out=true&limit=200')
      .then(r => setLeads(r.data?.leads || r.data || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = leads.filter(l =>
    !search ||
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search)
  );

  const resubscribe = async (lead: OptedOutLead) => {
    if (!confirm(`Unblock ${lead.name || lead.phone}? They may receive messages again.`)) return;
    setResubscribing(lead.id);
    try {
      await api.post(`/api/leads/${lead.id}/resubscribe`, {});
      toast.success(`${lead.name || lead.phone} unblocked`);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
    } catch {
      toast.error('Unblock failed');
    } finally {
      setResubscribing(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) { toast.error('No data to export'); return; }
    const rows = [
      ['Name', 'Phone', 'Email', 'Source', 'Opted Out Date'],
      ...filtered.map(l => [
        l.name || '',
        l.phone || '',
        l.email || '',
        l.source || '',
        new Date(l.updated_at || l.created_at).toLocaleString('en-IN'),
      ]),
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `opted_out_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(`${filtered.length} contacts exported`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Opted-Out Contacts</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Customers who sent STOP or were manually blocked. B9 will not send them automation or campaign messages.
            {' '}
            <a href="/dashboard/auto-replies" className="text-indigo-600 hover:underline font-medium">
              Configure the STOP auto-reply rule →
            </a>
          </p>
        </div>
        <Button variant="secondary" onClick={exportCsv} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-800">{leads.length} contacts opted out</span>
        </div>
        <span className="text-xs text-red-500">Automation and campaign sends are blocked for these contacts.</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-red-400" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border-2 border-dashed border-gray-200">
          <UserX className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? 'No matching contact found' : 'No opted-out contacts. Great!'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Opted Out</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{lead.name || '-'}</p>
                      {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {lead.phone || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                      {(lead.source || 'unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(lead.updated_at || lead.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => resubscribe(lead)}
                      disabled={resubscribing === lead.id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-600 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 disabled:opacity-50 transition ml-auto">
                      {resubscribing === lead.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RotateCcw className="w-3 h-3" />}
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
              {filtered.length} contact{filtered.length !== 1 ? 's' : ''} shown
              {search && ` (filtered from ${leads.length} total)`}
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Before unblocking</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>- Once unblocked, the customer may receive automation messages again.</li>
          <li>- Only unblock if the customer explicitly asked to resubscribe.</li>
          <li>- Meta guidelines require honoring opt-out requests.</li>
        </ul>
      </div>
    </div>
  );
}

