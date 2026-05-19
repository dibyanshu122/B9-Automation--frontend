'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SIDEBAR_GROUPS } from '@/lib/constants';
import { useUIStore } from '@/store/uiStore';
import { Logo } from '@/components/logo';
import {
  Bell,
  Brain,
  FileText,
  MessageCircle,
  Code,
  BarChart3,
  CreditCard,
  Settings,
  X,
  Menu,
  Briefcase,
  CheckSquare,
  Users,
  Workflow,
  Plug,
  Rocket,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ShoppingCart,
  Send,
  Layout,
  Upload,
  ScrollText,
  Key,
  Megaphone,
  MessageSquare,
  Zap,
  Database,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from './button';

const ICONS = {
  Bell, LayoutDashboard, Brain, FileText, MessageCircle, Code, BarChart3,
  CreditCard, Settings, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ShoppingCart, Send, Layout, Upload, ScrollText,
  Key, Megaphone, MessageSquare, Zap, Database, Building2,
};

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchCount = () => {
      const token = localStorage.getItem('token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${base}/api/automation/inbox`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => {
          const items: any[] = data?.items || [];
          const cutoff = Date.now() - 86400000;
          const unread = items.filter(
            (i: any) => i.direction === 'inbound' && new Date(i.created_at + 'Z').getTime() > cutoff
          ).length;
          setCount(Math.min(unread, 99));
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

export const Sidebar = () => {
  const pathname = usePathname();
  const {
    sidebarOpen, setSidebarOpen, toggleSidebar,
    sidebarPinned, toggleSidebarPinned,
    openGroups, toggleGroup,
  } = useUIStore();
  const unreadCount = useUnreadCount();

  // JS-based hover state — much more reliable than pure CSS group-hover
  const [hovered, setHovered] = useState(false);
  const expanded = sidebarPinned || hovered;

  const isPathActive = (href: string): boolean =>
    pathname === href || (href !== '/dashboard' && (pathname?.startsWith(href) ?? false));
  const isGroupChildActive = (children?: any[]): boolean =>
    children?.some((child) => isPathActive(child.href)) ?? false;

  // Shared label style
  const labelCls = clsx(
    'text-sm whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden',
    expanded ? 'opacity-100 max-w-[180px] ml-0' : 'opacity-0 max-w-0'
  );
  const chevronCls = clsx(
    'w-4 h-4 shrink-0 transition-all duration-200',
    expanded ? 'opacity-100' : 'opacity-0 w-0'
  );

  // Shared nav item style
  const itemCls = (active: boolean) => clsx(
    'flex w-full items-center rounded-xl px-3 py-2.5 transition-all duration-150 gap-3',
    active
      ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/20'
      : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
  );

  const childItemCls = (active: boolean) => clsx(
    'flex w-full items-center rounded-lg px-3 py-2 transition-all duration-150 gap-3',
    active
      ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/20'
      : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
  );

  return (
    <>
      {/* ── Mobile toggle button ─────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="md:hidden fixed top-20 left-4 z-50"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── DESKTOP SIDEBAR ─ Hover-to-Expand ────────────────────────────── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={clsx(
          'hidden md:flex flex-col',
          'fixed left-0 top-16 h-[calc(100vh-64px)] z-40',
          'bg-slate-950/98 backdrop-blur-2xl border-r border-white/10',
          'transition-[width] duration-300 ease-in-out',
          // Width transitions via JS state
          expanded ? 'w-72 shadow-2xl shadow-black/40' : 'w-16',
        )}
      >
        {/* Logo */}
        <div className="flex h-[61px] shrink-0 items-center border-b border-white/10 px-3">
          {expanded ? (
            <div className="overflow-hidden transition-all duration-200">
              <Logo variant="dark" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 mx-auto">
              <span className="text-cyan-400 font-black text-sm">B9</span>
            </div>
          )}
        </div>

        {/* Nav scroll area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {/* Main items (0–7) */}
          {SIDEBAR_GROUPS.slice(0, 8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isOpen = openGroups.includes(group.id);
            const hasChildren = !!(group.children?.length);
            const isActive = isPathActive(group.href || '');
            const childActive = isGroupChildActive(group.children);

            if (hasChildren) {
              return (
                <div key={group.id}>
                  <button
                    onClick={() => {
                      if (!sidebarPinned && !hovered) toggleSidebarPinned();
                      toggleGroup(group.id);
                    }}
                    title={!expanded ? group.name : undefined}
                    className={itemCls(childActive)}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={clsx(labelCls, 'flex-1 text-left')}>{group.name}</span>
                    <ChevronDown className={clsx(chevronCls, isOpen && 'rotate-180')} />
                  </button>

                  {/* Children — only render when sidebar is expanded */}
                  {isOpen && expanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {group.children?.map((child) => {
                        const ChildIcon = ICONS[child.icon as keyof typeof ICONS];
                        const childIsActive = isPathActive(child.href);
                        const isMessages = child.href === '/dashboard/messages';
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={childItemCls(childIsActive)}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-sm whitespace-nowrap overflow-hidden">
                              {child.name}
                            </span>
                            {isMessages && unreadCount > 0 && (
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
              <Link
                key={group.id}
                href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={labelCls}>{group.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-white/10 py-2 px-2 space-y-0.5">
          {SIDEBAR_GROUPS.slice(8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isActive = isPathActive(group.href || '');
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={labelCls}>{group.name}</span>
              </Link>
            );
          })}

          {/* Pin / Unpin */}
          <button
            onClick={toggleSidebarPinned}
            title={sidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:bg-white/8 hover:text-slate-300 transition-all duration-150"
          >
            {sidebarPinned
              ? <ChevronsLeft className="w-4 h-4 shrink-0" />
              : <ChevronsRight className="w-4 h-4 shrink-0" />}
            <span className={labelCls}>
              {sidebarPinned ? 'Collapse' : 'Pin open'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR ───────────────────────────────────────────────── */}
      <aside
        className={clsx(
          'md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] w-72 z-40',
          'bg-slate-950/98 backdrop-blur-2xl border-r border-white/10',
          'overflow-y-auto transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <Logo variant="dark" />
        </div>
        <nav className="p-3 space-y-0.5">
          {SIDEBAR_GROUPS.slice(0, 8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isOpen = openGroups.includes(group.id);
            const hasChildren = !!(group.children?.length);
            const isActive = isPathActive(group.href || '');
            const childActive = isGroupChildActive(group.children);

            if (hasChildren) {
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                      childActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{group.name}</span>
                    <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {group.children?.map((child) => {
                        const ChildIcon = ICONS[child.icon as keyof typeof ICONS];
                        const childIsActive = isPathActive(child.href);
                        const isMessages = child.href === '/dashboard/messages';
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={clsx(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                              childIsActive
                                ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                                : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1">{child.name}</span>
                            {isMessages && unreadCount > 0 && (
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
              <Link
                key={group.id}
                href={group.href || '#'}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{group.name}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-white/10" />
          {SIDEBAR_GROUPS.slice(8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isActive = isPathActive(group.href || '');
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{group.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
