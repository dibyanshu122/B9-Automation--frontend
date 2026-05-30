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
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'assistants', name: 'AI Assistants', icon: 'Brain', href: '/dashboard/assistants' },
  {
    id: 'sales',
    name: 'Leads & CRM',
    icon: 'Target',
    children: [
      { name: 'Leads', href: '/dashboard/leads', icon: 'Users' },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: 'Megaphone' },
      { name: 'Product Catalog', href: '/dashboard/catalog', icon: 'ShoppingCart' },
      { name: 'QR Codes', href: '/dashboard/qr-codes', icon: 'QrCode' },
      { name: 'Import Contacts', href: '/dashboard/imports', icon: 'Upload' },
    ],
  },
  {
    id: 'support',
    name: 'Inbox',
    icon: 'MessageSquare',
    children: [
      { name: 'Messages', href: '/dashboard/messages', icon: 'Send' },
      { name: 'Handover Queue', href: '/dashboard/handover', icon: 'UserCog' },
      { name: 'Auto Replies', href: '/dashboard/auto-replies', icon: 'Bot' },
      { name: 'Opted Out', href: '/dashboard/opted-out', icon: 'UserX' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: 'CheckSquare' },
    ],
  },
  {
    id: 'automate',
    name: 'Automate',
    icon: 'Zap',
    children: [
      { name: 'Automations', href: '/dashboard/automations', icon: 'Workflow' },
      { name: 'WhatsApp Flows', href: '/dashboard/flows', icon: 'Layers' },
      { name: 'WA Templates', href: '/dashboard/templates', icon: 'Layout' },
      { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: 'FlaskConical' },
      { name: 'Automation Logs', href: '/dashboard/logs', icon: 'ScrollText' },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Base',
    icon: 'Briefcase',
    children: [
      { name: 'Documents', href: '/dashboard/documents', icon: 'FileText' },
      { name: 'Chat', href: '/dashboard/chat', icon: 'MessageCircle' },
      { name: 'Widgets', href: '/dashboard/widgets', icon: 'Code' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
      { name: 'Notifications', href: '/dashboard/notifications', icon: 'Bell' },
    ],
  },
  {
    id: 'workspace',
    name: 'Workspace',
    icon: 'Building2',
    children: [
      { name: 'Team', href: '/dashboard/team', icon: 'UserCog' },
      { name: 'Integrations', href: '/dashboard/integrations', icon: 'Plug' },
      { name: 'API Keys', href: '/dashboard/api', icon: 'Key' },
      { name: 'API Docs', href: '/developers', icon: 'Code2' },
      { name: 'Billing', href: '/dashboard/billing', icon: 'CreditCard' },
      { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
    ],
  },
  { id: 'launch', name: 'Go Live Checklist', icon: 'Rocket', href: '/dashboard/launch', position: 'bottom' },
];

export const SIDEBAR_ITEMS = SIDEBAR_GROUPS as any[];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
