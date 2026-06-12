'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Users, Zap, Send, FileText, MessageSquare, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ActionItem = { label: string; icon: React.FC<{ className?: string }>; href: string; color: string };

const ACTIONS: ActionItem[] = [
  { label: 'Add Lead', icon: Users, href: '/dashboard/leads', color: 'bg-blue-500 hover:bg-blue-600' },
  { label: 'New Automation', icon: Zap, href: '/dashboard/automations', color: 'bg-violet-500 hover:bg-violet-600' },
  { label: 'Send Campaign', icon: Send, href: '/dashboard/campaigns', color: 'bg-primary-500 hover:bg-primary-600' },
  { label: 'New Template', icon: FileText, href: '/dashboard/templates', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { label: 'Open Inbox', icon: MessageSquare, href: '/dashboard/messages', color: 'bg-green-500 hover:bg-green-600' },
];

const PAGE_ACTIONS: Record<string, ActionItem[]> = {
  '/dashboard/leads': [
    { label: 'Add Lead', icon: Users, href: '/dashboard/leads', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'New Task', icon: CheckSquare, href: '/dashboard/tasks', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { label: 'Send Campaign', icon: Send, href: '/dashboard/campaigns', color: 'bg-primary-500 hover:bg-primary-600' },
  ],
  '/dashboard/campaigns': [
    { label: 'New Campaign', icon: Send, href: '/dashboard/campaigns', color: 'bg-primary-500 hover:bg-primary-600' },
    { label: 'New Template', icon: FileText, href: '/dashboard/templates', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Add Lead', icon: Users, href: '/dashboard/leads', color: 'bg-blue-500 hover:bg-blue-600' },
  ],
  '/dashboard/automations': [
    { label: 'New Automation', icon: Zap, href: '/dashboard/automations', color: 'bg-violet-500 hover:bg-violet-600' },
    { label: 'New Template', icon: FileText, href: '/dashboard/templates', color: 'bg-emerald-500 hover:bg-emerald-600' },
  ],
  '/dashboard/messages': [
    { label: 'Open Inbox', icon: MessageSquare, href: '/dashboard/messages', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Add Lead', icon: Users, href: '/dashboard/leads', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Send Campaign', icon: Send, href: '/dashboard/campaigns', color: 'bg-primary-500 hover:bg-primary-600' },
  ],
  '/dashboard/tasks': [
    { label: 'New Task', icon: CheckSquare, href: '/dashboard/tasks', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { label: 'Add Lead', icon: Users, href: '/dashboard/leads', color: 'bg-blue-500 hover:bg-blue-600' },
  ],
};

export function QuickActionFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Hide on the live inbox — the FAB sits exactly over the message send button
  if (pathname?.startsWith('/dashboard/messages')) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
        {/* Action items */}
        {open && (PAGE_ACTIONS[pathname ?? ''] || ACTIONS).map((action: ActionItem, i: number) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all ${action.color}`}
              style={{ animation: `fadeUp 0.15s ease ${i * 0.04}s both` }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {action.label}
            </Link>
          );
        })}

        {/* FAB button */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 ${
            open
              ? 'bg-gray-800 rotate-45 scale-95 hover:bg-gray-700'
              : 'bg-primary-500 hover:bg-primary-600 hover:scale-110'
          }`}
          title="Quick actions"
          aria-label="Quick actions"
        >
          {open ? <X className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
