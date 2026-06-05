'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, Megaphone, Workflow, FileText, MessageSquare, Zap, ShoppingCart, CreditCard } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Result {
  id: string;
  type: 'lead' | 'campaign' | 'automation' | 'template' | 'message';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  lead:       <Users className="h-3.5 w-3.5 text-orange-500" />,
  campaign:   <Megaphone className="h-3.5 w-3.5 text-blue-500" />,
  automation: <Workflow className="h-3.5 w-3.5 text-violet-500" />,
  template:   <FileText className="h-3.5 w-3.5 text-emerald-500" />,
  message:    <MessageSquare className="h-3.5 w-3.5 text-green-500" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { get } = useApi();
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setResults([]);
        setActive(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [leadsRes, campaignsRes, tplRes, docsRes, autoRes, catalogRes] = await Promise.allSettled([
        get(`/api/leads?search=${encodeURIComponent(q)}&limit=5`),
        get(`/api/campaigns?search=${encodeURIComponent(q)}&limit=5`),
        get('/api/automation/whatsapp/templates'),
        get(`/api/documents?search=${encodeURIComponent(q)}&limit=5`),
        get(`/api/automation/workflows?search=${encodeURIComponent(q)}&limit=5`),
        get(`/api/automation/catalog?search=${encodeURIComponent(q)}&limit=5`),
      ]);

      const items: Result[] = [];

      // Leads
      if (leadsRes.status === 'fulfilled') {
        const data = leadsRes.value.data;
        const leads = Array.isArray(data) ? data : (data?.leads || []);
        leads.slice(0, 5).forEach((l: any) => {
          items.push({
            id: `lead-${l.id}`,
            type: 'lead',
            title: l.name || l.phone || 'Unnamed lead',
            subtitle: [l.phone, l.status, l.score_label].filter(Boolean).join(' · '),
            href: '/dashboard/leads',
            icon: TYPE_ICONS.lead,
          });
        });
      }

      // Campaigns
      if (campaignsRes.status === 'fulfilled') {
        const camps = campaignsRes.value.data?.campaigns || campaignsRes.value.data || [];
        camps.filter((c: any) => c.name?.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3).forEach((c: any) => {
            items.push({
              id: `camp-${c.name}`,
              type: 'campaign',
              title: c.name,
              subtitle: `${c.status} · ${c.total || 0} recipients`,
              href: '/dashboard/campaigns',
              icon: TYPE_ICONS.campaign,
            });
          });
      }

      // Templates
      if (tplRes.status === 'fulfilled') {
        const tpls = tplRes.value.data?.templates || [];
        tpls.filter((t: any) => t.name?.toLowerCase().includes(q.toLowerCase()) || t.status === 'APPROVED')
          .slice(0, 3).forEach((t: any) => {
            items.push({
              id: `tpl-${t.name}`,
              type: 'template',
              title: t.name,
              subtitle: `${t.status} · ${t.category}`,
              href: '/dashboard/templates',
              icon: TYPE_ICONS.template,
            });
          });
      }

      // Documents
      if (docsRes.status === 'fulfilled') {
        const docs = docsRes.value.data?.documents || docsRes.value.data || [];
        docs.slice(0, 3).forEach((d: any) => {
          items.push({
            id: `doc-${d.id}`,
            type: 'template',
            title: d.title || d.filename || 'Document',
            subtitle: `Document · ${d.mime_type || ''}`,
            href: '/dashboard/documents',
            icon: <FileText className="h-3.5 w-3.5 text-emerald-500" />,
          });
        });
      }

      // Automations
      if (autoRes.status === 'fulfilled') {
        const autos = autoRes.value.data?.workflows || autoRes.value.data || [];
        autos.slice(0, 3).forEach((a: any) => {
          items.push({
            id: `auto-${a.id}`,
            type: 'automation',
            title: a.name || 'Automation',
            subtitle: `Automation · ${a.is_active ? 'Active' : 'Inactive'}`,
            href: '/dashboard/automations',
            icon: TYPE_ICONS.automation,
          });
        });
      }

      // Catalog / Products
      if (catalogRes.status === 'fulfilled') {
        const products = catalogRes.value.data?.products || catalogRes.value.data || [];
        (Array.isArray(products) ? products : []).slice(0, 3).forEach((p: any) => {
          if (!p.name?.toLowerCase().includes(q.toLowerCase())) return;
          items.push({
            id: `prod-${p.id}`,
            type: 'template',
            title: p.name || 'Product',
            subtitle: `Product · ₹${p.price || 0}`,
            href: '/dashboard/catalog',
            icon: <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />,
          });
        });
      }

      // Quick navigation suggestions
      const quickLinks = [
        { key: 'leads', label: 'Go to Leads', href: '/dashboard/leads' },
        { key: 'campaigns', label: 'Go to Campaigns', href: '/dashboard/campaigns' },
        { key: 'automations', label: 'Go to Automations', href: '/dashboard/automations' },
        { key: 'templates', label: 'Go to Templates', href: '/dashboard/templates' },
        { key: 'analytics', label: 'Go to Analytics', href: '/dashboard/analytics' },
        { key: 'settings', label: 'Go to Settings', href: '/dashboard/settings' },
        { key: 'messages', label: 'Go to Messages', href: '/dashboard/messages' },
        { key: 'billing', label: 'Go to Billing', href: '/dashboard/billing' },
        { key: 'integrations', label: 'Go to Integrations', href: '/dashboard/integrations' },
        { key: 'catalog', label: 'Go to Product Catalog', href: '/dashboard/catalog' },
        { key: 'qr', label: 'Go to QR Codes', href: '/dashboard/qr-codes' },
        { key: 'segments', label: 'Go to Segments', href: '/dashboard/segments' },
        { key: 'flows', label: 'Go to WhatsApp Flows', href: '/dashboard/flows' },
        { key: 'team', label: 'Go to Team', href: '/dashboard/team' },
      ].filter(l => l.label.toLowerCase().includes(q.toLowerCase()) || l.key.includes(q.toLowerCase()));

      quickLinks.slice(0, 3).forEach(l => {
        items.push({
          id: `nav-${l.key}`,
          type: 'message',
          title: l.label,
          subtitle: 'Navigation',
          href: l.href,
          icon: <Zap className="h-3.5 w-3.5 text-amber-500" />,
        });
      });

      setResults(items);
      setActive(0);
    } finally {
      setLoading(false);
    }
  }, [get]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const go = (result: Result) => {
    router.push(result.href);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) go(results[active]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search leads, campaigns, templates… or type a page name"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            {loading && <div className="h-3.5 w-3.5 border-2 border-gray-300 border-t-orange-400 rounded-full animate-spin" />}
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">Esc</kbd>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1.5">
            {results.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${active === i ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active === i ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  {r.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                </div>
                {active === i && <kbd className="shrink-0 rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-500">↵</kbd>}
              </button>
            ))}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No results for <strong>&ldquo;{query}&rdquo;</strong>
          </div>
        )}

        {!query && (
          <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
            <span className="ml-auto">Try: &ldquo;hot leads&rdquo;, &ldquo;settings&rdquo;, campaign name</span>
          </div>
        )}
      </div>
    </div>
  );
}
