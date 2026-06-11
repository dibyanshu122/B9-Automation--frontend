'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SIDEBAR_GROUPS } from '@/lib/constants';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import {
  Bell, Brain, FileText, MessageCircle, Code, Code2, BarChart3, CreditCard,
  Settings, X, Menu, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ChevronsLeft, ChevronsRight, LayoutDashboard,
  ShoppingCart, Send, Layout, Upload, ScrollText, Key, Megaphone,
  MessageSquare, Zap, Database, Building2, Layers, QrCode, FlaskConical,
  Bot, UserCog, UserX, Target, Filter, LogOut,
  Inbox, Reply,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from './button';
import { getDashboardBootstrap } from '@/lib/dashboard-bootstrap';

const ICONS = {
  Bell, LayoutDashboard, Brain, FileText, MessageCircle, Code, Code2, BarChart3,
  CreditCard, Settings, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ShoppingCart, Send, Layout, Upload, ScrollText,
  Key, Megaphone, MessageSquare, Zap, Database, Building2, Layers, QrCode,
  FlaskConical, Bot, UserCog, UserX, Target, Filter, Inbox, Reply,
};

// Dark sidebar
const BG = '#0F172A';

// Per-icon hover animation — each icon moves true to its meaning (see globals.css)
const ICON_ANIM: Record<string, string> = {
  Settings: 'icon-anim-spin',
  Bell: 'icon-anim-ring', MessageSquare: 'icon-anim-ring', MessageCircle: 'icon-anim-ring', Inbox: 'icon-anim-ring',
  Zap: 'icon-anim-zap', Workflow: 'icon-anim-zap',
  Upload: 'icon-anim-lift', BarChart3: 'icon-anim-lift', Layers: 'icon-anim-lift',
  Plug: 'icon-anim-wiggle', Bot: 'icon-anim-wiggle', FlaskConical: 'icon-anim-wiggle', Megaphone: 'icon-anim-wiggle', UserCog: 'icon-anim-wiggle',
  Brain: 'icon-anim-pulse', Target: 'icon-anim-pulse', QrCode: 'icon-anim-pulse', LayoutDashboard: 'icon-anim-pulse',
  ShoppingCart: 'icon-anim-nudge', CreditCard: 'icon-anim-nudge', Reply: 'icon-anim-nudge', Send: 'icon-anim-nudge', LogOut: 'icon-anim-nudge',
  UserX: 'icon-anim-shake',
  Key: 'icon-anim-turn',
  Rocket: 'icon-anim-rocket',
};
const iconAnim = (name?: string) => (name && ICON_ANIM[name]) || 'icon-anim-pop';

type TeamAccess = {
  role?: string;
  is_owner?: boolean;
  permissions?: string[];
};

const NAV_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/assistants': ['settings.manage', 'automations.manage'],
  '/dashboard/leads': ['leads.read_all', 'leads.read_assigned'],
  '/dashboard/campaigns': ['campaigns.manage', 'campaigns.draft'],
  '/dashboard/catalog': ['integrations.manage', 'campaigns.manage'],
  '/dashboard/qr-codes': ['campaigns.manage', 'campaigns.draft'],
  '/dashboard/imports': ['leads.write', 'leads.write_assigned'],
  '/dashboard/messages': ['inbox.read_all', 'inbox.read_assigned'],
  '/dashboard/handover': ['inbox.read_all', 'inbox.read_assigned'],
  '/dashboard/auto-replies': ['automations.manage', 'inbox.reply'],
  '/dashboard/opted-out': ['leads.read_all'],
  '/dashboard/tasks': ['tasks.manage_own', 'leads.write', 'leads.write_assigned'],
  '/dashboard/automations': ['automations.manage', 'automations.view'],
  '/dashboard/flows': ['flows.manage', 'flows.draft'],
  '/dashboard/templates': ['templates.manage', 'templates.draft'],
  '/dashboard/ab-testing': ['campaigns.manage'],
  '/dashboard/logs': ['automations.manage', 'automations.view'],
  '/dashboard/documents': ['dashboard.read'],
  '/dashboard/chat': ['dashboard.read'],
  '/dashboard/widgets': ['dashboard.read'],
  '/dashboard/analytics': ['analytics.read', 'dashboard.read'],
  '/dashboard/notifications': ['dashboard.read'],
  '/dashboard/team': ['team.manage', 'team.manage_agents'],
  '/dashboard/integrations': ['integrations.manage'],
  '/dashboard/api': ['api_keys.manage'],
  '/dashboard/billing': ['settings.manage'],
  '/dashboard/settings': ['settings.manage'],
  '/dashboard/launch': ['settings.manage', 'integrations.manage'],
};

function canSeeHref(access: TeamAccess | null, href?: string) {
  if (!href) return true;
  if (!access) return true;
  const perms = new Set(access.permissions || []);
  if (access.is_owner || access.role === 'owner' || perms.has('*')) return true;
  const required = NAV_PERMISSIONS[href];
  if (!required?.length) return true;
  return required.some((permission) => perms.has(permission));
}

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const run = () => {
      const token = useAuthStore.getState().token;
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      // Pass last-inbox-visit timestamp so only NEW messages are counted
      const since = localStorage.getItem('inbox_last_visited') || '';
      const url = since
        ? `${base}/api/automation/inbox/unread-count?since=${since}`
        : `${base}/api/automation/inbox/unread-count`;
      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => {
          setCount(data?.unread ?? 0);
        })
        .catch(() => {});
    };
    const initial = setTimeout(run, 1500);
    const t = setInterval(run, 30000);
    // inbox-read fires when user opens a chat OR visits the inbox page
    const onRead = () => { run(); };
    window.addEventListener('inbox-read', onRead);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
      window.removeEventListener('inbox-read', onRead);
    };
  }, []);
  return count;
}

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const {
    sidebarOpen, setSidebarOpen, toggleSidebar,
    sidebarPinned, toggleSidebarPinned,
    openGroups, toggleGroup,
  } = useUIStore();
  const unreadCount = useUnreadCount();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [teamAccess, setTeamAccess] = useState<TeamAccess | null>(null);
  const [accessLoaded, setAccessLoaded] = useState(true); // show sidebar immediately, load permissions in bg
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 80);
  };

  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); }, []);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (!token) { setAccessLoaded(true); return; }
    getDashboardBootstrap()
      .then((data) => data.team || null)
      .then((data) => { if (data) setTeamAccess(data); })
      .catch(() => {})
      .finally(() => setAccessLoaded(true));
  }, []);

  // Auto-open the group that contains the current active route
  useEffect(() => {
    if (!pathname) return;
    SIDEBAR_GROUPS.forEach((group) => {
      if (group.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        const { openGroups: og, toggleGroup: tg } = useUIStore.getState();
        if (!og.includes(group.id)) tg(group.id);
      }
    });
  }, [pathname]);

  const expanded = sidebarPinned || hovered;
  const visibleGroups = SIDEBAR_GROUPS.map((group) => {
    if (!group.children?.length) return canSeeHref(teamAccess, group.href) ? group : null;
    const children = group.children.filter((childItem) => canSeeHref(teamAccess, childItem.href));
    return children.length ? { ...group, children } : null;
  }).filter(Boolean) as typeof SIDEBAR_GROUPS;
  const mainGroups = visibleGroups.filter((group) => group.position !== 'bottom');
  const bottomGroups = visibleGroups.filter((group) => group.position === 'bottom');

  const isActive = (href: string): boolean =>
    pathname === href || (href !== '/dashboard' && (pathname?.startsWith(href) ?? false));
  const groupActive = (children?: any[]): boolean =>
    children?.some(c => isActive(c.href)) ?? false;

  const item = (active: boolean, mini = false) => clsx(
    'nav-item flex w-full items-center rounded-lg transition-all duration-150 text-sm font-medium',
    mini
      ? 'h-12 justify-center items-center px-0 py-0 gap-0'   // collapsed: h-12 = natural gap between icons
      : 'gap-3 px-3 py-3',                                    // expanded: py-3 + gap-3
    active
      ? mini
        ? 'bg-indigo-500/25 text-white'
        : 'bg-indigo-500/20 text-indigo-200 font-semibold'
      : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100'
  );
  const child = (active: boolean) => clsx(
    'nav-item flex w-full items-center gap-3 rounded-lg transition-all duration-150 text-sm font-medium',
    'px-3 py-2.5',                                            // tighter child items
    active
      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
      : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100'
  );

  const lbl = clsx(
    // Stable label animation: opacity+width, never clips layout during collapse
    'transition-all duration-200 whitespace-nowrap overflow-hidden leading-none select-none',
    expanded
      ? 'opacity-100 max-w-[180px] w-auto'
      : 'opacity-0 max-w-0 w-0 pointer-events-none'
  );

  return (
    <>
      {/* Mobile button */}
      <Button variant="ghost" size="sm" onClick={toggleSidebar}
        className="md:hidden fixed top-20 left-4 z-50">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar — 64px collapsed, 256px expanded */}
      <aside
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ backgroundColor: BG }}
        className={clsx(
          'hidden md:flex flex-col fixed left-0 top-16 z-40',
          'h-[calc(100vh-64px)]',
          'border-r border-white/10',
          'overflow-hidden',
          'transition-[width] duration-300 ease-in-out',
          expanded ? 'w-64' : 'w-16',
          expanded && 'shadow-[4px_0_20px_rgba(0,0,0,0.3)]',
        )}
      >
        <nav className={clsx(
          'flex-1 overflow-y-auto overflow-x-hidden py-4',
          expanded ? 'px-3' : 'px-1.5'
        )}>
          {/* Skeleton while permissions load — prevents forbidden-route click window */}
          {!accessLoaded && (
            <div className="space-y-1 px-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.06] animate-pulse" style={{ width: expanded ? '100%' : '40px' }} />
              ))}
            </div>
          )}
          {accessLoaded && mainGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const open = openGroups.includes(group.id);
            const hasKids = !!(group.children?.length);
            const gActive = groupActive(group.children);
            const singleActive = isActive(group.href || '');

            if (hasKids) {
              return (
                <div key={group.id} className="mb-3">
                  <button
                    title={!expanded ? group.name : undefined}
                    onClick={() => {
                      if (!expanded) toggleSidebarPinned();
                      toggleGroup(group.id);
                    }}
                    className={item(gActive, !expanded)}
                  >
                    <span className="relative shrink-0">
                      <Icon className={clsx('w-5 h-5 nav-icon', iconAnim(group.icon))} />
                      {/* Red dot when group has Messages child with unread — visible even collapsed */}
                      {!expanded && unreadCount > 0 && group.children?.some(c => c.href === '/dashboard/messages') && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-slate-950" />
                      )}
                    </span>
                    <span className={clsx(lbl, expanded && 'flex-1 text-left')}>{group.name}</span>
                    {expanded && (
                      <ChevronDown className={clsx(
                        'w-4 h-4 shrink-0 transition-transform duration-200',
                        open && 'rotate-180'
                      )} />
                    )}
                  </button>

                  {open && expanded && (
                    <div className="mt-0.5 ml-3 pl-3 space-y-0.5 border-l border-white/10">
                      {group.children?.map((c) => {
                        const CIcon = ICONS[c.icon as keyof typeof ICONS];
                        const cActive = isActive(c.href);
                        const isMsg = c.href === '/dashboard/messages';
                        return (
                          <Link key={c.href} href={c.href}
                            className={child(cActive)}
                            onClick={() => setSidebarOpen(false)}>
                            <CIcon className={clsx('w-4 h-4 shrink-0 nav-icon', iconAnim(c.icon))} />
                            <span className="flex-1 whitespace-nowrap overflow-hidden">{c.name}</span>
                            {c.badge && (
                              <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-200 ring-1 ring-amber-300/20">
                                {c.badge}
                              </span>
                            )}
                            {isMsg && unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-white shrink-0">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={group.id} className="mb-2">
                <Link href={group.href || '#'}
                  title={!expanded ? group.name : undefined}
                  className={item(singleActive, !expanded)}
                  onClick={() => setSidebarOpen(false)}>
                  <Icon className={clsx('w-5 h-5 shrink-0 nav-icon', iconAnim(group.icon))} />
                  <span className={lbl}>{group.name}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className={clsx(
          'shrink-0 border-t border-white/[0.08] py-2',
          expanded ? 'px-3' : 'px-1.5'
        )}>
          {bottomGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const a = isActive(group.href || '');
            return (
              <Link key={group.id} href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={item(a, !expanded)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className={clsx('w-5 h-5 shrink-0 nav-icon', iconAnim(group.icon))} />
                <span className={lbl}>{group.name}</span>
              </Link>
            );
          })}

          <div className={clsx('h-px bg-white/[0.08]', expanded ? 'my-1 mx-1' : 'my-1 mx-2')} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={!expanded ? 'Logout' : undefined}
            className={clsx(
              'nav-item flex w-full items-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 text-sm',
              expanded ? 'gap-3 px-3 py-2' : 'h-10 justify-center items-center px-0 py-0 gap-0'
            )}>
            <LogOut className="w-5 h-5 shrink-0 nav-icon icon-anim-nudge" />
            <span className={lbl}>Logout</span>
          </button>

          {/* Pin / Unpin */}
          <button onClick={toggleSidebarPinned}
            title={sidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
            className={clsx(
              'flex w-full items-center rounded-lg text-slate-500 transition-all hover:bg-white/10 hover:text-slate-300 text-sm',
              expanded ? 'gap-3 px-3 py-2' : 'h-10 justify-center items-center px-0 py-0 gap-0'
            )}>
            {sidebarPinned ? (
              <ChevronsLeft className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronsRight className="w-4 h-4 shrink-0" />
            )}
            <span className={lbl}>{sidebarPinned ? 'Collapse' : 'Pin open'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        style={{ backgroundColor: BG }}
        className={clsx(
          'md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-40',
          'border-r border-white/10 backdrop-blur-xl overflow-y-auto',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <Logo variant="dark" />
        </div>
        <nav className="p-3 space-y-0.5">
          {mainGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const open = openGroups.includes(group.id);
            const hasKids = !!(group.children?.length);
            const gActive = groupActive(group.children);
            const sActive = isActive(group.href || '');

            if (hasKids) {
              return (
                <div key={group.id}>
                  <button onClick={() => toggleGroup(group.id)} className={item(gActive)}>
                    <Icon className={clsx('w-5 h-5 shrink-0 nav-icon', iconAnim(group.icon))} />
                    <span className="flex-1 text-left">{group.name}</span>
                    <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="mt-0.5 ml-4 pl-3 space-y-0.5 border-l border-white/10">
                      {group.children?.map((c) => {
                        const CIcon = ICONS[c.icon as keyof typeof ICONS];
                        const cActive = isActive(c.href);
                        const isMsg = c.href === '/dashboard/messages';
                        return (
                          <Link key={c.href} href={c.href} className={child(cActive)}
                            onClick={() => setSidebarOpen(false)}>
                            <CIcon className={clsx('w-4 h-4 shrink-0 nav-icon', iconAnim(c.icon))} />
                            <span className="flex-1">{c.name}</span>
                            {c.badge && (
                              <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-200 ring-1 ring-amber-300/20">
                                {c.badge}
                              </span>
                            )}
                            {isMsg && unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-white">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={group.id} href={group.href || '#'} className={item(sActive)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className={clsx('w-5 h-5 shrink-0 nav-icon', iconAnim(group.icon))} />
                <span>{group.name}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-white/10" />
          {bottomGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            return (
              <Link key={group.id} href={group.href || '#'} className={item(isActive(group.href || ''))}
                onClick={() => setSidebarOpen(false)}>
                <Icon className={clsx('w-5 h-5 shrink-0 nav-icon', iconAnim(group.icon))} />
                <span>{group.name}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-white/10" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
