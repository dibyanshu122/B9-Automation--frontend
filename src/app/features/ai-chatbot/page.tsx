import { MarketingNav, MarketingFooter, MarketingCta } from '@/components/marketing-shell';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';

const FEATURE = {
  badge: '🤖 AI Website Chatbot',
  title: 'Add an AI chatbot to your website in 2 minutes',
  description: 'Upload your business documents, get an embed code, and paste it anywhere. Your AI assistant answers customer questions 24/7 from your own knowledge — no coding required.',
  steps: [
    {
      num: 1,
      title: 'Upload your knowledge',
      desc: 'Go to Documents and upload PDFs, paste a URL, or add a YouTube video. Your AI assistant reads and indexes everything automatically.',
    },
    {
      num: 2,
      title: 'Get your embed code',
      desc: 'Go to Widgets → create a widget → copy the one-line embed code. Customize the color, name, and greeting to match your brand.',
    },
    {
      num: 3,
      title: 'Paste on your website',
      desc: 'Add the embed code to your website before the closing </body> tag. The chat widget appears instantly on all pages and starts answering visitors.',
    },
  ],
  useCases: [
    'Answer product and pricing FAQs from your website automatically',
    'Capture visitor name and phone before they leave your site',
    'Answer admission and enrollment questions for coaching institutes',
    'Guide visitors through your service catalog 24/7',
    'Qualify leads by asking intent questions before handing off to sales',
    'Support existing customers with onboarding and how-to questions',
  ],
};

export default function AiChatbotPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%"><defs><pattern id="dots-ai-cha" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots-ai-cha)" /></svg>
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
          <h2 className="text-2xl font-bold mb-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">How to set it up in 3 steps</h2>
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
          <h2 className="text-2xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">What you can do with it</h2>
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
