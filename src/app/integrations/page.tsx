'use client';

import Link from 'next/link';
import { MarketingNav, MarketingCta, MarketingFooter } from '@/components/marketing-shell';
import { MessageSquare, Camera, Facebook, Mail, Sheet, CreditCard, Factory, ShoppingCart, Webhook, ArrowRight, CheckCircle2 } from 'lucide-react';

const INTEGRATIONS = [
  {
    name: 'WhatsApp Business',
    emoji: '💬',
    icon: MessageSquare,
    category: 'Messaging',
    color: 'emerald',
    desc: 'Official Meta Cloud API — send messages, run agentic AI, broadcast campaigns.',
    bullets: [
      'Send & receive messages via Meta Cloud API',
      'Template campaigns to segmented lead lists',
      'Agentic AI auto-reply (intent → catalog → payment)',
    ],
    href: '/features/whatsapp-agentic-ai',
  },
  {
    name: 'Instagram DM',
    emoji: '📸',
    icon: Camera,
    category: 'Messaging',
    color: 'pink',
    desc: 'Auto-reply to Instagram DMs, capture leads, and route to AI assistant.',
    bullets: [
      'Lead capture from DMs with name, phone, intent',
      'Quick reply buttons for common questions',
      'AI assistant routing based on DM content',
    ],
    href: '/features/instagram-dm',
  },
  {
    name: 'Facebook Lead Ads',
    emoji: '📘',
    icon: Facebook,
    category: 'Lead Generation',
    color: 'blue',
    desc: 'Real-time lead form capture directly into your CRM with instant WhatsApp follow-up.',
    bullets: [
      'Instant CRM sync when form is submitted',
      'Automatic WhatsApp follow-up message',
      'Google Sheets export for sales teams',
    ],
    href: '/features/facebook-lead-ads',
  },
  {
    name: 'Gmail',
    emoji: '📧',
    icon: Mail,
    category: 'Email',
    color: 'red',
    desc: 'Sync your inbox, draft AI replies, and create CRM leads from emails.',
    bullets: [
      'Sync inbox and draft AI-powered replies',
      'Create leads from inbound email enquiries',
      'Send email notifications from automations',
    ],
    href: '/features/crm',
  },
  {
    name: 'Google Sheets',
    emoji: '📊',
    icon: Sheet,
    category: 'Data',
    color: 'teal',
    desc: 'Auto-push every captured lead to your sheet in real time with custom field mapping.',
    bullets: [
      'Real-time sync on every new lead captured',
      'Custom field mapping (name, phone, score, source)',
      'Bulk export existing leads to Sheets anytime',
    ],
    href: '/features/crm',
  },
  {
    name: 'Razorpay',
    emoji: '💳',
    icon: CreditCard,
    category: 'Payments',
    color: 'violet',
    desc: 'Payment links via WhatsApp — AI detects buy intent and collects money automatically.',
    bullets: [
      'Auto payment link on detected buy intent',
      'GST invoice generated on payment confirmation',
      'Lead status updated to "won" after payment',
    ],
    href: '/features/payments',
  },
  {
    name: 'IndiaMART',
    emoji: '🏭',
    icon: Factory,
    category: 'Lead Generation',
    color: 'orange',
    desc: 'Auto-import B2B enquiries from IndiaMART into CRM with instant WhatsApp follow-up.',
    bullets: [
      'Auto-import IndiaMART buyer enquiries',
      'WhatsApp follow-up sent within seconds',
      'Lead scored and placed in CRM pipeline',
    ],
    href: '/features/crm',
  },
  {
    name: 'Shopify',
    emoji: '🛒',
    icon: ShoppingCart,
    category: 'E-commerce',
    color: 'green',
    desc: 'Order webhooks, WhatsApp order confirmations, and customer sync to CRM.',
    bullets: [
      'Order placed → WhatsApp confirmation sent instantly',
      'Customer auto-created in CRM on first order',
      'Abandoned cart → WhatsApp follow-up automation',
    ],
    href: '/features/catalog',
  },
  {
    name: 'Webhooks / REST API',
    emoji: '🪝',
    icon: Webhook,
    category: 'Developer',
    color: 'gray',
    desc: 'Connect any external tool via HTTP webhooks or the REST API v1 with 22 scopes.',
    bullets: [
      'Receive events from any HTTP endpoint',
      'REST API v1 with 22 permission scopes',
      'Request logs, rate limiting, code examples',
    ],
    href: '/features/api',
  },
];

const COLOR_MAP: Record<string, { card: string; icon: string; badge: string; bullet: string }> = {
  emerald: { card: 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.03]', icon: 'bg-emerald-500/10 text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', bullet: 'text-emerald-500' },
  pink:    { card: 'hover:border-pink-500/30 hover:bg-pink-500/[0.03]',       icon: 'bg-pink-500/10 text-pink-400',       badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',       bullet: 'text-pink-500'    },
  blue:    { card: 'hover:border-blue-500/30 hover:bg-blue-500/[0.03]',       icon: 'bg-blue-500/10 text-blue-400',       badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',       bullet: 'text-blue-500'    },
  red:     { card: 'hover:border-red-500/30 hover:bg-red-500/[0.03]',         icon: 'bg-red-500/10 text-red-400',         badge: 'bg-red-500/10 border-red-500/20 text-red-400',         bullet: 'text-red-500'     },
  teal:    { card: 'hover:border-teal-500/30 hover:bg-teal-500/[0.03]',       icon: 'bg-teal-500/10 text-teal-400',       badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',       bullet: 'text-teal-500'    },
  violet:  { card: 'hover:border-violet-500/30 hover:bg-violet-500/[0.03]',   icon: 'bg-violet-500/10 text-violet-400',   badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',   bullet: 'text-violet-500'  },
  orange:  { card: 'hover:border-orange-500/30 hover:bg-orange-500/[0.03]',   icon: 'bg-orange-500/10 text-orange-400',   badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',   bullet: 'text-orange-500'  },
  green:   { card: 'hover:border-green-500/30 hover:bg-green-500/[0.03]',     icon: 'bg-green-500/10 text-green-400',     badge: 'bg-green-500/10 border-green-500/20 text-green-400',     bullet: 'text-green-500'   },
  gray:    { card: 'hover:border-white/20 hover:bg-white/[0.03]',             icon: 'bg-white/10 text-gray-300',          badge: 'bg-white/10 border-white/20 text-gray-300',          bullet: 'text-gray-400'    },
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Integrations</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-bold text-white leading-tight">
            9 live integrations. All working today.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            B9 connects to the tools Indian businesses actually use — WhatsApp, Instagram, Facebook, Gmail, Google Sheets, Razorpay, IndiaMART, Shopify, and REST API. Every integration on this page is live in production.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-gray-100 transition-colors">
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/[0.06] transition-colors">
              How It Works
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Need more? Use REST API or Webhooks to connect any tool.
          </p>
        </div>
      </section>

      {/* Integrations grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((intg) => {
              const colors = COLOR_MAP[intg.color] ?? COLOR_MAP.gray;
              const Icon = intg.icon;

              return (
                <Link
                  key={intg.name}
                  href={intg.href}
                  className={`group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-200 flex flex-col ${colors.card}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{intg.name}</h3>
                        <p className="text-[11px] text-gray-500">{intg.category}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${colors.badge}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">{intg.desc}</p>

                  {/* Bullets */}
                  <div className="space-y-2 flex-1">
                    {intg.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${colors.bullet}`} />
                        <span className="text-xs text-gray-400 leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>

                  {/* Learn more */}
                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-gray-500 group-hover:text-white transition-colors">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Need a different integration?</span>{' '}
              Use{' '}
              <Link href="/features/api" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                REST API v1
              </Link>{' '}
              or{' '}
              <Link href="/features/api" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                Webhooks
              </Link>{' '}
              to connect any tool — CRMs, custom backends, Shopify apps, or anything with an HTTP endpoint.
            </p>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t border-white/[0.06] bg-slate-900/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { emoji: '🔒', title: 'Tokens encrypted at rest', desc: 'All WhatsApp, Instagram, Facebook, and Razorpay tokens stored with PBKDF2-HMAC-256 encryption.' },
              { emoji: '✅', title: 'Official APIs only', desc: 'We use only official Meta Cloud API, Razorpay webhooks, and Google OAuth — no unofficial methods.' },
              { emoji: '🛡️', title: 'Meta-compliant messaging', desc: '24-hour window enforcement, durable opt-out, and STOP detection built in to every integration.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  <p className="mt-1 text-xs text-gray-400 leading-5">{item.desc}</p>
                </div>
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
