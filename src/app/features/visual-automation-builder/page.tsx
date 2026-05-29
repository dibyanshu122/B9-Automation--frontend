import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';

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
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%"><defs><pattern id="dots-visual" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots-visual)" /></svg>
      </div>
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/features" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#00F2FE] transition-colors mb-6">
            <ChevronLeft className="h-4 w-4" /> All Features
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 mb-6 ml-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">LIVE NOW</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 sm:text-5xl">{FEATURE.title}</h1>
          <p className="mt-5 text-lg text-zinc-400 max-w-2xl leading-relaxed">{FEATURE.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-6 py-3 font-bold text-white backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_24px_rgba(0,242,254,0.2)]">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 font-semibold text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">How to build your first automation</h2>
          <div className="space-y-6">
            {FEATURE.steps.map((step) => (
              <div key={step.num} className="flex gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-6 transition-all duration-300 hover:border-[#00F2FE]/20 hover:bg-white/[0.025]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/[0.08] font-black text-[#00F2FE] text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">Workflows you can build today</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURE.useCases.map((uc) => (
              <div key={uc} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-4 transition-all duration-300 hover:border-[#00F2FE]/20">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00F2FE] mt-0.5" />
                <p className="text-sm text-zinc-300">{uc}</p>
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
