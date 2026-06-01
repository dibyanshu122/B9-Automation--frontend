'use client';

import { MarketingFooter, MarketingNav, MarketingCta } from '@/components/marketing-shell';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const SECTIONS = [
  {
    id: 'whatsapp-ai',
    icon: '🤖',
    title: 'WhatsApp Agentic AI',
    tagline: 'How Agentic AI handles every customer message',
    description: 'When a customer messages your WhatsApp number, the Agentic AI receives it, classifies the intent (buy, question, complaint, opt-out), calls the right tools — catalog, payment link, knowledge base — and sends a reply automatically. No human needed for most queries.',
    useCases: [
      'Customer asks "what is the price?" → AI searches knowledge base → sends answer with pricing PDF',
      'Customer says "I want to buy" → AI sends product catalog → creates Razorpay payment link',
      'Customer sends "STOP" → opt-out recorded → all future sends blocked immediately',
      'After-hours message → AI replies from knowledge base + schedules human follow-up for morning',
    ],
    steps: [
      'Connect Meta WhatsApp Business Account in Integrations with Phone Number ID + Access Token',
      'Upload your knowledge base (PDFs, URLs, product catalog) in Documents',
      'Activate Agentic AI from Settings — it handles all incoming messages automatically',
    ],
    href: '/features/whatsapp-agentic-ai',
  },
  {
    id: 'templates-flows',
    icon: '✨',
    title: 'Templates & Flows',
    tagline: 'Build Meta-approved templates with AI in seconds',
    description: 'The AI Template Builder turns a plain English description into a fully-formed Meta WhatsApp template — with variables, header, footer, and buttons — ready to submit for approval. Build interactive WhatsApp Forms for lead capture, bookings, and surveys with the visual Flow Designer.',
    useCases: [
      'Type "Diwali sale 20% off, valid till Oct 25, promo code DIWALI20" → AI drafts complete template',
      'Build a lead capture form with name, phone, city, budget — no coding required',
      'Submit template to Meta directly from dashboard — see approval status in real time',
      'Rejected template shows exact rejection reason with one-click resubmit',
    ],
    steps: [
      'Open Templates → click "AI Draft Template" → describe your campaign in plain English',
      'AI generates template with correct variables, header, buttons and category',
      'Review, edit if needed, then submit to Meta — approval typically takes a few minutes',
    ],
    href: '/features/ai-template-builder',
  },
  {
    id: 'automation-canvas',
    icon: '🎯',
    title: 'Automation Canvas',
    tagline: '37-node drag-drop visual builder for any workflow',
    description: 'The visual canvas lets you build any automation by connecting triggers, AI nodes, conditions, and actions. Describe your flow in plain English and AI generates the full canvas instantly. Test in draft mode before going live.',
    useCases: [
      'New WhatsApp lead → AI qualifies budget → if hot: send catalog → payment link → mark won',
      'Facebook Lead Ad → save to Google Sheets + send WhatsApp welcome in parallel',
      'Daily at 9am → check overdue follow-ups → send WhatsApp reminder to each lead',
      'Payment confirmed → send GST invoice + trigger onboarding WhatsApp sequence',
    ],
    steps: [
      'Open Automations → click "Generate with AI" → describe your flow in plain English',
      'AI builds the full canvas — review nodes, edit config, adjust conditions',
      'Click Test to run in draft mode → verify each step → Activate to go live',
    ],
    href: '/features/visual-automation-builder',
  },
  {
    id: 'campaigns',
    icon: '📣',
    title: 'Broadcast Campaigns',
    tagline: 'Reach the right leads at the right time at scale',
    description: 'Filter your CRM by lead score (hot/warm/cold), apply tags, pick an approved template, schedule delivery — and send to thousands. A/B test two message variants, track delivery and open rates, retry failed sends automatically.',
    useCases: [
      'Diwali sale blast: filter warm + hot leads → send "DIWALI20" promo template → track opens',
      'Win-back sequence: cold leads inactive 30 days → send re-engagement template',
      'A/B test: 50% get short message, 50% get long — see which converts better',
      'Schedule off-hours: set campaign for 9am Monday → system sends automatically',
    ],
    steps: [
      'Go to Campaigns → New Campaign → filter recipients by score, tag, or phone list',
      'Choose an APPROVED WhatsApp template and map variables (name, amount, date)',
      'Schedule for a future time or send immediately — track delivery in real time',
    ],
    href: '/features/campaigns',
  },
  {
    id: 'leads-crm',
    icon: '👥',
    title: 'Leads & CRM',
    tagline: 'Capture, score, and follow up on every lead automatically',
    description: 'Every lead from every channel — WhatsApp, Instagram, Facebook, website widget — lands in your CRM. AI scores them 0–10 based on buying intent, moves them through pipeline stages, and schedules follow-ups. Full conversation history on every lead.',
    useCases: [
      'WhatsApp lead says "I want 2BHK" → AI scores 9/10 hot → notifies owner instantly',
      'Facebook Lead Ad form submitted → lead in CRM in seconds → WhatsApp sent automatically',
      'Website widget visitor fills form → lead captured → AI follow-up scheduled for next morning',
      'Bulk export CSV → import to your existing sales tool or share with team',
    ],
    steps: [
      'Connect your channels (WhatsApp, Instagram, Facebook, Widget) — leads auto-populate',
      'AI scores incoming leads automatically based on conversation intent',
      'Set follow-up schedules from the lead detail view — or let automation handle it',
    ],
    href: '/features/crm',
  },
  {
    id: 'integrations',
    icon: '🔌',
    title: 'Integrations',
    tagline: 'Connect all your business tools — 9 live integrations',
    description: 'B9 connects to the tools Indian businesses actually use: WhatsApp, Instagram, Facebook, Gmail, Google Sheets, Razorpay, IndiaMART, Shopify, and Webhooks/REST API. Availability depends on your provider account and completed connection health checks.',
    useCases: [
      'Razorpay: customer pays via WhatsApp link → CRM updated to "won" → invoice sent automatically',
      'Google Sheets: every new lead auto-pushed to your sales team sheet in real time',
      'IndiaMART: B2B enquiries auto-imported → WhatsApp follow-up sent within seconds',
      'REST API: connect any custom tool — 22 scopes, versioned routes, request logs',
    ],
    steps: [
      'Go to Integrations in the dashboard → click the integration you want to connect',
      'Follow the OAuth flow or paste your API credentials — tokens stored encrypted',
      'Map fields to your CRM and build automation flows on top of the connection',
    ],
    href: '/integrations',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-hiw" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-hiw)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="relative border-b border-white/[0.04] px-6 pb-20 pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center gap-5">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                How It Works
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              From WhatsApp message to closed deal — fully automated
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400">
              B9 is India's WhatsApp Agentic OS. Here is exactly how each part works — with real business examples from coaching, real estate, D2C, and B2B.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-all duration-300 hover:border-[#00F2FE]/25 hover:bg-[#00F2FE]/[0.05] hover:text-[#00F2FE]"
                >
                  <span>{s.icon}</span>{s.title}
                </a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="divide-y divide-white/[0.04]">
        {SECTIONS.map((section, idx) => (
          <section key={section.id} id={section.id} className="relative px-6 py-20 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className={`grid gap-10 lg:grid-cols-2 items-start ${idx % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
              >
                {/* Left: description + use cases */}
                <motion.div variants={fadeUp} className={idx % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{section.icon}</span>
                    <span className="rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00F2FE]">
                      Live
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 mb-2">
                    {section.title}
                  </h2>
                  <p className="text-[#00F2FE]/80 font-semibold text-sm mb-4">{section.tagline}</p>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">{section.description}</p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3">Real Use Cases</p>
                  <div className="space-y-3">
                    {section.useCases.map((uc) => (
                      <div key={uc} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                          <CheckCircle2 className="h-2.5 w-2.5 text-[#00F2FE]" />
                        </div>
                        <p className="text-sm text-zinc-300">{uc}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={section.href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00F2FE]/80 transition-all duration-300 hover:text-[#00F2FE] hover:gap-3"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                {/* Right: setup steps card */}
                <motion.div
                  variants={fadeUp}
                  className={`group rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] ${idx % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-5">How to set it up</p>
                  <div className="space-y-5">
                    {section.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/[0.08] text-sm font-bold text-[#00F2FE]">
                          {i + 1}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-xs text-zinc-500">
                      <span className="font-bold text-zinc-400">Tip:</span> Test every workflow in draft mode first. Check the Run Test section on the canvas to see each step execute in real time before going live.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      <MarketingCta variant="dark" />
      <MarketingFooter variant="dark" />
    </div>
  );
}
