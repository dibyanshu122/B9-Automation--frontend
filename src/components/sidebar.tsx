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
  Bell,
  LayoutDashboard,
  Brain,
  FileText,
  MessageCircle,
  Code,
  BarChart3,
  CreditCard,
  Settings,
  Briefcase,
  CheckSquare,
  Users,
  Workflow,
  Plug,
  Rocket,
  ChevronDown,
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
};

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchCount = () => {
      const token = localStorage.getItem('token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${base}/api/automation/inbox`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.json())
        .then(data => {
          const items: any[] = data?.items || [];
          const cutoff = Date.now() - 86400000;
          const unread = items.filter((i: any) => i.direction === 'inbound' && new Date(i.created_at + 'Z').getTime() > cutoff).length;
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

  const isPathActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const isGroupChildActive = (children?: any[]) =>
    children?.some((child) => isPathActive(child.href)) || false;

  // Label visibility class — visible when pinned OR on hover (via group-hover/sb)
  const labelClass = clsx(
    'whitespace-nowrap overflow-hidden transition-all duration-200 text-sm',
    sidebarPinned
      ? 'opacity-100 max-w-[200px] ml-0'
      : 'opacity-0 max-w-0 group-hover/sb:opacity-100 group-hover/sb:max-w-[200px]'
  );

  const chevronClass = clsx(
    'w-4 h-4 shrink-0 transition-all duration-200',
    sidebarPinned
      ? 'opacity-100'
      : 'opacity-0 group-hover/sb:opacity-100'
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="md:hidden fixed top-20 left-4 z-40"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── DESKTOP SIDEBAR — Hover-to-Expand ──────────────────────────── */}
      <aside
        className={clsx(
          // Hidden on mobile (handled separately below)
          'hidden md:flex flex-col',
          'fixed left-0 top-16 h-[calc(100vh-64px)] z-40',
          'bg-slate-950/95 backdrop-blur-2xl border-r border-white/10',
          // Width: 64px collapsed → 288px on hover OR when pinned
          'transition-all duration-300 ease-in-out overflow-hidden',
          // Group for hover detection
          'group/sb',
          sidebarPinned ? 'w-72' : 'w-16 hover:w-72',
          // Shadow when expanded
          'hover:shadow-2xl hover:shadow-black/40',
        )}
      >
        {/* Logo area */}
        <div className={clsx(
          'border-b border-white/10 flex items-center overflow-hidden shrink-0',
          'transition-all duration-300 h-[61px]',
          sidebarPinned ? 'px-4' : 'px-3 justify-center group-hover/sb:px-4 group-hover/sb:justify-start'
        )}>
          {/* Mini logo (icon only) */}
          <div className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 shrink-0',
            sidebarPinned ? 'hidden' : 'flex group-hover/sb:hidden'
          )}>
            <span className="text-cyan-400 font-black text-sm">B9</span>
          </div>
          {/* Full logo */}
          <div className={clsx(
            'overflow-hidden transition-all duration-300',
            sidebarPinned ? 'opacity-100 w-auto' : 'opacity-0 w-0 group-hover/sb:opacity-100 group-hover/sb:w-auto'
          )}>
            <Logo variant="dark" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 overflow-x-hidden">
          {/* Main groups (indices 0–7) */}
          {SIDEBAR_GROUPS.slice(0, 8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isOpen = openGroups.includes(group.id);
            const hasChildren = !!(group.children && group.children.length > 0);
            const isActive = isPathActive(group.href || '');
            const childActive = isGroupChildActive(group.children);

            if (hasChildren) {
              return (
                <div key={group.id}>
                  <button
                    onClick={() => {
                      // When collapsed and not pinned, pin first then open group
                      if (!sidebarPinned) toggleSidebarPinned();
                      toggleGroup(group.id);
                    }}
                    title={group.name}
                    className={clsx(
                      'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150',
                      childActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                        : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={labelClass}>{group.name}</span>
                    <ChevronDown className={clsx(chevronClass, 'ml-auto', isOpen && 'rotate-180')} />
                  </button>

                  {/* Children — only show when sidebar is expanded */}
                  {isOpen && (
                    <div className={clsx(
                      'overflow-hidden transition-all duration-200',
                      sidebarPinned
                        ? 'ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3 opacity-100 max-h-[500px]'
                        : 'ml-0 opacity-0 max-h-0 group-hover/sb:ml-3 group-hover/sb:mt-0.5 group-hover/sb:space-y-0.5 group-hover/sb:border-l group-hover/sb:border-white/10 group-hover/sb:pl-3 group-hover/sb:opacity-100 group-hover/sb:max-h-[500px]'
                    )}>
                      {group.children?.map((child) => {
                        const ChildIcon = ICONS[child.icon as keyof typeof ICONS];
                        const childIsActive = isPathActive(child.href);
                        const isMessages = child.href === '/dashboard/messages';
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            title={child.name}
                            className={clsx(
                              'flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all text-sm',
                              childIsActive
                                ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                                : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-sm whitespace-nowrap overflow-hidden">{child.name}</span>
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
                title={group.name}
                className={clsx(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={labelClass}>{group.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 py-2 px-2 space-y-0.5 shrink-0">
          {/* Bottom links: Launch, Billing, Settings */}
          {SIDEBAR_GROUPS.slice(8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isActive = isPathActive(group.href || '');
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                title={group.name}
                className={clsx(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={labelClass}>{group.name}</span>
              </Link>
            );
          })}

          {/* Pin/Unpin button */}
          <button
            onClick={toggleSidebarPinned}
            title={sidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-slate-500 hover:bg-white/8 hover:text-slate-300 transition-all duration-150"
          >
            {sidebarPinned
              ? <ChevronsLeft className="w-4 h-4 shrink-0" />
              : <ChevronsRight className="w-4 h-4 shrink-0" />
            }
            <span className={labelClass}>
              {sidebarPinned ? 'Collapse' : 'Pin sidebar'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR — Slide-in overlay (unchanged) ───────────────── */}
      <aside
        className={clsx(
          'md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] w-72 z-40',
          'bg-slate-950/95 backdrop-blur-2xl border-r border-white/10',
          'overflow-y-auto transition-transform duration-300',
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
            const hasChildren = !!(group.children && group.children.length > 0);
            const isActive = isPathActive(group.href || '');
            const childActive = isGroupChildActive(group.children);

            if (hasChildren) {
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
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
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
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
