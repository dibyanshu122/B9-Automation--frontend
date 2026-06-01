'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { PLANS } from '@/lib/constants';
import { CheckCircle2, ChevronDown, Info, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-4">
      {children}
    </p>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Can I change my plan anytime?',
      a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
    {
      q: 'Is there a long-term contract?',
      a: 'No, all plans are month-to-month or annual. Cancel anytime with no penalties.',
    },
    {
      q: 'What happens to my data if I cancel?',
      a: 'Your data remains accessible for 30 days after cancellation. After that, it will be permanently deleted.',
    },
    {
      q: 'Do you offer refunds?',
      a: "We offer a 7-day money-back guarantee if you're not satisfied with our service.",
    },
  ];

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
            <pattern id="dots-pricing" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pricing)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.04] px-6 pb-24 pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center gap-5">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                Simple Pricing
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              Plans that grow with you
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400">
              Start Free. Upgrade only when your AI starts generating leads. Transparent pricing, cancel anytime. All prices in INR.
            </motion.p>

            <motion.p variants={fadeUp} className="text-sm text-amber-400/80">
              ⚠ WhatsApp conversation charges (Meta) are billed by Meta separately and are NOT included in plan price.
            </motion.p>

            {/* Monthly/Yearly Toggle */}
            <motion.div variants={fadeUp} className="flex justify-center mt-4">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-xl">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    !isAnnual
                      ? 'bg-[#00F2FE]/[0.12] border border-[#00F2FE]/30 text-white shadow-[0_0_20px_rgba(0,242,254,0.1)]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isAnnual
                      ? 'bg-[#00F2FE]/[0.12] border border-[#00F2FE]/30 text-white shadow-[0_0_20px_rgba(0,242,254,0.1)]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Annual
                  <span className="absolute -top-8 right-0 rounded-md border border-[#00F2FE]/20 bg-[#00F2FE]/[0.08] px-2 py-0.5 text-[10px] font-bold text-[#00F2FE] whitespace-nowrap">
                    Save yearly
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5"
          >
            {PLANS.map((plan) => {
              const price = isAnnual && plan.annual_price ? plan.annual_price : plan.price;
              const annualMonthlyEquivalent = plan.annual_price ? Math.round(plan.annual_price / 12) : null;
              const annualSaving = plan.annual_price ? (plan.price * 12) - plan.annual_price : 0;
              const isPopular = plan.type === 'GROWTH';

              return (
                <motion.div
                  key={plan.type}
                  variants={fadeUp}
                  className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-500 ${
                    isPopular
                      ? 'border-[#00F2FE]/30 bg-[#00F2FE]/[0.04] ring-1 ring-[#00F2FE]/[0.15] hover:border-[#00F2FE]/50 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(0,242,254,0.08)] hover:-translate-y-1'
                      : 'border-white/[0.06] bg-white/[0.01] hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] hover:-translate-y-1'
                  }`}
                >
                  {/* Inner glow */}
                  {isPopular && (
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.04] to-transparent" />
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {isPopular && (
                    <div className="relative inline-flex items-center gap-1.5 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] px-3 py-1 text-[10px] font-bold text-[#00F2FE] mb-4 w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                      Most Popular
                    </div>
                  )}

                  <h3 className="relative text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="relative text-zinc-400 text-sm mb-4 min-h-[60px]">{plan.description}</p>

                  <div className="relative mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-zinc-500 text-sm">{isAnnual && plan.annual_price ? '/year' : '/month'}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {plan.annual_price
                        ? isAnnual
                          ? `≈ ₹${annualMonthlyEquivalent?.toLocaleString('en-IN')}/mo — save ₹${annualSaving.toLocaleString('en-IN')}/yr`
                          : `Annual: ₹${plan.annual_price.toLocaleString('en-IN')}/year`
                        : 'Free forever'}
                    </p>
                  </div>

                  <Link href="/signup" className="relative block w-full mb-6">
                    <button
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isPopular
                          ? 'border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] text-white hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_24px_rgba(0,242,254,0.2)]'
                          : 'border border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-[#00F2FE]/20 hover:bg-[#00F2FE]/[0.05] hover:text-white'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>

                  <div className="relative mb-5 space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs text-zinc-400">
                    <p><span className="text-zinc-500">Best for:</span> {plan.bestFor}</p>
                    <p><span className="text-zinc-500">Branding:</span> {plan.watermark}</p>
                    <p><span className="text-zinc-500">Integrations:</span> {plan.integrations}</p>
                    <p><span className="text-zinc-500">Automation:</span> {plan.automation}</p>
                  </div>

                  <div className="relative space-y-2.5 flex-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                          <CheckCircle2 className="h-2.5 w-2.5 text-[#00F2FE]" />
                        </div>
                        <span className="text-xs text-zinc-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Notes */}
      <section className="relative border-b border-white/[0.04] px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 text-sm text-zinc-400 backdrop-blur-xl md:grid-cols-2 lg:grid-cols-4">
            {[
              'WhatsApp Meta conversation charges are not included.',
              'Fair usage applies to unlimited links and public chats.',
              'Top-ups are available for AI credits, executions, and storage.',
              'Thinking mode consumes 3 credits per successful response.',
            ].map((note) => (
              <div key={note} className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00F2FE]/60" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare table */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <SectionLabel>Compare</SectionLabel>
            <h2
              className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500"
              style={{ letterSpacing: '-0.02em' }}
            >
              Compare all features
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="min-w-[880px] w-full border-collapse bg-white/[0.01] text-sm backdrop-blur-xl">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="p-4 text-zinc-500 font-medium">Feature</th>
                  {PLANS.map((plan) => (
                    <th key={plan.type} className={`p-4 font-semibold ${plan.type === 'GROWTH' ? 'text-[#00F2FE]' : 'text-white'}`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Assistants', ['1', '2', '5', '15', 'Unlimited']],
                  ['Sources', ['PDF only', 'PDF, URL, YouTube', 'All core sources', 'All + web search', 'All + priority']],
                  ['Widgets/domains', ['No widget', '1 / 1 domain', '3 / 3 domains', '10 / 10 domains', 'Unlimited']],
                  ['Integrations', ['None', 'Sheets + WhatsApp', 'Gmail, FB, IG, WhatsApp, Sheets, Shopify', 'All integrations', 'All integrations']],
                  ['Automation', ['None', '10 workflows / 15 steps / 1K runs/day', 'High-volume workflows & steps / 5K runs/day', 'High-volume / 25K runs/day', 'High-volume with fair usage']],
                  ['Campaigns', ['None', '100 recipients/send', '1,000 recipients/send', '5,000 recipients/send', '50,000 recipients/send']],
                  ['Branding', ['B9 watermark', 'B9 watermark', 'Watermark removed', 'Watermark removed', 'Full white-label']],
                  ['AI credits', ['30 lifetime', '1,000/month', '5,000/month', '20,000/month', '50,000/month']],
                  ['Team members', ['1', '2', '5', '15', '50']],
                  ['API & webhooks', ['No', 'No', 'No', 'Yes (PRO+)', 'Yes']],
                ].map(([label, values]) => (
                  <tr key={label as string} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-semibold text-zinc-300">{label}</td>
                    {(values as string[]).map((value, index) => (
                      <td key={`${label}-${index}`} className="p-4 text-zinc-400">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>FAQ</SectionLabel>
              <h2
                className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500"
                style={{ letterSpacing: '-0.02em' }}
              >
                Common Questions
              </h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-3"
          >
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl transition-all duration-300 hover:border-[#00F2FE]/20"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.01]"
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-500 transition-transform duration-300 ${
                      openFaq === idx ? 'rotate-180 text-[#00F2FE]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.04] px-6 pb-6 pt-4 text-sm leading-relaxed text-zinc-400">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative border-b border-white/[0.04] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-2xl border border-[#00F2FE]/10 bg-[#00F2FE]/[0.02] p-12 text-center backdrop-blur-xl lg:p-16"
            >
              {/* Corner blobs */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#00F2FE]/[0.06] blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[#00F2FE]/[0.04] blur-[80px]" />

              <div className="relative">
                <motion.h2
                  variants={fadeUp}
                  className="mb-5 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-5xl"
                  style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
                >
                  Ready to automate your business?
                </motion.h2>
                <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-2xl text-lg font-light text-zinc-400">
                  Start free with one assistant. Upgrade when the widget, leads, and automations begin doing real work.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-8 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
                  >
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/signup?demo=1"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:border-[#00F2FE]/20 hover:text-white"
                  >
                    Book Demo Call
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
