'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  MessageSquare,
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
  { key: 'coaching',    label: 'Coaching Center' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'ecommerce',   label: 'D2C / Ecommerce' },
  { key: 'healthcare',  label: 'Clinic / Doctor' },
  { key: 'salon',       label: 'Salon / Gym' },
  { key: 'indiamart',   label: 'IndiaMART Business' },
  { key: 'it_agency',   label: 'IT / Agency' },
  { key: 'general',     label: 'General Business' },
];

const actionHref: Record<string, string> = {
  business_profile: '/dashboard/settings',
  assistant: '/dashboard/assistants',
  documents: '/dashboard/documents',
  widget: '/dashboard/widgets',
  lead_capture: '/dashboard/widgets',
  automations: '/dashboard/automations',
  document_routing: '/dashboard/documents',
  action_drafts: '/dashboard/automations',
  whatsapp: '/dashboard/integrations',
  secret_key: '/admin',
  debug: '/admin',
  database: '/admin',
  public_api: '/admin',
  payment_webhook: '/dashboard/integrations',
  lead_engine: '/dashboard/leads',
  automation_engine: '/dashboard/automations',
  knowledge_engine: '/dashboard/documents',
  widget_engine: '/dashboard/widgets',
  whatsapp_engine: '/dashboard/integrations',
};

export default function LaunchCenterPage() {
  const { get, post } = useApi();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [industry, setIndustry] = useState('coaching');
  const [demoResult, setDemoResult] = useState<any>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    get('/api/automation/launch-audit')
      .then((response) => setAudit(response.data))
      .catch((error) => toast.error(error.response?.data?.detail || 'Failed to load launch audit'))
      .finally(() => setLoading(false));
  }, [get]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
  const allChecks = [...(audit?.readiness?.checks || []), ...securityChecks, ...valueChecks, ...integrationChecks];
  const mustFix = allChecks.filter((check: any) => !check.done).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-950 p-6 text-white shadow-xl">
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h1 className="text-2xl font-bold">Production Launch Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
              Final readiness checklist for WhatsApp, payments, security, business value, widget, automation, and the real owner journey.
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

          <div className="rounded-xl border border-white/10 bg-white/10 p-5">
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
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-lg font-bold">{audit?.completed || 0}</p>
                <p className="text-gray-300">Passed</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-lg font-bold">{mustFix}</p>
                <p className="text-gray-300">Open</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-lg font-bold">{integrationChecks.filter((c: any) => c.done).length}</p>
                <p className="text-gray-300">Live</p>
              </div>
            </div>
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
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Meta live test', 'Webhook, inbound, template, and opt-out pass.'],
            ['Razorpay live test', 'Payment link, webhook, and ledger update pass.'],
            ['Agentic test', 'Question, buy, complaint, and opt-out route correctly.'],
            ['Browser QA', 'No console crash on key dashboard routes.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-orange-100 bg-white p-3">
              <p className="text-sm font-bold text-gray-950">{title}</p>
              <p className="mt-1 text-xs text-gray-600">{body}</p>
            </div>
          ))}
        </div>
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
            {check.done ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Done</span>
            ) : (
              <Link href={actionHref[check.key] || '/dashboard/launch'} className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100">
                Fix
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
