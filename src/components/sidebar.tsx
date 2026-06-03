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
  Bot, UserCog, UserX, Target, Filter, LogOut, Image as ImageIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from './button';
import { getDashboardBootstrap } from '@/lib/dashboard-bootstrap';

const ICONS = {
  Bell, LayoutDashboard, Brain, FileText, MessageCircle, Code, Code2, BarChart3,
  CreditCard, Settings, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ShoppingCart, Send, Layout, Upload, ScrollText,
  Key, Megaphone, MessageSquare, Zap, Database, Building2, Layers, QrCode,
  FlaskConical, Bot, UserCog, UserX, Target, Filter, Image: ImageIcon,
};

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
      fetch(`${base}/api/automation/inbox?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => {
          const items: any[] = data?.items || [];
          const seen = new Map<string, string>();
          items.forEach((i: any) => {
            if (!i.created_at) return;
            const key = `${i.channel}::${i.sender_id}`;
            const existing = seen.get(key);
            if (!existing || i.created_at > existing) seen.set(key, i.created_at);
          });
          let unread = 0;
          seen.forEach((latestMsgTime, key) => {
            const [channel, senderId] = key.split('::');
            const lastRead = typeof window !== 'undefined'
              ? localStorage.getItem(`msg_read_${channel}_${senderId}`) || ''
              : '';
            if (!lastRead || latestMsgTime > lastRead) unread++;
          });
          setCount(Math.min(unread, 99));
        })
        .catch(() => {});
    };
    const initial = setTimeout(run, 1500);
    const t = setInterval(run, 30000);
    const onRead = () => run();
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
    if (!token) return;
    getDashboardBootstrap()
      .then((data) => data.team || null)
      .then((data) => { if (data) setTeamAccess(data); })
      .catch(() => {});
  }, []);

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

  // ── Premium light item style ──────────────────────────────────────────────
  const item = (active: boolean, mini = false) => clsx(
    'flex w-full items-center rounded-lg transition-all duration-150 text-sm font-medium select-none',
    mini
      ? 'h-10 justify-center px-0 py-0'               // collapsed: icon-only centered
      : 'gap-2 px-3 py-2',                             // expanded: icon + label
    active
      ? 'bg-blue-50 text-blue-700 font-semibold'       // clean blue accent
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  );

  const child = (active: boolean) => clsx(
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
    active
      ? 'bg-blue-50 text-blue-700 font-semibold'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
  );

  // Label: visible when expanded, hidden (zero-width) when collapsed.
  const lbl = clsx(
    'transition-all duration-200 whitespace-nowrap overflow-hidden leading-none',
    expanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0 pointer-events-none'
  );

  return (
    <>
      {/* Mobile toggle button */}
      <Button variant="ghost" size="sm" onClick={toggleSidebar}
        className="md:hidden fixed top-20 left-4 z-50">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={clsx(
          'hidden md:flex flex-col fixed left-0 top-16 z-40',
          'h-[calc(100vh-64px)]',
          'bg-white border-r border-gray-200',          // light bg, 1px border
          'overflow-hidden',
          'transition-all duration-300 ease-in-out',    // smooth all-props transition
          expanded ? 'w-64' : 'w-16',                  // 64 collapsed / 256 expanded
          expanded && 'shadow-[2px_0_12px_rgba(0,0,0,0.06)]',
        )}
      >
        {/* ── Main nav ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
          {mainGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const open = openGroups.includes(group.id);
            const hasKids = !!(group.children?.length);
            const gActive = groupActive(group.children);
            const singleActive = isActive(group.href || '');

            if (hasKids) {
              return (
                <div key={group.id}>
                  <button
                    title={!expanded ? group.name : undefined}
                    onClick={() => {
                      if (!expanded) toggleSidebarPinned();
                      toggleGroup(group.id);
                    }}
                    className={item(gActive, !expanded)}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                    <span className={clsx(lbl, 'flex-1 text-left')}>{group.name}</span>
                    <ChevronDown className={clsx(
                      'w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200',
                      open && 'rotate-180',
                      expanded ? 'opacity-100' : 'opacity-0 w-0'
                    )} />
                  </button>

                  {open && expanded && (
                    <div className="mt-0.5 ml-3 pl-3 space-y-0.5 border-l border-gray-200">
                      {group.children?.map((c) => {
                        const CIcon = ICONS[c.icon as keyof typeof ICONS];
                        const cActive = isActive(c.href);
                        const isMsg = c.href === '/dashboard/messages';
                        return (
                          <Link key={c.href} href={c.href}
                            className={child(cActive)}
                            onClick={() => setSidebarOpen(false)}>
                            <CIcon className="w-4 h-4 shrink-0 text-gray-400" />
                            <span className="flex-1 whitespace-nowrap overflow-hidden text-[13px]">{c.name}</span>
                            {c.badge && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                                {c.badge}
                              </span>
                            )}
                            {isMsg && unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white shrink-0">
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
              <Link key={group.id} href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={item(singleActive, !expanded)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                <span className={lbl}>{group.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom section: anchored to bottom with mt-auto ───────────── */}
        <div className="mt-auto shrink-0 border-t border-gray-100 py-2 px-2 space-y-0.5">
          {bottomGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const a = isActive(group.href || '');
            return (
              <Link key={group.id} href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={item(a, !expanded)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                <span className={lbl}>{group.name}</span>
              </Link>
            );
          })}

          <div className={clsx('h-px bg-gray-100', expanded ? 'my-1' : 'my-1 mx-2')} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={!expanded ? 'Logout' : undefined}
            className={clsx(
              'flex w-full items-center rounded-lg text-gray-400 transition-all duration-150 text-sm hover:bg-red-50 hover:text-red-600',
              expanded ? 'gap-2 px-3 py-2' : 'h-10 justify-center px-0 py-0'
            )}>
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={lbl}>Logout</span>
          </button>

          {/* Pin / Collapse toggle */}
          <button onClick={toggleSidebarPinned}
            title={sidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
            className={clsx(
              'flex w-full items-center rounded-lg text-gray-400 transition-all duration-150 text-sm hover:bg-gray-100 hover:text-gray-700',
              expanded ? 'gap-2 px-3 py-2' : 'h-10 justify-center px-0 py-0'
            )}>
            {sidebarPinned
              ? <ChevronsLeft className="w-4 h-4 shrink-0" />
              : <ChevronsRight className="w-4 h-4 shrink-0" />
            }
            <span className={lbl}>{sidebarPinned ? 'Collapse' : 'Pin open'}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar (slide-in overlay) ───────────────────────────── */}
      <aside
        className={clsx(
          'md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-40',
          'bg-white border-r border-gray-200 overflow-y-auto',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-gray-100 px-4 py-4">
          <Logo variant="light" />
        </div>
        <nav className="p-2 space-y-0.5">
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
                    <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                    <span className="flex-1 text-left">{group.name}</span>
                    <ChevronDown className={clsx('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="mt-0.5 ml-3 pl-3 space-y-0.5 border-l border-gray-200">
                      {group.children?.map((c) => {
                        const CIcon = ICONS[c.icon as keyof typeof ICONS];
                        const cActive = isActive(c.href);
                        const isMsg = c.href === '/dashboard/messages';
                        return (
                          <Link key={c.href} href={c.href} className={child(cActive)}
                            onClick={() => setSidebarOpen(false)}>
                            <CIcon className="w-4 h-4 shrink-0 text-gray-400" />
                            <span className="flex-1 text-[13px]">{c.name}</span>
                            {c.badge && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                                {c.badge}
                              </span>
                            )}
                            {isMsg && unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
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
                <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                <span>{group.name}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-gray-100" />
          {bottomGroups.map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            return (
              <Link key={group.id} href={group.href || '#'} className={item(isActive(group.href || ''))}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                <span>{group.name}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-gray-100" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
