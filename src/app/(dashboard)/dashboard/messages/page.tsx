'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, ChevronRight, Copy, Inbox, Loader2, MapPin, MessageCircle, MoreVertical, Search, Send, Tag, Trash2, User, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

const CHANNEL_BADGE: Record<string, { label: string; color: string; emoji: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: 'bg-emerald-50 text-emerald-700',  emoji: '💬' },
  instagram: { label: 'Instagram', color: 'bg-pink-50 text-pink-700',        emoji: '📸' },
  facebook:  { label: 'Facebook',  color: 'bg-blue-50 text-blue-700',        emoji: '📘' },
};

function ChannelIcon({ channel, size = 16 }: { channel: string; size?: number }) {
  if (channel === 'whatsapp') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366"/>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
    </svg>
  );
  if (channel === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fd5949"/>
          <stop offset="50%" stopColor="#d6249f"/>
          <stop offset="100%" stopColor="#285AEB"/>
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig)"/>
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="17" cy="7" r="1" fill="white"/>
    </svg>
  );
  if (channel === 'facebook') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2"/>
      <path d="M16 8h-2a1 1 0 00-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 014-4h2v3z" fill="white"/>
    </svg>
  );
  return <span className="text-sm">💬</span>;
}

function timeAgo(iso: string) {
  if (!iso) return '';
  // Add 'Z' if missing so browser treats as UTC (server stores UTC without Z)
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Contact {
  sender_id: string;
  sender_name: string;
  channel: string;
  last_text: string;
  last_time: string;
  unread: number;
}

/* ── Delivery tick indicator ─────────────────────────────────────── */
function DeliveryTick({ status, delivery_status, isOutbound }: { status?: string; delivery_status?: string; isOutbound: boolean }) {
  if (!isOutbound) return null;
  const ds = delivery_status || status || '';
  if (ds === 'read') return <span className="text-sky-300 text-[11px]">✓✓</span>;
  if (ds === 'delivered') return <span className="text-emerald-100 text-[11px]">✓✓</span>;
  if (ds === 'sent' || status === 'sent') return <span className="text-emerald-200 text-[11px]">✓</span>;
  if (status === 'failed') return <span className="text-red-300 text-[11px]">✗</span>;
  return <span className="text-emerald-200 text-[11px]">✓</span>;
}

/* ── Rich message content renderer ──────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
function mediaProxyUrl(mediaId: string) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
  return `${API_BASE}/api/automation/media/${mediaId}?t=${encodeURIComponent(token)}`;
}

function MessageContent({ msg, isOutbound }: { msg: any; isOutbound: boolean }) {
  const type = msg.message_type || 'text';
  const payload = msg.payload || {};
  const text = msg.text || '';

  // Image
  if (type === 'image') {
    const img = payload.image || {};
    const caption = img.caption || text;
    const mediaId = img.id || '';
    return (
      <div className="space-y-1">
        <div className="rounded-lg overflow-hidden bg-black/10 max-w-[240px]">
          {mediaId ? (
            <img
              src={mediaProxyUrl(mediaId)}
              alt="image"
              className="max-w-full rounded-lg block"
              style={{maxHeight: 300}}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 py-4 px-6 opacity-60">
              <span className="text-2xl">🖼️</span>
              <span className="text-[10px]">Image</span>
            </div>
          )}
        </div>
        {caption && <p className="text-sm leading-relaxed mt-1">{caption}</p>}
      </div>
    );
  }

  // Video
  if (type === 'video') {
    const vid = payload.video || {};
    const caption = vid.caption || text;
    return (
      <div className="space-y-1">
        <div className="rounded-lg bg-black/20 flex items-center justify-center gap-2 px-4 py-3 min-w-[140px]">
          <Play className="h-5 w-5" />
          <span className="text-sm font-medium">Video</span>
        </div>
        {caption && <p className="text-sm leading-relaxed">{caption}</p>}
      </div>
    );
  }

  // Audio / Voice
  if (type === 'audio' || type === 'voice') {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/10 min-w-[140px]">
        <span className="text-lg">🎵</span>
        <div className="flex-1">
          <div className="flex gap-0.5 items-end h-5">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="w-0.5 rounded-full opacity-60" style={{
                height: `${30 + Math.sin(i * 0.8) * 20 + Math.cos(i * 1.3) * 15}%`,
                background: isOutbound ? 'white' : '#25D366'
              }} />
            ))}
          </div>
          <p className="text-[10px] mt-0.5 opacity-70">Voice message</p>
        </div>
      </div>
    );
  }

  // Document
  if (type === 'document') {
    const doc = payload.document || {};
    const filename = doc.filename || text || 'Document';
    const caption = doc.caption || '';
    const mediaId = doc.id || '';
    return (
      <div className="space-y-1">
        <a
          href={mediaId ? mediaProxyUrl(mediaId) : '#'}
          download={filename}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 min-w-[160px] transition ${
            isOutbound ? 'bg-emerald-400/30 hover:bg-emerald-400/40' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <FileText className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[160px]">{filename}</p>
            <p className="text-[10px] opacity-60">{doc.mime_type ? doc.mime_type.split('/')[1]?.toUpperCase() : 'Document'} · Tap to download</p>
          </div>
        </a>
        {caption && <p className="text-sm px-1">{caption}</p>}
      </div>
    );
  }

  // Sticker
  if (type === 'sticker') {
    return (
      <div className="flex items-center gap-2 opacity-70">
        <span className="text-3xl">🎭</span>
        <span className="text-xs">Sticker</span>
      </div>
    );
  }

  // Location
  if (type === 'location') {
    const loc = payload.location || {};
    const lat = loc.latitude || 0;
    const lng = loc.longitude || 0;
    const name = loc.name || text || 'Location';
    const address = loc.address || '';
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    return (
      <a href={mapsUrl} target="_blank" rel="noreferrer" className="block">
        <div className={`rounded-xl overflow-hidden border min-w-[200px] ${isOutbound ? 'border-emerald-400' : 'border-gray-200'}`}>
          <div className="bg-gray-100 h-16 flex items-center justify-center relative">
            <div className="w-full h-full" style={{
              background: 'linear-gradient(135deg, #e2e8f0 25%, #f0f4f8 50%, #e2e8f0 75%)',
              backgroundSize: '20px 20px',
            }} />
            <MapPin className="absolute h-6 w-6 text-red-500" />
          </div>
          <div className={`px-2 py-1.5 ${isOutbound ? 'bg-emerald-400/20' : 'bg-white'}`}>
            <p className="text-xs font-semibold truncate">{name}</p>
            {address && <p className="text-[10px] opacity-70 truncate">{address}</p>}
            <p className="text-[10px] text-blue-500 mt-0.5">Open in Maps ↗</p>
          </div>
        </div>
      </a>
    );
  }

  // Interactive reply (customer tapped a button or list item)
  if (type === 'interactive') {
    const inter = payload.interactive || {};
    const reply = inter.button_reply || inter.list_reply || inter.nfm_reply || {};
    const replyTitle = reply.title || reply.id || text;
    return (
      <div className="space-y-1">
        {replyTitle && (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
            isOutbound ? 'border-emerald-300 bg-emerald-400/20' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            <Check className="h-3 w-3" />
            {replyTitle}
          </div>
        )}
        {text && text !== replyTitle && <p className="text-sm">{text}</p>}
      </div>
    );
  }

  // Template button reply
  if (type === 'button') {
    const btn = payload.button || {};
    const btnText = btn.text || text;
    return (
      <div className="space-y-1">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
          isOutbound ? 'border-emerald-300 bg-emerald-400/20' : 'border-blue-200 bg-blue-50 text-blue-800'
        }`}>
          <Check className="h-3 w-3" />
          {btnText}
        </div>
      </div>
    );
  }

  // Order
  if (type === 'order') {
    const order = payload.order || {};
    const itemCount = (order.product_items || []).length;
    return (
      <div className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2">
        <span className="text-xl">🛒</span>
        <div>
          <p className="text-sm font-semibold">Order placed</p>
          <p className="text-xs opacity-70">{itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''}` : 'From catalog'}</p>
        </div>
      </div>
    );
  }

  // Default: plain text (with line breaks)
  const displayText = text || '';
  if (!displayText) return <p className="text-sm italic opacity-50">Empty message</p>;
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayText}</p>
  );
}

function UnifiedInbox() {
  const { get, post, delete: del } = useApi();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'facebook'>('all');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadsMap, setLeadsMap] = useState<Record<string, string>>({});
  const [quickReplies, setQuickReplies] = useState<{id: string; title: string; message: string}[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [leadProfile, setLeadProfile] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState('');
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const tplRef = useRef<HTMLDivElement>(null);

  // Fetch leads once to map phone → name
  useEffect(() => {
    get('/api/leads?limit=500').then(r => {
      const map: Record<string, string> = {};
      (r.data?.leads || r.data || []).forEach((l: any) => {
        if (l.phone && l.name) {
          const clean = l.phone.replace(/\D/g, '');
          map[clean] = l.name;
          map[l.phone] = l.name;
        }
      });
      setLeadsMap(map);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const resolveContactName = (senderId: string): string => {
    const clean = senderId.replace(/\D/g, '');
    return leadsMap[senderId] || leadsMap[clean] || leadsMap['+' + clean] || null!;
  };

  const loadInbox = (retryCount = 0) => {
    get('/api/automation/inbox')
      .then(res => {
        const items: any[] = res.data?.items || [];
        const map = new Map<string, Contact>();
        items.forEach(item => {
          const key = `${item.channel}::${item.sender_id}`;
          if (!map.has(key)) {
            map.set(key, {
              sender_id: item.sender_id,
              sender_name: item.sender_name || item.sender_id,
              channel: item.channel,
              last_text: item.text || `[${item.message_type}]`,
              last_time: item.created_at,
              unread: 1,
            });
          } else {
            const c = map.get(key)!;
            if (item.created_at > c.last_time) {
              c.last_text = item.text || `[${item.message_type}]`;
              c.last_time = item.created_at;
            }
            c.unread++;
          }
        });
        setContacts(Array.from(map.values()).sort((a, b) => b.last_time.localeCompare(a.last_time)));
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 401 && retryCount < 2) {
          // Token may not be hydrated yet — retry after short delay
          setTimeout(() => loadInbox(retryCount + 1), 1500);
        } else {
          toast.error('Failed to load inbox');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // Load saved quick replies once
  useEffect(() => {
    get('/api/auto-replies/quick-replies')
      .then(r => {
        const list = r.data?.quick_replies || r.data?.items || (Array.isArray(r.data) ? r.data : []);
        setQuickReplies(list);
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  // Close quick reply / template dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) setQrOpen(false);
      if (tplRef.current && !tplRef.current.contains(e.target as Node)) setTplOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load APPROVED templates once
  useEffect(() => {
    get('/api/automation/whatsapp/templates').then(r => {
      const all = r.data?.data || r.data || [];
      setTemplates(all.filter((t: any) => t.status === 'APPROVED'));
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Load lead profile when contact selected
  useEffect(() => {
    if (!selected) { setLeadProfile(null); return; }
    setProfileLoading(true);
    get(`/api/leads?phone=${encodeURIComponent(selected.sender_id)}&limit=1`)
      .then(r => {
        const leads = r.data?.leads || r.data || [];
        setLeadProfile(leads[0] || null);
      })
      .catch(() => setLeadProfile(null))
      .finally(() => setProfileLoading(false));
  }, [selected?.sender_id]); // eslint-disable-line

  const fetchThread = (s: typeof selected) => {
    if (!s) return;
    get(`/api/automation/inbox/conversation?sender_id=${encodeURIComponent(s.sender_id)}&channel=${s.channel}`)
      .then(res => setThread(res.data?.messages || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!selected) return;
    setThreadLoading(true);
    fetchThread(selected);
    setThreadLoading(false);

    // Auto-poll every 5 seconds for new incoming messages
    const interval = setInterval(() => fetchThread(selected), 5000);
    return () => clearInterval(interval);
  }, [selected]); // eslint-disable-line

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [thread]);

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const msgText = reply.trim();
    setReply('');
    // Optimistic UI — show message immediately
    setThread(prev => [...prev, {
      id: `temp-${Date.now()}`,
      direction: 'outbound',
      text: msgText,
      created_at: new Date().toISOString(),
      channel: selected.channel,
      status: 'sending',
    }]);
    try {
      await post('/api/automation/outbound-messages', {
        channel: selected.channel,
        recipient: selected.sender_id,
        message: msgText,
        provider: 'meta',
        force_send: true,
      });
      toast.success('Sent ✓');
      // Refresh thread after 1.5s
      setTimeout(() => {
        get(`/api/automation/inbox/conversation?sender_id=${encodeURIComponent(selected.sender_id)}&channel=${selected.channel}`)
          .then(res => setThread(res.data?.messages || []));
      }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || '';
      if (detail.includes('paid plan') || detail.includes('upgrade')) {
        toast.error('Upgrade to STARTER plan to send live messages');
      } else {
        toast('Saved as draft — WhatsApp may not be connected', { icon: '📋' });
      }
    }
    finally { setSending(false); }
  };

  const filtered = contacts
    .filter(c => filter === 'all' || c.channel === filter)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (resolveContactName(c.sender_id) || c.sender_name || '').toLowerCase();
      return name.includes(q) || c.sender_id.includes(q) || c.last_text.toLowerCase().includes(q);
    });

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* LEFT — Contacts panel */}
        <div className={`b9-glass flex min-h-0 flex-col overflow-hidden rounded-lg ${selected ? 'hidden xl:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                  <Inbox className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-bold text-white text-sm">Inbox</span>
              </div>
              {contacts.length > 0 && (
                <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white">{contacts.length}</span>
              )}
            </div>
            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="w-full rounded-lg bg-white/8 border border-white/10 pl-8 pr-7 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'whatsapp', 'instagram', 'facebook'] as const).map(ch => (
                <button key={ch} onClick={() => setFilter(ch)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    filter === ch
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}>
                  {ch === 'all' ? 'All' : <span className="flex items-center gap-1"><ChannelIcon channel={ch} size={12} /><span className="hidden lg:inline">{CHANNEL_BADGE[ch]?.label}</span></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Contact rows */}
          <div className="flex-1 overflow-y-auto mt-1 px-2 pb-2 space-y-0.5">
            {loading ? (
              <div className="space-y-1 p-3">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/10 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">💬</div>
                <p className="text-xs text-slate-500 text-center">No messages yet<br/>Connect WhatsApp to get started</p>
              </div>
            ) : filtered.map(c => {
              const badge = CHANNEL_BADGE[c.channel] || { emoji: '💬', label: c.channel, color: '' };
              const isSelected = selected?.sender_id === c.sender_id && selected?.channel === c.channel;
              return (
                <button key={`${c.channel}::${c.sender_id}`}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 ring-1 ring-cyan-500/40'
                      : 'hover:bg-white/8'
                  }`}>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${
                      c.channel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400' :
                      c.channel === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {c.sender_name?.[0]?.toUpperCase() || badge.emoji}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5"><ChannelIcon channel={c.channel} size={14} /></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {resolveContactName(c.sender_id) || c.sender_name}
                      </p>
                      <p className="shrink-0 text-[10px] text-slate-500" title={c.last_time ? new Date(c.last_time + 'Z').toLocaleString() : ''}>{timeAgo(c.last_time)}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.last_text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Chat Thread + Lead Profile */}
        {selected ? (
          <div className="b9-glass flex min-h-0 min-w-0 overflow-hidden rounded-lg">
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 shrink-0">
              <button onClick={() => setSelected(null)} className="xl:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition mr-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-semibold">Back</span>
              </button>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                selected.channel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400' :
                selected.channel === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {(resolveContactName(selected.sender_id) || selected.sender_name)?.[0]?.toUpperCase() || CHANNEL_BADGE[selected.channel]?.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-100 truncate">
                  {resolveContactName(selected.sender_id) || selected.sender_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ChannelIcon channel={selected.channel} size={12} />
                  <p className="text-[11px] text-slate-400 capitalize">{selected.channel}</p>
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
              </div>
              {/* Profile toggle */}
              <button
                onClick={() => setProfileOpen(o => !o)}
                title="Lead Profile"
                className={`p-2 rounded-xl transition ${profileOpen ? 'bg-slate-900 text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
              >
                <User className="h-5 w-5" />
              </button>
              {/* 3-dot menu */}
              <div className="relative">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                      <button onClick={async () => {
                        setMenuOpen(false);
                        if (!confirm('Delete this entire conversation? This cannot be undone.')) return;
                        const deletingContact = selected;
                        try {
                          await del(`/api/automation/inbox/conversation?sender_id=${encodeURIComponent(selected.sender_id)}&channel=${selected.channel}`);
                          toast.success('Conversation deleted');
                          setSelected(null);
                          setThread([]);
                          // Remove from contacts list immediately
                          setContacts(prev => prev.filter(c => !(c.sender_id === deletingContact.sender_id && c.channel === deletingContact.channel)));
                        } catch {
                          toast.error('Failed to delete conversation');
                        }
                      }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Delete Chat
                      </button>
                      <button onClick={async () => {
                        setMenuOpen(false);
                        if (!confirm(`Block ${resolveContactName(selected.sender_id) || selected.sender_name}? They will not trigger automations.`)) return;
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                          const token = localStorage.getItem('token');
                          await fetch(`${apiUrl}/api/automation/inbox/block?sender_id=${encodeURIComponent(selected.sender_id)}&channel=${selected.channel}`, {
                            method: 'POST',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          toast.success('Contact blocked');
                          setSelected(null);
                        } catch { toast.error('Block failed'); }
                      }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                        🚫 Block Contact
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-2 b9-chat-area">
              {threadLoading ? (
                <div className="flex justify-center pt-12"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
              ) : thread.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <MessageCircle className="h-10 w-10 text-gray-200" />
                  <p className="text-sm text-gray-400">No messages yet</p>
                </div>
              ) : thread.map(msg => {
                const isOutbound = msg.direction === 'outbound';
                const isPureMedia = ['image','video','audio','voice','sticker','location','document'].includes(msg.message_type);
                return (
                <div key={msg.id} className={`flex items-end gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  {!isOutbound && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-gray-600 mb-1">
                      {(resolveContactName(selected.sender_id) || selected.sender_name)?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className={`max-w-[72%] rounded-2xl text-sm ${
                    isOutbound
                      ? 'bg-emerald-500 text-white rounded-br-none shadow-md shadow-emerald-100'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none shadow-sm'
                  } ${isPureMedia ? 'p-1.5' : 'px-3.5 py-2'}`}>
                    <MessageContent msg={msg} isOutbound={isOutbound} />
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isPureMedia ? 'px-2 pb-1' : ''}`}>
                      <span className={`text-[10px] ${isOutbound ? 'text-emerald-100' : 'text-gray-400'}`}
                        title={msg.created_at ? new Date(msg.created_at + 'Z').toLocaleString() : ''}>
                        {timeAgo(msg.created_at)}
                      </span>
                      <DeliveryTick status={msg.status} delivery_status={msg.delivery_status} isOutbound={isOutbound} />
                    </div>
                  </div>
                </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-white/10 shrink-0">
              {/* Quick Reply dropdown */}
              {qrOpen && (
                <div ref={qrRef} className="border-b border-white/10 bg-white/5 px-4 py-2 max-h-40 overflow-y-auto">
                  {quickReplies.length === 0 ? (
                    <p className="text-xs text-slate-400 py-1">No quick replies saved. Add in <a href="/dashboard/auto-replies" className="text-amber-400 underline">Auto Replies</a>.</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-amber-400 mb-1.5">Quick Replies — click to insert</p>
                      {quickReplies.map(qr => (
                        <button key={qr.id} onClick={() => { setReply(qr.message); setQrOpen(false); }}
                          className="w-full text-left rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition">
                          <span className="font-semibold text-amber-300">{qr.title}</span>
                          <span className="ml-2 text-slate-400 truncate">{qr.message.slice(0, 60)}{qr.message.length > 60 ? '…' : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-3.5">
                {/* Quick Reply ⚡ */}
                <button onClick={() => { setQrOpen(v => !v); setTplOpen(false); }} title="Quick Replies"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${qrOpen ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400'}`}>
                  <Zap className="h-4 w-4" />
                </button>
                {/* Template send 📋 */}
                <div className="relative" ref={tplRef}>
                  <button onClick={() => { setTplOpen(v => !v); setQrOpen(false); }} title="Send Template"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${tplOpen ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400'}`}>
                    <FileText className="h-4 w-4" />
                  </button>
                  {tplOpen && (
                    <div className="absolute bottom-12 left-0 z-30 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <input autoFocus value={tplSearch} onChange={e => setTplSearch(e.target.value)}
                          placeholder="Search approved templates…"
                          className="flex-1 text-xs outline-none bg-transparent text-slate-200 placeholder-slate-500" />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {templates.filter(t => !tplSearch || t.name?.toLowerCase().includes(tplSearch.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-gray-400 p-4 text-center">No approved templates</p>
                        ) : templates
                          .filter(t => !tplSearch || t.name?.toLowerCase().includes(tplSearch.toLowerCase()))
                          .map((t: any) => {
                            const body = t.components?.find((c: any) => c.type === 'BODY')?.text || t.body || '';
                            return (
                              <button key={t.id || t.name} onClick={async () => {
                                setTplOpen(false);
                                setSendingTemplate(true);
                                try {
                                  await post('/api/automation/outbound-messages', {
                                    channel: selected.channel,
                                    recipient: selected.sender_id,
                                    message: body,
                                    msg_type: 'template',
                                    template_name: t.name,
                                    language_code: t.language || 'en_US',
                                    send_mode: 'live',
                                  });
                                  toast.success(`Template "${t.name}" sent`);
                                  fetchThread(selected);
                                } catch { toast.error('Failed to send template'); }
                                finally { setSendingTemplate(false); }
                              }} className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-50 last:border-0">
                                <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{body}</p>
                                <span className="text-[10px] text-blue-500 mt-1 inline-block">{t.language} · {t.category}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder={`Message ${resolveContactName(selected.sender_id) || selected.sender_name}…`}
                  className="flex-1 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/15 transition"
                />
                <button onClick={sendReply} disabled={sending || sendingTemplate || !reply.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-30 transition shadow-md">
                  {sending || sendingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* LEAD PROFILE SIDEBAR */}
          {profileOpen && (
            <div className="w-72 shrink-0 border-l border-white/10 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Lead Profile</span>
                <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {profileLoading ? (
                <div className="p-4 space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-200 rounded-lg animate-pulse" />)}
                </div>
              ) : leadProfile ? (
                <div className="p-4 space-y-4">
                  {/* Avatar + Name */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white text-xl font-bold">
                      {leadProfile.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <p className="font-bold text-gray-900 text-sm text-center">{leadProfile.name || 'Unknown'}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      leadProfile.status === 'hot' ? 'bg-red-100 text-red-700' :
                      leadProfile.status === 'warm' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{leadProfile.status || 'new'}</span>
                  </div>
                  {/* Details */}
                  {[
                    { label: 'Phone', value: leadProfile.phone, icon: '📞' },
                    { label: 'Email', value: leadProfile.email, icon: '✉️' },
                    { label: 'Source', value: leadProfile.source, icon: '📌' },
                    { label: 'Assigned to', value: leadProfile.assigned_to, icon: '👤' },
                  ].filter(d => d.value).map(d => (
                    <div key={d.label} className="flex gap-2">
                      <span className="text-sm shrink-0">{d.icon}</span>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{d.label}</p>
                        <p className="text-xs font-medium text-gray-800">{d.value}</p>
                      </div>
                    </div>
                  ))}
                  {/* Last message */}
                  {leadProfile.message && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Last Message</p>
                      <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">{leadProfile.message}</p>
                    </div>
                  )}
                  {/* Tags */}
                  {leadProfile.tag && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-gray-400" />
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{leadProfile.tag}</span>
                    </div>
                  )}
                  {/* View full profile */}
                  <a href="/dashboard/leads" className="flex items-center justify-center gap-1.5 mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                    View Full Profile →
                  </a>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No lead profile found for this contact</p>
                  <p className="text-[10px] text-gray-400 mt-1">{selected.sender_id}</p>
                </div>
              )}
            </div>
          )}
          </div>
        ) : (
          <div className="b9-glass hidden xl:flex min-h-0 flex-col items-center justify-center gap-4 rounded-lg">
            <MessageCircle className="h-16 w-16 text-slate-500" />
            <div className="text-center">
              <p className="font-bold text-slate-100">Your conversations</p>
              <p className="text-sm text-slate-400 mt-1">Select a contact from the left to open chat</p>
            </div>
          </div>
        )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div style={{ height: 'calc(100dvh - 80px)' }} className="flex flex-col">
      <UnifiedInbox />
    </div>
  );
}

