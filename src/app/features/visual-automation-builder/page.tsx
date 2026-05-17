import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURE = {
  badge: '🎯 Visual Automation Builder',
  title: 'Build powerful automations visually — no code needed',
  description: 'Drag and drop triggers, AI agents, and actions onto a canvas. Connect them in seconds to create workflows that run 24/7 without you.',
  steps: [
    {
      num: 1,
      title: 'Pick a Trigger',
      desc: 'Choose what starts your workflow: a new Facebook lead, an Instagram DM, a website visitor filling a widget, a webhook from any tool, or a Razorpay payment.',
    },
    {
      num: 2,
      title: 'Add an AI Agent',
      desc: 'Drop an AI Agent node and choose your assistant. It reads from your knowledge base and crafts a personalised reply or qualifies the lead automatically.',
    },
    {
      num: 3,
      title: 'Connect an Action',
      desc: 'Add a Send WhatsApp, Save to Google Sheet, Send Email, or Handover to Human node. Save the workflow and click Test to run it end-to-end.',
    },
  ],
  useCases: [
    'Lead capture → AI qualify → WhatsApp follow-up in one flow',
    'Facebook Lead Ad → save to Google Sheet → notify owner on WhatsApp',
    'Website widget lead → AI reply → handover hot leads to your team',
    'Razorpay payment → WhatsApp onboarding message to new customer',
    'Instagram DM → AI answers FAQ → captures lead to CRM',
    'Webhook from any tool → trigger any downstream action automatically',
  ],
};

export default function VisualAutomationBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">LIVE NOW</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{FEATURE.badge}</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{FEATURE.title}</h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl">{FEATURE.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700 transition">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 font-semibold text-gray-300 hover:border-white/20 transition">
              ← All Features
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-10">How to build your first automation</h2>
          <div className="space-y-6">
            {FEATURE.steps.map((step) => (
              <div key={step.num} className="flex gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 font-black text-white text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Workflows you can build today</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURE.useCases.map((uc) => (
              <div key={uc} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <p className="text-sm text-gray-300">{uc}</p>
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
