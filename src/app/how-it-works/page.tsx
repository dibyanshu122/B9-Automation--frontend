import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SECTIONS = [
  {
    id: 'whatsapp',
    icon: '💬',
    color: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'WhatsApp Automation',
    tagline: 'Auto-reply to every WhatsApp message with AI',
    description: 'Connect your WhatsApp Business account via Meta Cloud API. Every incoming message triggers your automation — AI reads it, generates a reply from your knowledge base, and sends it back automatically.',
    useCases: [
      'Coaching institute: student says "demo chahiye" → AI replies with batch details + booking link',
      'Real estate: buyer asks "2BHK price?" → AI replies with current listings',
      'Salon: "appointment available?" → AI checks and confirms slot',
      'E-commerce: "order status?" → AI replies with tracking info',
    ],
    steps: ['Go to Integrations → WhatsApp → enter Phone Number ID + Access Token', 'Build: New WhatsApp Message → AI Agent → Send WhatsApp', 'Save workflow → set Send Mode to Live → Test'],
    href: '/features/whatsapp-automation',
  },
  {
    id: 'instagram',
    icon: '📸',
    color: 'from-pink-500/10 to-purple-500/5 border-pink-500/20',
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    title: 'Instagram DM Automation',
    tagline: 'Reply to Instagram DMs instantly with AI',
    description: 'Connect your Instagram Professional account. When a follower or customer sends a DM, your automation fires — AI reads the message, answers from your knowledge base, and captures them as a lead.',
    useCases: [
      'Fashion brand: "price of this outfit?" → AI replies with price + buy link',
      'Fitness coach: "how to join?" → AI sends program details + fee structure',
      'Restaurant: "table for 4?" → AI confirms availability and takes booking',
      'Course creator: "syllabus?" → AI sends full course outline',
    ],
    steps: ['Go to Integrations → Instagram → connect Professional account via OAuth', 'Build: New Instagram Message → AI Agent → Send Instagram DM', 'Save and Test'],
    href: '/features/instagram-dm',
  },
  {
    id: 'facebook',
    icon: '📘',
    color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: 'Facebook Lead Ads + Messenger',
    tagline: 'Capture Facebook leads and reply to Messenger messages',
    description: 'Two powerful features in one. Capture leads from Facebook Lead Ad forms automatically into your CRM. Also, when someone messages your Facebook Page, AI replies instantly.',
    useCases: [
      'Lead Ad: user fills "demo request" form → instantly gets WhatsApp message with details',
      'Messenger: "how much does it cost?" → AI replies with pricing',
      'Lead Ad + Sheet: every new lead synced to Google Sheet for sales team',
      'Qualify leads: AI asks follow-up questions to score Hot/Warm/Cold',
    ],
    steps: ['Go to Integrations → Facebook → connect via OAuth', 'For Lead Ads: New Facebook Lead → AI Agent → Send WhatsApp', 'For Messenger: New Facebook Message → AI Agent → Send Facebook Message'],
    href: '/features/facebook-lead-ads',
  },
  {
    id: 'widget',
    icon: '🌐',
    color: 'from-cyan-500/10 to-sky-500/5 border-cyan-500/20',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    title: 'Website AI Chatbot Widget',
    tagline: 'Add an AI chatbot to any website in 2 minutes',
    description: 'Upload your business documents (PDFs, URLs, YouTube videos). Get a one-line embed code. Paste it on your website. Visitors chat with your AI, get answers from your knowledge, and are captured as leads.',
    useCases: [
      'School website: "admission fees?" → AI answers from fee structure PDF',
      'Agency: "what services do you offer?" → AI explains from your service docs',
      'Doctor: "consultation timings?" → AI answers 24/7',
      'Startup: lead capture widget → visitor gives name + phone → saved to CRM',
    ],
    steps: ['Upload documents in Documents section', 'Go to Widgets → create widget → copy embed code', 'Paste on your website before </body> tag'],
    href: '/features/ai-chatbot',
  },
  {
    id: 'automation-builder',
    icon: '🎯',
    color: 'from-violet-500/10 to-purple-500/5 border-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    title: 'Visual Automation Builder',
    tagline: 'Build powerful workflows without code',
    description: 'Drag and drop triggers, AI agents, and actions onto a canvas. Connect them to build workflows that run 24/7. Multiple triggers can feed into one AI agent, or one trigger can fan out to multiple actions.',
    useCases: [
      'WhatsApp + Instagram + Facebook → same AI → same WhatsApp reply (3 triggers, 1 AI, 1 action)',
      'New lead → AI qualifies → if Hot: notify owner → if Warm: send follow-up next day',
      'Facebook lead → save to Google Sheet + send WhatsApp (1 trigger, 2 parallel actions)',
      'Website lead → AI reply → wait 1 hour → send follow-up message',
    ],
    steps: ['Open Automations → New Workflow', 'Drag a Trigger from the library → connect to AI Agent node', 'Add action nodes (Send WhatsApp, Save Sheet, Notify) → Save → Test'],
    href: '/features/visual-automation-builder',
  },
  {
    id: 'sheets',
    icon: '📊',
    color: 'from-green-500/10 to-emerald-500/5 border-green-500/20',
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    title: 'Google Sheets Sync',
    tagline: 'Every lead automatically saved to your Google Sheet',
    description: 'Connect Google Sheets via OAuth. Every lead captured from any channel (website, WhatsApp, Facebook, Instagram) is automatically saved as a row in your sheet with name, phone, email, source, and AI reply.',
    useCases: [
      'Sales team: all leads in one sheet, sorted by source and date',
      'Teacher: student inquiry form responses auto-saved',
      'Bulk automation: import 500 leads from sheet → send WhatsApp to each',
      'Reports: daily lead count, channel breakdown, conversion tracking',
    ],
    steps: ['Go to Integrations → Google Sheets → Connect via Google OAuth', 'Add "Save to Google Sheet" action node in any automation', 'Map columns: Name, Phone, AI Reply, Source, Status'],
    href: '/features',
  },
  {
    id: 'leads',
    icon: '👥',
    color: 'from-amber-500/10 to-orange-500/5 border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    title: 'Lead Management CRM',
    tagline: 'All your leads in one pipeline with AI scoring',
    description: 'Every lead from every channel appears in your CRM. AI scores them as Hot, Warm, or Cold based on urgency and buying intent. Move them through pipeline stages, assign tasks, and track conversations.',
    useCases: [
      'See all WhatsApp, Instagram, Facebook, website leads in one place',
      'Hot leads automatically highlighted — call them first',
      'One-click: send follow-up WhatsApp to any lead',
      'Assign tasks: "Call Rahul before 5pm" with due date',
    ],
    steps: ['Leads appear automatically from all connected channels', 'Click any lead → see full conversation history', 'Use filters: Hot leads, by source, by date, by status'],
    href: '/dashboard/leads',
  },
  {
    id: 'analytics',
    icon: '📈',
    color: 'from-rose-500/10 to-red-500/5 border-rose-500/20',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    title: 'Analytics & Insights',
    tagline: 'See exactly what is working and what is not',
    description: 'Real-time dashboard showing leads captured, conversations handled, automation runs, WhatsApp messages sent, hot leads, and estimated revenue potential. Know your best lead source and optimize.',
    useCases: [
      'See: 45 leads this week, 12 hot, ₹3.4L revenue potential',
      'Compare: WhatsApp vs Instagram vs Website — which sends most leads?',
      'Track: automation run success rate, AI response accuracy',
      'Top questions customers are asking — update your knowledge base',
    ],
    steps: ['Open Analytics from the sidebar', 'View 30-day trend charts and business impact metrics', 'Check launch readiness score before going live'],
    href: '/dashboard/analytics',
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
            Everything you can do with B9 Automation
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            From WhatsApp automation to lead management — here is exactly how to use every feature, with real business examples.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition">
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
                      Feature
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

                  <Link href={section.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300 transition">
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
                      <span className="font-bold text-slate-400">Tip:</span> Start with a test message after saving your workflow. Check the Run Test section on the canvas to see each step execute in real time.
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
