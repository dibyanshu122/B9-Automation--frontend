'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { UpgradeModal } from '@/components/upgrade-modal';
import { getApiClient } from '@/hooks/useApi';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuthStore } from '@/store/authStore';
import { Assistant } from '@/types';
import { Bot, Check, Code2, Copy, Globe, Loader2, MessageSquare, Plus, Save, Send, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface WidgetDomain {
  id: string;
  domain_id?: string;
  domain: string;
  is_active: boolean;
  created_at?: string;
}

interface WidgetConfig {
  title: string;
  primary_color: string;
  theme_color?: string;
  welcome_message: string;
  position: string;
  enable_3d_robot: boolean;
  spline_scene_url: string;
  fallback_image_url: string;
  suggested_buttons: string[];
  lead_capture_after_messages: number;
  lead_capture_on_intents: string[];
  sales_agent_mode: boolean;
  allowed_domains: string[];
}

const defaultConfig: WidgetConfig = {
  title: 'Chat with us',
  primary_color: '#3b82f6',
  theme_color: '#3b82f6',
  welcome_message: 'Hey 👋 Welcome to {businessName}. How can I help you?',
  position: 'bottom-right',
  enable_3d_robot: true,
  spline_scene_url: 'https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode',
  fallback_image_url: '',
  suggested_buttons: ['Pricing', 'Services', 'Book Demo', 'Talk to Team'],
  lead_capture_after_messages: 3,
  lead_capture_on_intents: ['pricing_intent', 'demo_intent', 'support_intent'],
  sales_agent_mode: true,
  allowed_domains: [],
};

function normalizeWidgetConfig(raw: Partial<WidgetConfig> | null | undefined): WidgetConfig {
  const cfg = raw || {};
  return {
    title: cfg.title ?? defaultConfig.title,
    primary_color: cfg.primary_color ?? defaultConfig.primary_color,
    theme_color: cfg.theme_color ?? cfg.primary_color ?? defaultConfig.theme_color,
    welcome_message: cfg.welcome_message ?? defaultConfig.welcome_message,
    position: cfg.position ?? defaultConfig.position,
    enable_3d_robot: cfg.enable_3d_robot ?? defaultConfig.enable_3d_robot,
    spline_scene_url: cfg.spline_scene_url ?? defaultConfig.spline_scene_url,
    fallback_image_url: cfg.fallback_image_url ?? '',
    suggested_buttons: Array.isArray(cfg.suggested_buttons) ? cfg.suggested_buttons : defaultConfig.suggested_buttons,
    lead_capture_after_messages: cfg.lead_capture_after_messages ?? defaultConfig.lead_capture_after_messages,
    lead_capture_on_intents: Array.isArray(cfg.lead_capture_on_intents) ? cfg.lead_capture_on_intents : defaultConfig.lead_capture_on_intents,
    sales_agent_mode: cfg.sales_agent_mode ?? defaultConfig.sales_agent_mode,
    allowed_domains: Array.isArray(cfg.allowed_domains) ? cfg.allowed_domains : defaultConfig.allowed_domains,
  };
}

export default function WidgetsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [assistantDomainCounts, setAssistantDomainCounts] = useState<Record<string, number>>({});
  const [domains, setDomains] = useState<WidgetDomain[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [fallbackImgUploading, setFallbackImgUploading] = useState(false);
  const fallbackImgRef = useRef<HTMLInputElement>(null);
  // Preview/test chat state
  const [previewMessages, setPreviewMessages] = useState<{role:string;text:string}[]>([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState('');
  const api = useMemo(() => getApiClient(), []);
  const widgetAccess = usePlanAccess('widget.embed');
  const premiumWidgetAccess = usePlanAccess('premium_widget');

  const selectedAssistant = useMemo(
    () => assistants.find((assistant) => assistant.id === selectedAssistantId),
    [assistants, selectedAssistantId]
  );

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const response = await api.get('/api/assistants');
        const assistantList = response.data as Assistant[];
        setAssistants(assistantList);
        if (assistantList[0]) {
          setSelectedAssistantId(assistantList[0].id);
        }
        const domainPairs = await Promise.all(
          assistantList.map(async (assistant) => {
            try {
              const domainsResponse = await api.get(`/api/widgets/${assistant.id}/domains`);
              return [assistant.id, domainsResponse.data.length] as const;
            } catch {
              return [assistant.id, 0] as const;
            }
          })
        );
        setAssistantDomainCounts(Object.fromEntries(domainPairs));
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load assistants');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, [api]);

  const fetchWidgetData = useCallback(async (assistantId: string) => {
    try {
      const [domainsResponse, embedResponse] = await Promise.all([
        api.get(`/api/widgets/${assistantId}/domains`),
        api.get(`/api/widgets/${assistantId}/embed-code`),
      ]);

      setDomains(domainsResponse.data);
      setAssistantDomainCounts((items) => ({ ...items, [assistantId]: domainsResponse.data.length }));
      setEmbedCode(embedResponse.data.embed_code);
      setConfig(normalizeWidgetConfig(embedResponse.data.config));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load widget settings');
    }
  }, [api]);

  useEffect(() => {
    setLeadCaptureEnabled(selectedAssistant?.lead_capture_enabled ?? true);
  }, [selectedAssistant]);

  useEffect(() => {
    if (!selectedAssistantId) {
      setDomains([]);
      setEmbedCode('');
      setConfig(normalizeWidgetConfig(defaultConfig));
      return;
    }

    fetchWidgetData(selectedAssistantId);
  }, [fetchWidgetData, selectedAssistantId]);

  const copyText = async (text: string, key: string, message: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(message);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleCopyEmbedForAssistant = async (assistantId: string) => {
    try {
      const response = await api.get(`/api/widgets/${assistantId}/embed-code`);
      await copyText(response.data.embed_code, `embed-${assistantId}`, 'Embed code copied');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to copy embed code');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistantId) return;
    if (!widgetAccess.allowed) {
      setUpgradeOpen(true);
      return;
    }

    setSavingConfig(true);
    try {
      const formData = new FormData();
      formData.append('title', config.title);
      formData.append('primary_color', config.primary_color);
      formData.append('welcome_message', config.welcome_message);
      formData.append('position', config.position);
      formData.append('lead_capture_enabled', String(leadCaptureEnabled));
      formData.append('enable_3d_robot', String(config.enable_3d_robot && premiumWidgetAccess.allowed));
      formData.append('spline_scene_url', config.spline_scene_url);
      formData.append('fallback_image_url', config.fallback_image_url || '');
      formData.append('suggested_buttons', JSON.stringify(config.suggested_buttons));
      formData.append('lead_capture_after_messages', String(config.lead_capture_after_messages));
      formData.append('lead_capture_on_intents', JSON.stringify(config.lead_capture_on_intents));
      formData.append('sales_agent_mode', String(config.sales_agent_mode));
      formData.append('allowed_domains', JSON.stringify(config.allowed_domains));

      const response = await api.post(`/api/widgets/${selectedAssistantId}/config`, formData);
      setConfig(normalizeWidgetConfig(response.data.config));
      await fetchWidgetData(selectedAssistantId);
      toast.success('Widget config saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save widget config');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistantId || !domainInput.trim()) return;
    if (!widgetAccess.allowed) {
      setUpgradeOpen(true);
      return;
    }
    if (domains.length >= widgetAccess.limits.domains) {
      toast.error(`Your plan allows max ${widgetAccess.limits.domains} domain${widgetAccess.limits.domains === 1 ? '' : 's'}.`);
      setUpgradeOpen(true);
      return;
    }

    setAddingDomain(true);
    try {
      const formData = new FormData();
      formData.append('domain', normalizeDomain(domainInput));

      await api.post(`/api/widgets/${selectedAssistantId}/domains`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchWidgetData(selectedAssistantId);
      setDomainInput('');
      toast.success('Domain added');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!selectedAssistantId || !confirm('Delete this widget domain?')) return;

    try {
      await api.delete(`/api/widgets/${selectedAssistantId}/domains/${domainId}`);
      setDomains((items) => items.filter((domain) => domain.id !== domainId));
      toast.success('Domain deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete domain');
    }
  };

  const sendPreviewMessage = async () => {
    if (!previewInput.trim() || !selectedAssistantId || previewLoading) return;
    const userMsg = previewInput.trim();
    setPreviewInput('');
    setPreviewMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setPreviewLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/widgets/${selectedAssistantId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: typeof window !== 'undefined' ? window.location.origin : '' },
        body: JSON.stringify({ message: userMsg, session_id: previewSessionId || undefined }),
      });
      const data = await res.json();
      if (!previewSessionId && data.session_id) setPreviewSessionId(data.session_id);
      const reply = data.response || data.answer || 'No response';
      setPreviewMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setPreviewMessages(prev => [...prev, { role: 'bot', text: 'Preview unavailable. Make sure your assistant is active and has documents uploaded.' }]);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-2 py-12 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading widgets...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Widgets</h1>
          <p className="mt-2 text-gray-600">Choose which assistant should appear on each website and copy its embed code.</p>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Plan: {widgetAccess.currentPlan} · Watermark: {widgetAccess.currentPlan === 'STARTER' ? 'ON' : widgetAccess.currentPlan === 'FREE' ? 'Locked' : 'Removed'}
            {widgetAccess.currentPlan === 'BUSINESS' ? ' · White-label available' : ''}
          </p>
        </div>
        <select
          value={selectedAssistantId}
          onChange={(e) => setSelectedAssistantId(e.target.value)}
          className="input-field min-w-64"
        >
          <option value="">Choose assistant</option>
          {assistants.map((assistant) => (
            <option key={assistant.id} value={assistant.id}>
              {assistant.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedAssistant ? (
        <Card className="py-12 text-center">
          <h3 className="text-xl font-bold text-gray-900">No assistant found</h3>
          <p className="mt-2 text-gray-600">Create an assistant first, then generate its widget.</p>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assistants.map((assistant) => {
              const isSelected = assistant.id === selectedAssistantId;
              return (
                <div
                  key={assistant.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAssistantId(assistant.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedAssistantId(assistant.id);
                  }}
                  className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 ${
                    isSelected ? 'border-primary-500 ring-4 ring-orange-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-3 ${isSelected ? 'bg-orange-50 text-primary-700' : 'bg-gray-50 text-gray-600'}`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-950">{assistant.name}</p>
                        <p className="text-xs text-gray-500">{assistant.language}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${assistant.lead_capture_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {assistant.lead_capture_enabled ? 'Lead ON' : 'Lead OFF'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-bold uppercase text-gray-500">Assistant ID</p>
                    <p className="mt-1 break-all font-mono text-xs text-gray-700">{assistant.id}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary-600" />
                      {assistantDomainCounts[assistant.id] || 0} domains
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      {isSelected ? 'Selected' : 'Ready'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyText(assistant.id, `assistant-${assistant.id}`, 'Assistant ID copied');
                      }}
                    >
                      {copiedKey === `assistant-${assistant.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy ID
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCopyEmbedForAssistant(assistant.id);
                      }}
                    >
                      {copiedKey === `embed-${assistant.id}` ? <Check className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                      Embed
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>

          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assistant</p>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAssistant.name}</h2>
                <p className="mt-2 break-all rounded-md bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                  {selectedAssistant.id}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyText(selectedAssistant.id, 'assistant-id', 'Assistant ID copied')}
              >
                {copiedKey === 'assistant-id' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy ID
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Widget Config</h2>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Welcome message</label>
                  <input
                    value={config.welcome_message}
                    onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Theme color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value, theme_color: e.target.value })}
                        className="h-11 w-14 rounded-md border border-gray-300"
                      />
                      <input
                        value={config.primary_color}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          // Auto-prepend # for hex without it
                          if (val && !val.startsWith('#') && !val.startsWith('rgb')) val = `#${val}`;
                          // Only accept valid 3 or 6 digit hex OR rgb() — reject garbage
                          const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val);
                          const validRgb = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(val);
                          if (val && !validHex && !validRgb && val.length > 1) return; // ignore invalid
                          setConfig({ ...config, primary_color: val, theme_color: val });
                        }}
                        className="input-field font-mono"
                        placeholder="#f97316"
                        maxLength={7}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Position</label>
                    <select
                      value={config.position}
                      onChange={(e) => setConfig({ ...config, position: e.target.value })}
                      className="input-field"
                    >
                      <option value="bottom-right">Bottom right</option>
                      <option value="bottom-left">Bottom left</option>
                      <option value="top-right">Top right</option>
                      <option value="top-left">Top left</option>
                    </select>
                  </div>
                </div>
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">3D robot launcher</span>
                    <span className="block text-xs text-gray-600">The Spline robot lazy-loads on desktop. Mobile uses the fallback image.</span>
                    {!premiumWidgetAccess.allowed && <span className="mt-1 block text-xs font-bold text-amber-700">Premium 3D widget requires Pro. Basic fallback will be used.</span>}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.enable_3d_robot && premiumWidgetAccess.allowed}
                    onChange={(e) => {
                      if (!premiumWidgetAccess.allowed && e.target.checked) {
                        setUpgradeOpen(true);
                        return;
                      }
                      setConfig({ ...config, enable_3d_robot: e.target.checked });
                    }}
                    className="h-5 w-5"
                  />
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <span className="font-bold">Branding:</span>{' '}
                  {widgetAccess.currentPlan === 'STARTER'
                    ? 'Powered by B9 Automation watermark will be shown.'
                    : widgetAccess.currentPlan === 'BUSINESS'
                    ? 'Full white-label controls are available.'
                    : widgetAccess.currentPlan === 'FREE'
                    ? 'Widget embed is locked on Free.'
                    : 'Watermark removed on this plan.'}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Spline scene URL</label>
                  <input
                    value={config.spline_scene_url}
                    onChange={(e) => setConfig({ ...config, spline_scene_url: e.target.value })}
                    className="input-field"
                    placeholder="https://prod.spline.design/.../scene.splinecode"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mobile fallback image</label>
                  <input ref={fallbackImgRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFallbackImgUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const token = useAuthStore.getState().token;
                        const base = process.env.NEXT_PUBLIC_API_URL || '';
                        const res = await fetch(`${base}/api/automation/upload-media-public`, {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                          body: fd,
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.detail || 'Upload failed');
                        setConfig({ ...config, fallback_image_url: data.public_url });
                        toast.success('Image uploaded!');
                      } catch (err: any) {
                        toast.error(err.message || 'Upload failed');
                      } finally {
                        setFallbackImgUploading(false);
                        if (fallbackImgRef.current) fallbackImgRef.current.value = '';
                      }
                    }}
                  />
                  {config.fallback_image_url ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={config.fallback_image_url} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <span className="flex-1 truncate text-xs text-gray-500">{config.fallback_image_url.split('/').pop()}</span>
                      <button type="button" onClick={() => setConfig({ ...config, fallback_image_url: '' })} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fallbackImgRef.current?.click()} disabled={fallbackImgUploading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-50">
                      {fallbackImgUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload fallback image</>}
                    </button>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Suggested buttons</label>
                  <input
                    value={config.suggested_buttons.join(', ')}
                    onChange={(e) => setConfig({ ...config, suggested_buttons: splitCsv(e.target.value) })}
                    className="input-field"
                    placeholder="Pricing, Services, Book Demo, Talk to Team"
                  />
                  <p className="mt-0.5 text-[11px] text-gray-400">Comma-separated. Use quotes for text with commas: "Hello, world"</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Capture after messages</label>
                    <select
                      value={config.lead_capture_after_messages}
                      onChange={(e) => setConfig({ ...config, lead_capture_after_messages: Number(e.target.value) })}
                      className="input-field"
                    >
                      <option value={2}>2 messages</option>
                      <option value={3}>3 messages</option>
                      <option value={4}>4 messages</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Capture on intents</label>
                    <input
                      value={config.lead_capture_on_intents.join(', ')}
                      onChange={(e) => setConfig({ ...config, lead_capture_on_intents: splitCsv(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
                <label className="flex items-center justify-between gap-4 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Lead capture</span>
                    <span className="block text-xs text-gray-600">When a visitor shares phone/email, B9 saves the lead and prepares a WhatsApp draft.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={leadCaptureEnabled}
                    onChange={(e) => setLeadCaptureEnabled(e.target.checked)}
                    className="h-5 w-5"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Sales-agent mode</span>
                    <span className="block text-xs text-gray-600">Widget answers from knowledge, detects buying intent, asks for contact details, and suggests quote/demo/support actions.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.sales_agent_mode}
                    onChange={(e) => setConfig({ ...config, sales_agent_mode: e.target.checked })}
                    className="h-5 w-5"
                  />
                </label>
                <Button type="submit" loading={savingConfig}>
                  <Save className="h-4 w-4" />
                  Save Config
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Allowed Domains</h2>
              <p className="mb-4 text-sm text-gray-500">
                Enter the root domain (e.g. <code className="bg-gray-100 px-1 rounded">example.com</code>). This matches only that exact domain.
                {' '}<strong>Subdomains (e.g. shop.example.com) must be added separately.</strong>
                {' '}For local testing, <code className="bg-gray-100 px-1 rounded">localhost</code> is always allowed automatically.
              </p>
              <form onSubmit={handleAddDomain} className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com or shop.example.com"
                  className="input-field"
                  required
                />
                <Button type="submit" loading={addingDomain} className="shrink-0">
                  <Plus className="h-4 w-4" />
                  Add Domain
                </Button>
              </form>

              <div className="space-y-3">
                {domains.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-gray-600">
                    Add your website domain before embedding the widget.
                  </div>
                ) : (
                  domains.map((domain) => {
                    const domainId = domain.id || domain.domain_id;

                    return (
                    <div
                      key={domainId || domain.domain}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Globe className="h-5 w-5 shrink-0 text-primary-500" />
                        <span className="truncate font-medium text-gray-900">{domain.domain}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => domainId && handleDeleteDomain(domainId)}
                        disabled={!domainId}
                        aria-label={`Delete ${domain.domain}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Live Preview / Test Chat */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Test Widget Chat</h2>
              <span className="ml-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">Preview</span>
            </div>
            <p className="mb-4 text-sm text-gray-500">Send a test message to see exactly how your widget AI responds before going live.</p>
            {/* Message thread */}
            <div className="mb-3 h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              {previewMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Send a message to test your widget AI response
                </div>
              ) : (
                previewMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {previewLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none bg-white border border-gray-200 px-3 py-2 text-sm text-gray-400 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Thinking...
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex gap-2">
              <input
                value={previewInput}
                onChange={e => setPreviewInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendPreviewMessage()}
                placeholder="Type a test message..."
                className="input-field flex-1 text-sm"
                disabled={previewLoading}
              />
              <Button type="button" onClick={sendPreviewMessage} disabled={previewLoading || !previewInput.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
              {previewMessages.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setPreviewMessages([]); setPreviewSessionId(''); }}>
                  Clear
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Embed Code</h2>
                <p className="mt-1 text-gray-600">Paste this snippet before the closing body tag.</p>
              </div>
              <Button
                type="button"
                onClick={() => copyText(embedCode, 'embed-code', 'Embed code copied')}
                disabled={!embedCode}
              >
                {copiedKey === 'embed-code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Code
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-5 text-sm text-gray-100">
              <code>{embedCode}</code>
            </pre>
          </Card>
        </>
      )}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={widgetAccess.currentPlan}
        feature={premiumWidgetAccess.allowed ? 'widget.embed' : 'premium_widget'}
      />
    </div>
  );
}

function normalizeDomain(value: string) {
  let v = value.trim().toLowerCase();
  if (!v) return '';
  // Strip protocol
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  // Keep only host (strip path)
  v = v.split('/')[0];
  // Keep port if present (e.g. localhost:3000)
  // Strip query/hash if any slipped through
  v = v.split('?')[0].split('#')[0];
  return v;
}

function splitCsv(value: string) {
  // Support quoted values: "Hello, world", Services → ["Hello, world", "Services"]
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { if (current.trim()) results.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) results.push(current.trim());
  return results;
}
