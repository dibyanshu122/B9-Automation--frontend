'use client';

import Link from 'next/link';
import { Button } from '@/components/button';
import { MarketingCta, MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { ArrowRight, Bot, Sparkles, Workflow, BookOpen, MessageSquare, Camera, Facebook, Megaphone, Users, CreditCard, Package, Globe, LayoutDashboard, Code2, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'ai-core',
    label: 'AI Core',
    desc: 'Powered by DeepSeek Agentic Core',
    features: [
      {
        icon: Bot,
        slug: 'whatsapp-agentic-ai',
        title: 'Agentic WhatsApp AI',
        desc: 'AI that autonomously classifies intent, calls tools, sends catalogs, creates payment links — without human input.',
        color: 'emerald',
      },
      {
        icon: Sparkles,
        slug: 'ai-template-builder',
        title: 'AI Template Builder',
        desc: 'Describe your campaign in plain English — AI drafts a Meta-approved WhatsApp template in 10 Indian languages.',
        color: 'violet',
      },
      {
        icon: Workflow,
        slug: 'visual-automation-builder',
        title: 'AI Flow Builder',
        desc: '37-node drag-drop canvas. Describe your flow in text and AI generates the entire automation instantly.',
        color: 'blue',
      },
      {
        icon: BookOpen,
        slug: 'widget',
        title: 'Knowledge Base AI',
        desc: 'Upload PDFs, URLs, YouTube links — AI learns from your content and answers customer questions with citations.',
        color: 'amber',
      },
    ],
  },
  {
    id: 'channels',
    label: 'Channels',
    desc: 'Official Meta Cloud API integrations',
    features: [
      {
        icon: MessageSquare,
        slug: 'whatsapp-automation',
        title: 'WhatsApp Automation',
        desc: 'Keyword replies, welcome messages, out-of-hours responses — all via official Meta Cloud API.',
        color: 'emerald',
      },
      {
        icon: Camera,
        slug: 'instagram-dm',
        title: 'Instagram DM',
        desc: 'Auto-reply to DMs, capture leads, route to AI assistant — no manual inbox monitoring required.',
        color: 'pink',
      },
      {
        icon: Facebook,
        slug: 'facebook-lead-ads',
        title: 'Facebook Lead Ads',
        desc: 'Real-time lead form capture → CRM → instant WhatsApp follow-up. Zero manual effort.',
        color: 'blue',
      },
    ],
  },
  {
    id: 'business-tools',
    label: 'Business Tools',
    desc: 'Everything to run sales and operations',
    features: [
      {
        icon: Megaphone,
        slug: 'campaigns',
        title: 'Broadcast Campaigns',
        desc: 'Send to hot/warm/cold segments with A/B testing, scheduling, retry logic and delivery analytics.',
        color: 'orange',
      },
      {
        icon: Users,
        slug: 'crm',
        title: 'CRM & Leads',
        desc: 'AI scores every lead 0–10, tracks pipeline stages, schedules follow-ups, exports CSV or syncs Sheets.',
        color: 'teal',
      },
      {
        icon: CreditCard,
        slug: 'payments',
        title: 'Razorpay Payments',
        desc: 'AI detects buy intent → creates payment link → sends via WhatsApp → marks lead "won" on payment.',
        color: 'emerald',
      },
      {
        icon: Package,
        slug: 'catalog',
        title: 'Product Catalog',
        desc: 'Upload products or sync from Meta. AI detects buy intent and sends the right catalog card automatically.',
        color: 'violet',
      },
      {
        icon: Globe,
        slug: 'widget',
        title: 'Website Sales Widget',
        desc: 'Embeddable AI assistant captures visitors as leads and starts a WhatsApp follow-up — one script tag.',
        color: 'blue',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    desc: 'Developer & integration tools',
    features: [
      {
        icon: LayoutDashboard,
        slug: 'visual-automation-builder',
        title: 'Visual Canvas (37 nodes)',
        desc: 'Full drag-drop automation builder with test mode, A/B split, webhook triggers and visual debug.',
        color: 'indigo',
      },
      {
        icon: Code2,
        slug: 'api',
        title: 'REST API v1',
        desc: '22 scopes, clean versioned routes, API key auth, request logs — connect any external tool.',
        color: 'gray',
      },
    ],
  },
];

const COLOR_MAP: Record<string, { badge: string; hover: string; icon: string; dot: string }> = {
  emerald: { badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', hover: 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]', icon: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
  violet:  { badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',   hover: 'hover:border-violet-500/30 hover:bg-violet-500/[0.04]',   icon: 'bg-violet-500/10 text-violet-400',   dot: 'bg-violet-500'  },
  blue:    { badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',          hover: 'hover:border-blue-500/30 hover:bg-blue-500/[0.04]',          icon: 'bg-blue-500/10 text-blue-400',          dot: 'bg-blue-500'    },
  amber:   { badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',       hover: 'hover:border-amber-500/30 hover:bg-amber-500/[0.04]',       icon: 'bg-amber-500/10 text-amber-400',       dot: 'bg-amber-500'   },
  pink:    { badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',          hover: 'hover:border-pink-500/30 hover:bg-pink-500/[0.04]',          icon: 'bg-pink-500/10 text-pink-400',          dot: 'bg-pink-500'    },
  orange:  { badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',    hover: 'hover:border-orange-500/30 hover:bg-orange-500/[0.04]',    icon: 'bg-orange-500/10 text-orange-400',    dot: 'bg-orange-500'  },
  teal:    { badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',          hover: 'hover:border-teal-500/30 hover:bg-teal-500/[0.04]',          icon: 'bg-teal-500/10 text-teal-400',          dot: 'bg-teal-500'    },
  indigo:  { badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',    hover: 'hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]',    icon: 'bg-indigo-500/10 text-indigo-400',    dot: 'bg-indigo-500'  },
  gray:    { badge: 'bg-white/10 border-white/20 text-gray-300',                hover: 'hover:border-white/20 hover:bg-white/[0.04]',                icon: 'bg-white/10 text-gray-300',                dot: 'bg-gray-400'    },
};

export default function FeaturesPage() {
  const totalFeatures = CATEGORIES.reduce((sum, c) => sum + c.features.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">All Features</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-bold text-white leading-tight">
            {totalFeatures} features. All live. All working today.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            B9 Automation is India's WhatsApp Agentic OS — AI that talks to customers, qualifies leads, sends catalogs, collects payments, and follows up. No "Coming Soon". No fake demos.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup">
              <Button>
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="secondary">See How It Works</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky category nav */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {cat.label}
                <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {cat.features.length}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Feature sections */}
      {CATEGORIES.map((cat, ci) => (
        <section
          key={cat.id}
          id={cat.id}
          className={`px-4 py-20 sm:px-6 lg:px-8 ${ci % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'}`}
        >
          <div className="mx-auto max-w-7xl">
            {/* Section header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{cat.label}</h2>
                <span className="rounded-full bg-white/10 border border-white/10 text-gray-400 px-2.5 py-0.5 text-xs font-bold">
                  {cat.features.length} features
                </span>
              </div>
              <p className="text-sm text-gray-500">{cat.desc}</p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cat.features.map((f) => {
                const colors = COLOR_MAP[f.color] ?? COLOR_MAP.gray;
                const Icon = f.icon;

                const card = (
                  <div className={`group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-200 h-full flex flex-col ${colors.hover}`}>
                    {/* Icon + live badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${colors.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${colors.dot}`} />
                        LIVE
                      </span>
                    </div>

                    {/* Text */}
                    <h3 className="text-base font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed flex-1">{f.desc}</p>

                    {/* CTA */}
                    <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-gray-500 group-hover:text-white transition-colors">
                      Learn more <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                );

                return (
                  <Link href={`/features/${f.slug}`} key={`${cat.id}-${f.slug}-${f.title}`} className="block">
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Trust banner */}
      <section className="border-t border-white/[0.06] bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { icon: '🔒', title: 'Official Meta Cloud API', desc: 'All WhatsApp/Instagram/Facebook connections go through Meta official Cloud API — no unofficial workarounds.' },
                { icon: '🛡️', title: 'Opt-out Compliant', desc: 'STOP detection, durable opt-out records, 24-hour window enforcement — Meta-compliant by default.' },
                { icon: '🇮🇳', title: 'Built for India', desc: '10 Indian languages, Razorpay payments, IndiaMART leads, Rs pricing — designed for the Indian market.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    <p className="mt-1 text-xs text-gray-400 leading-5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-900/50 border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-white mb-10">Common questions</h2>
          <div className="space-y-4">
            {[
              ['Which features are live right now?', `All ${totalFeatures} features listed on this page are live and production-ready. We do not list "Coming Soon" features — everything you see is working today.`],
              ['Does B9 work with official WhatsApp Business API?', 'Yes. B9 uses the official Meta Cloud API (not unofficial methods). You connect your own Meta WABA — your number, your data.'],
              ['Can the AI autonomously handle customer conversations?', 'Yes. The Agentic WhatsApp AI classifies intent, calls tools (catalog, payment, knowledge base), and sends replies — no human needed for most queries.'],
              ['How does AI Template Builder work?', 'Describe your campaign in plain English (e.g. "Diwali sale 20% off"). AI drafts a Meta-compliant WhatsApp template with variables, header, footer, and buttons — ready to submit for approval.'],
              ['Is my customer data private?', 'Yes. Tokens are encrypted with PBKDF2-HMAC-256. Customer conversations stay in your workspace. We never read your messages.'],
            ].map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  {q}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta variant="dark" />
      <MarketingFooter variant="dark" />
    </div>
  );
}
