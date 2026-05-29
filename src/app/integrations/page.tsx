'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MarketingNav, MarketingCta, MarketingFooter } from '@/components/marketing-shell';
import { MessageSquare, Camera, Facebook, Mail, Sheet, CreditCard, Factory, ShoppingCart, Webhook, ArrowRight, CheckCircle2, Lock, ShieldCheck, Zap } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const INTEGRATIONS = [
  { name: 'WhatsApp Business', emoji: '💬', icon: MessageSquare, category: 'Messaging', color: 'emerald', desc: 'Official Meta Cloud API — send messages, run agentic AI, broadcast campaigns.', bullets: ['Send & receive messages via Meta Cloud API', 'Template campaigns to segmented lead lists', 'Agentic AI auto-reply (intent → catalog → payment)'], href: '/features/whatsapp-agentic-ai' },
  { name: 'Instagram DM', emoji: '📸', icon: Camera, category: 'Messaging', color: 'pink', desc: 'Auto-reply to Instagram DMs, capture leads, and route to AI assistant.', bullets: ['Lead capture from DMs with name, phone, intent', 'Quick reply buttons for common questions', 'AI assistant routing based on DM content'], href: '/features/instagram-dm' },
  { name: 'Facebook Lead Ads', emoji: '📘', icon: Facebook, category: 'Lead Generation', color: 'blue', desc: 'Real-time lead form capture directly into your CRM with instant WhatsApp follow-up.', bullets: ['Instant CRM sync when form is submitted', 'Automatic WhatsApp follow-up message', 'Google Sheets export for sales teams'], href: '/features/facebook-lead-ads' },
  { name: 'Gmail', emoji: '📧', icon: Mail, category: 'Email', color: 'red', desc: 'Sync your inbox, draft AI replies, and create CRM leads from emails.', bullets: ['Sync inbox and draft AI-powered replies', 'Create leads from inbound email enquiries', 'Send email notifications from automations'], href: '/features/crm' },
  { name: 'Google Sheets', emoji: '📊', icon: Sheet, category: 'Data', color: 'teal', desc: 'Auto-push every captured lead to your sheet in real time with custom field mapping.', bullets: ['Real-time sync on every new lead captured', 'Custom field mapping (name, phone, score, source)', 'Bulk export existing leads to Sheets anytime'], href: '/features/crm' },
  { name: 'Razorpay', emoji: '💳', icon: CreditCard, category: 'Payments', color: 'violet', desc: 'Payment links via WhatsApp — AI detects buy intent and collects money automatically.', bullets: ['Auto payment link on detected buy intent', 'GST invoice generated on payment confirmation', 'Lead status updated to "won" after payment'], href: '/features/payments' },
  { name: 'IndiaMART', emoji: '🏭', icon: Factory, category: 'Lead Generation', color: 'orange', desc: 'Auto-import B2B enquiries from IndiaMART into CRM with instant WhatsApp follow-up.', bullets: ['Auto-import IndiaMART buyer enquiries', 'WhatsApp follow-up sent within seconds', 'Lead scored and placed in CRM pipeline'], href: '/features/crm' },
  { name: 'Shopify', emoji: '🛒', icon: ShoppingCart, category: 'E-commerce', color: 'green', desc: 'Order webhooks, WhatsApp order confirmations, and customer sync to CRM.', bullets: ['Order placed → WhatsApp confirmation sent instantly', 'Customer auto-created in CRM on first order', 'Abandoned cart → WhatsApp follow-up automation'], href: '/features/catalog' },
  { name: 'Webhooks / REST API', emoji: '🪝', icon: Webhook, category: 'Developer', color: 'gray', desc: 'Connect any external tool via HTTP webhooks or the REST API v1 with 22 scopes.', bullets: ['Receive events from any HTTP endpoint', 'REST API v1 with 22 permission scopes', 'Request logs, rate limiting, code examples'], href: '/features/api' },
];

const COLOR_MAP: Record<string, { icon: string; badge: string; bullet: string }> = {
  emerald: { icon: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', bullet: 'text-emerald-500' },
  pink:    { icon: 'border-pink-500/20 bg-pink-500/[0.08] text-pink-400',           badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',           bullet: 'text-pink-500'    },
  blue:    { icon: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-400',           badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',           bullet: 'text-blue-500'    },
  red:     { icon: 'border-red-500/20 bg-red-500/[0.08] text-red-400',             badge: 'bg-red-500/10 border-red-500/20 text-red-400',             bullet: 'text-red-500'     },
  teal:    { icon: 'border-teal-500/20 bg-teal-500/[0.08] text-teal-400',           badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',           bullet: 'text-teal-500'    },
  violet:  { icon: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-400',     badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',     bullet: 'text-violet-500'  },
  orange:  { icon: 'border-orange-500/20 bg-orange-500/[0.08] text-orange-400',     badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',     bullet: 'text-orange-500'  },
  green:   { icon: 'border-green-500/20 bg-green-500/[0.08] text-green-400',       badge: 'bg-green-500/10 border-green-500/20 text-green-400',       bullet: 'text-green-500'   },
  gray:    { icon: 'border-white/[0.08] bg-white/[0.04] text-gray-300',             badge: 'bg-white/10 border-white/20 text-gray-300',                 bullet: 'text-zinc-400'    },
};

export default function IntegrationsPage() {
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
            <pattern id="dots-intg" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-intg)" />
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
                9 Live Integrations
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              9 live integrations. All working today.
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400">
              B9 connects to the tools Indian businesses actually use — WhatsApp, Instagram, Facebook, Gmail, Google Sheets, Razorpay, IndiaMART, Shopify, and REST API. Every integration on this page is live in production.
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
                How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Integrations grid */}
      <section className="relative px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {INTEGRATIONS.map((intg) => {
              const colors = COLOR_MAP[intg.color] ?? COLOR_MAP.gray;
              const Icon = intg.icon;

              return (
                <motion.div key={intg.name} variants={fadeUp}>
                  <Link href={intg.href} className="group block h-full">
                    <div className="relative flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.04)]">
                      {/* Inner glow */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      {/* Header */}
                      <div className="relative flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${colors.icon}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{intg.name}</h3>
                            <p className="text-[11px] text-zinc-500">{intg.category}</p>
                          </div>
                        </div>
                        <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${colors.badge}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                          LIVE
                        </span>
                      </div>

                      <p className="relative text-sm leading-relaxed text-zinc-400 mb-4">{intg.desc}</p>

                      <div className="relative flex-1 space-y-2">
                        {intg.bullets.map((b) => (
                          <div key={b} className="flex items-start gap-2">
                            <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colors.bullet}`} />
                            <span className="text-xs leading-relaxed text-zinc-400">{b}</span>
                          </div>
                        ))}
                      </div>

                      <div className="relative mt-5 flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-all duration-300 group-hover:gap-2 group-hover:text-[#00F2FE]/80">
                        Learn more <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Bottom note */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 text-center backdrop-blur-xl"
          >
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-white">Need a different integration?</span>{' '}
              Use{' '}
              <Link href="/features/api" className="text-[#00F2FE]/80 underline underline-offset-2 hover:text-[#00F2FE]">
                REST API v1
              </Link>{' '}
              or{' '}
              <Link href="/features/api" className="text-[#00F2FE]/80 underline underline-offset-2 hover:text-[#00F2FE]">
                Webhooks
              </Link>{' '}
              to connect any tool — CRMs, custom backends, Shopify apps, or anything with an HTTP endpoint.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust section */}
      <section className="relative border-t border-white/[0.04] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-[#00F2FE]/10 bg-[#00F2FE]/[0.02] p-8 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                { Icon: Lock, title: 'Tokens encrypted at rest', desc: 'All WhatsApp, Instagram, Facebook, and Razorpay tokens stored with PBKDF2-HMAC-256 encryption.' },
                { Icon: Zap, title: 'Official APIs only', desc: 'We use only official Meta Cloud API, Razorpay webhooks, and Google OAuth — no unofficial methods.' },
                { Icon: ShieldCheck, title: 'Meta-compliant messaging', desc: '24-hour window enforcement, durable opt-out, and STOP detection built in to every integration.' },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                    <item.Icon className="h-5 w-5 text-[#00F2FE]" />
                  </div>
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

      <MarketingCta variant="dark" />
      <MarketingFooter variant="dark" />
    </div>
  );
}
