'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Building2, CheckCircle2, Globe2, MessageCircle, Rocket, Sparkles, Target, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { DEFAULT_INDUSTRY_PACK, INDUSTRY_PACKS, IndustryPack } from '@/lib/industry-packs';

const setupSteps = [
  'Reading your business profile',
  'Creating your workspace',
  'Creating your AI assistant',
  'Loading automation templates',
  'Preparing your dashboard',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { get, post } = useApi();
  const { user, token, hasHydrated } = useAuthStore();
  const [selectedPack, setSelectedPack] = useState<IndustryPack>(DEFAULT_INDUSTRY_PACK);
  const [form, setForm] = useState({
    business_name: '',
    target_audience: '',
    services: '',
    primary_goal: '',
    website_url: '',
    whatsapp_number: '',
    instagram_handle: '',
    business_description: '',
    language: 'hinglish',
    tone: 'friendly',
  });
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    get('/api/automation/onboarding/status')
      .then((response) => {
        if (response.data?.is_complete) {
          router.replace('/dashboard');
        }
      })
      .finally(() => setChecking(false));
  }, [get, hasHydrated, router, token, user]);

  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, setupSteps.length - 1));
    }, 650);
    return () => window.clearInterval(timer);
  }, [loading]);

  const completion = useMemo(() => {
    // Only count actual user-filled fields (not defaults from selectedPack)
    const fields = [
      form.business_name,
      form.target_audience,
      form.primary_goal,
      form.services,
    ];
    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form.business_name, form.primary_goal, form.target_audience, form.services]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await post('/api/automation/onboarding/setup', {
        business_type: selectedPack.label,
        industry: selectedPack.label,
        business_name: form.business_name || selectedPack.workspace_name,
        services: form.services,
        target_audience: form.target_audience || selectedPack.target_audience,
        primary_goal: form.primary_goal || selectedPack.primary_goal,
        website_url: form.website_url,
        whatsapp_number: form.whatsapp_number,
        instagram_handle: form.instagram_handle,
        business_description: form.business_description,
        tone: form.tone,
        language: form.language,
      });
      setStepIndex(setupSteps.length - 1);
      toast.success('Your B9 Automation workspace is ready!');
      // Clear skip flag since onboarding is now complete
      if (typeof window !== 'undefined') localStorage.removeItem('onboarding_skipped');
      window.setTimeout(() => router.replace('/dashboard?welcome=1'), 850);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Onboarding setup failed');
      setLoading(false);
    }
  };

  if (!hasHydrated || checking) {
    return (
      <div className="b9-command-shell flex min-h-screen items-center justify-center px-4 text-slate-100">
        <div className="b9-glass b9-scanline rounded-xl px-6 py-4 font-medium">Preparing onboarding...</div>
      </div>
    );
  }

  return (
    <div className="b9-command-shell min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="b9-glass flex flex-col justify-between rounded-2xl p-6 lg:p-8"
          >
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-sm font-bold text-orange-100">
                <Sparkles className="h-4 w-4" />
                First-time business setup
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Tell B9 what your business does.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                We will create your workspace, assistant, lead flow, and automation templates before opening the dashboard.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-100">Setup health</p>
                    <p className="mt-1 text-xs text-slate-500">Complete the basics to unlock your dashboard.</p>
                  </div>
                  <div className="text-3xl font-bold text-orange-100">{completion}%</div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-400 to-emerald-400 transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {setupSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${loading && index <= stepIndex ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                    {loading && index <= stepIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={loading && index <= stepIndex ? 'text-slate-100' : 'text-slate-500'}>{step}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.form
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onSubmit={handleSubmit}
            className="b9-glass rounded-2xl p-5 lg:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-100/80">Business profile</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Setup your automation base</h2>
              </div>
              <Bot className="h-8 w-8 text-orange-200" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INDUSTRY_PACKS.map((pack) => (
                <button
                  key={pack.key}
                  type="button"
                  onClick={() => setSelectedPack(pack)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedPack.key === pack.key
                      ? 'border-orange-300/50 bg-orange-400/15 text-orange-100 shadow-lg shadow-orange-500/10'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-300/30 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-sm font-bold">{pack.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{pack.primary_goal}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Field icon={Building2} label="Business name">
                <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="input-field" placeholder={selectedPack.workspace_name} required />
              </Field>
              <Field icon={Users} label="Target audience">
                <input value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="input-field" placeholder={selectedPack.target_audience} />
              </Field>
              <Field icon={Target} label="Main goal">
                <input value={form.primary_goal} onChange={(e) => setForm({ ...form, primary_goal: e.target.value })} className="input-field" placeholder={selectedPack.primary_goal} />
              </Field>
              <Field icon={Sparkles} label="Services / offers">
                <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} className="input-field" placeholder="Courses, plans, services, pricing..." />
              </Field>
              <Field icon={Globe2} label="Website URL">
                <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="input-field" placeholder="https://yourbusiness.com" />
              </Field>
              <Field icon={MessageCircle} label="WhatsApp number">
                <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="input-field" placeholder="+91 9876543210" />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="input-field">
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
              <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className="input-field">
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="sales-focused">Sales-focused</option>
              </select>
            </div>

            <textarea
              value={form.business_description}
              onChange={(e) => setForm({ ...form, business_description: e.target.value })}
              className="input-field mt-3 min-h-24"
              placeholder="Short description: what do you sell, who do you help, and what should AI know?"
            />

            <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-400/10 p-4 text-sm text-slate-300">
              <p className="font-bold text-orange-100">{selectedPack.dashboard_message}</p>
              <p className="mt-1">{selectedPack.document_hint}</p>
            </div>

            <Button type="submit" loading={loading} className="mt-5 w-full justify-center" size="lg">
              <Rocket className="h-5 w-5" />
              Continue and Create My Business OS
              <ArrowRight className="h-5 w-5" />
            </Button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('onboarding_skipped', 'true');
                }
                router.replace('/dashboard');
              }}
              className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Skip for now — set up later in Settings
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5 text-orange-200" />
        {label}
      </span>
      {children}
    </label>
  );
}
