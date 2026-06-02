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
import { CheckCircle2, XCircle, Loader2, ExternalLink, KeyRound, Cpu, Zap, CreditCard, Activity, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { quota } = useQuota();
  const { get, post, put, delete: del } = useApi();
  const isFreePlan = !user?.plan || user.plan === 'FREE';
  const PLAN_QUERY_LIMITS: Record<string, number> = {
    FREE: 30, STARTER: 1000, GROWTH: 5000, PRO: 20000, BUSINESS: 50000,
  };
  const planQueryLimit = quota?.queries_limit || PLAN_QUERY_LIMITS[(user?.plan || 'FREE').toUpperCase()] || 500;
  const remainingReplies = Math.max(0, planQueryLimit - (quota?.queries_used ?? 0));
  const [name, setName] = useState('');
  // Activity log state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);

  const loadAuditLogs = async () => {
    if (auditLoaded) return;
    setAuditLoading(true);
    try {
      const r = await get('/api/audit-logs?limit=50');
      setAuditLogs(r.data || []);
      setAuditLoaded(true);
    } catch { /* silent */ }
    finally { setAuditLoading(false); }
  };

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [canManageSensitiveSettings, setCanManageSensitiveSettings] = useState<boolean | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; qr_uri: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFADisableCode, setTwoFADisableCode] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  // Active sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [revokingSession, setRevokingSession] = useState('');
  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
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
  const [agenticMaxSteps, setAgenticMaxSteps] = useState(4);
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

  useEffect(() => { loadNotifPrefs(); }, []); // eslint-disable-line

  useEffect(() => {
    Promise.all([
      get('/api/automation/business-profile').catch(() => ({ data: null })),
      get('/api/automation/whatsapp/status').catch(() => ({ data: null })),
      get('/api/team/me').catch(() => ({ data: null })),
      get('/api/settings/ai-keys').catch(() => ({ data: null })),
    ]).then(([bpRes, waRes, teamRes, aiRes]) => {
      if (bpRes.data) setBusinessProfile(bpRes.data);
      if (waRes.data) setWhatsappStatus(waRes.data);
      if (teamRes.data) {
        const permissions = teamRes.data.permissions || [];
        setCanManageSensitiveSettings(Boolean(teamRes.data.is_owner || permissions.includes('*') || permissions.includes('settings.manage')));
      } else {
        setCanManageSensitiveSettings(false);
      }
      if (aiRes.data) {
        setAiKeys(aiRes.data);
        setByokEnabled(aiRes.data.byok_enabled ?? false);
        setPreferredModel(aiRes.data.preferred_model ?? 'auto');
        setAgenticMaxSteps(aiRes.data.agentic_max_steps ?? 4);
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
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter and one number');
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

  // ── 2FA functions ────────────────────────────────────────────────────────
  const setup2FA = async () => {
    setTwoFALoading(true);
    try {
      const r = await get('/api/auth/2fa/setup');
      setTwoFASetup(r.data);
      setTwoFAEnabled(r.data.already_enabled);
    } catch { toast.error('Failed to start 2FA setup'); }
    finally { setTwoFALoading(false); }
  };
  const verify2FA = async () => {
    if (!twoFACode.trim()) return;
    setTwoFALoading(true);
    try {
      await post('/api/auth/2fa/verify', { code: twoFACode.trim() });
      toast.success('Two-factor authentication enabled!');
      setTwoFAEnabled(true);
      setTwoFASetup(null);
      setTwoFACode('');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Invalid code'); }
    finally { setTwoFALoading(false); }
  };
  const disable2FA = async () => {
    if (!twoFADisableCode.trim()) return;
    setTwoFALoading(true);
    try {
      await post('/api/auth/2fa/disable', { code: twoFADisableCode.trim() });
      toast.success('2FA disabled');
      setTwoFAEnabled(false);
      setShowDisable2FA(false);
      setTwoFADisableCode('');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Invalid code'); }
    finally { setTwoFALoading(false); }
  };

  // ── Sessions functions ────────────────────────────────────────────────────
  const loadSessions = async () => {
    if (sessionsLoaded) return;
    setSessionsLoading(true);
    try {
      const r = await get('/api/auth/sessions');
      setSessions(r.data || []);
      setSessionsLoaded(true);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  };
  const revokeSession = async (id: string) => {
    setRevokingSession(id);
    try {
      await del(`/api/auth/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session revoked');
    } catch { toast.error('Failed to revoke session'); }
    finally { setRevokingSession(''); }
  };

  // ── Notification Prefs functions ──────────────────────────────────────────
  const loadNotifPrefs = async () => {
    setNotifLoading(true);
    try {
      const r = await get('/api/auth/notification-preferences');
      setNotifPrefs(r.data || {});
    } catch { /* silent */ }
    finally { setNotifLoading(false); }
  };
  const saveNotifPrefs = async () => {
    setNotifSaving(true);
    try {
      await put('/api/auth/notification-preferences', notifPrefs);
      toast.success('Notification preferences saved');
    } catch { toast.error('Failed to save'); }
    finally { setNotifSaving(false); }
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
      const body: any = { byok_enabled: byokEnabled, preferred_model: preferredModel, agentic_max_steps: agenticMaxSteps };
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
      else toast.error(`${provider === 'groq' ? 'Groq' : 'Gemini'} key is invalid - check and re-enter`);
    } catch {
      setTestResult((r) => ({ ...r, [provider]: false }));
      toast.error('Test failed - check your key');
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
            {savingProfile ? 'Saving...' : 'Save Changes'}
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
              placeholder="+91XXXXXXXXXX"
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
                {(process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com')}/api/webhooks/whatsapp
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com'}/api/webhooks/whatsapp`);
                }}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Copy
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Paste this URL in your Meta App, then WhatsApp, then Configuration, then Webhook URL.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={saveWhatsappDraftMode} disabled={savingWhatsapp}>
            {savingWhatsapp ? 'Saving...' : 'Keep Draft Mode'}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/messages'}>
            Connect WhatsApp
          </Button>
        </div>
      </Card>

      {canManageSensitiveSettings === false && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Advanced Settings</h2>
          <p className="text-sm text-gray-600">
            AI provider keys, payment keys, and workspace-level settings are managed by the workspace owner or an admin.
          </p>
        </Card>
      )}

      {/* AI & BYOK Settings */}
      {canManageSensitiveSettings === true && (
      <Card>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-bold text-gray-900">AI Settings</h2>
        </div>

        {/* Plan-specific context banner */}
        {isFreePlan ? (
          /* FREE PLAN - push BYOK as the upgrade path */
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800 mb-1">Free plan - 30 lifetime AI replies included</p>
            <p className="text-xs text-emerald-700">
              Add your own Groq API key below to use your own provider quota for AI replies.
              Takes 2 minutes. Groq&apos;s free tier handles 500+ customer conversations/day.
            </p>
          </div>
        ) : (
          /* PAID PLAN - show remaining quota + offer top-up */
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-900 mb-0.5">
                  {user?.plan} plan - B9 managed AI active
                </p>
                <p className="text-xs text-blue-700">
                  {quota
                    ? <>You have <strong>{remainingReplies.toLocaleString('en-IN')} AI replies</strong> remaining this month (out of {planQueryLimit.toLocaleString('en-IN')} included).</>
                    : 'Your plan includes AI replies every month.'}
                  {' '}When you run out, buy a top-up below - no plan upgrade needed.
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
                {isFreePlan ? 'Use your own API keys (advanced)' : 'Use your own API keys (advanced)'}
              </p>
              <p className="text-xs text-gray-500">
                {isFreePlan
                  ? 'Your key is used instead of B9 managed credits. Provider usage is billed or limited by your provider account.'
                  : 'Uses your provider account instead of monthly B9 credits while this is ON.'}
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
            <strong>Note:</strong> With BYOK ON, your {user?.plan} plan&apos;s monthly AI credits and top-ups are not consumed. Turn BYOK OFF if you want to use B9 managed credits.
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
              {' '}- 2 minutes setup.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={groqKey}
                onChange={(e) => { setGroqKey(e.target.value); setAiDirty(true); }}
                className="input-field flex-1"
                placeholder={aiKeys?.groq_key_set ? aiKeys.groq_key_masked || '****************' : 'gsk_...'}
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
              {' '}- 1,500 req/day free.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => { setGeminiKey(e.target.value); setAiDirty(true); }}
                className="input-field flex-1"
                placeholder={aiKeys?.gemini_key_set ? aiKeys.gemini_key_masked || '****************' : 'AIza...'}
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
            <option value="auto">B9 Agentic Core - Auto (recommended)</option>
            <option value="groq">Groq only (llama-3.1-8b, fastest)</option>
            <option value="gemini">Gemini only (flash-lite, long context)</option>
          </select>
        </div>

        {/* Agentic AI safety - max steps */}
        <div className="mt-5">
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Agentic AI - Max Steps per Reply
          </label>
          <p className="mb-2 text-xs text-gray-500">
            How many tool calls the AI can make per customer message. Higher = more thorough but slower. Range: 2-8.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range" min={2} max={8} step={1}
              value={agenticMaxSteps}
              onChange={(e) => { setAgenticMaxSteps(Number(e.target.value)); setAiDirty(true); }}
              className="w-40 accent-orange-500"
            />
            <span className="w-6 text-center text-sm font-bold text-gray-900">{agenticMaxSteps}</span>
            <span className="text-xs text-gray-400">
              {agenticMaxSteps <= 3 ? '- Fast, simple replies' : agenticMaxSteps <= 5 ? '- Balanced (recommended)' : '- Deep, multi-step replies'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button variant="primary" onClick={saveAiKeys} loading={savingAiKeys}>
            {savingAiKeys ? 'Saving...' : 'Save AI Settings'}
          </Button>
          {aiDirty && !savingAiKeys && (
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              * Unsaved changes
            </span>
          )}
          {byokEnabled && (aiKeys?.groq_key_set || aiKeys?.gemini_key_set) && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> BYOK active - provider-managed usage
            </span>
          )}
        </div>

        {/* Bottom info - different for free vs paid */}
        {isFreePlan ? (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-bold mb-1 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Use your own AI key</p>
            <ul className="space-y-1 text-xs text-emerald-700 list-disc list-inside">
              <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="font-semibold underline">console.groq.com</a>, create a free account, then copy your API key.</li>
              <li>Paste above, toggle BYOK ON, then save.</li>
              <li>Done - your AI now runs through your Groq account and provider limits.</li>
              <li>Keys are AES-encrypted. Never visible after saving.</li>
            </ul>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-bold mb-1 text-gray-900">How AI replies work on paid plans</p>
            <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
              <li>B9 manages the AI - no key needed. Just use the platform.</li>
              <li>Monthly replies reset every billing cycle.</li>
              <li>Limit hit? Buy a top-up from <Link href="/dashboard/billing" className="font-semibold text-primary-600 underline">Billing</Link> - replies added instantly.</li>
              <li>BYOK is for power users who prefer provider-managed usage instead of B9 credits.</li>
            </ul>
          </div>
        )}
      </Card>
      )}

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
            {changingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" /> Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${twoFAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {twoFAEnabled ? '✓ Enabled' : 'Disabled'}
          </span>
        </div>
        {!twoFAEnabled && !twoFASetup && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Use Google Authenticator, Authy, or any TOTP app to generate login codes.</p>
            <Button variant="secondary" onClick={setup2FA} loading={twoFALoading}>
              Enable Two-Factor Auth →
            </Button>
          </div>
        )}
        {!twoFAEnabled && twoFASetup && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Step 1 — Scan this QR code</p>
              <p className="text-xs text-gray-500">Open Google Authenticator or Authy and scan the QR code below.</p>
              {/* QR code as image using free API */}
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFASetup.qr_uri)}`}
                  alt="2FA QR Code"
                  className="rounded-xl border border-gray-200 shadow-sm"
                  width={180} height={180}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">Can't scan? Use manual key: <code className="bg-gray-100 px-1 rounded text-xs font-mono">{twoFASetup.secret}</code></p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Step 2 — Enter the 6-digit code from your app</p>
              <div className="flex gap-2">
                <input
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="input-field text-center text-xl font-mono tracking-[0.5em] w-40"
                />
                <Button onClick={verify2FA} loading={twoFALoading} disabled={twoFACode.length !== 6}>
                  Verify & Enable
                </Button>
                <Button variant="secondary" onClick={() => { setTwoFASetup(null); setTwoFACode(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {twoFAEnabled && !showDisable2FA && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-emerald-700 flex-1">Your account is protected with two-factor authentication.</p>
            <button onClick={() => setShowDisable2FA(true)} className="text-xs text-red-500 hover:text-red-700 font-semibold underline">
              Disable 2FA
            </button>
          </div>
        )}
        {twoFAEnabled && showDisable2FA && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">Enter your current authenticator code to disable 2FA:</p>
            <div className="flex gap-2">
              <input
                value={twoFADisableCode}
                onChange={e => setTwoFADisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="input-field text-center text-xl font-mono tracking-[0.5em] w-40"
              />
              <Button variant="secondary" onClick={disable2FA} loading={twoFALoading} disabled={twoFADisableCode.length !== 6}>
                Confirm Disable
              </Button>
              <Button variant="secondary" onClick={() => { setShowDisable2FA(false); setTwoFADisableCode(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Active Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Devices and browsers currently logged into your account</p>
          </div>
          {!sessionsLoaded && (
            <Button variant="secondary" size="sm" onClick={loadSessions} loading={sessionsLoading}>
              Load Sessions
            </Button>
          )}
        </div>
        {sessionsLoading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}</div>}
        {sessionsLoaded && sessions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No active sessions found</p>
        )}
        {sessionsLoaded && sessions.length > 0 && (
          <div className="divide-y divide-gray-100">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {s.device_info}
                    {s.is_current && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Current</span>}
                  </p>
                  <p className="text-xs text-gray-400">{s.ip_address} · Last active {s.last_active ? new Date(s.last_active + 'Z').toLocaleString() : '—'}</p>
                </div>
                {!s.is_current && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revokingSession === s.id}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition disabled:opacity-40"
                  >
                    {revokingSession === s.id ? '...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">Choose which events trigger email and in-app notifications</p>
        {notifLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'new_lead', label: 'New lead captured', desc: 'When a lead comes from website widget, WhatsApp, or Facebook' },
              { key: 'campaign_complete', label: 'Campaign completed', desc: 'When a broadcast campaign finishes sending' },
              { key: 'payment_received', label: 'Payment received', desc: 'When a customer completes a payment via Razorpay' },
              { key: 'automation_error', label: 'Automation errors', desc: 'When a workflow run fails or hits an error' },
              { key: 'handover_requested', label: 'Handover requested', desc: 'When AI escalates a conversation for human review' },
              { key: 'weekly_report', label: 'Weekly summary report', desc: 'Weekly stats digest every Monday morning' },
              { key: 'marketing_updates', label: 'Product updates & tips', desc: 'New features, tips, and platform announcements' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  role="switch"
                  aria-checked={!!notifPrefs[item.key]}
                  aria-label={item.label}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0 ${notifPrefs[item.key] ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
            <Button onClick={saveNotifPrefs} loading={notifSaving} className="mt-2">
              Save Notification Preferences
            </Button>
          </div>
        )}
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
              View Privacy Policy
            </a>
          </div>
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
          </div>
          <button
            onClick={loadAuditLogs}
            disabled={auditLoading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {auditLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
            {auditLoaded ? 'Refresh' : 'Load Activity'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Audit trail of all AI actions, agentic runs, and API calls on your account.
        </p>
        {!auditLoaded ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-400">
            Click "Load Activity" to view your audit log
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-400">
            No activity recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Action</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Resource</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-indigo-700">{log.action}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{log.resource_type || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${log.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
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
