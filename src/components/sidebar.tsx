'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, openGroups, toggleGroup } = useUIStore();

  const isPathActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const isGroupChildActive = (children?: any[]) =>
    children?.some((child) => isPathActive(child.href)) || false;

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

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-16 h-[calc(100vh-64px)] w-72',
          'bg-slate-950/95 backdrop-blur-2xl',
          'border-r border-white/10',
          'overflow-y-auto z-30 transition-transform md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-white/10 px-4 py-5">
          <Logo variant="dark" />
        </div>

        <nav className="p-4 space-y-1 flex flex-col h-full">
          {/* Main groups: Dashboard, AI Assistants + 6 expandable groups (indices 0–7) */}
          {SIDEBAR_GROUPS.slice(0, 8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isOpen = openGroups.includes(group.id);
            const hasChildren = group.children && group.children.length > 0;
            const isActive = isPathActive(group.href || '');
            const childActive = isGroupChildActive(group.children);

            if (hasChildren) {
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                      childActive
                        ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                        : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline flex-1 text-left">{group.name}</span>
                    <ChevronDown
                      className={clsx(
                        'w-4 h-4 hidden sm:inline transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">
                      {group.children?.map((child) => {
                        const ChildIcon = ICONS[child.icon as keyof typeof ICONS];
                        const childIsActive = isPathActive(child.href);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={clsx(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                              childIsActive
                                ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                                : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{child.name}</span>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                  isActive
                    ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{group.name}</span>
              </Link>
            );
          })}

          {/* Divider — pushes bottom items down */}
          <div className="my-2 border-t border-white/10 mt-auto" />

          {/* Bottom: Launch Center, Billing, Settings (indices 8–10) */}
          {SIDEBAR_GROUPS.slice(8).map((group) => {
            const Icon = ICONS[group.icon as keyof typeof ICONS];
            const isActive = isPathActive(group.href || '');

            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                  isActive
                    ? 'bg-primary-500/20 text-cyan-100 font-semibold shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{group.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
