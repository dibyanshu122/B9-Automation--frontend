'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Bot, Check, CheckCheck, FileText, Loader2, MapPin, MessageCircle, MoreVertical, Play, Search, Send, Tag, Trash2, User, XCircle, Zap, Paperclip, Image as ImageIcon, Phone, ShoppingCart, Sticker, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

const CHANNEL_BADGE: Record<string, { label: string; color: string; emoji: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: 'bg-emerald-50 text-emerald-700',  emoji: '' },
  instagram: { label: 'Instagram', color: 'bg-pink-50 text-pink-700',        emoji: '' },
  facebook:  { label: 'Facebook',  color: 'bg-blue-50 text-blue-700',        emoji: '' },
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
  return <span className="text-sm">Chat</span>;
}

function timeAgo(iso: string, format: 'short' | 'time' | 'full' = 'short') {
  if (!iso) return '';
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const date = new Date(utcIso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (format === 'time' || (format === 'short' && diffDays === 0 && now.getDate() === date.getDate())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (format === 'short') {
    if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  // full format for tooltips
  return date.toLocaleString();
}

interface Contact {
  sender_id: string;
  sender_name: string;
  channel: string;
  last_text: string;
  last_time: string;
  unread: number;
  lead_score?: string; // hot | warm | cold
  assigned_agent?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
}

/* 24-hour window helper */
function getWindowStatus(lastTime: string, channel: string): { open: boolean; hoursAgo: number; windowHours: number } {
  const windowHours = channel === 'whatsapp' ? 24 : 168; // WA=24h, IG/FB=168h (7 days)
  const hoursAgo = lastTime ? (Date.now() - new Date(lastTime.endsWith('Z') ? lastTime : lastTime + 'Z').getTime()) / 3600000 : 999;
  return { open: hoursAgo < windowHours, hoursAgo, windowHours };
}

function getSlaStatus(contact: any): { label: string; color: string; urgent: boolean } | null {
  // Only show SLA timer if contact has unread messages (customer waiting for reply)
  if (!contact.unread || contact.unread <= 0) return null;
  const lastTime = contact.last_time;
  if (!lastTime) return null;
  const minsAgo = (Date.now() - new Date(lastTime.endsWith('Z') ? lastTime : lastTime + 'Z').getTime()) / 60000;
  if (minsAgo < 30) return null; // Under 30 min — no SLA warning
  if (minsAgo < 60) return { label: `${Math.round(minsAgo)}m waiting`, color: 'text-amber-600 bg-amber-50', urgent: false };
  if (minsAgo < 240) return { label: `${Math.round(minsAgo / 60)}h waiting`, color: 'text-orange-600 bg-orange-50', urgent: false };
  return { label: `${Math.round(minsAgo / 60)}h ⚠️`, color: 'text-red-600 bg-red-50', urgent: true };
}

function templateVarCount(body: string): number {
  const vars = new Set((body.match(/\{\{(\d+)\}\}/g) || []).map((m) => m.replace(/\D/g, '')));
  return vars.size;
}

/* Delivery tick indicator */
function DeliveryTick({ status, delivery_status, isOutbound }: { status?: string; delivery_status?: string; isOutbound: boolean }) {
  if (!isOutbound) return null;
  const ds = delivery_status || status || '';
  if (ds === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
  if (ds === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
  if (ds === 'sent' || status === 'sent') return <Check className="h-3.5 w-3.5 text-gray-400" />;
  if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  return <Check className="h-3.5 w-3.5 text-gray-400" />;
}

/* Rich message content renderer */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
function mediaProxyUrl(mediaId: string) {
  const token = typeof window !== 'undefined' ? (useAuthStore.getState().token || '') : '';
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
        <div className="rounded-lg overflow-hidden bg-gray-100 max-w-[240px]">
          {mediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaProxyUrl(mediaId)}
              alt="image"
              className="max-w-full rounded-lg block"
              style={{maxHeight: 300}}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 px-8 text-gray-400">
              <ImageIcon className="h-8 w-8" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Image</span>
            </div>
          )}
        </div>
        {caption && <p className="text-[14.5px] leading-snug mt-1 text-gray-800">{caption}</p>}
      </div>
    );
  }

  // Video
  if (type === 'video') {
    const vid = payload.video || {};
    const caption = vid.caption || text;
    return (
      <div className="space-y-1">
        <div className="rounded-lg bg-gray-800 text-white flex items-center justify-center gap-2 px-4 py-6 min-w-[200px]">
          <Play className="h-8 w-8 opacity-80" />
          <span className="text-sm font-medium opacity-80">Video</span>
        </div>
        {caption && <p className="text-[14.5px] leading-snug text-gray-800">{caption}</p>}
      </div>
    );
  }

  // Audio / Voice
  if (type === 'audio' || type === 'voice') {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg min-w-[180px] ${isOutbound ? 'bg-green-100/50' : 'bg-gray-100'}`}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isOutbound ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
          <Play className="h-4 w-4 ml-0.5" />
        </div>
        <div className="flex-1">
          <div className="flex gap-0.5 items-end h-5">
            {Array.from({length: 24}).map((_, i) => (
              <div key={i} className="w-[3px] rounded-full opacity-40" style={{
                height: `${30 + Math.sin(i * 0.5) * 40 + Math.cos(i * 1.1) * 30}%`,
                background: isOutbound ? '#166534' : '#4b5563'
              }} />
            ))}
          </div>
          <p className={`text-[10px] mt-1 opacity-70 ${isOutbound ? 'text-green-800' : 'text-gray-500'}`}>Voice message</p>
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2 min-w-[200px] transition ${
            isOutbound ? 'bg-green-100 hover:bg-green-200/70' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <div className={`h-10 w-10 flex items-center justify-center rounded-lg shrink-0 ${isOutbound ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium truncate text-gray-900 max-w-[160px]">{filename}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wide">{doc.mime_type ? doc.mime_type.split('/')[1]?.substring(0,4) : 'DOC'} • {doc.file_size ? Math.round(doc.file_size/1024) + 'KB' : 'File'}</p>
          </div>
        </a>
        {caption && <p className="text-[14.5px] leading-snug px-1 text-gray-800">{caption}</p>}
      </div>
    );
  }

  // Sticker
  if (type === 'sticker') {
    return (
      <div className="flex flex-col items-center gap-1 opacity-80 py-2">
        <Sticker className="h-12 w-12 text-gray-400" />
        <span className="text-[10px] uppercase font-medium text-gray-400">Sticker</span>
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
        <div className={`rounded-lg overflow-hidden border min-w-[220px] ${isOutbound ? 'border-green-200' : 'border-gray-200'}`}>
          <div className="bg-gray-100 h-24 flex items-center justify-center relative">
            <div className="w-full h-full opacity-30" style={{
              background: 'linear-gradient(135deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%)',
              backgroundSize: '16px 16px',
            }} />
            <div className="absolute flex flex-col items-center">
              <MapPin className="h-8 w-8 text-red-500 fill-red-100" />
            </div>
          </div>
          <div className={`px-3 py-2 ${isOutbound ? 'bg-green-50' : 'bg-white'}`}>
            <p className="text-[14px] font-semibold truncate text-gray-900">{name}</p>
            {address && <p className="text-[12px] text-gray-500 truncate mt-0.5">{address}</p>}
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
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${
            isOutbound ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
          }`}>
            <Check className="h-3.5 w-3.5" />
            {replyTitle}
          </div>
        )}
        {text && text !== replyTitle && <p className="text-[14.5px] leading-snug text-gray-800 mt-1">{text}</p>}
      </div>
    );
  }

  // Template button reply
  if (type === 'button') {
    const btn = payload.button || {};
    const btnText = btn.text || text;
    return (
      <div className="space-y-1">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${
          isOutbound ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
        }`}>
          <Check className="h-3.5 w-3.5" />
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
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${isOutbound ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isOutbound ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">Order placed</p>
          <p className="text-[12px] text-gray-500">{itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''}` : 'From catalog'}</p>
        </div>
      </div>
    );
  }

  // Default: plain text (with line breaks)
  const displayText = text || '';
  if (!displayText) return <p className="text-sm italic text-gray-400">Empty message</p>;
  return (
    <p className="text-[14.5px] leading-snug whitespace-pre-wrap text-gray-800 break-words">{displayText}</p>
  );
}

function UnifiedInbox() {
  const { get, post, delete: del } = useApi();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'facebook'>('all');
  const [inboxView, setInboxView] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [teamMembers, setTeamMembers] = useState<{user_id:string;name:string;is_self:boolean}[]>([]);
  const [assignMenuPhone, setAssignMenuPhone] = useState<string | null>(null);
  const [assigningPhone, setAssigningPhone] = useState<string | null>(null); // loading guard
  const [scoreFilter, setScoreFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const agentSseRef = useRef<EventSource | null>(null);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_leadMemory, setLeadMemory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_memoryExpanded, setMemoryExpanded] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState('');
  const [sendingTemplate, setSendingTemplate] = useState(false);
  // Team presence — track who's viewing this conversation
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null);
  const [assigningToMe, setAssigningToMe] = useState(false);
  const { user } = useAuthStore();
  const [templateDraft, setTemplateDraft] = useState<{ template: any; body: string; values: string[] } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const tplRef = useRef<HTMLDivElement>(null);
  // Emoji picker
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  // Media attach dialog
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image'|'document'|'video'>('image');
  const [sendingMedia, setSendingMedia] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  // Fetch leads once to map phone → name
  useEffect(() => {
    get('/api/leads?limit=200').then(r => {
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
    get(`/api/automation/inbox?view=${inboxView}`)
      .then(res => {
        const items: any[] = res.data?.items || [];
        const map = new Map<string, Contact>();
        // Load last-read timestamps from localStorage per contact
        const getLastRead = (channel: string, senderId: string): string => {
          return localStorage.getItem(`msg_read_${channel}_${senderId}`) || '';
        };

        items.forEach(item => {
          const key = `${item.channel}::${item.sender_id}`;
          const lastRead = getLastRead(item.channel, item.sender_id);
          // Only count as unread if message arrived AFTER user last opened this contact
          const isUnread = !lastRead || item.created_at > lastRead;

          if (!map.has(key)) {
            map.set(key, {
              sender_id: item.sender_id,
              sender_name: item.sender_name || item.sender_id,
              channel: item.channel,
              last_text: item.text || `[${item.message_type}]`,
              last_time: item.created_at,
              unread: isUnread ? 1 : 0,
              lead_score: item.lead_score || 'cold',
              assigned_to_user_id: item.assigned_to_user_id || null,
              assigned_to_name: item.assigned_to_name || null,
            });
          } else {
            const c = map.get(key)!;
            if (item.created_at > c.last_time) {
              c.last_text = item.text || `[${item.message_type}]`;
              c.last_time = item.created_at;
            }
            if (isUnread) c.unread++;
            // Keep hottest score
            if (item.lead_score === 'hot') c.lead_score = 'hot';
            else if (item.lead_score === 'warm' && c.lead_score !== 'hot') c.lead_score = 'warm';
          }
        });
        // AI Priority Queue: hot first, then warm, then cold, then by time
        const scoreOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
        setContacts(Array.from(map.values()).sort((a, b) => {
          const sa = scoreOrder[a.lead_score || 'cold'] ?? 2;
          const sb = scoreOrder[b.lead_score || 'cold'] ?? 2;
          if (sa !== sb) return sa - sb;
          return b.last_time.localeCompare(a.last_time);
        }));
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
    // Mark inbox as visited — sidebar badge will reset to 0 for messages before this time
    localStorage.setItem('inbox_last_visited', Date.now().toString());
    window.dispatchEvent(new CustomEvent('inbox-read'));
    loadInbox();
    const interval = setInterval(loadInbox, 10000);
    return () => clearInterval(interval);
  }, [inboxView]); // eslint-disable-line

  // Load team members for assignment
  useEffect(() => {
    get('/api/automation/inbox/team-members')
      .then(r => { if (r.data?.members) setTeamMembers(r.data.members); })
      .catch(() => { /* non-critical — team assignment optional */ });
  }, []); // eslint-disable-line

  // Load saved quick replies once
  useEffect(() => {
    get('/api/auto-replies/quick-replies')
      .then(r => {
        const list = r.data?.quick_replies || r.data?.items || (Array.isArray(r.data) ? r.data : []);
        setQuickReplies(list);
      })
      .catch(() => { /* non-critical — quick replies optional */ });
  }, []); // eslint-disable-line

  // Close quick reply / template / filter / emoji dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) setQrOpen(false);
      if (tplRef.current && !tplRef.current.contains(e.target as Node)) setTplOpen(false);
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) setFilterPanelOpen(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load APPROVED templates once
  useEffect(() => {
    get('/api/automation/whatsapp/templates').then(r => {
      const payload = r.data;
      const all = Array.isArray(payload?.templates)
        ? payload.templates
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
      setTemplates(all.filter((t: any) => String(t.status || '').toUpperCase() === 'APPROVED'));
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Agentic SSE — connect when contact selected, show typing indicator
  useEffect(() => {
    if (agentSseRef.current) { agentSseRef.current.close(); agentSseRef.current = null; }
    setAgentStatus(null);
    if (!selected) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      // Use withCredentials so auth-token cookie is sent — avoids JWT in URL/logs
      const sse = new EventSource(`${base}/api/analytics/stream/agentic?lead_id=${selected.sender_id}`, { withCredentials: true });
      sse.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.status === 'connected' || d.error) return;
          const toolLabel: Record<string, string> = {
            send_whatsapp_message: 'Sending message',
            send_whatsapp_buttons: 'Preparing buttons',
            send_catalog: 'Sending catalog',
            create_customer_payment_link: 'Creating payment link',
            done: 'Finishing up',
          };
          const label = toolLabel[d.tool] || `Step ${d.step}`;
          setAgentStatus(d.status === 'done' || d.status === 'complete' ? null : label);
        } catch { /* ignore parse errors */ }
      };
      sse.onerror = () => setAgentStatus(null);
      agentSseRef.current = sse;
    } catch { /* SSE not supported or Redis unavailable */ }
    return () => { agentSseRef.current?.close(); agentSseRef.current = null; };
  }, [selected?.sender_id]); // eslint-disable-line

  // Load lead profile when contact selected
  useEffect(() => {
    if (!selected) { setLeadProfile(null); return; }
    setProfileLoading(true);
    get(`/api/leads?phone=${encodeURIComponent(selected.sender_id)}&limit=1`)
      .then(r => {
        const leads = r.data?.leads || r.data || [];
        const lead = leads[0] || null;
        setLeadProfile(lead);
        if (lead?.id) {
          get(`/api/leads/${lead.id}/memory`)
            .then(mr => setLeadMemory(mr.data?.memory || []))
            .catch(() => setLeadMemory([]));
        } else {
          setLeadMemory([]);
        }
      })
      .catch(() => { setLeadProfile(null); setLeadMemory([]); })
      .finally(() => setProfileLoading(false));
  }, [selected?.sender_id]); // eslint-disable-line

  // Load lead assignment when contact selected
  useEffect(() => {
    if (!selected) { setAssignedAgent(null); return; }
    get(`/api/leads?phone=${encodeURIComponent(selected.sender_id)}&limit=1`)
      .then(r => {
        const lead = (r.data?.leads || r.data || [])[0];
        setAssignedAgent(lead?.assigned_to_name || lead?.assigned_to_email || null);
      })
      .catch(() => setAssignedAgent(null));
  }, [selected?.sender_id]); // eslint-disable-line

  const sendMedia = async () => {
    if (!selected || !mediaUrl.trim()) return;
    setSendingMedia(true);
    try {
      await post('/api/automation/outbound-messages', {
        recipient: selected.sender_id,
        channel: selected.channel,
        message_type: mediaType,
        // Both 'link' (Meta API format) and 'url' are supported — use link for WhatsApp Media Object spec
        payload: { [mediaType]: { link: mediaUrl.trim(), url: mediaUrl.trim() } },
      });
      setMediaOpen(false);
      setMediaUrl('');
      setMediaType('image');
      toast.success(`${mediaType === 'image' ? 'Image' : mediaType === 'document' ? 'Document' : 'Video'} sent`);
    } catch { toast.error('Failed to send media'); }
    finally { setSendingMedia(false); }
  };

  const assignToMe = async () => {
    if (!selected || !leadProfile?.id) return;
    setAssigningToMe(true);
    try {
      const { getApiClient } = await import('@/hooks/useApi');
      await getApiClient().patch(`/api/leads/${leadProfile.id}`, { assigned_to_user_id: user?.id });
      setAssignedAgent(user?.name || user?.email || 'You');
      toast.success('Conversation assigned to you');
    } catch { toast.error('Failed to assign'); }
    finally { setAssigningToMe(false); }
  };

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
      if (detail.includes('24-hour') || detail.includes('window closed') || detail.includes('template')) {
        toast.error('24h window closed — use an approved template to message this contact.');
        setTplOpen(true);
      } else if (detail.includes('paid plan') || detail.includes('upgrade')) {
        toast.error('Upgrade to STARTER plan to send live messages');
      } else {
        toast('Saved as draft — WhatsApp may not be connected', { icon: '📋' });
      }
    }
    finally { setSending(false); }
  };

  const sendTemplate = async (template: any, body: string, values: string[] = []) => {
    if (!selected) return;
    setSendingTemplate(true);
    try {
      await post('/api/automation/outbound-messages', {
        channel: selected.channel,
        recipient: selected.sender_id,
        message: body,
        msg_type: 'template',
        template_name: template.name,
        language_code: template.language || 'en_US',
        template_variables: values,
        send_mode: 'live',
      });
      toast.success(`Template "${template.name}" sent`);
      fetchThread(selected);
      setTemplateDraft(null);
    } catch {
      toast.error('Failed to send template');
    } finally {
      setSendingTemplate(false);
    }
  };

  const filtered = contacts
    .filter(c => filter === 'all' || c.channel === filter)
    .filter(c => scoreFilter === 'all' || (c.lead_score || 'cold') === scoreFilter)
    .filter(c => !unreadOnly || c.unread > 0)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (resolveContactName(c.sender_id) || c.sender_name || '').toLowerCase();
      return name.includes(q) || c.sender_id.includes(q) || c.last_text.toLowerCase().includes(q);
    });

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)] bg-gray-50 dark:bg-slate-900">
      {/* LEFT — Contacts panel */}
        <div className={`flex min-h-0 flex-col overflow-hidden border-r border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 ${selected ? 'hidden xl:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-gray-800 text-xl">Chats</h1>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
                  <MessageCircle className="h-5 w-5" />
                </button>
                {/* Filter button with active-indicator dot */}
                <div ref={filterPanelRef} className="relative">
                  <button
                    onClick={() => setFilterPanelOpen(o => !o)}
                    className={`relative p-2 rounded-full transition ${filterPanelOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="Filter chats"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                    {/* Active dot — shows when any filter is on */}
                    {(scoreFilter !== 'all' || unreadOnly) && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500 border-2 border-[#f0f2f5]" />
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {filterPanelOpen && (
                    <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl py-2 overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filter Chats</span>
                        {(scoreFilter !== 'all' || unreadOnly) && (
                          <button
                            onClick={() => { setScoreFilter('all'); setUnreadOnly(false); }}
                            className="text-[10px] font-semibold text-red-500 hover:text-red-700"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Lead Score section */}
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Lead Score</p>
                        <div className="space-y-1">
                          {([
                            { key: 'all',  label: 'All leads',  icon: '·', active: 'bg-gray-100 text-gray-800' },
                            { key: 'hot',  label: '🔥 Hot',     icon: '', active: 'bg-red-50 text-red-700' },
                            { key: 'warm', label: '☀️ Warm',    icon: '', active: 'bg-amber-50 text-amber-700' },
                            { key: 'cold', label: '❄️ Cold',    icon: '', active: 'bg-sky-50 text-sky-700' },
                          ] as const).map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setScoreFilter(opt.key)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                                scoreFilter === opt.key
                                  ? opt.active
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {scoreFilter === opt.key && (
                                <span className="text-xs">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gray-100 mx-4" />

                      {/* Unread toggle */}
                      <div className="px-4 py-3">
                        <button
                          onClick={() => setUnreadOnly(v => !v)}
                          role="switch"
                          aria-checked={unreadOnly}
                          aria-label="Show unread messages only"
                          className="w-full flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800 text-left">Unread only</p>
                            <p className="text-[11px] text-gray-400 text-left">Show only unread messages</p>
                          </div>
                          <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ml-3 ${unreadOnly ? 'bg-green-500' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${unreadOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Search */}
            <div className="relative flex items-center bg-white rounded-lg px-3 py-1.5 border-b-2 border-transparent focus-within:border-green-500 transition-colors shadow-sm">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full bg-transparent pl-3 pr-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Channel filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'whatsapp', 'instagram', 'facebook'] as const).map(ch => (
                <button key={ch} onClick={() => setFilter(ch)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all border ${
                    filter === ch
                      ? 'bg-green-100 border-green-200 text-green-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {ch === 'all' ? 'All' : <span className="flex items-center gap-1.5"><ChannelIcon channel={ch} size={14} /><span className="hidden lg:inline">{CHANNEL_BADGE[ch]?.label}</span></span>}
                </button>
              ))}
            </div>
            {/* Team inbox view tabs — only if team members exist */}
            {teamMembers.length > 1 && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-semibold mt-1">
                {(['all', 'mine', 'unassigned'] as const).map(v => (
                  <button key={v} onClick={() => setInboxView(v)}
                    className={`flex-1 py-1.5 transition ${inboxView === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {v === 'all' ? 'All Chats' : v === 'mine' ? 'My Chats' : 'Unassigned'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact rows */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="space-y-0 p-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-[72px] mx-2 my-1 rounded-lg bg-gray-100 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <p className="text-sm text-gray-500 text-center">No messages yet<br/>Connect WhatsApp to get started</p>
              </div>
            ) : filtered.map(c => {
              const badge = CHANNEL_BADGE[c.channel] || { emoji: '', label: c.channel, color: '' };
              const isSelected = selected?.sender_id === c.sender_id && selected?.channel === c.channel;
              return (
                <button key={`${c.channel}::${c.sender_id}`}
                  onClick={() => {
                    const readKey = `msg_read_${c.channel}_${c.sender_id}`;
                    const readVal = c.last_time || new Date().toISOString();
                    localStorage.setItem(readKey, readVal);
                    // CustomEvent works same-tab (StorageEvent only fires cross-tab)
                    window.dispatchEvent(new CustomEvent('inbox-read'));
                    setContacts(prev => prev.map(x => x.sender_id === c.sender_id && x.channel === c.channel ? { ...x, unread: 0 } : x));
                    setSelected(c);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all border-b border-gray-100 last:border-0 ${
                    isSelected ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-[#f5f6f6]'
                  }`}>
                  {/* Avatar */}
                  <div className="relative shrink-0 ml-1">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium shadow-sm ${
                      c.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                      c.channel === 'instagram' ? 'bg-pink-100 text-pink-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {c.sender_name?.[0]?.toUpperCase() || badge.emoji || <User className="h-6 w-6" />}
                    </div>
                    <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white shadow-sm"><ChannelIcon channel={c.channel} size={16} /></span>
                  </div>
                  <div className="min-w-0 flex-1 py-1 pr-2">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[16px] font-medium truncate text-gray-900">
                          {resolveContactName(c.sender_id) || c.sender_name}
                        </p>
                        {c.lead_score === 'hot' && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">🔥 HOT</span>}
                        {c.lead_score === 'warm' && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">☀️ WARM</span>}
                      </div>
                      <p className={`shrink-0 text-[12px] font-medium ${c.unread ? 'text-green-600' : 'text-gray-500'}`} title={c.last_time ? new Date(c.last_time + 'Z').toLocaleString() : ''}>
                        {timeAgo(c.last_time, 'short')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] text-gray-500 truncate">{c.last_text}</p>
                      {/* Only show unread count — clears when chat is opened */}
                      {c.unread > 0 && (
                        <span className="flex shrink-0 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">
                          {c.unread > 99 ? '99+' : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Assignment badge + assign button (team inbox) */}
                  {teamMembers.length > 1 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {(c as any).assigned_to_name ? `👤 ${(c as any).assigned_to_name}` : '— Unassigned'}
                      </span>
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setAssignMenuPhone(assignMenuPhone === c.sender_id ? null : c.sender_id); }}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          Assign
                        </button>
                        {assignMenuPhone === c.sender_id && (
                          <div className="absolute right-0 top-5 z-50 w-44 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                            <button
                              disabled={assigningPhone === c.sender_id}
                              onClick={async e => { e.stopPropagation(); if (assigningPhone) return; setAssigningPhone(c.sender_id); try { await post('/api/automation/inbox/assign', { phone: c.sender_id, assign_to: null }); setAssignMenuPhone(null); loadInbox(); } finally { setAssigningPhone(null); } }}
                              className="flex w-full items-center px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                              Unassign
                            </button>
                            {teamMembers.map(m => (
                              <button key={m.user_id}
                                disabled={assigningPhone === c.sender_id}
                                onClick={async e => { e.stopPropagation(); if (assigningPhone) return; setAssigningPhone(c.sender_id); try { await post('/api/automation/inbox/assign', { phone: c.sender_id, assign_to: m.user_id }); setAssignMenuPhone(null); loadInbox(); } finally { setAssigningPhone(null); } }}
                                className="flex w-full items-center px-3 py-2 text-xs text-gray-800 hover:bg-blue-50 disabled:opacity-40">
                                {m.is_self ? `🙋 ${m.name} (me)` : `👤 ${m.name}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Chat Thread + Lead Profile */}
        {selected ? (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-50 dark:bg-slate-900">
          <div className="flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-slate-900">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700 shrink-0 z-10" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <button onClick={() => setSelected(null)} className="xl:hidden flex items-center gap-1 p-2 rounded-full hover:bg-gray-200 text-gray-500 transition mr-1">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-medium shadow-sm ${
                selected.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                selected.channel === 'instagram' ? 'bg-pink-100 text-pink-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {(resolveContactName(selected.sender_id) || selected.sender_name)?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setProfileOpen(o => !o)}>
                <p className="text-[16px] font-medium text-gray-900 truncate">
                  {resolveContactName(selected.sender_id) || selected.sender_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 opacity-80 flex-wrap">
                  <ChannelIcon channel={selected.channel} size={12} />
                  <p className="text-[12px] text-gray-500 capitalize">{selected.channel}</p>
                  {assignedAgent ? (
                    <span className="text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                      👤 {assignedAgent}
                    </span>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); assignToMe(); }}
                      disabled={assigningToMe || !leadProfile?.id}
                      className="text-[11px] bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full transition disabled:opacity-40"
                    >
                      {assigningToMe ? '…' : '+ Assign to me'}
                    </button>
                  )}
                </div>
              </div>
              {/* Profile toggle */}
              <button
                onClick={() => setProfileOpen(o => !o)}
                title="Contact Info"
                className={`p-2.5 rounded-full transition ${profileOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'}`}
              >
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-full hover:bg-gray-200 text-gray-500 transition hidden sm:block">
                <Search className="h-5 w-5" />
              </button>
              {/* 3-dot menu */}
              <div className="relative">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                  className="p-2.5 rounded-full hover:bg-gray-200 text-gray-500 transition">
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[180px]">
                      {/* Export Chat */}
                      <button onClick={() => {
                        setMenuOpen(false);
                        if (!thread.length) { toast.error('No messages to export'); return; }
                        const contactName = resolveContactName(selected.sender_id) || selected.sender_name;
                        const lines = thread.map(m => {
                          const dir = m.direction === 'outbound' ? (m.is_automated ? '🤖 Bot' : '👤 You') : `👤 ${contactName}`;
                          const time = m.created_at ? new Date(m.created_at + 'Z').toLocaleString() : '';
                          const text = m.text || `[${m.message_type}]`;
                          return `[${time}] ${dir}: ${text}`;
                        });
                        const header = `Chat with ${contactName} (${selected.channel})\nExported: ${new Date().toLocaleString()}\n${'─'.repeat(50)}\n\n`;
                        const blob = new Blob([header + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `chat-${contactName.replace(/\s+/g,'_')}-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Chat exported');
                      }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Export Chat
                      </button>
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
                          const token = useAuthStore.getState().token;
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
            <div ref={chatBoxRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 relative bg-gray-50 dark:bg-slate-900">
              {threadLoading ? (
                <div className="flex justify-center pt-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : thread.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-70">
                  <div className="bg-[#d9fdd3] text-green-900 px-4 py-2 rounded-lg text-sm shadow-sm inline-flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Messages are end-to-end encrypted
                  </div>
                </div>
              ) : thread.map(msg => {
                const isOutbound = msg.direction === 'outbound';
                const isAutomated = !!(msg.is_automated);
                const isPureMedia = ['image','video','audio','voice','sticker','location','document'].includes(msg.message_type);
                return (
                <div key={msg.id} className={`flex flex-col w-full ${isOutbound ? 'items-end' : 'items-start'}`}>
                  {/* AI badge above automated outbound messages */}
                  {isAutomated && isOutbound && (
                    <div className="flex items-center gap-1 mb-0.5 mr-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        <Bot className="h-2.5 w-2.5" /> AI Auto-reply
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[60%]`}>
                  <div className={`w-full text-[14px] shadow-sm relative group border border-[#E5E7EB] ${
                    isOutbound
                      ? 'bg-[#EFF6FF] text-gray-900 rounded-2xl rounded-tr-sm'
                      : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm'
                  } ${isPureMedia ? 'p-1' : 'px-3 py-2'}`}>
                    {/* Tail svg (optional detail) */}
                    <div className={`absolute top-0 w-3 h-3 ${isOutbound ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white'}`}>
                      <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                        {isOutbound 
                          ? <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                          : <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />}
                      </svg>
                    </div>

                    <MessageContent msg={msg} isOutbound={isOutbound} />
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isPureMedia ? 'px-2 pb-1 absolute bottom-1 right-2 bg-black/20 rounded-full px-1.5 py-0.5' : ''}`}>
                      <span className={`text-[10px] ${isPureMedia ? 'text-white' : 'text-gray-500'}`}
                        title={msg.created_at ? new Date(msg.created_at + 'Z').toLocaleString() : ''}>
                        {timeAgo(msg.created_at, 'time')}
                      </span>
                      {isOutbound && !isPureMedia && <DeliveryTick status={msg.status} delivery_status={msg.delivery_status} isOutbound={isOutbound} />}
                    </div>
                  </div>
                  </div>
                </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}

            <div className="bg-white dark:bg-slate-800 border-t border-[#E5E7EB] dark:border-slate-700 px-4 py-3 shrink-0 relative">
              {/* 24-hour window compliance banner */}
              {selected && (() => {
                const win = getWindowStatus(selected.last_time, selected.channel);
                if (win.open) return null; // WhatsApp doesn't show a banner for open window, it's just normal
                return (
                  <div className="flex items-center gap-3 bg-amber-50 rounded-lg border border-amber-200 px-4 py-2.5 mb-3 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-amber-900">Active window closed</p>
                      <p className="text-[12px] text-amber-700 mt-0.5">
                        {Math.round(win.hoursAgo)}h since last message. Only approved templates can be sent to start a new 24h window.
                      </p>
                    </div>
                    <button onClick={() => { setTplOpen(true); setQrOpen(false); }}
                      className="shrink-0 text-[13px] font-bold text-white bg-amber-600 rounded-lg px-4 py-2 hover:bg-amber-700 transition shadow-sm">
                      Use Template
                    </button>
                  </div>
                );
              })()}
              
              {/* Agentic typing indicator — shows when AI is processing */}
              {agentStatus && (
                <div className="flex items-center gap-2 px-4 py-1.5 mb-1">
                  <div className="flex h-7 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm border border-gray-200">
                    <Bot className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                    <span className="text-xs font-medium text-indigo-600">{agentStatus}...</span>
                    <span className="flex gap-0.5">
                      {[0,1,2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Reply dropdown */}
              {qrOpen && (
                <div ref={qrRef} className="absolute bottom-full left-4 mb-2 z-20 w-80 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto py-2">
                  <div className="px-4 pb-2 border-b border-gray-100">
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Quick Replies</p>
                  </div>
                  {quickReplies.length === 0 ? (
                    <p className="text-[13px] text-gray-500 p-4">No quick replies saved. Add them in settings.</p>
                  ) : (
                    <div className="flex flex-col">
                      {quickReplies.map(qr => (
                        <button key={qr.id} onClick={() => { setReply(qr.message); setQrOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                          <span className="font-semibold text-gray-800 text-[14px]">{qr.title}</span>
                          <p className="text-[13px] text-gray-500 truncate mt-1">{qr.message}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-end gap-2">
                {/* Tools */}
                <div className="flex items-center gap-1 pb-1">
                  <button onClick={() => { setQrOpen(v => !v); setTplOpen(false); }} title="Quick Replies"
                    className="p-2.5 rounded-full text-gray-500 hover:bg-gray-200 transition">
                    <Zap className="h-6 w-6" />
                  </button>
                  <div className="relative" ref={tplRef}>
                    <button onClick={() => { setTplOpen(v => !v); setQrOpen(false); }} title="Send Template"
                      className="p-2.5 rounded-full text-gray-500 hover:bg-gray-200 transition">
                      <FileText className="h-6 w-6" />
                    </button>
                    {tplOpen && (
                      <div className="absolute bottom-12 left-0 z-30 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[400px]">
                        <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50 shrink-0">
                          <Search className="h-4 w-4 text-gray-400" />
                          <input autoFocus value={tplSearch} onChange={e => setTplSearch(e.target.value)}
                            placeholder="Search templates…"
                            className="flex-1 text-[13px] outline-none bg-transparent text-gray-800 placeholder-gray-400" />
                        </div>
                        <div className="flex-1 overflow-y-auto py-1">
                          {templates.filter(t => !tplSearch || t.name?.toLowerCase().includes(tplSearch.toLowerCase())).length === 0 ? (
                            <p className="text-[13px] text-gray-400 p-4 text-center">No approved templates</p>
                          ) : templates
                            .filter(t => !tplSearch || t.name?.toLowerCase().includes(tplSearch.toLowerCase()))
                            .map((t: any) => {
                              const body = t.components?.find((c: any) => c.type === 'BODY')?.text || t.body || '';
                              return (
                                <button key={t.id || t.name} onClick={async () => {
                                  setTplOpen(false);
                                  const count = templateVarCount(body);
                                  if (count > 0) {
                                    setTemplateDraft({ template: t, body, values: Array(count).fill('') });
                                  } else {
                                    await sendTemplate(t, body, []);
                                  }
                                }} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 group">
                                  <p className="text-[14px] font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{t.name}</p>
                                  <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{body}</p>
                                  <span className="text-[11px] font-medium text-gray-400 mt-2 block bg-gray-100 w-fit px-2 py-0.5 rounded">{t.category}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Emoji picker */}
                  <div ref={emojiRef} className="relative">
                    <button
                      onClick={() => setEmojiOpen(o => !o)}
                      className={`p-2.5 rounded-full transition ${emojiOpen ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}
                      title="Emoji"
                    >
                      <span className="text-xl leading-none">😊</span>
                    </button>
                    {emojiOpen && (
                      <div className="absolute bottom-12 left-0 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-72">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Emojis</p>
                        <div className="grid grid-cols-8 gap-1">
                          {['😊','😂','🙏','👍','❤️','🎉','🔥','✅','😍','🤝','💯','👏','😄','🙌','💪','⭐','🥳','😎','🤩','💰','📲','📢','🎯','✨','👋','😅','🤔','💬','📍','🚀','🛒','📦','💳','📝','🗓️','⏰'].map(e => (
                            <button
                              key={e}
                              onClick={() => { setReply(r => r + e); setEmojiOpen(false); }}
                              className="text-xl rounded-lg p-1 hover:bg-gray-100 transition leading-none"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Attach media */}
                  <button
                    onClick={() => setMediaOpen(true)}
                    className="p-2.5 rounded-full text-gray-500 hover:bg-gray-200 transition"
                    title="Send image, document or video"
                  >
                    <Paperclip className="h-6 w-6" />
                  </button>
                  {/* Media — hidden file inputs, one per type. Select = auto upload + auto send */}
                  {(['image','document','video'] as const).map(t => (
                    <input key={t} type="file" className="hidden"
                      ref={t === mediaType ? mediaFileRef : undefined}
                      accept={t==='image'?'image/jpeg,image/png,image/webp,image/gif':t==='document'?'application/pdf':'video/mp4,video/3gpp'}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selected) return;
                        setMediaUploading(true);
                        setMediaOpen(false);
                        toast('Sending ' + (t==='image'?'image':t==='document'?'document':'video') + '…', { icon: '📤' });
                        try {
                          // Step 1: upload
                          const fd = new FormData();
                          fd.append('file', file);
                          const tkn = useAuthStore.getState().token;
                          const base = process.env.NEXT_PUBLIC_API_URL || '';
                          const res = await fetch(`${base}/api/automation/upload-media-public`, {
                            method: 'POST',
                            headers: tkn ? { Authorization: `Bearer ${tkn}` } : {},
                            body: fd,
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.detail || 'Upload failed');
                          const url = data.public_url;
                          // Step 2: send immediately
                          await post('/api/automation/outbound-messages', {
                            recipient: selected.sender_id,
                            channel: selected.channel,
                            message_type: t,
                            payload: { [t]: { link: url, url } },
                          });
                          toast.success(`${t==='image'?'Image':t==='document'?'Document':'Video'} sent!`);
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to send');
                        } finally {
                          setMediaUploading(false);
                          setMediaUrl('');
                          if (e.target) e.target.value = '';
                        }
                      }}
                    />
                  ))}
                  {/* Media type picker — shows only when attachment icon clicked */}
                  {mediaOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 p-4" onClick={() => setMediaOpen(false)}>
                      <div className="w-full max-w-xs rounded-2xl bg-white shadow-2xl p-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-bold text-gray-700 mb-3 text-center">Select file type to send</p>
                        {mediaUploading ? (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                            <p className="text-sm text-gray-500">Uploading &amp; sending…</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {(['image','document','video'] as const).map(t => (
                              <button key={t} onClick={() => {
                                setMediaType(t);
                                // Open the file picker for this type
                                const inp = document.querySelector(`input[accept*="${t==='image'?'jpeg':t==='document'?'pdf':'mp4'}"]`) as HTMLInputElement;
                                inp?.click();
                                setMediaOpen(false);
                              }}
                                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 text-xs font-semibold text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition">
                                <span className="text-2xl">{t==='image'?'🖼️':t==='document'?'📄':'🎥'}</span>
                                {t==='image'?'Image':t==='document'?'Document':'Video'}
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={() => setMediaOpen(false)} className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 text-center">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {(() => {
                  const win = getWindowStatus(selected.last_time, selected.channel);
                  const blocked = !win.open && selected.channel === 'whatsapp';
                  return (
                    <div className="flex-1 bg-white rounded-xl border border-[#E5E7EB] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 flex items-end shadow-sm transition-all"
                      style={{borderRadius:'12px'}}>
                      <textarea
                        rows={1}
                        value={reply}
                        onChange={e => {
                          setReply(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!blocked && !sending && !sendingTemplate) sendReply();
                          }
                        }}
                        placeholder={blocked ? 'Window closed — use template' : 'Type a message'}
                        disabled={blocked}
                        className={`w-full max-h-[120px] min-h-[44px] bg-transparent px-4 py-3 text-[15px] resize-none focus:outline-none scrollbar-hide ${blocked ? 'text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg' : 'text-gray-800'}`}
                      />
                    </div>
                  );
                })()}

                {/* Send */}
                <div className="pb-1 pl-1">
                  <button
                    onClick={sendReply}
                    disabled={sending || sendingTemplate || !reply.trim() || (!getWindowStatus(selected?.last_time || '', selected?.channel || '').open && selected?.channel === 'whatsapp')}
                    aria-label="Send message"
                    className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-colors ${
                      reply.trim()
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}>
                    {sending || sendingTemplate ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {templateDraft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
                <div className="mb-4 px-5 pt-5 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">Fill template variables</p>
                  <p className="mt-1 text-xs text-gray-500">This Meta template has placeholders. Fill the values before sending it to the customer.</p>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 px-5 pb-2">
                  <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    {templateDraft.body}
                  </div>
                  <div className="space-y-2">
                    {templateDraft.values.map((value, idx) => (
                      <label key={idx} className="block">
                        <span className="text-xs font-semibold text-gray-700">{`{{${idx + 1}}}`}</span>
                        <input
                          value={value}
                          onChange={(e) => setTemplateDraft((draft) => draft ? {
                            ...draft,
                            values: draft.values.map((v, i) => i === idx ? e.target.value : v),
                          } : draft)}
                          placeholder={idx === 0 ? (resolveContactName(selected.sender_id) || selected.sender_name || 'Customer name') : `Value ${idx + 1}`}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2 px-5 pb-5 flex-shrink-0">
                  <Button variant="secondary" onClick={() => setTemplateDraft(null)} disabled={sendingTemplate}>Cancel</Button>
                  <Button
                    onClick={() => sendTemplate(templateDraft.template, templateDraft.body, templateDraft.values)}
                    disabled={sendingTemplate || templateDraft.values.some(v => !v.trim())}
                    className="min-w-[120px]"
                  >
                    {sendingTemplate ? 'Sending...' : 'Send Template'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* LEAD PROFILE SIDEBAR */}
          {profileOpen && (
            <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <span className="text-sm font-semibold text-gray-800">Contact Info</span>
                <button onClick={() => setProfileOpen(false)} className="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              {profileLoading ? (
                <div className="p-5 space-y-4">
                  <div className="h-24 w-24 rounded-full bg-gray-100 animate-pulse mx-auto" />
                  <div className="h-4 w-32 bg-gray-100 animate-pulse mx-auto" />
                  <div className="space-y-2 mt-8">
                    {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                </div>
              ) : leadProfile ? (
                <div className="p-0">
                  {/* Avatar + Name */}
                  <div className="flex flex-col items-center gap-3 py-8 px-5 border-b border-gray-100">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-4xl font-medium shadow-sm">
                      {leadProfile.name?.[0]?.toUpperCase() || <User className="h-12 w-12" />}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900 text-xl">{leadProfile.name || 'Unknown Contact'}</p>
                      <p className="text-sm text-gray-500 mt-1">{leadProfile.phone || selected.sender_id}</p>
                    </div>
                    <span className={`mt-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      leadProfile.status === 'hot' ? 'bg-red-100 text-red-700' :
                      leadProfile.status === 'warm' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{leadProfile.status || 'new'}</span>
                  </div>

                  <div className="px-5 py-6 border-b border-gray-100 space-y-5">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">AI Summary</p>
                      <div className="space-y-2.5 text-[14px] text-gray-800">
                        <p><span className="font-medium text-gray-500 w-16 inline-block">Intent:</span> {leadProfile.intent || leadProfile.ai_intent || leadProfile.tag || 'Needs review'}</p>
                        <p><span className="font-medium text-gray-500 w-16 inline-block">Priority:</span> {leadProfile.status || selected.lead_score || 'cold'}</p>
                        <p><span className="font-medium text-gray-500 w-16 inline-block">Next:</span> {leadProfile.status === 'hot' ? 'Call or send payment link' : 'Schedule follow-up'}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Contact Details</p>
                      {[
                        { label: 'Email', value: leadProfile.email, icon: <FileText className="h-4 w-4" /> },
                        { label: 'Source', value: leadProfile.source, icon: <MapPin className="h-4 w-4" /> },
                        { label: 'Owner', value: leadProfile.assigned_to, icon: <User className="h-4 w-4" /> },
                      ].filter(d => d.value).map(d => (
                        <div key={d.label} className="flex gap-3 items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                            {d.icon}
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-500 font-medium">{d.label}</p>
                            <p className="text-[14px] text-gray-900">{d.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    {leadProfile.tag && (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-700">
                            <Tag className="h-3 w-3 text-gray-400" />
                            {leadProfile.tag}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <a href="/dashboard/leads" className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 hover:border-red-100 transition">
                      <Trash2 className="h-4 w-4" /> Delete Contact
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
                  <User className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-[15px] font-medium text-gray-600">No profile found</p>
                  <p className="text-[13px] text-gray-400 mt-1">{selected.sender_id}</p>
                </div>
              )}
            </div>
          )}
          </div>
        ) : (
          <div className="hidden xl:flex min-h-0 flex-col items-center justify-center bg-[#f0f2f5] border-l border-gray-200">
            <div className="text-center max-w-md px-6 flex flex-col items-center">
              <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                <MessageCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-light text-gray-800 mb-3">WhatsApp Messages</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Send and receive customer messages through your connected WhatsApp Business account.<br/>
                Delivery, read status, templates, and the 24-hour reply window are tracked here.
              </p>
              <div className="mt-8 pt-8 border-t border-gray-300 w-full flex items-center justify-center gap-2 text-[13px] text-gray-400">
                <Zap className="h-4 w-4" /> End-to-end encrypted
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div style={{ height: 'calc(100dvh - 80px)' }} className="flex flex-col bg-white">
      <UnifiedInbox />
    </div>
  );
}
