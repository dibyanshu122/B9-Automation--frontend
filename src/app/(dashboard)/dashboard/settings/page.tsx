'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { useAuthStore } from '@/store/authStore';
import { useApi } from '@/hooks/useApi';
import { useQuota } from '@/hooks/useQuota';
import { BusinessProfile } from '@/types';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2, ExternalLink, KeyRound, Cpu, Zap, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { quota } = useQuota();
  const { get, post, delete: del } = useApi();
  const isFreePlan = !user?.plan || user.plan === 'FREE';
  const PLAN_QUERY_LIMITS: Record<string, number> = {
    FREE: 30, STARTER: 500, GROWTH: 1200, PRO: 2500, BUSINESS: 7500,
  };
  const planQueryLimit = quota?.queries_limit || PLAN_QUERY_LIMITS[(user?.plan || 'FREE').toUpperCase()] || 500;
  const remainingReplies = Math.max(0, planQueryLimit - (quota?.queries_used ?? 0));
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);

  // AI / BYOK settings
  const [aiKeys, setAiKeys] = useState<{
    byok_enabled: boolean;
    groq_key_set: boolean;
    gemini_key_set: boolean;
    openai_key_set: boolean;
    groq_key_masked: string;
    gemini_key_masked: string;
    preferred_model: string;
  } | null>(null);
  const [byokEnabled, setByokEnabled] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('auto');
  const [savingAiKeys, setSavingAiKeys] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});
  const [aiDirty, setAiDirty] = useState(false);
  const aiDirtyRef = useRef(false);

  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    business_name: '',
    business_type: '',
    industry: '',
    target_audience: '',
    website_url: '',
    whatsapp_number: '',
    instagram_handle: '',
    business_description: '',
    services: '',
    primary_goal: '',
    tone: 'friendly',
    language: 'hinglish',
  });

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    Promise.all([
      get('/api/automation/business-profile').catch(() => ({ data: null })),
      get('/api/automation/whatsapp/status').catch(() => ({ data: null })),
      get('/api/settings/ai-keys').catch(() => ({ data: null })),
    ]).then(([bpRes, waRes, aiRes]) => {
      if (bpRes.data) setBusinessProfile(bpRes.data);
      if (waRes.data) setWhatsappStatus(waRes.data);
      if (aiRes.data) {
        setAiKeys(aiRes.data);
        setByokEnabled(aiRes.data.byok_enabled ?? false);
        setPreferredModel(aiRes.data.preferred_model ?? 'auto');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingProfile(true);
    try {
      await post('/api/auth/update-profile', { name: name.trim() });
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      toast.error('Email does not match. Please enter your exact email address.');
      return;
    }
    setDeletingAccount(true);
    try {
      await del('/api/auth/account');
      toast.success('Account deleted.');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete account. Contact support.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Enter current and new password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await post('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const updateBusinessField = (field: keyof BusinessProfile, value: string) => {
    setBusinessProfile((profile) => ({ ...profile, [field]: value }));
  };

  const saveBusinessProfile = async () => {
    if (!businessProfile.business_name || !businessProfile.business_type) {
      toast.error('Business name and type are required');
      return;
    }

    setSavingBusiness(true);
    try {
      const response = await post('/api/automation/business-profile', businessProfile);
      setBusinessProfile(response.data);
      toast.success('Business profile saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save business profile');
    } finally {
      setSavingBusiness(false);
    }
  };

  const saveWhatsappDraftMode = async () => {
    setSavingWhatsapp(true);
    try {
      await post('/api/automation/integrations', {
        provider: 'draft',
        channel: 'whatsapp',
        status: 'draft',
        config: { note: 'Draft mode. Add secure Meta Cloud API credentials to enable live sending.' },
      });
      const response = await get('/api/automation/whatsapp/status');
      setWhatsappStatus(response.data);
      toast.success('WhatsApp draft mode saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save WhatsApp settings');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  // Warn user before leaving with unsaved AI key changes
  useEffect(() => {
    aiDirtyRef.current = aiDirty;
  }, [aiDirty]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (aiDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const saveAiKeys = async () => {
    setSavingAiKeys(true);
    try {
      const body: any = { byok_enabled: byokEnabled, preferred_model: preferredModel };
      if (groqKey.trim()) body.groq_api_key = groqKey.trim();
      if (geminiKey.trim()) body.gemini_api_key = geminiKey.trim();
      await post('/api/settings/ai-keys', body);
      toast.success('AI settings saved');
      setAiDirty(false);
      // Refresh masked key status
      const res = await get('/api/settings/ai-keys').catch(() => ({ data: null }));
      if (res.data) {
        setAiKeys(res.data);
        setByokEnabled(res.data.byok_enabled ?? false);
      }
      setGroqKey('');
      setGeminiKey('');
      setTestResult({});
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save AI settings');
    } finally {
      setSavingAiKeys(false);
    }
  };

  const testAiKey = async (provider: 'groq' | 'gemini') => {
    setTestingProvider(provider);
    setTestResult((r) => ({ ...r, [provider]: null }));
    try {
      const res = await post(`/api/settings/ai-keys/test?provider=${provider}`, {});
      setTestResult((r) => ({ ...r, [provider]: res.data?.ok === true }));
      if (res.data?.ok) toast.success(`${provider === 'groq' ? 'Groq' : 'Gemini'} key works`);
      else toast.error(`${provider === 'groq' ? 'Groq' : 'Gemini'} key is invalid — check and re-enter`);
    } catch {
      setTestResult((r) => ({ ...r, [provider]: false }));
      toast.error('Test failed — check your key');
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              disabled
              className="input-field opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>
          <Button variant="primary" onClick={saveProfile} loading={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Business Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              value={businessProfile.business_name || ''}
              onChange={(e) => updateBusinessField('business_name', e.target.value)}
              className="input-field"
              placeholder="Bright Coaching Classes"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Business Type</label>
            <input
              type="text"
              value={businessProfile.business_type || ''}
              onChange={(e) => updateBusinessField('business_type', e.target.value)}
              className="input-field"
              placeholder="Coaching, Gym, Salon, Real Estate"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Industry</label>
            <input
              type="text"
              value={businessProfile.industry || ''}
              onChange={(e) => updateBusinessField('industry', e.target.value)}
              className="input-field"
              placeholder="Education"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target Audience</label>
            <input
              type="text"
              value={businessProfile.target_audience || ''}
              onChange={(e) => updateBusinessField('target_audience', e.target.value)}
              className="input-field"
              placeholder="Class 10-12 students"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Primary Goal</label>
            <input
              type="text"
              value={businessProfile.primary_goal || ''}
              onChange={(e) => updateBusinessField('primary_goal', e.target.value)}
              className="input-field"
              placeholder="Capture leads, answer FAQs, generate content"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Services / Products</label>
            <input
              type="text"
              value={businessProfile.services || ''}
              onChange={(e) => updateBusinessField('services', e.target.value)}
              className="input-field"
              placeholder="Physics batches, demo class, test series"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Website URL</label>
            <input
              type="url"
              value={businessProfile.website_url || ''}
              onChange={(e) => updateBusinessField('website_url', e.target.value)}
              className="input-field"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp Number</label>
            <input
              type="text"
              value={businessProfile.whatsapp_number || ''}
              onChange={(e) => updateBusinessField('whatsapp_number', e.target.value)}
              className="input-field"
              placeholder="+919999999999"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Instagram Handle</label>
            <input
              type="text"
              value={businessProfile.instagram_handle || ''}
              onChange={(e) => updateBusinessField('instagram_handle', e.target.value)}
              className="input-field"
              placeholder="@brightcoaching"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tone</label>
              <select
                value={businessProfile.tone || 'friendly'}
                onChange={(e) => updateBusinessField('tone', e.target.value)}
                className="input-field"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
              <select
                value={businessProfile.language || 'hinglish'}
                onChange={(e) => updateBusinessField('language', e.target.value)}
                className="input-field"
              >
                <option value="hinglish">Hinglish</option>
                <option value="hindi">Hindi</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Business Description</label>
            <textarea
              value={businessProfile.business_description || ''}
              onChange={(e) => updateBusinessField('business_description', e.target.value)}
              className="input-field min-h-28"
              placeholder="Admissions, demo classes, pricing, offers, audience, and service details."
            />
          </div>
        </div>
        <Button variant="primary" className="mt-5" onClick={saveBusinessProfile} disabled={savingBusiness}>
          {savingBusiness ? 'Saving...' : 'Save Business Profile'}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold text-gray-900">WhatsApp Integration</h2>
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
          <p className="font-semibold text-gray-950">
            Mode: {whatsappStatus?.send_enabled ? 'Live sending enabled' : 'Draft mode'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Provider: {whatsappStatus?.provider || 'draft'} · Status: {whatsappStatus?.status || 'draft'}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Live WhatsApp sending starts only after the Meta Cloud API connection is ready.
          </p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">WhatsApp Webhook URL</p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
              <code className="flex-1 truncate text-xs text-gray-700 select-all">
                {(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/api/webhooks/whatsapp
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/webhooks/whatsapp`);
                }}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Copy
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Paste this URL in your Meta App → WhatsApp → Configuration → Webhook URL</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={saveWhatsappDraftMode} disabled={savingWhatsapp}>
            {savingWhatsapp ? 'Saving...' : 'Keep Draft Mode'}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/messages'}>
            Connect WhatsApp →
          </Button>
        </div>
      </Card>

      {/* AI & BYOK Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-bold text-gray-900">AI Settings</h2>
        </div>

        {/* Plan-specific context banner */}
        {isFreePlan ? (
          /* FREE PLAN — push BYOK as the upgrade path */
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800 mb-1">Free plan — 30 lifetime AI replies included</p>
            <p className="text-xs text-emerald-700">
              Add your own free Groq API key below to get <strong>unlimited AI replies at zero cost</strong> — no payment needed.
              Takes 2 minutes. Groq&apos;s free tier handles 500+ customer conversations/day.
            </p>
          </div>
        ) : (
          /* PAID PLAN — show remaining quota + offer top-up */
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-900 mb-0.5">
                  {user?.plan} plan — B9 managed AI active
                </p>
                <p className="text-xs text-blue-700">
                  {quota
                    ? <>You have <strong>{remainingReplies.toLocaleString('en-IN')} AI replies</strong> remaining this month (out of {planQueryLimit.toLocaleString('en-IN')} included).</>
                    : 'Your plan includes AI replies every month.'}
                  {' '}When you run out, buy a top-up below — no plan upgrade needed.
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shrink-0"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Buy top-up
              </Link>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-200">
              <div
                className={`h-full rounded-full transition-all ${remainingReplies < 50 ? 'bg-red-500' : remainingReplies < 150 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (remainingReplies / planQueryLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* BYOK toggle */}
        <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 mb-5 transition ${byokEnabled ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <KeyRound className={`h-4 w-4 shrink-0 ${byokEnabled ? 'text-violet-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-bold text-gray-950">
                {isFreePlan ? 'Use your own API keys — unlimited for free' : 'Use your own API keys (advanced)'}
              </p>
              <p className="text-xs text-gray-500">
                {isFreePlan
                  ? 'Your key is used instead of B9\'s shared key — bypasses the 30-query limit'
                  : 'Bypasses your monthly plan quota. Your top-up balance won\'t be used when this is ON.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setByokEnabled(!byokEnabled); setAiDirty(true); }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${byokEnabled ? 'bg-violet-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${byokEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Paid plan warning when BYOK turned ON */}
        {!isFreePlan && byokEnabled && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Note:</strong> With BYOK ON, your {user?.plan} plan&apos;s monthly AI replies won&apos;t be consumed — but any top-ups you buy also won&apos;t be used. Turn BYOK OFF if you want to use your plan quota or top-ups.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Groq key */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Groq API Key</label>
            <p className="mb-2 text-xs text-gray-500">
              Free at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-violet-600 hover:underline">
                console.groq.com/keys <ExternalLink className="h-3 w-3" />
              </a>
              {' '}— 2 minutes setup.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={groqKey}
                onChange={(e) => { setGroqKey(e.target.value); setAiDirty(true); }}
                className="input-field flex-1"
                placeholder={aiKeys?.groq_key_set ? aiKeys.groq_key_masked || '••••••••••••••••' : 'gsk_...'}
                autoComplete="new-password"
              />
              {aiKeys?.groq_key_set && (
                <button
                  type="button"
                  disabled={testingProvider === 'groq'}
                  onClick={() => testAiKey('groq')}
                  className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  {testingProvider === 'groq' ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : testResult.groq === true ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : testResult.groq === false ? <XCircle className="h-4 w-4 text-red-500" />
                    : 'Test'}
                </button>
              )}
            </div>
            {aiKeys?.groq_key_set && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Key saved
              </p>
            )}
          </div>

          {/* Gemini key */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Gemini API Key</label>
            <p className="mb-2 text-xs text-gray-500">
              Free at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-violet-600 hover:underline">
                aistudio.google.com <ExternalLink className="h-3 w-3" />
              </a>
              {' '}— 1,500 req/day free.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => { setGeminiKey(e.target.value); setAiDirty(true); }}
                className="input-field flex-1"
                placeholder={aiKeys?.gemini_key_set ? aiKeys.gemini_key_masked || '••••••••••••••••' : 'AIza...'}
                autoComplete="new-password"
              />
              {aiKeys?.gemini_key_set && (
                <button
                  type="button"
                  disabled={testingProvider === 'gemini'}
                  onClick={() => testAiKey('gemini')}
                  className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  {testingProvider === 'gemini' ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : testResult.gemini === true ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : testResult.gemini === false ? <XCircle className="h-4 w-4 text-red-500" />
                    : 'Test'}
                </button>
              )}
            </div>
            {aiKeys?.gemini_key_set && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Key saved
              </p>
            )}
          </div>
        </div>

        {/* Preferred model */}
        <div className="mt-5">
          <label className="mb-1 block text-sm font-semibold text-gray-700">Preferred AI Model</label>
          <select
            value={preferredModel}
            onChange={(e) => { setPreferredModel(e.target.value); setAiDirty(true); }}
            className="input-field max-w-xs"
          >
            <option value="auto">Auto (recommended) — B9 picks best model per task</option>
            <option value="groq">Groq only (llama-3.1-8b, fastest)</option>
            <option value="gemini">Gemini only (flash-lite, long context)</option>
          </select>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button variant="primary" onClick={saveAiKeys} loading={savingAiKeys}>
            {savingAiKeys ? 'Saving…' : 'Save AI Settings'}
          </Button>
          {aiDirty && !savingAiKeys && (
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              ● Unsaved changes
            </span>
          )}
          {byokEnabled && (aiKeys?.groq_key_set || aiKeys?.gemini_key_set) && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> BYOK active — no reply limit
            </span>
          )}
        </div>

        {/* Bottom info — different for free vs paid */}
        {isFreePlan ? (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-bold mb-1 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Free unlimited AI — here&apos;s how</p>
            <ul className="space-y-1 text-xs text-emerald-700 list-disc list-inside">
              <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="font-semibold underline">console.groq.com</a> → Create free account → Copy API key</li>
              <li>Paste above → Toggle BYOK ON → Save</li>
              <li>Done — your AI now runs on Groq&apos;s free tier (500+ chats/day)</li>
              <li>Keys are AES-encrypted. Never visible after saving.</li>
            </ul>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-bold mb-1 text-gray-900">How AI replies work on paid plans</p>
            <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
              <li>B9 manages the AI — no key needed. Just use the platform.</li>
              <li>Monthly replies reset every billing cycle.</li>
              <li>Limit hit? Buy a top-up from <Link href="/dashboard/billing" className="font-semibold text-primary-600 underline">Billing</Link> — replies added instantly.</li>
              <li>BYOK is for power users who want truly unlimited without buying top-ups.</li>
            </ul>
          </div>
        )}
      </Card>

      {/* Security */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="input-field mb-2"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="input-field mb-2"
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              className="input-field"
            />
          </div>
          <Button variant="primary" onClick={changePassword} loading={changingPassword}>
            {changingPassword ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Data & Privacy</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 text-sm">Export Your Data</p>
            <p className="mt-1 text-xs text-gray-500">Download all your leads, conversations, documents and workflow history as a CSV / JSON export.</p>
            <a href="/api/auth/me/export" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition">
              Download Export
            </a>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 text-sm">Privacy Policy</p>
            <p className="mt-1 text-xs text-gray-500">Read how we collect, use and protect your data.</p>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-semibold text-primary-600 underline hover:text-primary-700">
              View Privacy Policy →
            </a>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
          Delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
      </Card>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete your account, all workspaces, assistants, leads, and automation workflows. <strong>This cannot be undone.</strong>
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Type your email address to confirm: <span className="font-mono text-gray-900">{user?.email}</span>
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="input-field"
                placeholder={user?.email}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={deleteAccount}
                loading={deletingAccount}
                disabled={deleteConfirmEmail !== user?.email || deletingAccount}
              >
                {deletingAccount ? 'Deleting…' : 'Yes, Delete My Account'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirmEmail(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
