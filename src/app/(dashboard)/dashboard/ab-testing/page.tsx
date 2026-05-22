'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BarChart2, CheckCircle2, Edit2, FlaskConical, Loader2, Plus, Trash2, Trophy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';

interface Workflow {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  workflow_id: string;
  name: string;
  variant_key: string;
  status: string;
  traffic_percentage: number;
  run_count: number;
  conversion_count: number;
  conversion_rate?: number;
  winner?: boolean;
  config?: any;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  paused: 'bg-amber-100 text-amber-700',
};

export default function ABTestingPage() {
  const { get, post, patch, delete: del } = useApi();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWfId, setSelectedWfId] = useState<string>('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [analytics, setAnalytics] = useState<{ variants: Variant[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVariant, setEditVariant] = useState<Variant | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    variant_key: 'B',
    status: 'draft',
    traffic_percentage: 50,
  });

  const loadWorkflows = () => {
    get('/api/automation/workflows')
      .then(r => {
        const wfs: Workflow[] = (r.data?.workflows || r.data || []);
        setWorkflows(wfs);
        if (wfs.length > 0 && !selectedWfId) setSelectedWfId(wfs[0].id);
      })
      .catch(() => toast.error('Could not load workflows'))
      .finally(() => setLoading(false));
  };

  const loadVariantsAndAnalytics = (wfId: string) => {
    if (!wfId) return;
    Promise.all([
      get(`/api/automation/workflows/${wfId}/variants`),
      get(`/api/automation/workflows/${wfId}/variants/analytics`).catch(() => ({ data: null })),
    ]).then(([vRes, aRes]) => {
      setVariants(vRes.data || []);
      setAnalytics(aRes.data);
    }).catch(() => toast.error('Could not load variants'));
  };

  useEffect(() => { loadWorkflows(); }, []); // eslint-disable-line
  useEffect(() => { if (selectedWfId) loadVariantsAndAnalytics(selectedWfId); }, [selectedWfId]); // eslint-disable-line

  const openCreate = () => {
    setEditVariant(null);
    setForm({ name: '', variant_key: 'B', status: 'draft', traffic_percentage: 50 });
    setShowForm(true);
  };

  const openEdit = (v: Variant) => {
    setEditVariant(v);
    setForm({
      name: v.name,
      variant_key: v.variant_key,
      status: v.status,
      traffic_percentage: v.traffic_percentage,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Variant name required'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        variant_key: form.variant_key.trim() || 'B',
        status: form.status,
        traffic_percentage: Number(form.traffic_percentage),
        config: null,
      };
      if (editVariant) {
        await patch(`/api/automation/workflows/${selectedWfId}/variants/${editVariant.id}`, body);
        toast.success('Variant updated');
      } else {
        await post(`/api/automation/workflows/${selectedWfId}/variants`, body);
        toast.success('Variant created');
      }
      setShowForm(false);
      loadVariantsAndAnalytics(selectedWfId);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    setDeleting(id);
    try {
      await del(`/api/automation/workflows/${selectedWfId}/variants/${id}`);
      toast.success('Variant deleted');
      setVariants(prev => prev.filter(v => v.id !== id));
      setAnalytics(prev => prev ? { ...prev, variants: (prev.variants || []).filter(v => v.id !== id) } : prev);
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const analyticsMap: Record<string, Variant> = {};
  (analytics?.variants || []).forEach(v => { analyticsMap[v.id] = v; });

  const totalTraffic = variants.filter(v => v.status === 'active').reduce((s, v) => s + v.traffic_percentage, 0);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Test multiple automation variants and automatically route traffic to the best-performing one.
          </p>
        </div>
        {selectedWfId && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Variant
          </Button>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
        <p className="font-semibold mb-1">How A/B Testing works</p>
        <ul className="text-xs space-y-0.5 opacity-90">
          <li>• Create variants of an automation workflow with different message copy or logic</li>
          <li>• Set traffic split (e.g., 50% each) — B9 automatically routes each trigger</li>
          <li>• The variant with the highest conversion rate is marked the winner</li>
          <li>• Activate a variant to start routing, set to draft to pause</li>
        </ul>
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300" />
          <p className="font-semibold text-gray-500">No workflows yet</p>
          <p className="text-sm text-gray-400">Create an automation workflow first, then add A/B variants here.</p>
          <a href="/dashboard/automations" className="text-sm font-semibold text-purple-600 hover:underline">Go to Automations →</a>
        </div>
      ) : (
        <>
          {/* Workflow selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Workflow:</label>
            <select
              value={selectedWfId}
              onChange={e => setSelectedWfId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </div>

          {/* Traffic warning */}
          {totalTraffic > 100 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Active variants exceed 100% traffic ({totalTraffic}%). Adjust percentages so active variants total ≤ 100%.
            </div>
          )}

          {/* Variants list */}
          {variants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
              <FlaskConical className="w-10 h-10 text-gray-300" />
              <p className="font-semibold text-gray-500">No variants yet</p>
              <p className="text-sm text-gray-400">Add variants to start A/B testing this workflow.</p>
              <Button onClick={openCreate} className="mt-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Baseline card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">A</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Control (Original)</p>
                    <p className="text-xs text-gray-400">Base workflow — receives leftover traffic</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {Math.max(0, 100 - totalTraffic)}% traffic
                </span>
              </div>

              {/* Variant cards */}
              {variants.map(v => {
                const stats = analyticsMap[v.id];
                return (
                  <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                          {v.variant_key}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{v.name}</p>
                            {stats?.winner && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5">
                                <Trophy className="w-2.5 h-2.5" /> Winner
                              </span>
                            )}
                            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-500'}`}>
                              {v.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{v.traffic_percentage}% traffic</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteVariant(v.id)} disabled={deleting === v.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50">
                          {deleting === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    {stats && (
                      <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Runs</p>
                          <p className="text-lg font-bold text-gray-900">{stats.run_count || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Conversions</p>
                          <p className="text-lg font-bold text-gray-900">{stats.conversion_count || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Conv. Rate</p>
                          <p className={`text-lg font-bold ${(stats.conversion_rate || 0) >= 50 ? 'text-green-600' : 'text-gray-900'}`}>
                            {stats.conversion_rate || 0}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Traffic bar */}
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{ width: `${v.traffic_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Analytics summary */}
          {analytics && (analytics.variants || []).some(v => v.run_count > 0) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-700">Test Summary</h3>
              </div>
              <div className="space-y-2">
                {(analytics.variants || []).map(v => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-purple-700">{v.variant_key}</span>
                    <div className="flex-1 h-4 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${v.winner ? 'bg-amber-400' : 'bg-purple-400'}`}
                        style={{ width: `${Math.min(100, v.conversion_rate || 0)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-gray-700">{v.conversion_rate || 0}%</span>
                    {v.winner && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-50 bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">{editVariant ? 'Edit Variant' : 'Add Variant'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Variant Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Version B — Shorter message"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Variant Key</label>
                  <input value={form.variant_key} onChange={e => setForm(f => ({ ...f, variant_key: e.target.value.toUpperCase().slice(0, 3) }))}
                    placeholder="B"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <p className="text-xs text-gray-400 mt-1">Short label shown in analytics (e.g. B, C, V2)</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Traffic Split</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} step={5}
                      value={form.traffic_percentage}
                      onChange={e => setForm(f => ({ ...f, traffic_percentage: Number(e.target.value) }))}
                      className="flex-1 accent-purple-600" />
                    <span className="w-12 text-right text-sm font-bold text-gray-900">{form.traffic_percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Percentage of triggers routed to this variant when active</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    <option value="draft">Draft — not routing traffic</option>
                    <option value="active">Active — routing traffic now</option>
                    <option value="paused">Paused — temporarily stopped</option>
                  </select>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Note: To use a different workflow config for this variant, go to Automations, design the variant flow, and save it. Variant config editing is available in the automation canvas.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving || !form.name.trim()} className="flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editVariant ? 'Save Changes' : 'Create Variant'}
                </Button>
              </div>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
