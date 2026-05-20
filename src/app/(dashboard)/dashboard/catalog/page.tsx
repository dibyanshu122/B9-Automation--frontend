'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { Package, Plus, Pencil, Trash2, Search, Tag, IndianRupee, X, Check, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/button';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface MetaConnection {
  connected: boolean;
  catalog_id?: string;
  catalog_name?: string;
  product_count?: number;
  last_synced_at?: string;
  sync_error?: string;
}

const EMPTY: Omit<Product, 'id' | 'created_at'> = {
  name: '',
  description: '',
  price: null,
  category: '',
  image_url: '',
  is_active: true,
};

export default function CatalogPage() {
  const { get, post, put, delete: del } = useApi();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'created_at'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [metaConn, setMetaConn] = useState<MetaConnection>({ connected: false });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, metaRes] = await Promise.all([
        get('/api/catalog/products?active_only=false'),
        get('/api/catalog/categories'),
        get('/api/catalog/meta/connection').catch(() => ({ data: { connected: false } })),
      ]);
      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data?.categories || []);
      setMetaConn(metaRes.data || { connected: false });
    } catch {
      setError('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
    setError('');
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: p.price, category: p.category || '', image_url: p.image_url || '', is_active: p.is_active });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Product name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: form.price ? Number(form.price) : null };
      if (editingId) {
        const res = await put(`/api/catalog/products/${editingId}`, payload);
        setProducts(prev => prev.map(p => p.id === editingId ? res.data : p));
      } else {
        const res = await post('/api/catalog/products', payload);
        setProducts(prev => [res.data, ...prev]);
        if (res.data.category && !categories.includes(res.data.category)) {
          setCategories(prev => [...prev, res.data.category]);
        }
      }
      setShowForm(false);
    } catch {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await del(`/api/catalog/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMetaSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await post('/api/catalog/meta/sync', {});
      setSyncMsg(res.data?.message || `Synced ${res.data?.total || 0} products`);
      await fetchProducts();
    } catch (e: any) {
      setSyncMsg(e?.response?.data?.detail || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Meta Catalog Sync Banner */}
        {metaConn.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🛍</span>
              <div>
                <p className="text-sm font-semibold text-violet-200">
                  Meta Catalog connected
                  {metaConn.catalog_name ? ` — ${metaConn.catalog_name}` : ''}
                </p>
                <p className="text-xs text-violet-400">
                  {metaConn.product_count ?? 0} products synced
                  {metaConn.last_synced_at ? ` · ${new Date(metaConn.last_synced_at).toLocaleString()}` : ''}
                </p>
                {syncMsg && <p className="text-xs text-emerald-400 mt-0.5">{syncMsg}</p>}
                {metaConn.sync_error && <p className="text-xs text-red-400 mt-0.5">{metaConn.sync_error}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/integrations')} className="text-xs border border-violet-500/30 text-violet-300">
                <Link2 className="h-3.5 w-3.5 mr-1" /> Settings
              </Button>
              <Button variant="primary" size="sm" onClick={handleMetaSync} disabled={syncing} className="text-xs bg-violet-600 hover:bg-violet-700">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from Meta'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🛍</span>
              <p className="text-sm text-slate-400">
                Have products on Facebook Business? <span className="text-violet-400 font-medium">Connect Meta Catalog</span> to sync them automatically.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/integrations')} className="text-xs border border-violet-500/30 text-violet-300 shrink-0">
              Connect in Integrations →
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
              <Package className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Product Catalog</h1>
              <p className="text-xs text-slate-500">Manage products — send via WhatsApp automation</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <select
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {error && !showForm && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No products yet</p>
            <p className="text-slate-600 text-sm mt-1">Add your first product to start sending catalogs via WhatsApp</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => (
              <div
                key={product.id}
                className={`relative rounded-xl border bg-slate-900 p-5 transition-all hover:border-violet-500/40 ${product.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}
              >
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-lg object-cover" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{product.name}</p>
                    {product.category && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                        <Tag className="h-2.5 w-2.5" />{product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(product)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-slate-200 transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {product.description && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{product.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {product.price != null ? (
                    <span className="flex items-center gap-0.5 text-sm font-bold text-emerald-400">
                      <IndianRupee className="h-3.5 w-3.5" />{product.price.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">Price on request</span>
                  )}
                  <span className={`text-[10px] font-semibold ${product.is_active ? 'text-emerald-500' : 'text-slate-600'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 flex-shrink-0">
              <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Product Name *</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  placeholder="e.g. Premium Coaching Package"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brief product description..."
                  value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    placeholder="e.g. 4999"
                    value={form.price ?? ''}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Category</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    placeholder="e.g. Coaching"
                    list="cat-list"
                    value={form.category || ''}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  />
                  <datalist id="cat-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Image URL (optional)</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  placeholder="https://..."
                  value={form.image_url || ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs text-slate-400">Active (visible in catalog)</span>
              </label>
            </div>
            <div className="flex gap-2 border-t border-white/10 px-5 py-4 flex-shrink-0">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (<><Check className="h-4 w-4 mr-1" />{editingId ? 'Update' : 'Add Product'}</>)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
