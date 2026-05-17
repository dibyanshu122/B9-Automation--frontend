'use client';

import Link from 'next/link';
import { Button } from '@/components/button';
import { MarketingCta, MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const LIVE_FEATURES = [
  {
    icon: '🤖',
    slug: 'ai-chatbot',
    title: 'AI Website Chatbot',
    desc: 'Embeddable widget answers questions from your documents 24/7. Zero coding needed.',
    steps: ['Upload your PDFs, URLs or YouTube videos', 'Get an embed code from the Widgets page', 'Paste it on your website — AI answers instantly'],
  },
  {
    icon: '💬',
    slug: 'whatsapp-automation',
    title: 'WhatsApp Automation',
    desc: 'Send text messages and pre-approved templates to leads via Meta Cloud API.',
    steps: ['Connect WhatsApp in Integrations with your Meta credentials', 'Add "Send WhatsApp" node in Automations', 'Set send_mode to Live — messages go out automatically'],
  },
  {
    icon: '📘',
    slug: 'facebook-lead-ads',
    title: 'Facebook Lead Ads',
    desc: 'Auto-capture leads from Facebook Lead Ad forms into your CRM the moment they submit.',
    steps: ['Connect Facebook in Integrations via OAuth', 'Select your Facebook Page and Lead Form', 'New form submissions trigger your automation flow'],
  },
  {
    icon: '📸',
    slug: 'instagram-dm',
    title: 'Instagram DM',
    desc: 'Auto-reply to incoming Instagram DMs and capture them as leads automatically.',
    steps: ['Connect Instagram Professional account in Integrations', 'Add "New Instagram Message" trigger in Automations', 'AI replies instantly, lead is captured to CRM'],
  },
  {
    icon: '🎯',
    slug: 'visual-automation-builder',
    title: 'Visual Automation Builder',
    desc: 'Drag-and-drop canvas: Trigger → AI Agent → Action. No code, no complexity.',
    steps: ['Pick a Trigger (Facebook Lead, WhatsApp, Website)', 'Add AI Agent node to qualify or reply', 'Connect Send WhatsApp or Save to Sheet action'],
  },
  {
    icon: '📊',
    slug: null,
    title: 'Google Sheets Sync',
    desc: 'Push every captured lead — name, phone, email, AI reply — to a connected Sheet.',
    steps: ['Connect Google Sheets in Integrations via OAuth', 'Add "Save to Sheet" node in Automations', 'Every lead auto-populates your spreadsheet in real time'],
  },
  {
    icon: '📧',
    slug: null,
    title: 'Gmail Integration',
    desc: 'AI drafts email replies, sends them, and syncs inbound emails to your lead CRM.',
    steps: ['Connect Gmail via OAuth in Integrations', 'Add "Send Email" node to your automation', 'AI drafts replies based on your knowledge base'],
  },
  {
    icon: '📄',
    slug: null,
    title: 'Document Intelligence',
    desc: 'Upload PDF, URL, YouTube video — AI learns from your content and answers from it.',
    steps: ['Go to Documents → Upload file, URL, or YouTube link', 'AI scans and indexes your content automatically', 'Your assistant now answers from that knowledge'],
  },
  {
    icon: '📈',
    slug: null,
    title: 'Analytics Dashboard',
    desc: 'Conversations, leads captured, hot leads, conversion rate, hours saved — all live.',
    steps: ['All metrics update in real time on your dashboard', 'Filter by workspace, assistant, or date range', 'Export reports as CSV anytime'],
  },
  {
    icon: '🪝',
    slug: null,
    title: 'Inbound Webhooks',
    desc: 'Receive data from Typeform, Zapier, Make or any custom API to start a workflow.',
    steps: ['Copy your unique webhook URL from Integrations', 'Send a POST request from any external tool', 'Workflow triggers instantly on data receipt'],
  },
  {
    icon: '💳',
    slug: null,
    title: 'Razorpay Trigger',
    desc: 'Fire automations on payment success — auto-send onboarding WhatsApp to new customers.',
    steps: ['Connect Razorpay webhook in Integrations', 'Add "Payment Success" trigger in Automations', 'Send WhatsApp onboarding message automatically'],
  },
  {
    icon: '🌐',
    slug: null,
    title: 'Website Lead Capture',
    desc: 'The embeddable widget captures visitor name, phone, email directly into your CRM.',
    steps: ['Create a Widget from the Widgets page', 'Copy the embed code (one script tag)', 'Visitors fill the widget → lead appears in CRM instantly'],
  },
];

const COMING_SOON_FEATURES = [
  { icon: '🏠', title: 'Zoho / HubSpot CRM', desc: 'Push leads directly into your CRM pipeline.' },
  { icon: '📅', title: 'Calendly Booking', desc: 'AI schedules meetings from automation flows.' },
  { icon: '🤖', title: 'Telegram / Slack Alerts', desc: 'Real-time owner notifications on hot leads.' },
  { icon: '📱', title: 'Twilio SMS', desc: 'Automated SMS to leads anywhere in the world.' },
  { icon: '🗓', title: 'Google Calendar', desc: 'Auto-create meetings from lead conversations.' },
  { icon: '🏷', title: 'White-label', desc: 'Your own domain, logo, and branded portal.' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Invite team members with role-based access.' },
  { icon: '📲', title: 'Mobile App', desc: 'Manage leads and automations from your phone.' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Features</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-bold text-white leading-tight">
            Everything your Indian business needs to automate and grow
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            B9 Automation connects your leads, AI, and WhatsApp into one no-code platform. See exactly what is live today — and what is coming next.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup">
              <Button>
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">See Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Features */}
      <section className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Live Now</h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-0.5 text-xs font-bold">
              {LIVE_FEATURES.length} Features
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIVE_FEATURES.map((f) => {
              const card = (
                <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all duration-200 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{f.icon}</span>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed flex-1">{f.desc}</p>
                  <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
                    {f.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-400">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  {f.slug && (
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary-400 group-hover:text-primary-300 transition-colors">
                      Learn how to set up <span className="ml-0.5">→</span>
                    </div>
                  )}
                </div>
              );

              return f.slug ? (
                <Link href={`/features/${f.slug}`} key={f.title} className="block">
                  {card}
                </Link>
              ) : (
                <div key={f.title}>{card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="bg-slate-900 border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
            <span className="rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-0.5 text-xs font-bold">
              In Development
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {COMING_SOON_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <div className="mb-3 text-2xl opacity-50 grayscale">{f.icon}</div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-5">{f.desc}</p>
                <span className="mt-3 inline-block rounded-full bg-amber-500/10 text-amber-500/70 px-2 py-0.5 text-[10px] font-bold">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-white mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              ['Which integrations are live right now?', 'WhatsApp (Meta Cloud API), Facebook Lead Ads, Instagram DM, Google Sheets, Gmail, Website Widget, and Razorpay payment triggers are all live and production-ready.'],
              ['Can B9 Automation answer from multiple documents?', 'Yes. Your AI assistant uses all uploaded documents, URLs, and videos to answer questions from the knowledge base.'],
              ['Does it support website widgets?', 'Yes. Generate an embed code from the Widgets page and add it to any website in 30 seconds.'],
              ['Is my data private?', 'Yes. Your content is private by default, encrypted in transit and at rest, and controlled entirely by your account.'],
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
