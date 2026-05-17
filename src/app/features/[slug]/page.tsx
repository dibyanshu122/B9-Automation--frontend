'use client';

import { useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import {
  Bot, MessageCircle, Mail, FileText, Building2, Sparkles, Brain, Globe, CheckCircle2, Users, ArrowRight, ExternalLink,
  Menu, X, Linkedin, Instagram, Youtube
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

type FeatureStep = { title: string; desc: string };
type FeatureItem = { title: string; desc: string };
type FeatureUseCase = { industry: string; benefit: string };
type FeatureData = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  steps: FeatureStep[];
  features: FeatureItem[];
  useCases: FeatureUseCase[];
};

const featuresData: Record<string, FeatureData> = {
  'ai-chatbot': {
    title: 'AI Chatbot',
    subtitle: 'Website chatbot powered by your knowledge base. Train it from docs, FAQs, help center, and videos.',
    icon: Bot,
    steps: [
      { title: 'Add Knowledge', desc: 'Upload PDFs, docs, videos, or paste URLs' },
      { title: 'AI Trains', desc: 'Content is indexed and prepared for chat' },
      { title: 'Chat Away', desc: 'Deploy on your website instantly' },
    ],
    features: [
      { title: 'Multi-source training', desc: 'PDFs, DOCX, videos, URLs, YouTube links' },
      { title: 'Instant deployment', desc: 'Get your chatbot live in minutes' },
      { title: 'Customizable behavior', desc: 'Set tone, context, and personality' },
      { title: 'Analytics built-in', desc: 'Track conversations and user questions' },
      { title: 'No coding required', desc: 'Anyone can create and publish' },
      { title: '24/7 availability', desc: 'Always-on customer support' },
    ],
    useCases: [
      { industry: 'Customer Support', benefit: 'Answer FAQs automatically 24/7' },
      { industry: 'Product Teams', benefit: 'Help users learn your product' },
      { industry: 'Agencies', benefit: 'Deliver chatbots to multiple clients' },
    ],
  },
  'whatsapp-automation': {
    title: 'WhatsApp Automation',
    subtitle: 'Automated messages, sequences, broadcasts, and lead qualification on WhatsApp.',
    icon: MessageCircle,
    steps: [
      { title: 'Design Flows', desc: 'Create automated sequences with no code' },
      { title: 'Connect WhatsApp', desc: 'Link your official WhatsApp Business Account' },
      { title: 'Go Live', desc: 'Start automating customer interactions' },
    ],
    features: [
      { title: 'Broadcast messages', desc: 'Send campaigns to thousands instantly' },
      { title: 'Automated sequences', desc: 'Multi-step workflows on button clicks' },
      { title: 'Lead qualification', desc: 'Auto-qualify inbound leads with questions' },
      { title: 'Two-way conversations', desc: 'Full chat with customers, not just broadcasts' },
      { title: 'Template management', desc: 'Pre-approved messages for instant sending' },
      { title: 'Analytics dashboard', desc: 'Track opens, clicks, and conversions' },
    ],
    useCases: [
      { industry: 'E-commerce', benefit: 'Automated order updates and reminders' },
      { industry: 'Coaching', benefit: 'Lead qualification and appointment reminders' },
      { industry: 'Real Estate', benefit: 'Property listings and inquiry automation' },
    ],
  },
  'email-automation': {
    title: 'Email Automation',
    subtitle: 'Automated email sequences, campaigns, and follow-ups to nurture leads.',
    icon: Mail,
    steps: [
      { title: 'Build Sequence', desc: 'Create multi-step email workflows' },
      { title: 'Set Triggers', desc: 'Emails send on sign-ups, form submissions, etc.' },
      { title: 'Monitor Results', desc: 'Track opens, clicks, and conversions' },
    ],
    features: [
      { title: 'Drag-drop editor', desc: 'No coding, visual workflow builder' },
      { title: 'Smart delays', desc: 'Send emails at optimal times' },
      { title: 'Dynamic content', desc: 'Personalize each email with user data' },
      { title: 'A/B testing', desc: 'Test subject lines and content' },
      { title: 'List management', desc: 'Segment audiences by behavior' },
      { title: 'Detailed analytics', desc: 'Opens, clicks, bounces, unsubscribes' },
    ],
    useCases: [
      { industry: 'SaaS', benefit: 'Onboarding sequences for new users' },
      { industry: 'Agencies', benefit: 'Newsletter and nurture campaigns' },
      { industry: 'Ecommerce', benefit: 'Abandoned cart recovery' },
    ],
  },
  'document-ai': {
    title: 'Document AI',
    subtitle: 'Extract, analyze, and answer questions from your documents instantly.',
    icon: FileText,
    steps: [
      { title: 'Upload Documents', desc: 'PDFs, Word docs, spreadsheets, or images' },
      { title: 'AI Analyzes', desc: 'Content is extracted and indexed' },
      { title: 'Ask Questions', desc: 'Get cited answers from your documents' },
    ],
    features: [
      { title: 'Multi-format support', desc: 'PDFs, DOCX, PPTX, images, spreadsheets' },
      { title: 'Cited answers', desc: 'Every response includes source references' },
      { title: 'OCR capability', desc: 'Read text from scanned images' },
      { title: 'Batch processing', desc: 'Analyze hundreds of documents at once' },
      { title: 'Search across docs', desc: 'Find relevant content instantly' },
      { title: 'Export insights', desc: 'Download summaries and extracted data' },
    ],
    useCases: [
      { industry: 'Legal', benefit: 'Contract analysis and review' },
      { industry: 'HR', benefit: 'Policy document search and retrieval' },
      { industry: 'Research', benefit: 'Analyze papers and reports' },
    ],
  },
  'lead-capture': {
    title: 'Lead Capture',
    subtitle: 'Smart forms with instant CRM sync to capture and qualify leads.',
    icon: Building2,
    steps: [
      { title: 'Create Form', desc: 'Design beautiful forms with conditional fields' },
      { title: 'Connect CRM', desc: 'Auto-sync leads to your CRM or database' },
      { title: 'Qualify Leads', desc: 'Instant notifications and lead scoring' },
    ],
    features: [
      { title: 'Custom forms', desc: 'Build forms without coding' },
      { title: 'CRM integration', desc: 'Auto-sync to HubSpot, Pipedrive, etc.' },
      { title: 'Conditional logic', desc: 'Show/hide fields based on answers' },
      { title: 'Lead scoring', desc: 'Automatically qualify hot leads' },
      { title: 'Email notifications', desc: 'Instant alerts on new submissions' },
      { title: 'GDPR compliant', desc: 'Built-in consent and privacy controls' },
    ],
    useCases: [
      { industry: 'Agencies', benefit: 'Capture client inquiries' },
      { industry: 'Coaching', benefit: 'Qualification for demos' },
      { industry: 'SaaS', benefit: 'Sign-ups and trial requests' },
    ],
  },
  'workflow-builder': {
    title: 'Workflow Builder',
    subtitle: 'No-code automation sequences and triggers for your business.',
    icon: Sparkles,
    steps: [
      { title: 'Design Workflow', desc: 'Drag-drop triggers and actions' },
      { title: 'Set Conditions', desc: 'Add if/then logic and delays' },
      { title: 'Automate', desc: 'Watch tasks run on their own' },
    ],
    features: [
      { title: 'Drag-drop builder', desc: 'Visual workflow editor' },
      { title: '100+ integrations', desc: 'Connect with your favorite tools' },
      { title: 'Advanced logic', desc: 'If/then, delays, loops, webhooks' },
      { title: 'Testing mode', desc: 'Test workflows before going live' },
      { title: 'Version history', desc: 'Rollback to previous versions' },
      { title: 'Real-time logs', desc: 'Monitor every workflow execution' },
    ],
    useCases: [
      { industry: 'Agencies', benefit: 'Client onboarding workflows' },
      { industry: 'E-commerce', benefit: 'Order processing and fulfillment' },
      { industry: 'Support', benefit: 'Ticket routing and assignment' },
    ],
  },
  'analytics': {
    title: 'Analytics & Insights',
    subtitle: 'Track conversations, leads, and ROI across all automations.',
    icon: Brain,
    steps: [
      { title: 'Collect Data', desc: 'All interactions are tracked automatically' },
      { title: 'Visualize', desc: 'View dashboards with key metrics' },
      { title: 'Optimize', desc: 'Use insights to improve campaigns' },
    ],
    features: [
      { title: 'Real-time dashboards', desc: 'See metrics as they happen' },
      { title: 'Custom reports', desc: 'Create and schedule reports' },
      { title: 'Conversion tracking', desc: 'From lead to customer' },
      { title: 'Cohort analysis', desc: 'Compare user segments' },
      { title: 'ROI calculation', desc: 'Measure automation impact' },
      { title: 'Data export', desc: 'Export to CSV or connect to BI tools' },
    ],
    useCases: [
      { industry: 'Marketing', benefit: 'Campaign performance tracking' },
      { industry: 'Sales', benefit: 'Conversion funnel analysis' },
      { industry: 'Operations', benefit: 'Efficiency and bottleneck detection' },
    ],
  },
  'integrations': {
    title: 'Integrations',
    subtitle: '100+ app integrations to connect B9 with your existing tools.',
    icon: Globe,
    steps: [
      { title: 'Choose App', desc: 'Select from 100+ pre-built integrations' },
      { title: 'Authenticate', desc: 'Connect your account securely' },
      { title: 'Activate', desc: 'Data flows between apps instantly' },
    ],
    features: [
      { title: 'CRM sync', desc: 'HubSpot, Pipedrive, Zoho, Salesforce' },
      { title: 'Email platforms', desc: 'Gmail, Outlook, SendGrid' },
      { title: 'Webhooks', desc: 'Connect any app via webhooks' },
      { title: 'Two-way sync', desc: 'Data flows in both directions' },
      { title: 'Scheduled sync', desc: 'Hourly or daily data syncing' },
      { title: 'Error handling', desc: 'Auto-retry failed syncs' },
    ],
    useCases: [
      { industry: 'Agencies', benefit: 'Connect all client tools' },
      { industry: 'Enterprises', benefit: 'Enterprise integration hub' },
      { industry: 'SMBs', benefit: 'Unify scattered data' },
    ],
  },
  'security': {
    title: 'Enterprise Security',
    subtitle: 'Bank-level encryption and compliance for your data.',
    icon: CheckCircle2,
    steps: [
      { title: 'Encrypt', desc: '256-bit end-to-end encryption' },
      { title: 'Comply', desc: 'GDPR, SOC2, ISO 27001 certified' },
      { title: 'Audit', desc: 'Full audit logs and access controls' },
    ],
    features: [
      { title: '256-bit encryption', desc: 'Military-grade data protection' },
      { title: 'GDPR compliant', desc: 'Data privacy and user rights' },
      { title: 'SOC2 certified', desc: 'Enterprise security standards' },
      { title: 'SSO/SAML', desc: 'Enterprise authentication' },
      { title: 'Audit logs', desc: 'Track all user actions' },
      { title: 'Data residency', desc: 'Choose where your data lives' },
    ],
    useCases: [
      { industry: 'Finance', benefit: 'Regulatory compliance' },
      { industry: 'Healthcare', benefit: 'HIPAA ready' },
      { industry: 'Enterprise', benefit: 'Security and audit requirements' },
    ],
  },
  'team-collaboration': {
    title: 'Team Collaboration',
    subtitle: 'Manage teams, permissions, and workflows together.',
    icon: Users,
    steps: [
      { title: 'Invite Team', desc: 'Add team members with email' },
      { title: 'Set Roles', desc: 'Admin, Editor, Viewer permissions' },
      { title: 'Collaborate', desc: 'Build automations together' },
    ],
    features: [
      { title: 'Role-based access', desc: 'Admin, Editor, Viewer, Custom' },
      { title: 'Team workspaces', desc: 'Organize by department or project' },
      { title: 'Activity logs', desc: 'See who changed what and when' },
      { title: 'Approvals', desc: 'Require sign-off before publishing' },
      { title: 'Comments', desc: 'Discuss workflows in context' },
      { title: 'Shared libraries', desc: 'Reuse templates across team' },
    ],
    useCases: [
      { industry: 'Agencies', benefit: 'Multi-client project management' },
      { industry: 'Enterprises', benefit: 'Department collaboration' },
      { industry: 'Teams', benefit: 'Shared automation library' },
    ],
  },
  'multi-language': {
    title: 'Multi-language Support',
    subtitle: 'Reach customers in their preferred language.',
    icon: Globe,
    steps: [
      { title: 'Enable Languages', desc: 'Choose supported languages' },
      { title: 'Auto-translate', desc: 'Content auto-translates in real-time' },
      { title: 'Global Reach', desc: 'Serve customers worldwide' },
    ],
    features: [
      { title: '50+ languages', desc: 'Coverage for global audiences' },
      { title: 'Auto-detection', desc: 'Detect user language automatically' },
      { title: 'RTL support', desc: 'Arabic, Hebrew, Urdu support' },
      { title: 'Regional variants', desc: 'Spanish (Spain) vs (Mexico)' },
      { title: 'Custom translations', desc: 'Override auto-translations' },
      { title: 'Contextual translation', desc: 'Industry-specific terminology' },
    ],
    useCases: [
      { industry: 'Global SaaS', benefit: 'Reach worldwide customers' },
      { industry: 'E-commerce', benefit: 'Multi-regional stores' },
      { industry: 'Support', benefit: 'Customer support in any language' },
    ],
  },
  'api-access': {
    title: 'API Access',
    subtitle: 'Full API for custom integrations and advanced use cases.',
    icon: ExternalLink,
    steps: [
      { title: 'Get API Key', desc: 'Generate secure API credentials' },
      { title: 'Read Docs', desc: 'Comprehensive API documentation' },
      { title: 'Build', desc: 'Integrate B9 into your app' },
    ],
    features: [
      { title: 'REST API', desc: 'Standard HTTP endpoints' },
      { title: 'Webhooks', desc: 'Real-time event notifications' },
      { title: 'Rate limiting', desc: 'Generous quotas for scale' },
      { title: 'SDK libraries', desc: 'Node.js, Python, Go, more' },
      { title: 'Sandbox testing', desc: 'Test before going live' },
      { title: '24/7 API support', desc: 'Dedicated developer support' },
    ],
    useCases: [
      { industry: 'Developers', benefit: 'Custom integrations' },
      { industry: 'Enterprises', benefit: 'Deep system integration' },
      { industry: 'Agencies', benefit: 'White-label solutions' },
    ],
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-4">{children}</p>;
}

export default function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { slug } = use(params);
  const feature = featuresData[slug];

  if (!feature) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Feature not found</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="0.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo variant="dark" />

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-black/95"
            >
              <div className="px-4 py-4 space-y-3">
                <Link href="/" className="block text-sm text-gray-400 hover:text-white py-2">
                  Features
                </Link>
                <Link href="/pricing" className="block text-sm text-gray-400 hover:text-white py-2">
                  Pricing
                </Link>
                <Link href="/blog" className="block text-sm text-gray-400 hover:text-white py-2">
                  Blog
                </Link>
                <Link href="/about" className="block text-sm text-gray-400 hover:text-white py-2">
                  About
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm mb-6">
              <Icon className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-medium text-gray-300">{feature.title}</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {feature.title}
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              {feature.subtitle}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <button className="px-6 py-3 rounded-lg bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all">
                Book Demo Call
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>How It Works</SectionLabel>
              <h2 className="text-4xl font-bold">Get started in minutes</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {feature.steps.map((step, idx) => (
              <motion.div key={idx} variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* KEY FEATURES GRID */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>What You Get</SectionLabel>
              <h2 className="text-4xl font-bold">Powerful features</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {feature.features.map((feat, idx) => (
              <motion.div key={idx} variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-white/[0.15] transition-all">
                <CheckCircle2 className="h-6 w-6 text-gray-500 mb-3" />
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-400">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Use Cases</SectionLabel>
              <h2 className="text-4xl font-bold">Who benefits</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {feature.useCases.map((useCase, idx) => (
              <motion.div key={idx} variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <h3 className="text-xl font-bold mb-3">{useCase.industry}</h3>
                <p className="text-gray-400">{useCase.benefit}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-12 lg:p-16 text-center"
          >
            <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to automate?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Start with a free 7-day trial. No credit card required. Full access to all features.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                  Start Free Trial
                </button>
              </Link>
              <button className="px-8 py-3 rounded-lg bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all">
                Book Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-white/[0.04]">
            <div>
              <div className="mb-4">
                <Logo variant="dark" />
              </div>
              <p className="text-sm text-gray-600 mt-4 max-w-xs leading-relaxed">
                AI automation for Indian businesses. No code. Pure automation.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { icon: <Globe className="h-4 w-4" />, label: 'Website' },
                  { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
                  { icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
                  { icon: <Youtube className="h-4 w-4" />, label: 'YouTube' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-gray-600 hover:text-white hover:border-white/[0.15] transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {Object.entries({
                  Features: '/features',
                  Pricing: '/pricing',
                  Blog: '/blog',
                  Changelog: '/changelog',
                  Integrations: '/integrations',
                  'API Docs': '/api-docs',
                }).map(([link, href]) => (
                  <li key={link}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {['About Us', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {['Help Center', 'Book a Demo', 'Community', 'Status Page', 'Roadmap'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-gray-700">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p>Made with ♥ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
