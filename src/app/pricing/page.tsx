'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing-shell';
import { PLANS } from '@/lib/constants';
import { CheckCircle2, ChevronDown, Mail, Linkedin, Instagram, Youtube, Globe, Info } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-4">{children}</p>;
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
      a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with our service.',
    },
  ];

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

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm mb-6">
              <span className="text-sm font-medium text-gray-300">Simple Pricing</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Plans that grow with you
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Start Free. Upgrade only when your AI starts generating leads. Transparent pricing, cancel anytime. All prices in INR.
            </motion.p>
            <motion.p variants={fadeUp} className="text-sm text-amber-400/80 mb-4">
              ⚠ WhatsApp conversation charges (Meta) are billed by Meta separately and are NOT included in plan price.
            </motion.p>

            {/* Monthly/Yearly Toggle */}
            <motion.div variants={fadeUp} className="flex justify-center mb-16">
              <div className="inline-flex items-center gap-4 rounded-full border border-white/[0.10] bg-white/[0.03] p-1">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    !isAnnual
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2 rounded-full font-medium transition-all relative ${
                    isAnnual
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Annual
                  <span className="absolute -top-8 right-0 text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded whitespace-nowrap">
                    Yearly discount
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
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
                  className={`relative rounded-2xl border p-6 transition-all ${
                    isPopular
                      ? 'border-white/[0.28] bg-white/[0.06] ring-1 ring-white/[0.14]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                  }`}
                >
                  {isPopular && (
                    <div className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white mb-4">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 min-h-[60px]">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-gray-500">{isAnnual && plan.annual_price ? '/year' : '/month'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {plan.annual_price
                        ? isAnnual
                          ? `Equivalent to ₹${annualMonthlyEquivalent?.toLocaleString('en-IN')}/month — save ₹${annualSaving.toLocaleString('en-IN')}/year`
                          : `Annual: ₹${plan.annual_price.toLocaleString('en-IN')}/year`
                        : 'Free forever'}
                    </p>
                  </div>

                  <Link href="/signup" className="block w-full mb-8">
                    <button
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        isPopular
                          ? 'bg-white text-black hover:bg-gray-100'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>

                  <div className="mb-5 space-y-2 rounded-lg border border-white/[0.06] bg-black/30 p-3 text-xs text-gray-300">
                    <p><span className="text-gray-500">Best for:</span> {plan.bestFor}</p>
                    <p><span className="text-gray-500">Branding:</span> {plan.watermark}</p>
                    <p><span className="text-gray-500">Integrations:</span> {plan.integrations}</p>
                    <p><span className="text-gray-500">Automation:</span> {plan.automation}</p>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative border-b border-white/[0.06] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-gray-400 md:grid-cols-2 lg:grid-cols-4">
            {[
              'WhatsApp Meta conversation charges are not included.',
              'Fair usage applies to unlimited links and public chats.',
              'Top-ups are available for AI credits, executions, and storage.',
              'Thinking mode consumes 3 credits per successful response.',
            ].map((note) => (
              <div key={note} className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/[0.06] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <SectionLabel>Compare</SectionLabel>
            <h2 className="text-3xl font-bold">Compare all features</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="min-w-[880px] w-full border-collapse bg-white/[0.02] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left">
                  <th className="p-4 text-gray-400">Feature</th>
                  {PLANS.map((plan) => <th key={plan.type} className="p-4 text-white">{plan.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Assistants', ['1', '1', '3', '5', '10']],
                  ['Sources', ['PDF', 'PDF, URL, YouTube', 'All core sources', 'All + web search', 'All + priority']],
                  ['Widgets/domains', ['No widget', '1 / 1', '2 / 2', '5 / 5', '15 domains']],
                  ['Integrations', ['None', 'Sheets', 'Sheets, Gmail, FB, WhatsApp', 'All', 'All']],
                  ['Automation', ['None', '1 workflow / 2 steps', '3 workflows / 5 steps', '5 workflows / 10 steps', '15 workflows / 20 steps']],
                  ['Branding', ['Watermark', 'Watermark', 'Removed', 'Removed', 'White-label']],
                  ['AI credits', ['30 lifetime', '1,000/month', '5,000/month', '20,000/month', '50,000/month']],
                  ['API & webhooks', ['No', 'No', 'No', 'Yes', 'Yes']],
                ].map(([label, values]) => (
                  <tr key={label as string} className="border-b border-white/[0.05] last:border-b-0">
                    <td className="p-4 font-semibold text-gray-300">{label}</td>
                    {(values as string[]).map((value, index) => (
                      <td key={`${label}-${index}`} className="p-4 text-gray-400">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-4xl font-bold">Common Questions</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="space-y-3"
          >
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="rounded-xl border border-white/[0.07] overflow-hidden hover:border-white/[0.12] transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.01] transition-colors"
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-400 border-t border-white/[0.05]">
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
              Ready to automate your business?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Start free with one assistant. Upgrade when the widget, leads, and automations begin doing real work.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                  Start Free
                </button>
              </Link>
              <Link href="/signup?demo=1">
                <button className="px-8 py-3 rounded-lg bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all">
                  Book Demo Call
                </button>
              </Link>
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
                AI automation for Indian businesses. WhatsApp bots, lead capture, AI chat, and document intelligence — all in one platform.
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
              <div className="space-y-2 text-sm">
                <a href="mailto:hello@b9automation.com" className="flex items-center gap-2 text-gray-600 hover:text-gray-300">
                  <Mail className="h-4 w-4" />
                  hello@b9automation.com
                </a>
              </div>
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
