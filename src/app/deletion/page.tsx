import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { Trash2 } from 'lucide-react';

export default function DataDeletionPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%"><defs><pattern id="dots-del" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots-del)" /></svg>
      </div>

      <MarketingNav variant="dark" />

      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 mb-6">
            <Trash2 className="h-3.5 w-3.5 text-[#00F2FE]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">Data Rights</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 mb-6" style={{ letterSpacing: '-0.02em' }}>
            Data Deletion Request
          </h1>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-8 space-y-5">
            <p className="text-zinc-400 leading-relaxed">
              If you would like to delete your data associated with B9 Automation, please send an email to:
            </p>
            <p className="text-lg font-semibold text-[#00F2FE]">
              support@b9automation.com
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Include your registered email address or phone number. We will process your request within 30 days and confirm deletion via email.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-6">
            <h2 className="text-sm font-bold text-white mb-3">What gets deleted</h2>
            <ul className="space-y-2 text-sm text-zinc-400">
              {[
                'Your account and profile information',
                'All uploaded documents and knowledge base data',
                'Conversation history and chat sessions',
                'Lead and contact data associated with your account',
                'Automation workflows and configurations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE] mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 text-sm text-zinc-600 border-t border-white/[0.06] pt-6">
            B9 Automation — AI-powered business automation platform.
          </p>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
