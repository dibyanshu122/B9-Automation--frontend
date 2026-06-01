'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MarketingCta, MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { ArrowRight, Bot, Sparkles, Workflow, MessageSquare, Camera, Facebook, Megaphone, Users, CreditCard, Globe, Code2, CheckCircle2, FileText } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

type CategoryFeature = { icon: React.ComponentType<{ className?: string }>; slug: string; title: string; desc: string; bullets: string[]; color: string };
type Category = { id: string; label: string; desc: string; features: CategoryFeature[] };

const CATEGORIES: Category[] = [
  {
    id: 'ai-core',
    label: 'AI Core',
    desc: 'Powered by DeepSeek Agentic Core',
    features: [
      {
        icon: Bot, slug: 'whatsapp-agentic-ai', title: 'Agentic WhatsApp AI',
        desc: 'AI receives, qualifies, sells, and follows up on WhatsApp',
        bullets: ['Intent classification + autonomous tool calling', 'Sends catalog & Razorpay payment links auto', '24h compliance + durable opt-out enforcement'],
        color: 'emerald',
      },
      {
        icon: Sparkles, slug: 'ai-template-builder', title: 'AI Template Builder',
        desc: 'Describe a campaign, AI drafts approved Meta template instantly',
        bullets: ['Plain English → Meta-approved template in 10s', '10 Indian languages + all template types', 'Rejection reason shown + one-click resubmit'],
        color: 'violet',
      },
      {
        icon: Workflow, slug: 'visual-automation-builder', title: 'Visual Flow Canvas',
        desc: '37-node drag-and-drop canvas: Trigger → AI → Action',
        bullets: ['37 node types: AI, condition, wait, webhook, loop', 'AI-generated flows from plain English description', 'Test mode + output inspector + A/B split'],
        color: 'blue',
      },
    ],
  },
  {
    id: 'channels',
    label: 'Channels',
    desc: 'Official Meta Cloud API integrations',
    features: [
      {
        icon: MessageSquare, slug: 'whatsapp-automation', title: 'WhatsApp Automation',
        desc: 'Automated reply sequences, rule engine, keyword triggers',
        bullets: ['Keyword reply, welcome, out-of-office rules', 'Opt-out handling + stop-after-first-match', 'Auto-assign to team by keyword or label'],
        color: 'emerald',
      },
      {
        icon: Camera, slug: 'instagram-dm', title: 'Instagram DM Automation',
        desc: 'Auto-reply to Instagram DMs and capture leads',
        bullets: ['Official Meta Graph API — zero ban risk', 'Quick reply buttons + AI assistant routing', 'Every DM auto-creates a CRM lead'],
        color: 'pink',
      },
      {
        icon: Facebook, slug: 'facebook-lead-ads', title: 'Facebook Lead Ads',
        desc: 'Auto-capture leads from Facebook forms into CRM',
        bullets: ['Real-time webhook — lead in CRM in under 2s', 'WhatsApp follow-up sent automatically', 'Multiple ad forms + Google Sheets sync'],
        color: 'blue',
      },
    ],
  },
  {
    id: 'business-tools',
    label: 'Business Tools',
    desc: 'Sales, revenue, and operations automation',
    features: [
      {
        icon: Megaphone, slug: 'campaigns', title: 'Broadcast Campaigns',
        desc: 'Bulk WhatsApp campaigns with A/B testing and analytics',
        bullets: ['Hot/warm/cold segment targeting', 'A/B test + schedule + retry failed sends', 'Per-lead delivery status + analytics'],
        color: 'orange',
      },
      {
        icon: CreditCard, slug: 'payments', title: 'Razorpay Payments',
        desc: 'Send payment links via WhatsApp, track orders and invoices',
        bullets: ['Auto payment link on buy intent detection', 'GST invoice auto-generated on payment', 'Lead moves to "Won" + WhatsApp receipt'],
        color: 'emerald',
      },
      {
        icon: FileText, slug: 'templates', title: 'Meta Templates',
        desc: 'Create, submit, and manage WhatsApp approved templates',
        bullets: ['Standard, carousel, LTO, authentication types', '20 curated templates for Indian businesses', 'Rejection reason shown + resubmit in 1 click'],
        color: 'violet',
      },
      {
        icon: Users, slug: 'crm', title: 'Leads & CRM',
        desc: 'Lead pipeline, scoring, memory, and lifecycle tracking',
        bullets: ['AI hot/warm/cold scoring from conversation', 'Conversation memory across sessions', 'CSV export + Google Sheets real-time sync'],
        color: 'teal',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    desc: 'Embed, extend, and integrate',
    features: [
      {
        icon: Globe, slug: 'widget', title: 'Website Widget',
        desc: 'Embed AI sales assistant on your website — captures leads instantly',
        bullets: ['One script tag embed — no developer needed', 'Answers from your PDFs with source citations', 'Lead captured → WhatsApp follow-up auto-sent'],
        color: 'cyan',
      },
      {
        icon: Code2, slug: 'api', title: 'REST API',
        desc: 'Full API v1 with 22 scopes for custom integrations',
        bullets: ['22 permission scopes — granular access control', 'Leads, messages, campaigns, automations endpoints', 'curl / JavaScript / Python code examples'],
        color: 'gray',
      },
    ],
  },
];

const COLOR_MAP: Record<string, { badge: string; icon: string; dot: string; bullet: string }> = {
  emerald: { badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400', dot: 'bg-emerald-500', bullet: 'bg-emerald-500/60' },
  violet:  { badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',   icon: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-400',   dot: 'bg-violet-500',  bullet: 'bg-violet-500/60'  },
  blue:    { badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',         icon: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-400',         dot: 'bg-blue-500',    bullet: 'bg-blue-500/60'    },
  amber:   { badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      icon: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-400',      dot: 'bg-amber-500',   bullet: 'bg-amber-500/60'   },
  pink:    { badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',         icon: 'border-pink-500/20 bg-pink-500/[0.08] text-pink-400',         dot: 'bg-pink-500',    bullet: 'bg-pink-500/60'    },
  orange:  { badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',   icon: 'border-orange-500/20 bg-orange-500/[0.08] text-orange-400',   dot: 'bg-orange-500',  bullet: 'bg-orange-500/60'  },
  teal:    { badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',         icon: 'border-teal-500/20 bg-teal-500/[0.08] text-teal-400',         dot: 'bg-teal-500',    bullet: 'bg-teal-500/60'    },
  indigo:  { badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',   icon: 'border-indigo-500/20 bg-indigo-500/[0.08] text-indigo-400',   dot: 'bg-indigo-500',  bullet: 'bg-indigo-500/60'  },
  cyan:    { badge: 'bg-[#00F2FE]/10 border-[#00F2FE]/20 text-[#00F2FE]',     icon: 'border-[#00F2FE]/20 bg-[#00F2FE]/[0.08] text-[#00F2FE]',     dot: 'bg-[#00F2FE]',   bullet: 'bg-[#00F2FE]/60'   },
  gray:    { badge: 'bg-white/10 border-white/20 text-gray-300',               icon: 'border-white/[0.08] bg-white/[0.04] text-gray-300',           dot: 'bg-gray-400',    bullet: 'bg-zinc-500/60'    },
};

export default function FeaturesPage() {
  const totalFeatures = CATEGORIES.reduce((sum, c) => sum + c.features.length, 0);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-feat" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-feat)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="relative border-b border-white/[0.04] px-6 pb-24 pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-5">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                All Features Live
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              {totalFeatures} features. All live. All working today.
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400">
              B9 Automation is India's WhatsApp Agentic OS — AI that talks to customers, qualifies leads, sends catalogs, collects payments, and follows up with review-first controls.
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:text-white"
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sticky category nav */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-[#00F2FE]/[0.05] hover:text-[#00F2FE]"
              >
                {cat.label}
                <span className="ml-1.5 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {cat.features.length}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Feature sections */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id} id={cat.id} className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section header */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="mb-10"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
                  {cat.label}
                </h2>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs font-bold text-zinc-500">
                  {cat.features.length} features
                </span>
              </motion.div>
              <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                {cat.desc}
              </motion.p>
            </motion.div>

            {/* Cards grid */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {cat.features.map((f) => {
                const colors = COLOR_MAP[f.color] ?? COLOR_MAP.gray;
                const Icon = f.icon;

                return (
                  <motion.div key={`${cat.id}-${f.slug}-${f.title}`} variants={fadeUp}>
                    <Link href={`/features/${f.slug}`} className="group block h-full">
                      <div className="relative flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/25 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.04)]">
                        {/* Inner glow */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Icon + live badge */}
                        <div className="relative flex items-center justify-between mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colors.icon} transition-transform duration-300 group-hover:scale-110`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${colors.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${colors.dot}`} />
                            LIVE
                          </span>
                        </div>

                        <h3 className="relative text-base font-bold text-white">{f.title}</h3>
                        <p className="relative mt-1.5 text-sm leading-relaxed text-zinc-400">{f.desc}</p>

                        {/* Bullet points */}
                        <ul className="relative mt-4 flex-1 space-y-2">
                          {f.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2">
                              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.bullet}`} />
                              <span className="text-xs leading-relaxed text-zinc-500">{b}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="relative mt-5 flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-all duration-300 group-hover:gap-2 group-hover:text-[#00F2FE]/80">
                          Explore feature <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      ))}

      {/* Trust banner */}
      <section className="relative border-b border-white/[0.04] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-[#00F2FE]/10 bg-[#00F2FE]/[0.02] p-8 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { icon: '🔒', title: 'Official Meta Cloud API', desc: 'All WhatsApp/Instagram/Facebook connections go through Meta official Cloud API — no unofficial workarounds.' },
                { icon: '🛡️', title: 'Opt-out Compliant', desc: 'STOP detection, durable opt-out records, 24-hour window enforcement — Meta-compliant by default.' },
                { icon: '🇮🇳', title: 'Built for India', desc: '10 Indian languages, Razorpay payments, IndiaMART leads, ₹ pricing — designed for the Indian market.' },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                  <span className="shrink-0 text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2
              variants={fadeUp}
              className="mb-10 text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500"
            >
              Common questions
            </motion.h2>
            <div className="space-y-4">
              {[
                ['Which features are available?', `B9 includes ${totalFeatures} product capabilities. Live provider actions require the relevant account connection, health check, and plan access.`],
                ['Does B9 work with official WhatsApp Business API?', 'Yes. B9 uses the official Meta Cloud API (not unofficial methods). You connect your own Meta WABA — your number, your data.'],
                ['Can the AI autonomously handle customer conversations?', 'Yes. The Agentic WhatsApp AI classifies intent, calls tools (catalog, payment, knowledge base), and sends replies — no human needed for most queries.'],
                ['How does AI Template Builder work?', 'Describe your campaign in plain English (e.g. "Diwali sale 20% off"). AI drafts a Meta-compliant WhatsApp template with variables, header, footer, and buttons — ready to submit for approval.'],
                ['Is my customer data private?', 'Yes. Tokens are encrypted with PBKDF2-HMAC-256. Customer conversations stay in your workspace. We never read your messages.'],
              ].map(([q, a]) => (
                <motion.div key={q} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#00F2FE]/20">
                  <h3 className="flex items-center gap-2 font-bold text-white">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                      <CheckCircle2 className="h-3 w-3 text-[#00F2FE]" />
                    </div>
                    {q}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingCta variant="dark" />
      <MarketingFooter variant="dark" />
    </div>
  );
}
