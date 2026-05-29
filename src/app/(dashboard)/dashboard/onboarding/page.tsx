'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Plug, FileText, Workflow, MessageCircle, ArrowRight, Sparkles, Rocket } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

const STEPS = [
  {
    key: 'whatsapp',
    icon: Plug,
    title: 'Connect WhatsApp',
    description: 'Link your WhatsApp Business number to start receiving and sending messages automatically.',
    action: 'Connect Now',
    href: '/dashboard/integrations',
    color: '#25D366',
  },
  {
    key: 'documents',
    icon: FileText,
    title: 'Upload Business Documents',
    description: 'Upload your price list, FAQs, brochures, or website URL so the AI can answer questions accurately.',
    action: 'Upload Documents',
    href: '/dashboard/documents',
    color: '#00F2FE',
  },
  {
    key: 'automations',
    icon: Workflow,
    title: 'Build Your First Automation',
    description: 'Create a welcome flow, FAQ bot, or lead qualifier. Use a template to start in under 2 minutes.',
    action: 'Open Automations',
    href: '/dashboard/automations',
    color: '#a78bfa',
  },
  {
    key: 'lead_capture',
    icon: MessageCircle,
    title: 'Test Your AI Assistant',
    description: 'Send a test message and see how your AI responds. Check that everything works before going live.',
    action: 'Test Chat',
    href: '/dashboard/chat',
    color: '#f59e0b',
  },
];

export default function OnboardingPage() {
  const { get } = useApi();
  const { user } = useAuthStore();
  const router = useRouter();
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/automation/readiness')
      .then(r => setReadiness(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const checks: Record<string, boolean> = {};
  (readiness?.checks || []).forEach((c: any) => { checks[c.key] = c.done; });

  const completedCount = STEPS.filter(s => checks[s.key]).length;
  const allDone = completedCount === STEPS.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Getting Started</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-3 text-gray-400 text-base max-w-xl mx-auto">
            Complete these 4 steps to start automating your WhatsApp business in under 10 minutes.
          </p>

          {/* Progress bar */}
          <div className="mt-6 mx-auto max-w-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{completedCount} of {STEPS.length} done</span>
              <span className="text-xs font-bold text-cyan-400">{Math.round((completedCount / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* All done state */}
        {allDone && (
          <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">You&rsquo;re all set!</h2>
            <p className="text-sm text-gray-400 mb-4">Your B9 Automation is ready. Head to your dashboard to see live data.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              <Rocket className="h-4 w-4" /> Go to Dashboard
            </Link>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = Boolean(checks[step.key]);
            return (
              <div
                key={step.key}
                className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                  done
                    ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-cyan-500/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step number / check */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    done
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.04]'
                  }`}>
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      : <Icon className="h-5 w-5" style={{ color: step.color }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Step {i + 1}</span>
                      {done && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Done ✓
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base ${done ? 'text-gray-400' : 'text-white'}`}>{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  </div>

                  {!done && (
                    <Link
                      href={step.href}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                      style={{ borderColor: `${step.color}30` }}
                    >
                      {step.action}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Skip link */}
        <p className="mt-8 text-center text-xs text-gray-600">
          Already configured?{' '}
          <Link href="/dashboard" className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2">
            Go to dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
