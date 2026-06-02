'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, Users, Filter, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';

// Filter fields available for segment rules
const FILTER_FIELDS = [
  { value: 'score_label', label: 'Lead Score', operators: ['equals'], options: ['hot', 'warm', 'cold'] },
  { value: 'status', label: 'Status', operators: ['equals'], options: ['new', 'contacted', 'qualified', 'converted', 'lost'] },
  { value: 'source', label: 'Source', operators: ['equals'], options: ['whatsapp', 'facebook', 'instagram', 'website_widget', 'manual', 'woocommerce', 'shopify'] },
  { value: 'tag', label: 'Tag', operators: ['contains'], options: [] },
];

interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  filters: Filter[];
  created_at?: string;
}

const DEFAULT_FILTER: Filter = { field: 'score_label', operator: 'equals', value: 'hot' };

export default function SegmentsPage() {
  const { get, post, patch, delete: del } = useApi();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // Builder state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<Filter[]>([{ ...DEFAULT_FILTER }]);
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ count: number; sample: string[] } | null>(null);

  const load = async () => {
    try {
      const r = await get('/api/leads/segments');
      setSegments(r.data || []);
    } catch { toast.error('Failed to load segments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openBuilder = (seg?: Segment) => {
    if (seg) {
      setEditingSegment(seg);
      setName(seg.name);
      setDescription(seg.description || '');
      setFilters(seg.filters?.length ? seg.filters : [{ ...DEFAULT_FILTER }]);
      setMatchMode((seg as any).match_mode || 'all');
    } else {
      setEditingSegment(null);
      setName('');
      setDescription('');
      setFilters([{ ...DEFAULT_FILTER }]);
      setMatchMode('all');
    }
    setPreviewResult(null);
    setShowBuilder(true);
  };

  const addFilter = () => setFilters(prev => [...prev, { ...DEFAULT_FILTER }]);

  const updateFilter = (i: number, key: keyof Filter, val: string) => {
    setFilters(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
      // Reset operator + value when field changes
      if (key === 'field') {
        const def = FILTER_FIELDS.find(f => f.value === val);
        next[i].operator = def?.operators[0] || 'equals';
        next[i].value = def?.options[0] || '';
      }
      return next;
    });
  };

  const removeFilter = (i: number) => setFilters(prev => prev.filter((_, idx) => idx !== i));

  const saveSegment = async () => {
    if (!name.trim()) { toast.error('Segment name required'); return; }
    if (filters.some(f => !f.value)) { toast.error('Fill all filter values'); return; }
    setSaving(true);
    try {
      const body = { name: name.trim(), description: description.trim(), filters, match_mode: matchMode };
      if (editingSegment) {
        await patch(`/api/leads/segments/${editingSegment.id}`, body);
        toast.success('Segment updated');
      } else {
        await post('/api/leads/segments', body);
        toast.success('Segment created');
      }
      setShowBuilder(false);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const previewSegment = async () => {
    if (!editingSegment) { toast('Save the segment first to preview'); return; }
    setPreviewing(true);
    try {
      const r = await post(`/api/leads/segments/${editingSegment.id}/preview`, {});
      setPreviewResult(r.data);
    } catch { toast.error('Preview failed'); }
    finally { setPreviewing(false); }
  };

  const deleteSegment = async (seg: Segment) => {
    if (!confirm(`Delete segment "${seg.name}"?`)) return;
    try {
      await del(`/api/leads/segments/${seg.id}`);
      setSegments(prev => prev.filter(s => s.id !== seg.id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Segments</h1>
          <p className="mt-1 text-sm text-gray-500">Group leads by behaviour, score, or source — then target them in campaigns.</p>
        </div>
        <button
          onClick={() => openBuilder()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" /> New Segment
        </button>
      </div>

      {/* Segment List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading segments...
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Filter className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No segments yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Create your first segment to target the right leads</p>
          <button onClick={() => openBuilder()} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition">
            Create Segment
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => (
            <div key={seg.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{seg.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openBuilder(seg)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition">
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteSegment(seg)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {seg.description && <p className="text-xs text-gray-500 mb-3">{seg.description}</p>}
              <div className="space-y-1">
                {(seg.filters || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 font-medium text-indigo-700">
                      {FILTER_FIELDS.find(ff => ff.value === f.field)?.label || f.field}
                    </span>
                    <span className="text-gray-400">{f.operator}</span>
                    <span className="font-semibold text-gray-700">{f.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-gray-400">
                {seg.created_at ? new Date(seg.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Segment Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingSegment ? 'Edit Segment' : 'New Segment'}
              </h2>
              <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Segment Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Hot Facebook Leads"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optional)</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Who is in this segment?"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Filter rules */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Filter Rules</label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] font-semibold">
                    <button type="button" onClick={() => setMatchMode('all')}
                      className={`px-2.5 py-1 transition ${matchMode === 'all' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      ALL match
                    </button>
                    <button type="button" onClick={() => setMatchMode('any')}
                      className={`px-2.5 py-1 transition ${matchMode === 'any' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      ANY match
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {filters.map((f, i) => {
                    const fieldDef = FILTER_FIELDS.find(ff => ff.value === f.field);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {/* Field */}
                        <select
                          value={f.field}
                          onChange={e => updateFilter(i, 'field', e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        >
                          {FILTER_FIELDS.map(ff => (
                            <option key={ff.value} value={ff.value}>{ff.label}</option>
                          ))}
                        </select>

                        {/* Operator */}
                        <select
                          value={f.operator}
                          onChange={e => updateFilter(i, 'operator', e.target.value)}
                          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        >
                          {(fieldDef?.operators || ['equals']).map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>

                        {/* Value */}
                        {fieldDef?.options.length ? (
                          <select
                            value={f.value}
                            onChange={e => updateFilter(i, 'value', e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          >
                            {fieldDef.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            value={f.value}
                            onChange={e => updateFilter(i, 'value', e.target.value)}
                            placeholder="value"
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                        )}

                        {filters.length > 1 && (
                          <button onClick={() => removeFilter(i)} className="text-gray-400 hover:text-red-500 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={addFilter} className="mt-2 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                  <Plus className="h-3 w-3" /> Add Rule
                </button>
              </div>

              {/* Preview result */}
              {previewResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-bold text-emerald-800">{previewResult.count} leads match this segment</p>
                  {previewResult.sample.length > 0 && (
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Sample: {previewResult.sample.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              {editingSegment && (
                <button
                  onClick={previewSegment}
                  disabled={previewing}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
                >
                  {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  Preview
                </button>
              )}
              <button
                onClick={saveSegment}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {editingSegment ? 'Update Segment' : 'Create Segment'}
              </button>
              <button onClick={() => setShowBuilder(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
