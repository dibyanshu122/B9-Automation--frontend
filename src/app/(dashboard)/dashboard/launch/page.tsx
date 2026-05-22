'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { HelpTip } from '@/components/help-tip';
import { ProgressBar } from '@/components/progress-bar';
import { useApi } from '@/hooks/useApi';

const industries = [
  { key: 'coaching',    label: '🎓 Coaching Center' },
  { key: 'real_estate', label: '🏠 Real Estate' },
  { key: 'ecommerce',   label: '🛒 D2C / Ecommerce' },
  { key: 'healthcare',  label: '🏥 Clinic / Doctor' },
  { key: 'salon',       label: '💇 Salon / Gym' },
  { key: 'indiamart',   label: '🇮🇳 IndiaMART Business' },
  { key: 'it_agency',   label: '💻 IT / Agency' },
  { key: 'general',     label: '🏢 General Business' },
];



export default function LaunchCenterPage() {
  const { get, post } = useApi();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [industry, setIndustry] = useState('coaching');
  const [demoResult, setDemoResult] = useState<any>(null);

  const refresh = () => {
    setLoading(true);
    get('/api/automation/launch-audit')
      .then((response) => setAudit(response.data))
      .catch((error) => toast.error(error.response?.data?.detail || 'Failed to load launch audit'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const runDemo = async () => {
    setRunning(true);
    try {
      const response = await post('/api/automation/launch-demo', { industry, persist: true });
      setDemoResult(response.data);
      toast.success('Demo flow completed. Lead, WhatsApp draft, and task created.');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Demo test failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <Card className="text-gray-600">Loading launch center...</Card>;
  }

  const score = audit?.score || 0;
  const stage = (audit?.stage || 'setup_needed').split('_').join(' ');
  const securityChecks = audit?.security_checks || [];
  const valueChecks = audit?.value_checks || [];
  const integrationChecks = audit?.integration_checks || [];
  const blockers = audit?.blockers || [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 p-6 text-white shadow-xl">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-24 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Make B9 Automation client-ready before you sell it.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
              This page checks business value, security, live integrations, WhatsApp readiness, and the real owner journey: lead captured, message drafted, task created.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard/automations">
                <Button variant="secondary">
                  <Zap className="h-4 w-4" />
                  Fix Automations
                </Button>
              </Link>
              <Link href="/dashboard/messages">
                <Button>
                  <MessageSquare className="h-4 w-4" />
                  Connect WhatsApp
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Launch score</p>
                <p className="mt-1 text-4xl font-bold">{score}%</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 text-orange-100">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={score} color="primary" showLabel={false} />
            </div>
            <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize text-orange-100">
              {stage}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-950">One-click Demo Test</h2>
            <HelpTip text="Creates demo records so you can verify the owner flow from lead capture to follow-up task." />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Use this before a client demo. It creates a hot lead, WhatsApp draft, automation run, and task.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {industries.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setIndustry(item.key)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
                  industry === item.key ? 'border-primary-300 bg-orange-50 text-primary-700' : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button className="mt-4" onClick={runDemo} loading={running}>
            <TestTube2 className="h-4 w-4" />
            Run Safe Demo Flow
          </Button>

          {demoResult && (
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-bold text-emerald-900">Demo result: {demoResult.mode}</p>
              <div className="mt-3 space-y-2">
                {(demoResult.timeline || []).map((item: any) => (
                  <div key={item.step} className="flex items-center gap-2 text-sm text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    {item.step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>


        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-950">Top Launch Blockers</h2>
            <HelpTip text="Fix these first. They are the highest impact issues before paid customers use the product." />
          </div>
          <div className="mt-5 space-y-3">
            {blockers.length === 0 ? (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                No critical blockers found. You are ready for a pilot customer.
              </p>
            ) : (
              blockers.map((blocker: any) => (
                <div key={blocker.label} className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                    <div>
                      <p className="font-bold text-gray-950">{blocker.label}</p>
                      <p className="mt-1 text-sm text-gray-700">{blocker.fix}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChecklistCard title="Business Value" icon={FlaskConical} checks={valueChecks} />
        <ChecklistCard title="Security" icon={ShieldCheck} checks={securityChecks} />
        <Card className="border-orange-100 shadow-sm" hoverable={false}>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-950">Live Connections</h2>
          </div>
          <div className="mt-5 space-y-3">
            {integrationChecks.map((check: any) => (
              <div key={check.key} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-950">{check.label}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${check.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {check.done ? 'Ready' : 'Draft'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{check.done ? 'Ready for live use' : 'Draft mode until connected'}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="border-orange-100 bg-orange-50 shadow-sm" hoverable={false}>
        <h2 className="text-lg font-bold text-gray-950">Production readiness summary</h2>
        <p className="mt-2 text-sm text-gray-700">
          Live provider connections are required before WhatsApp, email, and lead-ad automations can send real messages.
        </p>
      </Card>
    </div>
  );
}

function ChecklistCard({ title, icon: Icon, checks }: { title: string; icon: any; checks: any[] }) {
  return (
    <Card className="border-orange-100 shadow-sm" hoverable={false}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-950">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div key={check.key} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3">
            <div>
              <p className="font-semibold text-gray-900">{check.label}</p>
              {!check.done && check.fix && <p className="mt-1 text-xs text-gray-500">{check.fix}</p>}
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${check.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {check.done ? 'Done' : 'Fix'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
