'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SIDEBAR_GROUPS } from '@/lib/constants';
import { useUIStore } from '@/store/uiStore';
import { Logo } from '@/components/logo';
import {
  Bell, Brain, FileText, MessageCircle, Code, BarChart3, CreditCard,
  Settings, X, Menu, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ChevronsLeft, ChevronsRight, LayoutDashboard,
  ShoppingCart, Send, Layout, Upload, ScrollText, Key, Megaphone,
  MessageSquare, Zap, Database, Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from './button';

const ICONS = {
  Bell, LayoutDashboard, Brain, FileText, MessageCircle, Code, BarChart3,
  CreditCard, Settings, Briefcase, CheckSquare, Users, Workflow, Plug,
  Rocket, ChevronDown, ShoppingCart, Send, Layout, Upload, ScrollText,
  Key, Megaphone, MessageSquare, Zap, Database, Building2,
};

// Exact same dark bg as the original sidebar — rgba avoids Tailwind opacity-scale issues
const SIDEBAR_BG = 'rgba(2, 6, 23, 0.95)';  // slate-950 at 95% opacity

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

  // JS hover state — reliable across all browsers
  const [hovered, setHovered] = useState(false);
  const expanded = sidebarPinned || hovered;

  const isPathActive = (href: string): boolean =>
    pathname === href || (href !== '/dashboard' && (pathname?.startsWith(href) ?? false));
  const isGroupChildActive = (children?: any[]): boolean =>
    children?.some((child) => isPathActive(child.href)) ?? false;

  // Active item style — same cyan glow as original
  const itemCls = (active: boolean) => clsx(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 text-sm',
    active
      ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
      : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
  );
  const childItemCls = (active: boolean) => clsx(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 text-sm',
    active
      ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
      : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button variant="ghost" size="sm" onClick={toggleSidebar}
        className="md:hidden fixed top-20 left-4 z-50">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ backgroundColor: SIDEBAR_BG }}
        className={clsx(
          'hidden md:flex flex-col',
          'fixed left-0 top-16 z-40',
          'h-[calc(100vh-64px)]',
          'border-r border-white/10 backdrop-blur-xl',
          'overflow-hidden',                         // clip content to current width
          'transition-[width] duration-300 ease-in-out',
          expanded ? 'w-72 shadow-2xl shadow-black/50' : 'w-16',
        )}
      >
        {/* Logo area */}
        <div className="flex h-[61px] shrink-0 items-center border-b border-white/10"
          style={{ padding: expanded ? '0 16px' : '0 12px', justifyContent: expanded ? 'flex-start' : 'center' }}>
          {expanded ? (
            <div className="overflow-hidden">
              <Logo variant="dark" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 shrink-0">
              <span className="text-cyan-400 font-black text-sm select-none">B9</span>
            </div>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
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
                    title={!expanded ? group.name : undefined}
                    onClick={() => {
                      if (!expanded) toggleSidebarPinned();
                      toggleGroup(group.id);
                    }}
                    className={itemCls(childActive)}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {/* Label — fades in when expanded */}
                    <span className={clsx(
                      'flex-1 text-left whitespace-nowrap transition-all duration-200',
                      expanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
                    )}>
                      {group.name}
                    </span>
                    <ChevronDown className={clsx(
                      'w-4 h-4 shrink-0 transition-all duration-200',
                      isOpen && 'rotate-180',
                      expanded ? 'opacity-100' : 'opacity-0 w-0'
                    )} />
                  </button>

                  {/* Children — only when expanded */}
                  {isOpen && expanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {group.children?.map((child) => {
                        const ChildIcon = ICONS[child.icon as keyof typeof ICONS];
                        const childIsActive = isPathActive(child.href);
                        const isMessages = child.href === '/dashboard/messages';
                        return (
                          <Link key={child.href} href={child.href}
                            className={childItemCls(childIsActive)}
                            onClick={() => setSidebarOpen(false)}>
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 whitespace-nowrap overflow-hidden">{child.name}</span>
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
              <Link key={group.id} href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className={clsx(
                  'whitespace-nowrap transition-all duration-200',
                  expanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
                )}>
                  {group.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section — Launch, Billing, Settings + pin button */}
        <div className="shrink-0 border-t border-white/10 py-2 px-2 space-y-0.5">
          {SIDEBAR_GROUPS.slice(8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isActive = isPathActive(group.href || '');
            return (
              <Link key={group.id} href={group.href || '#'}
                title={!expanded ? group.name : undefined}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className={clsx(
                  'whitespace-nowrap transition-all duration-200',
                  expanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
                )}>
                  {group.name}
                </span>
              </Link>
            );
          })}

          {/* Pin / Unpin button */}
          <button
            onClick={toggleSidebarPinned}
            title={sidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-all duration-150 text-sm"
          >
            {sidebarPinned
              ? <ChevronsLeft className="w-4 h-4 shrink-0" />
              : <ChevronsRight className="w-4 h-4 shrink-0" />}
            <span className={clsx(
              'whitespace-nowrap transition-all duration-200',
              expanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
            )}>
              {sidebarPinned ? 'Collapse' : 'Pin open'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR — slide-in, unchanged ─────────────────────────── */}
      <aside
        style={{ backgroundColor: SIDEBAR_BG }}
        className={clsx(
          'md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] w-72 z-40',
          'border-r border-white/10 backdrop-blur-xl',
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
                  <button onClick={() => toggleGroup(group.id)}
                    className={itemCls(childActive)}>
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
                          <Link key={child.href} href={child.href}
                            className={childItemCls(childIsActive)}
                            onClick={() => setSidebarOpen(false)}>
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
              <Link key={group.id} href={group.href || '#'}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}>
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
              <Link key={group.id} href={group.href || '#'}
                className={itemCls(isActive)}
                onClick={() => setSidebarOpen(false)}>
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
