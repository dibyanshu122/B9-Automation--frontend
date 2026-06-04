'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { DarkModeToggle } from './dark-mode-toggle';
import { useApi } from '@/hooks/useApi';
import { Button } from './button';
import Link from 'next/link';
import { Bell, LogOut, Settings, Menu, Workflow, Users, MessageCircle, X, Building2, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
  const diff = Math.max(0, Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'automation_run') return <Workflow className="h-3.5 w-3.5 text-violet-400" />;
  if (type === 'new_lead') return <Users className="h-3.5 w-3.5 text-blue-400" />;
  return <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />;
}

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { get, post } = useApi();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Business Profile panel state
  const [showBizProfile, setShowBizProfile] = useState(false);
  const [bpLoading, setBpLoading] = useState(false);
  const [bpSaving, setBpSaving] = useState(false);
  const [bpForm, setBpForm] = useState({
    business_name: '', business_type: '', industry: '', services: '',
    target_audience: '', primary_goal: '', website_url: '', whatsapp_number: '',
    instagram_handle: '', tone: 'friendly',
    // WhatsApp Business Profile fields
    wa_about: '', wa_address: '', wa_email: '', wa_websites: '',
    wa_description: '', wa_vertical: '',
  });

  const openBizProfile = () => {
    setShowUserMenu(false);
    setShowBizProfile(true);
    if (bpLoading) return;
    setBpLoading(true);
    Promise.allSettled([
      get('/api/automation/business-profile').catch(() => ({ data: null })),
      get('/api/automation/whatsapp/business-profile').catch(() => ({ data: null })),
    ]).then(([b9Res, waRes]) => {
      const b9 = (b9Res.status === 'fulfilled' ? b9Res.value?.data : null) || {};
      const wa = ((waRes.status === 'fulfilled' ? waRes.value?.data?.profile : null) || {});
      setBpForm({
        business_name: b9.business_name || '',
        business_type: b9.business_type || '',
        industry: b9.industry || '',
        services: b9.services || '',
        target_audience: b9.target_audience || '',
        primary_goal: b9.primary_goal || '',
        website_url: b9.website_url || '',
        whatsapp_number: b9.whatsapp_number || '',
        instagram_handle: b9.instagram_handle || '',
        tone: b9.tone || 'friendly',
        wa_about: wa.about || '',
        wa_address: wa.address || '',
        wa_email: wa.email || '',
        wa_websites: (wa.websites || []).join(', '),
        wa_description: wa.description || '',
        wa_vertical: wa.vertical || '',
      });
    }).finally(() => setBpLoading(false));
  };

  const saveBizProfile = async () => {
    setBpSaving(true);
    try {
      await post('/api/automation/business-profile', {
        business_name: bpForm.business_name,
        business_type: bpForm.business_type,
        industry: bpForm.industry,
        services: bpForm.services,
        target_audience: bpForm.target_audience,
        primary_goal: bpForm.primary_goal,
        website_url: bpForm.website_url,
        whatsapp_number: bpForm.whatsapp_number,
        instagram_handle: bpForm.instagram_handle,
        tone: bpForm.tone,
      });
      // Save WA profile fields only if any filled
      if (bpForm.wa_about || bpForm.wa_address || bpForm.wa_email || bpForm.wa_websites || bpForm.wa_description) {
        await post('/api/automation/whatsapp/business-profile', {
          about: bpForm.wa_about,
          address: bpForm.wa_address,
          email: bpForm.wa_email,
          websites: bpForm.wa_websites.split(',').map((s: string) => s.trim()).filter(Boolean),
          description: bpForm.wa_description,
          vertical: bpForm.wa_vertical,
        }).catch(() => {});
      }
      setShowBizProfile(false);
    } catch {
      // toast not available here — use alert as fallback
      alert('Failed to save profile. Please try again.');
    } finally {
      setBpSaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      get('/api/automation/notifications')
        .then((res) => {
          const events: any[] = res.data?.events || [];
          setNotifications(events);
          // Count only events NEWER than last time user opened bell
          const lastSeen = parseInt(localStorage.getItem(`notif_last_seen_${user.id}`) || '0');
          const newCount = events.filter(e => {
            const t = e.created_at ? new Date(e.created_at + 'Z').getTime() : 0;
            return t > lastSeen;
          }).length;
          setUnreadCount(newCount);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    // Plan-based fallback — matches backend plans.py exactly
    const PLAN_QUERY_LIMITS: Record<string, number> = {
      FREE: 30, STARTER: 1000, GROWTH: 5000, PRO: 20000, BUSINESS: 50000,
    };
    const planDefault = PLAN_QUERY_LIMITS[(user.plan || 'FREE').toUpperCase()] ?? 500;

    const fetchCredits = () => {
      get('/api/quota/status')
        .then((res) => {
          const d = res.data || {};
          const used = Number(d.queries_used) || 0;
          const limit = Number(d.queries_limit) || planDefault; // API limit wins; fallback to plan default
          const remaining = limit - used;
          setAiCredits(Number.isFinite(remaining) ? Math.max(0, remaining) : planDefault);
        })
        .catch(() => {});
    };
    fetchCredits();
    const interval = setInterval(fetchCredits, 300000); // every 5 min
    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowNotifDropdown(false); setShowUserMenu(false); }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const openNotifications = () => {
    setShowNotifDropdown(true);
    // Save "last seen" timestamp — future notifications after this won't be unread
    if (user?.id && typeof window !== 'undefined') {
      localStorage.setItem(`notif_last_seen_${user.id}`, Date.now().toString());
    }
    setUnreadCount(0);
    get('/api/automation/notifications')
      .then((res) => {
        setNotifications(res.data?.events || []);
      })
      .catch(() => {});
  };

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 backdrop-blur-2xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/brand-logo.svg"
              alt="B9 Automation logo"
              width={36}
              height={36}
              className="shrink-0"
              priority
            />
            <div className="hidden sm:block leading-none select-none">
              {/* B9 Automation — dono words pe full premium gradient */}
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Inter', ui-sans-serif, system-ui, sans-serif",
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  background: 'linear-gradient(125deg, #00F2FE 0%, #a78bfa 45%, #7C3AED 75%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                B9 Automation
              </p>
              <p className="mt-[3px] text-[9.5px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                WhatsApp AI Platform
              </p>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* AI Credit Counter Chip */}
                {aiCredits !== null && (
                  <Link
                    href="/dashboard/billing"
                    title={`${aiCredits} AI replies remaining this month`}
                    className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition hover:opacity-80 ${
                      aiCredits < 20
                        ? 'border-red-500/40 bg-red-500/10 text-red-400'
                        : aiCredits < 100
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${aiCredits < 20 ? 'bg-red-400 animate-pulse' : aiCredits < 100 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                    {aiCredits.toLocaleString()} AI replies
                    {aiCredits < 100 && <span className="ml-1 underline">Buy more</span>}
                  </Link>
                )}

                {/* Dark mode toggle */}
                <DarkModeToggle />

                {/* Notification Bell with Dropdown */}
                <div ref={notifRef} className="relative hidden sm:block">
                  <button
                    onClick={() => {
                      if (showNotifDropdown) {
                        setShowNotifDropdown(false);
                      } else {
                        openNotifications();
                      }
                    }}
                    aria-label="Notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80 flex flex-col" style={{ zIndex: 9999, maxHeight: '420px' }}>
                      {/* Header — fixed, doesn't scroll */}
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 shrink-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Notifications</p>
                          {notifications.length > 0 && (
                            <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                              {notifications.length}
                            </span>
                          )}
                        </div>
                        <button onClick={() => setShowNotifDropdown(false)} className="text-slate-600 hover:text-slate-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Scrollable notification list */}
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-600">No notifications yet</p>
                      ) : (
                        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
                          {notifications.map((n) => (
                            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                                <NotifIcon type={n.type} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-200 leading-snug">{n.title}</p>
                                {n.body && <p className="mt-0.5 text-[11px] text-slate-500 leading-snug line-clamp-2">{n.body}</p>}
                              </div>
                              <p className="shrink-0 text-[10px] text-slate-600 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer — fixed, doesn't scroll */}
                      <div className="border-t border-white/10 px-4 py-2.5 shrink-0">
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition"
                        >
                          View all on Notifications page →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop User Menu */}
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {user.email}
                  </span>
                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-white flex items-center justify-center shadow-sm font-bold text-sm"
                    >
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </button>
                    {showUserMenu && (
                      <div
                        className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60"
                        style={{ zIndex: 9999 }}
                      >
                        <div className="border-b border-white/10 px-4 py-2.5">
                          <p className="text-xs font-semibold text-slate-300 truncate">{user.name || user.email}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={openBizProfile}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
                        >
                          <Building2 className="w-4 h-4 shrink-0 text-cyan-400" />
                          Business Profile
                        </button>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
                        >
                          <Settings className="w-4 h-4 shrink-0" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* ── Business Profile Slide-Over Panel ── */}
    {showBizProfile && (
      <div className="fixed inset-0 z-[9999] flex">
        {/* Backdrop */}
        <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowBizProfile(false)} />
        {/* Panel */}
        <div className="w-full max-w-md bg-slate-950 border-l border-white/10 flex flex-col h-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Building2 className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Business Profile</p>
                <p className="text-[10px] text-slate-500">Visible to your customers on WhatsApp &amp; AI bot</p>
              </div>
            </div>
            <button onClick={() => setShowBizProfile(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {bpLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                {/* B9 Business Info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Business Information</p>
                  <div className="space-y-3">
                    {[
                      { key: 'business_name', label: 'Business Name', placeholder: 'Your company name' },
                      { key: 'business_type', label: 'Business Type', placeholder: 'e.g. Coaching, Real Estate, D2C' },
                      { key: 'industry', label: 'Industry', placeholder: 'e.g. Education, Healthcare, Retail' },
                      { key: 'services', label: 'Services / Products', placeholder: 'What do you sell or offer?' },
                      { key: 'target_audience', label: 'Target Audience', placeholder: 'Who are your customers?' },
                      { key: 'primary_goal', label: 'Primary Goal', placeholder: 'e.g. Generate leads, Book appointments' },
                      { key: 'website_url', label: 'Website', placeholder: 'https://yourbusiness.com' },
                      { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '+91 XXXXX XXXXX' },
                      { key: 'instagram_handle', label: 'Instagram Handle', placeholder: '@yourbusiness' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">{f.label}</label>
                        <input
                          value={(bpForm as any)[f.key]}
                          onChange={e => setBpForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Communication Tone</label>
                      <select
                        value={bpForm.tone}
                        onChange={e => setBpForm(p => ({ ...p, tone: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                      >
                        {['friendly', 'professional', 'casual', 'formal'].map(t => (
                          <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Business Profile */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">WhatsApp Business Profile</p>
                  <p className="text-[10px] text-slate-500 mb-3">Shown on your WhatsApp Business number profile page</p>
                  <div className="space-y-3">
                    {[
                      { key: 'wa_about', label: 'About (max 139 chars)', placeholder: 'Short bio visible on WA profile' },
                      { key: 'wa_address', label: 'Address', placeholder: '123 Business Park, Mumbai' },
                      { key: 'wa_email', label: 'Support Email', placeholder: 'support@yourbusiness.com' },
                      { key: 'wa_websites', label: 'Website URLs (comma-separated)', placeholder: 'https://yourbusiness.com' },
                      { key: 'wa_vertical', label: 'Business Category', placeholder: 'RETAIL / HEALTH / EDUCATION / BEAUTY…' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">{f.label}</label>
                        <input
                          value={(bpForm as any)[f.key]}
                          onChange={e => setBpForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Description</label>
                      <textarea
                        value={bpForm.wa_description}
                        onChange={e => setBpForm(p => ({ ...p, wa_description: e.target.value }))}
                        placeholder="Detailed description of your business"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/40"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!bpLoading && (
            <div className="shrink-0 border-t border-white/10 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowBizProfile(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition"
              >
                Cancel
              </button>
              <button
                onClick={saveBizProfile}
                disabled={bpSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50 transition"
              >
                {bpSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {bpSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
};
