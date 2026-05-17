'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useApi } from '@/hooks/useApi';
import { Button } from './button';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, LogOut, Settings, Menu, Workflow, Users, MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
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
  const { get } = useApi();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [aiLimit, setAiLimit] = useState<number>(500);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      get('/api/automation/notifications')
        .then((res) => {
          setUnreadCount(res.data?.unread_count || 0);
          setNotifications((res.data?.events || []).slice(0, 5));
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    // Plan-based fallback so the credit chip never shows wrong limit
    const PLAN_QUERY_LIMITS: Record<string, number> = {
      FREE: 30, STARTER: 500, GROWTH: 1200, PRO: 2500, BUSINESS: 7500,
    };
    const planDefault = PLAN_QUERY_LIMITS[(user.plan || 'FREE').toUpperCase()] ?? 500;

    const fetchCredits = () => {
      get('/api/quota/status')
        .then((res) => {
          const d = res.data || {};
          const used = d.queries_used ?? 0;
          const limit = d.queries_limit || planDefault; // API limit wins; fallback to plan default
          setAiCredits(Math.max(0, limit - used));
          setAiLimit(limit);
        })
        .catch(() => {});
    };
    fetchCredits();
    const interval = setInterval(fetchCredits, 300000); // every 5 min
    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const openNotifications = () => {
    setShowNotifDropdown(true);
    setUnreadCount(0);
    get('/api/automation/notifications')
      .then((res) => {
        setNotifications((res.data?.events || []).slice(0, 5));
      })
      .catch(() => {});
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 backdrop-blur-2xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-white shadow-lg shadow-cyan-500/10">
              <Image
                src="/b9-mark-logo.jpg"
                alt="B9 Automation logo"
                width={140}
                height={114}
                className="h-8 w-8 rounded-full object-contain"
                priority
              />
            </span>
            <div className="hidden sm:block leading-tight">
              <p className="bg-gradient-to-r from-blue-200 via-cyan-100 to-sky-300 bg-clip-text text-lg font-black tracking-tight text-transparent">
                B9 Automation
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Business AI OS</p>
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
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80" style={{ zIndex: 9999 }}>
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Notifications</p>
                        <button onClick={() => setShowNotifDropdown(false)} className="text-slate-600 hover:text-slate-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-600">No notifications yet</p>
                      ) : (
                        <div className="divide-y divide-white/[0.04]">
                          {notifications.map((n) => (
                            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03]">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                                <NotifIcon type={n.type} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-200">{n.title}</p>
                                {n.body && <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.body}</p>}
                              </div>
                              <p className="shrink-0 text-[10px] text-slate-600">{timeAgo(n.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-white/10 px-4 py-2">
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-xs font-semibold text-primary-400 hover:text-primary-300"
                        >
                          View all notifications →
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
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-white flex items-center justify-center shadow-sm"
                    >
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </button>
                    {showUserMenu && (
                      <div className="b9-glass absolute right-0 top-full mt-2 overflow-hidden rounded-lg">
                        <Link
                          href="/dashboard/settings"
                          className="block px-4 py-2 text-slate-200 hover:bg-white/10"
                        >
                          <Settings className="w-4 h-4 inline mr-2" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-slate-200 hover:bg-white/10"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
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
  );
};
