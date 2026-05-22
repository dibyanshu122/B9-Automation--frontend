import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SECTIONS = [
  {
    id: 'whatsapp-ai',
    icon: '🤖',
    color: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
    color: 'from-violet-500/10 to-purple-500/5 border-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
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
    color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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
    color: 'from-orange-500/10 to-amber-500/5 border-orange-500/20',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
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
    color: 'from-teal-500/10 to-cyan-500/5 border-teal-500/20',
    badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
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
    color: 'from-indigo-500/10 to-blue-500/5 border-indigo-500/20',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    title: 'Integrations',
    tagline: 'Connect all your business tools — 9 live integrations',
    description: 'B9 connects to the tools Indian businesses actually use: WhatsApp, Instagram, Facebook, Gmail, Google Sheets, Razorpay, IndiaMART, Shopify, and Webhooks/REST API. Every integration is live today — no "Coming Soon".',
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
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">How It Works</span>
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            From WhatsApp message to closed deal — fully automated
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            B9 is India's WhatsApp Agentic OS. Here is exactly how each part works — with real business examples from coaching, real estate, D2C, and B2B.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition"
              >
                <span>{s.icon}</span>{s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="divide-y divide-white/[0.04]">
        {SECTIONS.map((section, idx) => (
          <section key={section.id} id={section.id} className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className={`grid gap-8 lg:grid-cols-[1fr_1fr] items-start ${idx % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* Left: description + use cases */}
                <div className={idx % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{section.icon}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${section.badge}`}>
                      Live
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">{section.title}</h2>
                  <p className="text-primary-400 font-semibold text-sm mb-4">{section.tagline}</p>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{section.description}</p>

                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Real use cases</h3>
                  <div className="space-y-2">
                    {section.useCases.map((uc) => (
                      <div key={uc} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                        <p className="text-sm text-slate-300">{uc}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={section.href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300 transition"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Right: setup steps card */}
                <div className={`rounded-2xl border ${section.color} bg-gradient-to-br p-6 backdrop-blur-sm ${idx % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">How to set it up</p>
                  <div className="space-y-4">
                    {section.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <p className="text-xs text-slate-500">
                      <span className="font-bold text-slate-400">Tip:</span> Test every workflow in draft mode first. Check the Run Test section on the canvas to see each step execute in real time before going live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <MarketingCta variant="dark" />
      <MarketingFooter variant="dark" />
    </div>
  );
}
