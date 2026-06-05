import {
  BarChart3,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  FileText,
  Globe,
  Globe2,
  LockKeyhole,
  MessageCircle,
  Mic2,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UploadCloud,
  Users,
  Workflow,
  Zap,
  ZapOff,
} from 'lucide-react';

export const marketingNav = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

// ── All features shown in nav dropdown ───────────────────────────────────────
export const allFeatures = [
  { icon: Bot,          title: 'Agentic WhatsApp AI',       description: 'AI receives, qualifies, sells, and follows up on WhatsApp',          href: '/features/whatsapp-agentic-ai' },
  { icon: MessageCircle,title: 'WhatsApp Automation',       description: 'Automated reply sequences, rule engine, keyword triggers',            href: '/features/whatsapp-automation' },
  { icon: Sparkles,     title: 'AI Template Builder',       description: 'Describe a campaign, AI drafts approved Meta template instantly',     href: '/features/ai-template-builder' },
  { icon: Workflow,     title: 'Visual Flow Canvas',        description: '37-node drag-and-drop canvas: Trigger → AI → Action',                href: '/features/visual-automation-builder' },
  { icon: Building2,    title: 'Facebook Lead Ads',         description: 'Auto-capture leads from Facebook forms into CRM',                    href: '/features/facebook-lead-ads' },
  { icon: Globe2,       title: 'Instagram DM Automation',   description: 'Auto-reply to Instagram DMs and capture leads',                      href: '/features/instagram-dm' },
  { icon: BarChart3,    title: 'Broadcast Campaigns',       description: 'Bulk WhatsApp campaigns with A/B testing and analytics',             href: '/features/campaigns' },
  { icon: CreditCard,   title: 'Razorpay Payments',        description: 'Send payment links via WhatsApp, track orders and invoices',          href: '/features/payments' },
  { icon: FileText,     title: 'Meta Templates',           description: 'Create, submit, and manage WhatsApp approved templates',              href: '/features/templates' },
  { icon: Users,        title: 'Leads & CRM',              description: 'Lead pipeline, scoring, memory, and lifecycle tracking',             href: '/features/crm' },
  { icon: Globe,        title: 'Website Widget',           description: 'Embed AI sales assistant on your website — captures leads instantly', href: '/features/widget' },
  { icon: Code2,        title: 'REST API',                 description: 'Full API v1 with 22 scopes for custom integrations',                  href: '/features/api' },
];

// ── 6-grid feature highlights on landing page ─────────────────────────────────
export const featureHighlights = [
  {
    icon: Bot,
    title: 'Agentic AI Core',
    description: 'B9 AI receives customer messages, classifies intent (buy/question/complaint/opt-out), searches your knowledge, sends catalog or payment link — fully automated.',
  },
  {
    icon: Sparkles,
    title: 'AI Template + Flow Builder',
    description: 'Type "Diwali sale 20% off" — B9 AI drafts an approved Meta template with variables, header, footer, and CTA buttons. WhatsApp Forms built in minutes.',
  },
  {
    icon: Workflow,
    title: '37-Node Automation Canvas',
    description: 'Visual drag-and-drop builder with triggers, AI nodes, conditions, loops, waits, catalog, payment, handover, and 30+ action types. No code needed.',
  },
  {
    icon: BarChart3,
    title: 'Campaigns & Broadcast',
    description: 'Send template campaigns to hot/warm/cold leads. A/B test messages, schedule for peak hours, preview recipient count before sending.',
  },
  {
    icon: CreditCard,
    title: 'Razorpay Payment Flows',
    description: 'Send Razorpay payment links via WhatsApp. AI detects buy intent and auto-creates links. GST invoice generation included.',
  },
  {
    icon: Users,
    title: 'Smart Lead CRM',
    description: 'Auto-score leads (hot/warm/cold), track conversation memory, pipeline stages, follow-up scheduler, bulk export, and Google Sheets sync.',
  },
  {
    icon: Zap,
    title: 'Rule Engine',
    description: 'Keyword replies, welcome messages, out-of-office auto-replies, opt-out handling, keyword alerts, and auto-assign — all no-code.',
  },
  {
    icon: Globe,
    title: 'Website Sales Widget',
    description: 'Embed an AI sales assistant that captures leads, qualifies prospects, and sends WhatsApp follow-ups — right from your website.',
  },
  {
    icon: ShoppingBag,
    title: 'Product Catalog',
    description: 'Upload your product catalog. AI recommends and sends catalog cards on WhatsApp when customer asks about products.',
  },
  {
    icon: FileText,
    title: 'Knowledge Base AI',
    description: 'Upload PDFs, URLs, and YouTube videos. AI answers customer questions with source citations from your documents.',
  },
  {
    icon: ZapOff,
    title: 'Meta Compliance Built-in',
    description: '24-hour window enforced automatically. Opt-out logged durably. Only approved templates sent after window closes. No accidental spam.',
  },
  {
    icon: Code2,
    title: 'API + Webhooks',
    description: 'Full REST API v1 with 22 scopes. Connect CRMs, custom tools, Shopify, IndiaMART, or any external platform.',
  },
];

// ── Use cases ─────────────────────────────────────────────────────────────────
export const useCases = [
  {
    icon: Users,
    title: 'Coaching Centers',
    description: 'AI qualifies leads, books demo classes, sends fee details, and follows up via WhatsApp — automatically.',
  },
  {
    icon: Building2,
    title: 'Real Estate',
    description: 'Property details, site visit booking, and payment collection — all on WhatsApp without any manual effort.',
  },
  {
    icon: Brain,
    title: 'D2C & E-commerce',
    description: 'Product catalog on WhatsApp, order confirmation, payment links, and delivery follow-ups — zero code.',
  },
  {
    icon: Globe2,
    title: 'Agencies & SaaS',
    description: 'Build client automation flows, manage multiple WhatsApp numbers, and track lead performance per client.',
  },
];

// ── How it works steps ────────────────────────────────────────────────────────
export const workflowSteps = [
  {
    icon: Globe,
    title: 'Connect WhatsApp',
    description: 'Link your WhatsApp Business number through the official Meta Cloud API connection flow.',
  },
  {
    icon: UploadCloud,
    title: 'Upload Your Knowledge',
    description: 'Add pricing PDFs, product catalog, FAQs, URLs, or YouTube videos. AI indexes everything.',
  },
  {
    icon: Sparkles,
    title: 'Describe Automation',
    description: 'Type "When someone asks about price, send catalog and ask for their phone number." B9 AI drafts the full flow.',
  },
  {
    icon: MessageCircle,
    title: 'Go Live',
    description: 'Review the AI-drafted templates, flows, and automation. Click activate. B9 handles everything 24/7.',
  },
];

// ── Trust points ──────────────────────────────────────────────────────────────
export const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Official Meta API',
    description: 'WhatsApp via Meta Cloud API only, with opt-out and messaging-window safeguards.',
  },
  {
    icon: LockKeyhole,
    title: 'Encrypted Tokens',
    description: 'All WhatsApp, payment, and API tokens stored with PBKDF2 encryption. Never plaintext.',
  },
  {
    icon: CheckCircle2,
    title: 'Opt-out Compliant',
    description: 'STOP messages handled instantly and durably. We block all future sends permanently — no re-send risk.',
  },
];

// ── Blog posts ────────────────────────────────────────────────────────────────
export const blogPosts = [
  {
    title: 'How Indian SMBs are using WhatsApp AI to close leads 3x faster',
    date: 'May 20, 2026',
    category: 'Case Study',
    description: 'Real coaching centers, real estate firms, and D2C brands share how B9 automated their entire WhatsApp lead funnel.',
  },
  {
    title: 'B9 Agentic Core: how the AI decides what to do with each WhatsApp message',
    date: 'May 18, 2026',
    category: 'Product',
    description: 'Deep dive into intent classification, tool routing, and how B9 AI decides to send catalog vs payment link vs handover.',
  },
  {
    title: 'How to create WhatsApp-approved templates with AI in 60 seconds',
    date: 'May 15, 2026',
    category: 'Guide',
    description: 'Step-by-step guide to using B9\'s AI Template Builder to draft, submit, and use approved Meta templates.',
  },
  {
    title: 'B9 honest comparison for Indian businesses',
    date: 'May 12, 2026',
    category: 'Comparison',
    description: 'Feature-by-feature comparison of top WhatsApp automation platforms. Which one actually handles agentic AI flows?',
  },
];

// ── Supported file formats ─────────────────────────────────────────────────────
export const supportedFormats = [
  { icon: FileText, label: 'PDF' },
  { icon: FileText, label: 'DOCX' },
  { icon: FileText, label: 'PPTX' },
  { icon: FileText, label: 'TXT' },
  { icon: Globe, label: 'URL' },
  { icon: PlayCircle, label: 'YouTube' },
  { icon: Mic2, label: 'Audio/Video' },
];

// ── Changelog ─────────────────────────────────────────────────────────────────
export const changelog = [
  {
    version: 'v1.0',
    date: 'May 21, 2026',
    title: '20-Part production audit complete',
    items: [
      'Agentic AI loop with DeepSeek/Groq fallback',
      'Duplicate reply prevention via orchestrator flag',
      'WhatsApp 24h compliance enforced backend',
      'Campaign template-only enforcement',
      'API v1 with 22 scopes + key auth',
    ],
  },
  {
    version: 'v0.9',
    date: 'May 15, 2026',
    title: 'Inbox & Campaigns',
    items: ['Template send from inbox fixed', 'Campaign recipient cap per plan', 'Bulk delete + export fixed', 'Phone filter added to leads'],
  },
  {
    version: 'v0.8',
    date: 'May 10, 2026',
    title: 'WhatsApp Flows + Templates',
    items: ['AI Flow generator (async, non-blocking)', 'Meta-valid condition routing', 'Template cache 60s TTL', 'Backend validation for button mixing'],
  },
];
