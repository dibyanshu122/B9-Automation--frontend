import type { Plan } from '@/types';
import { PLANS as BILLING_PLANS } from '@/lib/billing/plans';

export const PLANS: Plan[] = BILLING_PLANS as unknown as Plan[];

export type SidebarItem = {
  name: string;
  href: string;
  icon: string;
};

export type SidebarGroup = {
  id: string;
  name: string;
  icon: string;
  href?: string;
  children?: SidebarItem[];
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  // ── Core (always visible) ─────────────────────────────────
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'assistants', name: 'AI Assistants', icon: 'Brain', href: '/dashboard/assistants' },

  // ── Expandable groups (indices 2–7) ──────────────────────
  {
    id: 'workspace-tools',
    name: 'Workspace Tools',
    icon: 'Briefcase',
    children: [
      { name: 'Documents', href: '/dashboard/documents', icon: 'FileText' },
      { name: 'Chat', href: '/dashboard/chat', icon: 'MessageCircle' },
      { name: 'Widgets', href: '/dashboard/widgets', icon: 'Code' },
    ],
  },
  {
    id: 'messaging',
    name: 'Messaging',
    icon: 'MessageSquare',
    children: [
      { name: 'Messages', href: '/dashboard/messages', icon: 'Send' },
      { name: 'WA Templates', href: '/dashboard/templates', icon: 'Layout' },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: 'Megaphone' },
      { name: 'Auto Replies', href: '/dashboard/auto-replies', icon: 'Zap' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: 'BarChart3',
    children: [
      { name: 'Leads', href: '/dashboard/leads', icon: 'Users' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: 'CheckSquare' },
      { name: 'Notifications', href: '/dashboard/notifications', icon: 'Bell' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
    ],
  },
  {
    id: 'automation',
    name: 'Automation',
    icon: 'Zap',
    children: [
      { name: 'Automations', href: '/dashboard/automations', icon: 'Workflow' },
      { name: 'Automation Logs', href: '/dashboard/logs', icon: 'ScrollText' },
    ],
  },
  {
    id: 'data',
    name: 'Contacts & Data',
    icon: 'Database',
    children: [
      { name: 'Import Contacts', href: '/dashboard/imports', icon: 'Upload' },
      { name: 'Product Catalog', href: '/dashboard/catalog', icon: 'ShoppingCart' },
    ],
  },
  {
    id: 'workspace',
    name: 'Workspace',
    icon: 'Building2',
    children: [
      { name: 'Team', href: '/dashboard/team', icon: 'Users' },
      { name: 'Integrations', href: '/dashboard/integrations', icon: 'Plug' },
      { name: 'API Keys', href: '/dashboard/api', icon: 'Key' },
    ],
  },

  // ── Bottom (indices 8–10) — pinned with mt-auto ───────────
  { id: 'launch', name: 'Launch Center', icon: 'Rocket', href: '/dashboard/launch' },
  { id: 'billing', name: 'Billing', icon: 'CreditCard', href: '/dashboard/billing' },
  { id: 'settings', name: 'Settings', icon: 'Settings', href: '/dashboard/settings' },
];

export const SIDEBAR_ITEMS = SIDEBAR_GROUPS as any[];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
