import type { Plan } from '@/types';
import { PLANS as BILLING_PLANS } from '@/lib/billing/plans';

export const PLANS: Plan[] = BILLING_PLANS as unknown as Plan[];

export type SidebarItem = {
  name: string;
  href: string;
  icon: string;
  badge?: string;
};

export type SidebarGroup = {
  id: string;
  name: string;
  icon: string;
  href?: string;
  children?: SidebarItem[];
  position?: 'main' | 'bottom';
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  // ── Home ──────────────────────────────────────────────────────
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },

  // ── Daily Use ─────────────────────────────────────────────────
  {
    id: 'inbox',
    name: 'Inbox',
    icon: 'MessageSquare',
    children: [
      { name: 'Messages', href: '/dashboard/messages', icon: 'Send' },
      { name: 'Auto Replies', href: '/dashboard/auto-replies', icon: 'Bot' },
      { name: 'Handover Queue', href: '/dashboard/handover', icon: 'UserCog' },
      { name: 'Opted Out', href: '/dashboard/opted-out', icon: 'UserX' },
      { name: 'Notifications', href: '/dashboard/notifications', icon: 'Bell' },
    ],
  },
  {
    id: 'crm',
    name: 'Leads & CRM',
    icon: 'Target',
    children: [
      { name: 'Leads', href: '/dashboard/leads', icon: 'Users' },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: 'Megaphone' },
      { name: 'Segments', href: '/dashboard/segments', icon: 'Filter' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: 'CheckSquare' },
      { name: 'Product Catalog', href: '/dashboard/catalog', icon: 'ShoppingCart' },
      { name: 'Import Contacts', href: '/dashboard/imports', icon: 'Upload' },
      { name: 'QR Codes', href: '/dashboard/qr-codes', icon: 'QrCode' },
    ],
  },

  // ── Build ─────────────────────────────────────────────────────
  {
    id: 'automate',
    name: 'Automations',
    icon: 'Zap',
    children: [
      { name: 'Automations', href: '/dashboard/automations', icon: 'Workflow' },
      { name: 'WA Templates', href: '/dashboard/templates', icon: 'Layout' },
      { name: 'WhatsApp Flows', href: '/dashboard/flows', icon: 'Layers' },
      { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: 'FlaskConical' },
      { name: 'Automation Logs', href: '/dashboard/logs', icon: 'ScrollText' },
    ],
  },
  {
    id: 'knowledge',
    name: 'AI & Knowledge',
    icon: 'Brain',
    children: [
      { name: 'AI Assistants', href: '/dashboard/assistants', icon: 'Bot' },
      { name: 'Documents', href: '/dashboard/documents', icon: 'FileText' },
      { name: 'Widgets', href: '/dashboard/widgets', icon: 'Code' },
      { name: 'Test Chat', href: '/dashboard/chat', icon: 'MessageCircle' },
    ],
  },

  // ── Data ──────────────────────────────────────────────────────
  { id: 'analytics', name: 'Analytics', icon: 'BarChart3', href: '/dashboard/analytics' },

  // ── Connect ───────────────────────────────────────────────────
  { id: 'integrations', name: 'Integrations', icon: 'Plug', href: '/dashboard/integrations' },

  // ── Admin ─────────────────────────────────────────────────────
  {
    id: 'settings',
    name: 'Settings',
    icon: 'Settings',
    children: [
      { name: 'Team', href: '/dashboard/team', icon: 'UserCog' },
      { name: 'Billing', href: '/dashboard/billing', icon: 'CreditCard' },
      { name: 'API Keys', href: '/dashboard/api', icon: 'Key' },
      { name: 'Settings', href: '/dashboard/settings', icon: 'SlidersHorizontal' },
    ],
  },

  // ── Bottom ────────────────────────────────────────────────────
  { id: 'launch', name: 'Go Live Checklist', icon: 'Rocket', href: '/dashboard/launch', position: 'bottom' },
];

export const SIDEBAR_ITEMS = SIDEBAR_GROUPS as any[];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
