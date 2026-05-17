import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURE = {
  badge: '📘 Facebook Lead Ads',
  title: 'Capture Facebook leads into your CRM automatically',
  description: 'Connect your Facebook Business Page and every lead form submission instantly appears in your CRM — with AI qualification and WhatsApp follow-up triggered automatically.',
  steps: [
    {
      num: 1,
      title: 'Connect Facebook',
      desc: 'Go to Integrations → Facebook → click Connect with Facebook. Authorize your Business Page and select which Lead Ad form to sync.',
    },
    {
      num: 2,
      title: 'Build Automation',
      desc: 'In Automations, select "New Facebook Lead" as the Trigger. Add an AI Agent node to qualify the lead, then a Send WhatsApp node to follow up.',
    },
    {
      num: 3,
      title: 'Go Live',
      desc: 'Save and Test your workflow. Every new Facebook lead form submission now automatically flows through your pipeline.',
    },
  ],
  useCases: [
    'Instantly reply to Facebook leads with a personalised WhatsApp message',
    'AI qualifies lead intent — hot, warm, or cold — before you call',
    'Push every lead to Google Sheets for your sales team',
    'Send a demo booking link automatically to every new lead',
    'Route high-value leads to your personal WhatsApp via escalation',
    'Track lead source analytics directly in your B9 dashboard',
  ],
};

export default function FacebookLeadAdsPage() {
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
          <h2 className="text-2xl font-bold mb-10">How to set it up in 3 steps</h2>
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
          <h2 className="text-2xl font-bold mb-8">What you can do with it</h2>
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
