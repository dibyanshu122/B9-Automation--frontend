import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  Globe,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Mic2,
  PlayCircle,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Youtube,
} from 'lucide-react';

export const marketingNav = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export const allFeatures = [
  { icon: Bot, title: 'AI Chatbot', description: 'Website chatbot powered by your knowledge base', href: '/features/ai-chatbot' },
  { icon: MessageCircle, title: 'WhatsApp Automation', description: 'Automated messages, sequences & broadcasts', href: '/features/whatsapp-automation' },
  { icon: Building2, title: 'Facebook Lead Ads', description: 'Auto-capture leads from Facebook forms into CRM', href: '/features/facebook-lead-ads' },
  { icon: Sparkles, title: 'Instagram DM', description: 'Auto-reply to DMs and capture them as leads', href: '/features/instagram-dm' },
  { icon: Globe, title: 'Visual Automation Builder', description: 'Drag-and-drop canvas: Trigger → AI → Action', href: '/features/visual-automation-builder' },
  { icon: Mail, title: 'Email Automation', description: 'Email sequences and automated responses', href: '/features' },
  { icon: FileText, title: 'Document AI', description: 'Extract, analyze & answer from documents', href: '/features' },
  { icon: Brain, title: 'Analytics & Insights', description: 'Track conversations, leads, and ROI', href: '/features' },
  { icon: CheckCircle2, title: 'Enterprise Security', description: 'Bank-level encryption & compliance', href: '/features' },
  { icon: Users, title: 'Team Collaboration', description: 'Manage teams and permissions', href: '/features' },
  { icon: ArrowRight, title: 'Multi-language', description: 'Support for multiple languages', href: '/features' },
  { icon: ExternalLink, title: 'API Access', description: 'Full API for custom integrations', href: '/features' },
];

export const featureHighlights = [
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Train a customer-ready chatbot from your documents, FAQs, help center, videos, and links.',
  },
  {
    icon: FileText,
    title: 'Document Chat',
    description: 'Ask questions across PDFs, DOCX, PPTX, TXT, Markdown, and get answers with source citations.',
  },
  {
    icon: Mic2,
    title: 'Audio & Video Intelligence',
    description: 'Upload recordings or paste YouTube links, transcribe them, and chat with timestamped answers.',
  },
  {
    icon: Share2,
    title: 'Share & Embed',
    description: 'Share knowledge links or embed a branded AI widget on your website with one script.',
  },
  {
    icon: Search,
    title: 'Smart Retrieval',
    description: 'Search across files, URLs, and assistants with fast grounded responses for every user query.',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Track conversations, documents, queries, sessions, and quota usage from the SaaS dashboard.',
  },
];

export const useCases = [
  {
    icon: Users,
    title: 'Support Teams',
    description: 'Answer product, pricing, policy, and onboarding questions from your own docs.',
  },
  {
    icon: Building2,
    title: 'Founders & Agencies',
    description: 'Create client-facing knowledge bots without writing custom AI infrastructure.',
  },
  {
    icon: Brain,
    title: 'Students & Researchers',
    description: 'Study notes, papers, reports, and lecture recordings with cited AI answers.',
  },
  {
    icon: Globe2,
    title: 'Creators & Educators',
    description: 'Turn courses, videos, and guides into interactive assistants for your audience.',
  },
];

export const workflowSteps = [
  {
    icon: UploadCloud,
    title: 'Upload knowledge',
    description: 'Add PDFs, URLs, YouTube videos, docs, and support material.',
  },
  {
    icon: Sparkles,
    title: 'B9 Automation indexes it',
    description: 'Content is extracted, organized, and prepared for grounded AI answers.',
  },
  {
    icon: MessageCircle,
    title: 'Ask or embed',
    description: 'Chat inside the dashboard or publish a widget on your website.',
  },
];

export const trustPoints = [
  { icon: ShieldCheck, title: 'Private by default', description: 'Your content stays under your account unless you share it.' },
  { icon: LockKeyhole, title: 'Not for training', description: 'Customer data is used only to answer their own questions.' },
  { icon: CheckCircle2, title: 'Answers with sources', description: 'Responses can cite documents, pages, URLs, or video timestamps.' },
];

export const blogPosts = [
  {
    title: 'How to create an AI knowledge assistant for your business',
    date: 'Apr 30, 2026',
    category: 'Guide',
    description: 'A practical playbook for turning FAQs, PDFs, URLs, and videos into a useful AI assistant.',
  },
  {
    title: 'Document chat: why source citations matter',
    date: 'Apr 28, 2026',
    category: 'Product',
    description: 'Learn how grounded answers reduce hallucinations and help teams trust AI responses.',
  },
  {
    title: 'Using YouTube and video content as a searchable knowledge base',
    date: 'Apr 24, 2026',
    category: 'AI Workflow',
    description: 'Convert webinars, demos, and training videos into searchable support content.',
  },
  {
    title: 'Choosing the right SaaS plan for AI support automation',
    date: 'Apr 21, 2026',
    category: 'Pricing',
    description: 'How to think about queries, uploads, storage, widgets, and analytics while scaling.',
  },
];

export const changelog = [
  {
    version: 'v0.5',
    date: 'Apr 30, 2026',
    title: 'Production dashboard polish',
    items: ['Cleaner white dashboard theme', 'Faster quota loading', 'Groq-compatible chat provider config'],
  },
  {
    version: 'v0.4',
    date: 'Apr 29, 2026',
    title: 'SaaS user journey',
    items: ['Signup/login flow', 'Free plan quota setup', 'Assistants, documents, chat, billing pages'],
  },
  {
    version: 'v0.3',
    date: 'Apr 28, 2026',
    title: 'Knowledge ingestion',
    items: ['PDF upload', 'URL ingestion', 'YouTube link support', 'Document list and indexing states'],
  },
];

export const supportedFormats = [
  { icon: FileText, label: 'PDF' },
  { icon: FileText, label: 'DOCX' },
  { icon: FileText, label: 'PPTX' },
  { icon: Code2, label: 'TXT / MD' },
  { icon: PlayCircle, label: 'Audio / Video' },
  { icon: Youtube, label: 'YouTube' },
];
