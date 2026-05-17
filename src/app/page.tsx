'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { SplineViewer } from '@/components/spline-viewer';
import { featureHighlights, workflowSteps, trustPoints, blogPosts, allFeatures } from '@/lib/marketing';
import {
  ArrowRight, Bot, Brain, Building2, ChevronDown, FileText, MessageCircle, Sparkles, Users,
  CheckCircle2, Globe, Mail, Linkedin, Instagram, Youtube, ExternalLink,
  Menu, X,
} from 'lucide-react';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Inline data
const faqs = [
  {
    q: 'What is B9 Automation?',
    a: 'B9 Automation is an AI-powered no-code platform that automates customer interactions across WhatsApp, email, chat, and more. Set up AI chatbots, lead capture, automation workflows, and customer support in minutes without writing code.',
  },
  {
    q: 'Do I need coding knowledge to use B9?',
    a: 'No. B9 is a completely no-code platform. If you can describe what you want, our visual builder handles the rest. Thousands of non-technical users have deployed automations successfully.',
  },
  {
    q: 'Which platforms does B9 integrate with?',
    a: 'WhatsApp, Gmail, Google Sheets, Telegram, Slack, Calendly, Zoho CRM, HubSpot, Razorpay, Twilio, Google Drive, WordPress, and 100+ others via Webhooks and Zapier.',
  },
  {
    q: 'How does the AI learn my business?',
    a: 'Upload your documents, FAQs, product catalog, URLs, or YouTube links. Our AI reads and understands everything, then answers customer questions with citations pointing to the source.',
  },
  {
    q: 'Can I use B9 for multiple businesses?',
    a: 'Yes. Our Pro and Agency plans support multiple workspaces. Manage unlimited businesses from one dashboard.',
  },
  {
    q: 'Is my customer data safe?',
    a: 'Absolutely. Data is encrypted at rest and in transit using 256-bit encryption. We never train our AI models on your data. Full GDPR, SOC2, and ISO 27001 compliance.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'You can upgrade to a paid plan or stay on our free tier with limited queries. No hidden charges, cancel anytime.',
  },
  {
    q: 'Do you offer onboarding or support?',
    a: 'Yes. We provide video tutorials, documentation, live chat support, and free 30-minute onboarding calls for paid plans.',
  },
  {
    q: 'Can I build WhatsApp bot automation?',
    a: 'Yes. B9 fully integrates with WhatsApp Business API. Build broadcast campaigns, automated sequences, intelligent routing, and approval workflows.',
  },
  {
    q: 'What if I need a custom integration?',
    a: 'Use our Webhook feature to connect ANY external tool or API. Full REST API available for custom integrations.',
  },
];

const liveIntegrations = [
  { label: 'WhatsApp Business', icon: '💬', desc: 'Send messages via Meta API' },
  { label: 'Gmail', icon: '📧', desc: 'Sync & send emails' },
  { label: 'Google Sheets', icon: '📊', desc: 'Push leads to sheets' },
  { label: 'Facebook Lead Ads', icon: '📘', desc: 'Auto-capture form leads' },
  { label: 'Instagram DM', icon: '📸', desc: 'Auto-reply to DMs' },
  { label: 'Razorpay', icon: '💳', desc: 'Payment triggers' },
  { label: 'Webhooks', icon: '🪝', desc: 'Any external tool' },
];

const comingIntegrations = [
  { label: 'Telegram', icon: '🤖' },
  { label: 'Slack', icon: '💼' },
  { label: 'Calendly', icon: '📅' },
  { label: 'Zoho CRM', icon: '🏠' },
  { label: 'Zapier', icon: '🎯' },
  { label: 'HubSpot', icon: '🟠' },
  { label: 'Twilio SMS', icon: '📱' },
  { label: 'Google Calendar', icon: '🗓' },
];

const extendedUseCases = [
  {
    industry: 'Coaching Centers',
    icon: Brain,
    flow: 'Inquiry → AI qualifies → Schedules demo → Books slot → Sends WhatsApp reminder',
    stat: '3x More Demo Bookings',
  },
  {
    industry: 'Real Estate',
    icon: Building2,
    flow: 'Inquiry → Shares property details → Schedule site visit → CRM auto-update',
    stat: '60% Faster Response',
  },
  {
    industry: 'Gyms & Salons',
    icon: Users,
    flow: 'Walk-in inquiry → Shows pricing → Books appointment → Sends reminder',
    stat: 'Zero Missed Bookings',
  },
  {
    industry: 'Agencies',
    icon: Sparkles,
    flow: 'Lead visits → AI qualifies → Auto-sends proposal → Schedules follow-up',
    stat: '5x Faster Onboarding',
  },
];


function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-4">{children}</p>;
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  // Suppress Spline viewer console errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalError = console.error.bind(console);
      console.error = (...args: any[]) => {
        if (
          args[0]?.message?.includes('buildTimeline') ||
          args[0]?.toString?.().includes('spline') ||
          args[0]?.toString?.().includes('Missing property')
        ) {
          return;
        }
        originalError(...args);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* JSON-LD structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'B9 Automation',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'AI-powered WhatsApp bot, lead capture, and business automation platform for Indian SMEs.',
          url: 'https://b9automation.com',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          author: { '@type': 'Organization', name: 'B9 Automation', url: 'https://b9automation.com' },
        })}}
      />
      <style>{`
        spline-viewer::part(button), spline-viewer::part(logo), spline-viewer::part(hint),
        spline-viewer button, spline-viewer .logo, spline-viewer .hint,
        spline-viewer a, spline-viewer #logo,
        [data-spline-logo], .spline-logo, .spline-hint {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10">
        <svg className="absolute inset-0 h-full w-full opacity-[0.01]" xmlns="http://www.w3.org/2000/svg">
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

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button onClick={() => setFeaturesOpen(!featuresOpen)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                Features
                <ChevronDown className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-2 w-96 rounded-xl border border-white/10 bg-black/95 p-4 shadow-2xl max-h-[500px] overflow-y-auto"
                    onMouseLeave={() => setFeaturesOpen(false)}
                  >
                    <div className="space-y-2">
                      {allFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Link
                            key={f.title}
                            href={f.href}
                            onClick={() => setFeaturesOpen(false)}
                            className="flex gap-3 rounded-lg p-2 hover:bg-white/5 transition group"
                          >
                            <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-300 group-hover:text-white">{f.title}</p>
                              <p className="text-xs text-gray-600 group-hover:text-gray-500">{f.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-black/95"
            >
              <div className="px-4 py-4 space-y-3">
                <Link href="/features" className="block text-sm text-gray-400 hover:text-white py-2">
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
                <Link href="/login" className="block py-2">
                  <Button variant="secondary" size="sm" className="w-full bg-transparent text-gray-400 border-0">
                    Log In
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO — Full Screen with 3D Orb */}
      <section className="relative h-screen min-h-[700px] overflow-hidden border-b border-white/[0.06] bg-black">
        {/* Spline 3D Viewer - Right Side */}
        <div className="absolute top-0 right-0 bottom-0 left-[45%] z-0">
          <SplineViewer
            scene="https://prod.spline.design/3rBV1FmC9K7vx6ax/scene.splinecode"
            className="absolute inset-0 w-full h-full"
          />
          {/* Cover "Built with Spline" watermark — bottom-right of viewer */}
          <div className="absolute bottom-0 right-0 w-[260px] h-24 z-20 pointer-events-auto bg-black" />
        </div>

        {/* Background match — fill right side black before Spline loads */}
        <div className="absolute top-0 right-0 bottom-0 left-[45%] bg-black z-[-1]" />

        {/* Blend Gradients — left edge, top, bottom, right */}
        <div className="absolute inset-y-0 left-[43%] w-80 bg-gradient-to-r from-black to-transparent z-[1] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-[1] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black to-transparent z-[1] pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-[1] pointer-events-none" />
        {/* Hide "Move your mouse" text */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: 'radial-gradient(ellipse 25% 15% at 73% 50%, rgba(0,0,0,0.85) 0%, transparent 100%)' }} />

        {/* Hero Text — Left Side */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-[3] h-full flex flex-col justify-center pl-14 sm:pl-16 lg:pl-24 pr-4 max-w-2xl"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 self-start ml-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm mb-6"
          >
            <Sparkles className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-400">AI Automation Platform</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
          >
            Automate Everything.
            <br />
            <span className="text-gray-500">Grow Faster.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-8 text-lg text-gray-400 max-w-xl leading-relaxed"
          >
            B9 Automation powers WhatsApp bots, lead capture, AI customer support, and document intelligence for modern Indian businesses. No code. Pure automation.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/signup?demo=1">
              <button className="px-6 py-3 rounded-lg bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all">
                Book Demo Call
              </button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4 text-sm text-gray-500">
            {['✓ 14-day free trial', '✓ No credit card', '✓ Setup in 5 mins'].map((b) => (
              <span key={b}>{b}</span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-gray-600 mb-8">
            Used across 100+ Indian businesses
          </p>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {[
              'Coaching Centers',
              'Real Estate Firms',
              'Gyms & Fitness',
              'Salons & Spas',
              'IT Agencies',
              'E-commerce Stores',
              'Clinics & Healthcare',
              'Legal Practices',
              'Fintech Startups',
              'Educational Institutes',
            ].map((industry) => (
              <div
                key={industry}
                className="px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-gray-500 text-sm font-medium"
              >
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <SectionLabel>Core Capabilities</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Four powerful tools in one</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              {
                title: 'AI Website Chatbot',
                desc: 'Deploy a trained AI chatbot on your website. Answers customer questions 24/7 from your documents, FAQs, and knowledge base.',
                tag: 'Live on your site',
                icon: Bot,
              },
              {
                title: 'WhatsApp Automation',
                desc: 'Send automated follow-ups, broadcast campaigns, and handle customer queries on WhatsApp without lifting a finger.',
                tag: 'Send at scale',
                icon: MessageCircle,
              },
              {
                title: 'Smart Lead Capture',
                desc: 'Capture, qualify, and route leads automatically. Integrate with your CRM, Google Sheets, or Zoho in one click.',
                tag: 'Zero lost leads',
                icon: Users,
              },
              {
                title: 'Document Intelligence',
                desc: 'Upload PDFs, Word files, presentations, and URLs. Your AI reads everything and answers instantly with source citations.',
                tag: 'Search everything',
                icon: FileText,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 lg:p-8 backdrop-blur-sm hover:border-primary-500/20 hover:bg-white/[0.06] transition-all duration-300 shadow-xl shadow-black/20"
                >
                  <Icon className="h-6 w-6 text-gray-400" />
                  <h3 className="mt-4 text-xl font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{card.desc}</p>
                  <span className="mt-4 inline-block rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    {card.tag}
                  </span>
                  {i === 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-black border border-white/10 text-xs space-y-2 font-mono">
                      <div className="text-gray-500">
                        Customer: <span className="text-gray-300">"What are your pricing plans?"</span>
                      </div>
                      <div className="text-gray-500">
                        Bot: <span className="text-gray-300">"Our plans start at ₹999/mo..."</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* DEEP FEATURES 6-GRID */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <SectionLabel>Deep Features</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-bold">Every tool you need to scale</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]"
          >
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="bg-black p-8 lg:p-10 group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — Sticky */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <motion.div variants={fadeUp}>
                <SectionLabel>How It Works</SectionLabel>
                <h2 className="text-4xl font-bold max-w-sm">Set up in minutes, scale in days</h2>
                <p className="text-gray-400 mt-4 text-lg">No complex setup. B9 learns your business and starts automating instantly.</p>
                <Link href="/signup" className="mt-6 inline-block">
                  <Button className="bg-white text-black hover:bg-gray-100">Start Building →</Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Steps */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-12"
            >
              {workflowSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.title} variants={fadeUp} className="relative pl-16">
                    <div className="absolute left-0 top-0 h-10 w-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
                      {i + 1}
                    </div>
                    {i < workflowSteps.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
                    )}
                    <div>
                      <Icon className="h-5 w-5 text-gray-400 mb-2" />
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-gray-400 text-sm">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* AUTOMATION SPOTLIGHT — Robot 3D */}
      <section className="py-0 border-b border-white/[0.06] bg-black overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-screen">
          {/* Left — Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
          >
            <div className="max-w-md">
              <motion.div variants={fadeUp}>
                <SectionLabel>Workflow Automation</SectionLabel>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Your business runs 24/7.
                  <br />
                  <span className="text-gray-500">Even when you don't.</span>
                </h2>
                <p className="mt-6 text-gray-400 text-lg">Set up automation workflows once. B9 handles lead capture, follow-ups, appointment booking, and support while you focus on growing.</p>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 space-y-3">
                {[
                  'Automated WhatsApp sequences',
                  'AI-powered lead qualification',
                  'Multi-channel response routing',
                  'Smart escalation to humans',
                  'Real-time analytics dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-sm text-gray-400">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right — 3D Robot Scene */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative h-[500px] lg:h-full overflow-hidden"
          >
            <SplineViewer
              scene="https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode"
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            {/* Cover "Built with Spline" watermark - bottom right */}
            <div className="absolute bottom-0 right-0 w-[240px] h-20 bg-black z-20 pointer-events-auto" />
          </motion.div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <SectionLabel>Integrations</SectionLabel>
              <h2 className="text-4xl lg:text-5xl font-bold">Connects to your stack</h2>
              <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
                WhatsApp, Gmail, Google Sheets, Facebook, Instagram and more — live today. More integrations shipping every month.
              </p>
            </motion.div>
          </div>

          {/* Live integrations — card grid */}
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live Now
            </p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-10"
            >
              {liveIntegrations.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 hover:border-emerald-500/25 hover:bg-emerald-500/[0.07] transition-all cursor-default"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-200">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Coming soon integrations — card grid */}
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500/70 mb-6 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70 inline-block" />
              Coming Soon
            </p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {comingIntegrations.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 opacity-60"
                >
                  <span className="text-2xl grayscale mb-2 block">{item.icon}</span>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <span className="mt-2 inline-block rounded-full bg-amber-500/10 text-amber-500/70 px-2 py-0.5 text-[9px] font-bold">Soon</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <SectionLabel>Use Cases</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Built for businesses that move fast</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {extendedUseCases.map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.industry}
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-white/[0.08] overflow-hidden p-8 backdrop-blur-sm hover:border-white/[0.18] hover:shadow-lg hover:shadow-black/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background:
                        idx === 0
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 100%)'
                          : idx === 1
                            ? 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, transparent 100%)'
                            : idx === 2
                              ? 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, transparent 100%)'
                              : 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, transparent 100%)',
                    }}
                  />
                  <Icon className="h-6 w-6 text-gray-400 relative z-10" />
                  <h3 className="mt-4 text-2xl font-semibold relative z-10">{useCase.industry}</h3>
                  <p className="mt-3 text-gray-500 text-sm leading-relaxed relative z-10">{useCase.flow}</p>
                  <div className="mt-4 inline-block rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-gray-500 relative z-10">
                    {useCase.stat}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* PRIVACY & TRUST */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black relative">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-white/[0.015] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <SectionLabel>Security & Privacy</SectionLabel>
              <h2 className="text-4xl lg:text-5xl font-bold">Your data. Your rules. Always.</h2>
              <p className="mt-4 text-gray-400 text-lg">Enterprise-grade security with GDPR, SOC2, and ISO 27001 compliance.</p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{point.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex flex-wrap gap-4 justify-center">
            {['GDPR Ready', 'SOC2 Compliant', '256-bit Encryption', 'ISO 27001'].map((badge) => (
              <div
                key={badge}
                className="rounded-full border border-white/[0.08] px-4 py-2 text-xs text-gray-600 font-medium"
              >
                ✓ {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-4xl font-bold">Frequently asked questions</h2>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-2"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                variants={fadeUp}
                className="rounded-xl border border-white/[0.07] overflow-hidden hover:border-white/[0.12] transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.01] transition-colors"
                >
                  <p className="text-base font-medium text-white pr-4">{faq.q}</p>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-600 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-500 text-sm leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BLOG POSTS */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <SectionLabel>Blog</SectionLabel>
              <h2 className="text-4xl font-bold">Latest updates</h2>
            </motion.div>
            <a href="/blog" className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-300 transition-colors">
              Read all <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {blogPosts.slice(0, 4).map((post) => (
              <motion.a
                key={post.title}
                href="/blog"
                variants={fadeUp}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 lg:p-8 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300 group flex flex-col"
              >
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-gray-500">Automation</span>
                  <span>•</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US')}</span>
                </div>
                <h3 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{post.description}</p>
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors flex items-center gap-1">
                  Read article <ArrowRight className="h-3 w-3" />
                </span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] bg-black relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-12 lg:p-16 text-center"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Get Started</SectionLabel>
              <h2 className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                Start automating today.
              </h2>
              <p className="text-xl text-gray-400 mt-6 max-w-2xl mx-auto">
                Join 100+ Indian businesses who save 20+ hours per week with B9 Automation.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-white text-black hover:bg-gray-100">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup?demo=1">
                <Button size="lg" className="bg-white/5 text-white border border-white/10 hover:bg-white/10">
                  Book a Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['14-day free trial', 'No credit card required', 'Setup in under 5 minutes'].map((badge) => (
                <span key={badge}>✓ {badge}</span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-white/[0.04]">
            {/* Column 1 */}
            <div>
              <div className="mb-4">
                <Logo variant="dark" />
              </div>
              <p className="text-sm text-gray-600 mt-4 max-w-xs leading-relaxed">
                AI automation for Indian businesses. WhatsApp bots, lead capture, AI chat, and document intelligence — all in one platform.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { icon: <Globe className="h-4 w-4" />, label: 'Website', href: 'https://b9automation.com' },
                  { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn', href: 'https://linkedin.com/company/b9automation' },
                  { icon: <Instagram className="h-4 w-4" />, label: 'Instagram', href: 'https://instagram.com/b9automation' },
                  { icon: <Youtube className="h-4 w-4" />, label: 'YouTube', href: 'https://youtube.com/@b9automation' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-gray-600 hover:text-white hover:border-white/[0.15] transition-all"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 */}
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

            {/* Column 3 */}
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Careers', href: '/about#careers' },
                  { label: 'Contact', href: 'mailto:hello@b9automation.com' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {[
                  { label: 'Help Center', href: 'mailto:hello@b9automation.com' },
                  { label: 'Book a Demo', href: '/signup?demo=1' },
                  { label: 'Community', href: 'https://wa.me/919999999999' },
                  { label: 'Status Page', href: 'https://b9automation.com' },
                  { label: 'Roadmap', href: '/blog' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm">
                <a href="mailto:hello@b9automation.com" className="flex items-center gap-2 text-gray-600 hover:text-gray-300">
                  <Mail className="h-4 w-4" />
                  hello@b9automation.com
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-gray-700">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p>Made with ♥ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
