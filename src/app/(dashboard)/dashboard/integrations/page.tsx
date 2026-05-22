'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Database,
  ExternalLink,
  Instagram,
  Loader2,
  Mail,
  Plug,
  RefreshCw,
  Send,
  Sheet,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { featureForProvider, FeatureKey } from '@/lib/billing/features';
import { IntegrationCatalogItem, OutboundMessage } from '@/types';

const iconFor = (channel: string) => {
  if (channel === 'email') return Mail;
  if (channel === 'spreadsheet') return Sheet;
  if (channel === 'crm') return Database;
  if (channel === 'calendar') return CalendarClock;
  if (channel === 'notification') return Bell;
  if (channel === 'payment') return Send;
  if (channel === 'instagram') return Instagram;
  return Plug;
};

/* ── Google Sheets constants ── */
const GS_OPERATION_OPTIONS = [
  { value: 'append_row', label: 'Append Row', desc: 'Add a new row for each lead' },
  { value: 'update_row', label: 'Update Row', desc: 'Update existing row by key' },
  { value: 'lookup', label: 'Lookup', desc: 'Read data from sheet' },
];

const B9_LEAD_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'message', label: 'Message' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'tag', label: 'Tag' },
  { key: 'assistantName', label: 'Assistant' },
  { key: 'createdAt', label: 'Created At' },
];

const DEFAULT_GS_MAPPING: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  message: 'Message',
  source: 'Source',
  status: 'Status',
  tag: 'Tag',
  assistantName: 'Assistant',
  createdAt: 'Created At',
};

/* ── Gmail constants ── */
const GMAIL_RESOURCES = [
  { value: 'message', label: 'Message', desc: 'Send, reply, read emails' },
  { value: 'draft', label: 'Draft', desc: 'Create & manage email drafts' },
  { value: 'thread', label: 'Thread', desc: 'Read & manage email threads' },
];

const GMAIL_OPERATIONS: Record<string, { value: string; label: string }[]> = {
  message: [
    { value: 'send', label: 'Send' },
    { value: 'reply', label: 'Reply' },
    { value: 'get', label: 'Get (by ID)' },
    { value: 'getAll', label: 'Get All' },
    { value: 'delete', label: 'Delete' },
    { value: 'markAsRead', label: 'Mark as Read' },
  ],
  draft: [
    { value: 'create', label: 'Create Draft' },
    { value: 'send', label: 'Send Draft' },
    { value: 'get', label: 'Get (by ID)' },
    { value: 'getAll', label: 'Get All Drafts' },
    { value: 'delete', label: 'Delete Draft' },
  ],
  thread: [
    { value: 'get', label: 'Get (by ID)' },
    { value: 'getAll', label: 'Get All' },
    { value: 'trash', label: 'Move to Trash' },
  ],
};

const GMAIL_TEMPLATE_VARS = [
  { value: '', label: '— leave empty —' },
  { value: '{{name}}', label: '{{name}}' },
  { value: '{{phone}}', label: '{{phone}}' },
  { value: '{{email}}', label: '{{email}}' },
  { value: '{{requirement}}', label: '{{requirement}}' },
  { value: '{{score}}', label: '{{score}}' },
];

const actionTemplates = [
  {
    key: 'send_email',
    title: 'Email Follow-up',
    description: 'Draft an email reply for a lead.',
    payload: {
      to: 'lead@example.com',
      subject: 'Thanks for your inquiry',
      body: 'Hi, thanks for contacting us. Our team will help you with the next step.',
      resource: 'message',
      operation: 'send',
    },
  },
  {
    key: 'sync_to_sheet',
    title: 'Sync Lead to Sheet',
    description: 'Create a Google Sheets append-row draft.',
    payload: {
      sheet_name: 'Website Leads',
      operation: 'append_row',
      row: { name: 'Rahul', phone: '9876543210', interest: 'Class 12 Physics' },
    },
  },
];

const setupFields: Record<string, Array<{ key: string; label: string; placeholder: string; help?: string; secret?: boolean }>> = {
  indiamart: [
    { key: 'crm_key', label: 'IndiaMART CRM key', placeholder: 'CRM key from IndiaMART Lead Manager', secret: true },
    { key: 'mobile', label: 'Registered mobile number', placeholder: '9876543210' },
  ],
  slack: [
    { key: 'webhook_url', label: 'Slack incoming webhook URL', placeholder: 'https://hooks.slack.com/services/...', secret: true },
    { key: 'channel_name', label: 'Alert channel', placeholder: '#new-leads' },
  ],
  hubspot: [
    { key: 'access_token', label: 'HubSpot private app token', placeholder: 'pat-na1-...', secret: true },
    { key: 'auto_sync_leads', label: 'Auto sync leads', placeholder: 'true' },
  ],
  zoho: [
    { key: 'access_token', label: 'Zoho access token', placeholder: '1000.xxxxx', secret: true },
    { key: 'refresh_token', label: 'Zoho refresh token', placeholder: '1000.xxxxx', secret: true },
    { key: 'region', label: 'Region', placeholder: 'com, in, eu, au' },
  ],
  twilio: [
    { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'auth_token', label: 'Auth token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', secret: true },
    { key: 'from_number', label: 'From number', placeholder: '+14155552671' },
  ],
  calendly: [
    { key: 'personal_access_token', label: 'Personal access token', placeholder: 'calendly_pat_...', secret: true },
    { key: 'send_wa_confirmation', label: 'Send WhatsApp confirmation', placeholder: 'true' },
  ],
  'google-calendar': [
    { key: 'api_key', label: 'OAuth access token', placeholder: 'ya29....', secret: true },
    { key: 'calendar_id', label: 'Calendar ID', placeholder: 'primary or team-calendar@group.calendar.google.com' },
    { key: 'auto_create_events', label: 'Auto create events', placeholder: 'true' },
  ],
  zapier: [
    { key: 'zap_webhook_url', label: 'Zapier catch hook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
    { key: 'events', label: 'Events', placeholder: 'new_lead,payment_received' },
  ],
  meta_catalog: [
    { key: 'catalog_id', label: 'Meta catalog ID', placeholder: '123456789012345' },
    { key: 'business_id', label: 'Meta business ID', placeholder: '123456789012345' },
    { key: 'access_token_last4', label: 'Access token last 4 characters', placeholder: 'AB12', secret: true, help: 'Keep the full Meta token server-side.' },
    { key: 'sync_mode', label: 'Sync mode', placeholder: 'manual or scheduled' },
  ],
};

const requiredEnv: Record<string, string[]> = {
  google_sheets: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_SHEETS_REDIRECT_URI'],
  gmail: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI'],
  meta: ['META_APP_SECRET optional', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN optional'],
  facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_REDIRECT_URI', 'FACEBOOK_WEBHOOK_VERIFY_TOKEN'],
  instagram: ['META_APP_ID', 'META_APP_SECRET', 'INSTAGRAM_REDIRECT_URI', 'INSTAGRAM_WEBHOOK_VERIFY_TOKEN'],
};

export default function IntegrationsPage() {
  const { get, post, delete: del } = useApi();
  const authToken = useAuthStore((s: any) => s.token);
  const planAccess = usePlanAccess();
  const [catalog, setCatalog] = useState<IntegrationCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [drafts, setDrafts] = useState<OutboundMessage[]>([]);
  const [loading, setLoading] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCatalogItem | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [setupError, setSetupError] = useState('');
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const oauthPopupRef = useRef<Window | null>(null);

  /* ── Google Sheets state ── */
  const [gsOAuthConnected, setGsOAuthConnected] = useState(false);
  const [gsOperation, setGsOperation] = useState('append_row');
  const [gsSheetId, setGsSheetId] = useState('');
  const [gsSheetName, setGsSheetName] = useState('');
  const [gsTabName, setGsTabName] = useState('Sheet1');
  const [gsHeaderRow, setGsHeaderRow] = useState('1');
  const [gsSharedDrive, setGsSharedDrive] = useState(false);
  const [gsFiles, setGsFiles] = useState<{ id: string; name: string }[]>([]);
  const [gsTabs, setGsTabs] = useState<{ sheetId: number; title: string }[]>([]);
  const [gsColumns, setGsColumns] = useState<string[]>([]);
  const [gsColumnMappings, setGsColumnMappings] = useState<Record<string, string>>({});
  const [gsConnectionId, setGsConnectionId] = useState('');
  const [gsConnectedEmail, setGsConnectedEmail] = useState('');
  const [gsSyncLogs, setGsSyncLogs] = useState<any[]>([]);
  const [gsFetchingFiles, setGsFetchingFiles] = useState(false);
  const [gsFetchingColumns, setGsFetchingColumns] = useState(false);
  const [gsOAuthLoading, setGsOAuthLoading] = useState(false);
  const [gsShowFilePicker, setGsShowFilePicker] = useState(false);
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [waBusinessProfile, setWaBusinessProfile] = useState<any>(null);
  const [bpEditing, setBpEditing] = useState(false);
  const [bpForm, setBpForm] = useState({ about: '', address: '', description: '', email: '', websites: '', vertical: '' });

  /* ── Shopify state ── */
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifySecret, setShopifySecret] = useState('');
  const [shopifyWebhookUrl, setShopifyWebhookUrl] = useState('');
  const [shopifySaving, setShopifySaving] = useState(false);
  const [shopifySendConfirm, setShopifySendConfirm] = useState(true);

  /* ── Razorpay state ── */
  const [rzpConnected, setRzpConnected] = useState(false);
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpSecret, setRzpSecret] = useState('');
  const [rzpSaving, setRzpSaving] = useState(false);
  const [rzpKeyIdMasked, setRzpKeyIdMasked] = useState('');

  /* ── Gmail state ── */
  const [gmailOAuthConnected, setGmailOAuthConnected] = useState(false);
  const [gmailSenderEmail, setGmailSenderEmail] = useState('');
  const [gmailResource, setGmailResource] = useState('message');
  const [gmailOperation, setGmailOperation] = useState('send');
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailBody, setGmailBody] = useState('');
  const [gmailCc, setGmailCc] = useState('');
  const [gmailBcc, setGmailBcc] = useState('');
  const [gmailOAuthLoading, setGmailOAuthLoading] = useState(false);
  const [gmailLastSyncedAt, setGmailLastSyncedAt] = useState('');
  const [gmailTriggerDescription, setGmailTriggerDescription] = useState('');
  const [gmailSyncLoading, setGmailSyncLoading] = useState(false);
  const [gmailRecentEmails, setGmailRecentEmails] = useState<any[]>([]);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookAccountName, setFacebookAccountName] = useState('');
  const [facebookPages, setFacebookPages] = useState<{ id: string; name: string }[]>([]);
  const [facebookForms, setFacebookForms] = useState<{ id: string; name: string; status?: string }[]>([]);
  const [facebookSelectedPageId, setFacebookSelectedPageId] = useState('');
  const [facebookSelectedFormIds, setFacebookSelectedFormIds] = useState<string[]>([]);
  const [facebookWebhookUrl, setFacebookWebhookUrl] = useState('');
  const [facebookWebhookSubscription, setFacebookWebhookSubscription] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [facebookLastSyncedAt, setFacebookLastSyncedAt] = useState('');
  const [facebookRecentLeads, setFacebookRecentLeads] = useState<any[]>([]);
  const [facebookOAuthLoading, setFacebookOAuthLoading] = useState(false);
  const [facebookSyncLoading, setFacebookSyncLoading] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramAccountName, setInstagramAccountName] = useState('');
  const [instagramAccounts, setInstagramAccounts] = useState<{ pageId: string; pageName: string; instagramAccountId: string; username?: string }[]>([]);
  const [instagramSelectedAccount, setInstagramSelectedAccount] = useState('');
  const [instagramWebhookUrl, setInstagramWebhookUrl] = useState('');
  const [instagramWebhookSubscription, setInstagramWebhookSubscription] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramAutoCreateLeads, setInstagramAutoCreateLeads] = useState(true);
  const [instagramDefaultAssistantId, setInstagramDefaultAssistantId] = useState('');
  const [instagramOAuthLoading, setInstagramOAuthLoading] = useState(false);
  const [integrationAssistants, setIntegrationAssistants] = useState<{id: string; name: string}[]>([]);

  /* ── Meta Catalog state ── */
  const [metaCatalogConnected, setMetaCatalogConnected] = useState(false);
  const [metaCatalogId, setMetaCatalogId] = useState('');
  const [metaCatalogToken, setMetaCatalogToken] = useState('');
  const [metaCatalogName, setMetaCatalogName] = useState('');
  const [metaCatalogProductCount, setMetaCatalogProductCount] = useState(0);
  const [metaCatalogLastSynced, setMetaCatalogLastSynced] = useState('');
  const [metaCatalogSyncError, setMetaCatalogSyncError] = useState('');
  const [metaCatalogLoading, setMetaCatalogLoading] = useState('');
  const [showMetaCatalog, setShowMetaCatalog] = useState(false);

  /* ── New integration connection states (slack, hubspot, zoho, twilio, calendly, zapier, google-calendar, indiamart) ── */
  const [extraConn, setExtraConn] = useState<Record<string, { connected: boolean; config: Record<string, string> }>>({});
  const [extraSaving, setExtraSaving] = useState('');

  const loadExtraConnection = async (provider: string) => {
    try {
      const r = await get(`/api/${provider}/connection`);
      setExtraConn(prev => ({ ...prev, [provider]: { connected: r.data?.connected || false, config: r.data || {} } }));
    } catch { setExtraConn(prev => ({ ...prev, [provider]: { connected: false, config: {} } })); }
  };

  const saveExtraConnection = async (provider: string, connectPath: string, body: Record<string, string>) => {
    setExtraSaving(provider);
    try {
      await post(`/api/${connectPath}`, body);
      toast.success(`${provider} connected!`);
      await loadExtraConnection(provider);
      await refresh();
    } catch (e: any) { toast.error(e?.response?.data?.detail || `Failed to connect ${provider}`); }
    finally { setExtraSaving(''); }
  };

  /* ── Detect OAuth popup return ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sheets_connected') === '1') {
      window.opener?.postMessage({ type: 'sheets_connected' }, window.location.origin);
      window.close();
    }
    if (params.get('sheets_error')) {
      window.opener?.postMessage({ type: 'sheets_error', error: params.get('sheets_error') }, window.location.origin);
      window.close();
    }
    if (params.get('gmail_connected') === '1') {
      window.opener?.postMessage({ type: 'gmail_connected', email: params.get('gmail_email') || '' }, window.location.origin);
      window.close();
    }
    if (params.get('gmail_error')) {
      window.opener?.postMessage({ type: 'gmail_error', error: params.get('gmail_error') }, window.location.origin);
      window.close();
    }
    if (params.get('facebook_connected') === '1') {
      window.opener?.postMessage({ type: 'facebook_connected' }, window.location.origin);
      window.close();
    }
    if (params.get('facebook_error')) {
      window.opener?.postMessage({ type: 'facebook_error', error: params.get('facebook_error') }, window.location.origin);
      window.close();
    }
    if (params.get('instagram_connected') === '1') {
      window.opener?.postMessage({ type: 'instagram_connected' }, window.location.origin);
      window.close();
    }
    if (params.get('instagram_error')) {
      window.opener?.postMessage({ type: 'instagram_error', error: params.get('instagram_error') }, window.location.origin);
      window.close();
    }
    // Load Meta FB SDK for Embedded Signup popup
    if (!document.getElementById('fb-sdk')) {
      const s = document.createElement('script');
      s.id = 'fb-sdk';
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
      (window as any).fbAsyncInit = () => {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
        if (appId && (window as any).FB) {
          (window as any).FB.init({ appId, cookie: true, xfbml: false, version: 'v20.0' });
        }
      };
    }
    // Meta Embedded Signup callback handling
    if (params.get('meta_step') === 'select_assets') {
      toast.success('Meta connected! Finalizing WhatsApp setup…');
      // Auto-call finalize with empty body (backend will auto-discover WABA)
      const token = useAuthStore.getState().token;
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${base}/api/meta/onboarding/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then(r => r.json())
        .then(data => {
          if (data.connected) {
            toast.success(`✅ WhatsApp connected! Number: ${data.display_phone_number || 'configured'}`);
            window.history.replaceState({}, '', '/dashboard/integrations');
          } else {
            toast.error(data.detail || 'Could not finalize WhatsApp setup');
          }
        })
        .catch(() => toast.error('Could not finalize WhatsApp setup'));
    }
    if (params.get('meta_error')) {
      toast.error(`Meta connection failed: ${params.get('meta_error')}`);
      window.history.replaceState({}, '', '/dashboard/integrations');
    }
  }, []);

  const refresh = () => {
    setCatalogLoading(true);
    Promise.allSettled([
      get('/api/automation/integrations/catalog').catch(() => ({ data: [] })),
    ]).then(([catRes]) => {
      const catalogData = catRes.status === 'fulfilled' ? catRes.value.data : [];
      const items: IntegrationCatalogItem[] = Array.isArray(catalogData) ? catalogData : (catalogData?.data || []);
      setCatalog(items);
      setCatalogLoading(false);
      // Sync connected state from catalog — no extra API calls needed
      const connected = (p: string) => items.some((i: any) => (i.provider === p || i.channel === p) && i.connected);
      setWhatsappConnected(connected('whatsapp') || connected('meta'));
      setGsOAuthConnected(connected('google_sheets'));
      setGmailOAuthConnected(connected('gmail'));
      setFacebookConnected(connected('facebook'));
      setInstagramConnected(connected('instagram'));
    });

    get('/api/automation/action-drafts').then((draftRes) => {
      const draftsData = draftRes.data || [];
      const draftItems = Array.isArray(draftsData) ? draftsData : (draftsData?.data || []);
      setDrafts(draftItems.slice(0, 8));
    }).catch(() => setDrafts([]));
  };

  useEffect(() => {
    refresh();
    get('/api/settings/razorpay').then(r => {
      setRzpConnected(r.data?.connected || false);
      setRzpKeyIdMasked(r.data?.key_id_masked || '');
    }).catch(() => {});
    get('/api/shopify/connection').then(r => {
      setShopifyConnected(r.data?.connected || false);
      setShopifyDomain(r.data?.shop_domain || '');
      setShopifySendConfirm(r.data?.send_order_confirmation ?? true);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveShopify = async () => {
    if (!shopifyDomain.trim()) { toast.error('Shop domain required'); return; }
    setShopifySaving(true);
    try {
      const res = await post('/api/shopify/connect', {
        shop_domain: shopifyDomain.trim(),
        webhook_secret: shopifySecret.trim(),
        send_order_confirmation: shopifySendConfirm,
        auto_create_leads: true,
      });
      setShopifyConnected(true);
      setShopifyWebhookUrl(res.data?.webhook_url || '');
      toast.success('Shopify connected!');
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed to connect Shopify'); }
    finally { setShopifySaving(false); }
  };

  const disconnectShopify = async () => {
    await post('/api/shopify/disconnect', {}).catch(() => {});
    setShopifyConnected(false);
    setShopifyDomain('');
    setShopifySecret('');
    setShopifyWebhookUrl('');
    toast.success('Shopify disconnected');
  };

  const saveRazorpay = async () => {
    if (!rzpKeyId.trim() || !rzpSecret.trim()) {
      return;
    }
    setRzpSaving(true);
    try {
      await post('/api/settings/razorpay', { razorpay_key_id: rzpKeyId.trim(), razorpay_key_secret: rzpSecret.trim() });
      setRzpConnected(true);
      setRzpKeyIdMasked(rzpKeyId.trim().slice(0, 8) + '••••••••');
      setRzpKeyId('');
      setRzpSecret('');
      toast.success('Razorpay connected! Payment links in automations will use your account.');
    } catch { toast.error('Failed to save Razorpay keys'); }
    finally { setRzpSaving(false); }
  };

  const disconnectRazorpay = async () => {
    await del('/api/settings/razorpay').catch(() => {});
    setRzpConnected(false);
    setRzpKeyIdMasked('');
    toast.success('Razorpay disconnected');
  };

  /* ── Open setup modal ── */
  const openSetup = (item: IntegrationCatalogItem) => {
    const feature = featureForProvider(item.provider);
    if (!planAccess.canUse(feature)) {
      setLockedFeature(feature);
      return;
    }
    if (item.provider === 'meta_catalog') {
      loadMetaCatalogStatus();
      setShowMetaCatalog(true);
      return;
    }
    setSetupError('');
    if (item.provider === 'google_sheets') {
      const cfg = (item.config || {}) as Record<string, unknown>;
      setGsOAuthConnected(Boolean(cfg.oauth_connected));
      setGsOperation(String(cfg.operation || 'append_row'));
      setGsSheetId(String(cfg.sheet_id || ''));
      setGsSheetName(String(cfg.sheet_name || ''));
      setGsTabName(String(cfg.tab_name || 'Sheet1'));
      setGsHeaderRow(String(cfg.header_row || '1'));
      setGsSharedDrive(Boolean(cfg.shared_drive));
      setGsColumns([]);
      setGsColumnMappings((cfg.fieldMapping as Record<string, string>) || DEFAULT_GS_MAPPING);
      setGsFiles([]);
      setGsTabs([]);
      setGsShowFilePicker(false);
      loadGoogleSheetsStatus();
      loadSyncLogs();
    } else if (item.provider === 'gmail') {
      const cfg = (item.config || {}) as Record<string, unknown>;
      setGmailOAuthConnected(Boolean(cfg.oauth_connected));
      setGmailSenderEmail(String(cfg.sender_email || ''));
      setGmailResource(String(cfg.resource || 'message'));
      setGmailOperation(String(cfg.operation || 'send'));
      setGmailTo(String(cfg.default_to || ''));
      setGmailSubject(String(cfg.default_subject || ''));
      setGmailBody(String(cfg.default_body || ''));
      setGmailCc(String(cfg.default_cc || ''));
      setGmailBcc(String(cfg.default_bcc || ''));
      loadGmailStatus();
      loadGmailEmails();
    } else if (item.provider === 'facebook') {
      loadFacebookStatus();
      loadFacebookLeads();
      setFacebookPages([]);
      setFacebookForms([]);
    } else if (item.provider === 'instagram') {
      loadInstagramStatus();
      setInstagramAccounts([]);
      // Load assistants for DM routing selection
      if (integrationAssistants.length === 0) {
        get('/api/assistants').then(r => setIntegrationAssistants((r.data || []).map((a: any) => ({ id: a.id, name: a.name })))).catch(() => {});
      }
    } else if (['slack','hubspot','zoho','twilio','calendly','zapier','google-calendar','indiamart'].includes(item.provider)) {
      loadExtraConnection(item.provider);
      const fields = setupFields[item.provider] || [];
      const existing = extraConn[item.provider]?.config || {};
      setConfigForm(fields.reduce<Record<string,string>>((acc, f) => { acc[f.key] = String(existing[f.key] || ''); return acc; }, {}));
    } else if (item.provider === 'meta' || item.provider === 'whatsapp') {
      const cfg = (item.config || {}) as Record<string, unknown>;
      // Pre-fill with existing config first
      setConfigForm({
        mode: 'live',
        phone_number_id: String(cfg.phone_number_id || ''),
        waba_id: String(cfg.waba_id || ''),
        business_account_id: String(cfg.business_account_id || cfg.waba_id || ''),
        permanent_access_token: '',
        default_assistant_id: String(cfg.default_assistant_id || ''),
        sync_leads: String(cfg.sync_leads ?? 'true'),
      });
      // Fetch webhook URL from backend (verify_token + app_secret handled server-side)
      get('/api/integrations/whatsapp/defaults').then(r => {
        if (r.data?.webhook_url) setWhatsappWebhookUrl(r.data.webhook_url);
      }).catch(() => {});
      loadWhatsAppStatus();
    } else {
      const fields = setupFields[item.provider] || [
        { key: 'account_name', label: 'Account or workspace name', placeholder: `${item.label} workspace` },
        { key: 'external_id', label: 'External account ID', placeholder: 'Provider account ID' },
        { key: 'secret_hint', label: 'Secret/token last 4 characters', placeholder: 'AB12', secret: true, help: 'Keep full credentials in backend environment variables or the secure connector flow.' },
        { key: 'notes', label: 'Setup notes', placeholder: 'Default channel, owner, mapping, or sync notes' },
      ];
      const existingConfig = (item.config || {}) as Record<string, unknown>;
      setConfigForm(fields.reduce<Record<string, string>>((acc, f) => { acc[f.key] = String(existingConfig[f.key] || ''); return acc; }, {}));
    }
    setSelectedIntegration(item);
  };

  const loadWhatsAppStatus = async () => {
    try {
      const response = await get('/api/integrations/whatsapp/status');
      setWhatsappConnected(Boolean(response.data.connected));
      setWhatsappWebhookUrl(response.data.webhookUrl || '');
      const connection = response.data.connection;
      if (connection) {
        setConfigForm((current) => ({
          ...current,
          phone_number_id: connection.phoneNumberId || current.phone_number_id || '',
          waba_id: connection.businessAccountId || current.waba_id || '',
          business_account_id: connection.businessAccountId || current.business_account_id || '',
          permanent_access_token: '',
          verify_token: '',
          app_secret: '',
          default_assistant_id: connection.defaultAssistantId || '',
          sync_leads: String(connection.syncLeads ?? true),
        }));
      }
    } catch {
      setWhatsappConnected(false);
    }
  };

  const loadGoogleSheetsStatus = async () => {
    try {
      const response = await get('/api/integrations/google-sheets/status');
      setGsOAuthConnected(Boolean(response.data.connected));
      setGsConnectedEmail(response.data.email || '');
      const connection = response.data.connection;
      if (connection) {
        setGsConnectionId(connection.id || '');
        setGsSheetId(connection.spreadsheetId || '');
        setGsSheetName(connection.spreadsheetName || '');
        setGsTabName(connection.sheetName || 'Sheet1');
        setGsHeaderRow(String(connection.headerRow || 1));
        setGsColumnMappings(connection.fieldMapping || DEFAULT_GS_MAPPING);
      }
    } catch {
      // Status is optional while opening the modal.
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await get('/api/integrations/google-sheets/sync-logs');
      setGsSyncLogs(response.data || []);
    } catch {
      setGsSyncLogs([]);
    }
  };

  /* ── Google Sheets OAuth ── */
  const connectGoogleSheets = async () => {
    setGsOAuthLoading(true);
    setSetupError('');
    try {
      const resp = await get('/api/integrations/google/connect');
      const popup = window.open(resp.data.auth_url, 'sheets_oauth', 'width=600,height=700,left=200,top=100');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup was blocked. Please allow popups for this site in your browser settings, then try again.');
        setGsOAuthLoading(false);
        return;
      }
      oauthPopupRef.current = popup;
      const handler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return;
        window.removeEventListener('message', handler);
        setGsOAuthLoading(false);
        if (e.data?.type === 'sheets_connected') {
          setGsOAuthConnected(true);
          toast.success('Google account connected!');
          refresh();
          loadGoogleSheetsStatus();
          fetchDriveFiles(false);
        } else if (e.data?.type === 'sheets_error') {
          setSetupError(`OAuth failed: ${e.data.error || 'unknown error'}`);
        }
      };
      window.addEventListener('message', handler);
    } catch {
      setGsOAuthLoading(false);
      setSetupError('Could not start Google OAuth. Please check the Google connection setup.');
    }
  };

  const fetchDriveFiles = async (shared: boolean) => {
    void shared;
    setGsFetchingFiles(true);
    setSetupError('');
    try {
      const resp = await get('/api/integrations/google-sheets/spreadsheets');
      setGsFiles(resp.data.files || []);
      setGsShowFilePicker(true);
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Failed to load Drive files. Reconnect Google.');
    } finally {
      setGsFetchingFiles(false);
    }
  };

  const fetchTabs = async (spreadsheetId = gsSheetId) => {
    if (!spreadsheetId) return;
    try {
      const response = await get(`/api/integrations/google-sheets/spreadsheets/${encodeURIComponent(spreadsheetId)}/sheets`);
      setGsTabs(response.data.sheets || []);
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Failed to load sheet tabs.');
    }
  };

  const fetchColumns = async () => {
    if (!gsSheetId.trim() || !gsTabName.trim()) { setSetupError('Enter Sheet ID and Tab name first.'); return; }
    setGsFetchingColumns(true);
    setSetupError('');
    try {
      const resp = await get(`/api/integrations/google-sheets/headers?spreadsheetId=${encodeURIComponent(gsSheetId)}&sheetName=${encodeURIComponent(gsTabName)}&headerRow=${gsHeaderRow}`);
      const cols: string[] = resp.data.headers || [];
      setGsColumns(cols);
      setGsColumnMappings((current) => ({ ...DEFAULT_GS_MAPPING, ...current }));
      if (cols.length === 0) setSetupError('No headers found in that row. Try a different header row number.');
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Failed to fetch columns. Check Sheet ID and tab name.');
    } finally {
      setGsFetchingColumns(false);
    }
  };

  const createDefaultHeaders = async () => {
    if (!gsSheetId.trim()) { setSetupError('Sheet ID is required.'); return; }
    setGsFetchingColumns(true);
    try {
      const response = await post('/api/integrations/google-sheets/create-default-headers', {
        spreadsheetId: gsSheetId.trim(),
        sheetName: gsTabName.trim() || 'Sheet1',
      });
      setGsColumns(response.data.headers || []);
      setGsColumnMappings(DEFAULT_GS_MAPPING);
      toast.success('Default headers created');
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not create default headers');
    } finally {
      setGsFetchingColumns(false);
    }
  };

  const saveGoogleSheets = async () => {
    if (!gsSheetId.trim()) { setSetupError('Sheet ID is required.'); return; }
    if (!gsSheetName.trim()) { setSetupError('Sheet name is required.'); return; }
    setLoading('google_sheets:connect');
    setSetupError('');
    try {
      const response = await post('/api/integrations/google-sheets/save-connection', {
        spreadsheetId: gsSheetId.trim(),
        spreadsheetName: gsSheetName.trim(),
        sheetName: gsTabName.trim() || 'Sheet1',
        headerRow: Number(gsHeaderRow || 1),
        fieldMapping: gsColumnMappings,
        syncAllLeads: true,
        isDefault: true,
      });
      setGsConnectionId(response.data.connection?.id || '');
      toast.success('Google Sheets setup saved');
      closeModal();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Save failed. Please try again.');
    } finally {
      setLoading('');
    }
  };

  const testGoogleSheetsSync = async () => {
    setLoading('google_sheets:test');
    try {
      await post('/api/integrations/google-sheets/test-sync', { connectionId: gsConnectionId || undefined });
      toast.success('Test row added');
      loadSyncLogs();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Test sync failed');
    } finally {
      setLoading('');
    }
  };

  const syncAllGoogleSheetLeads = async () => {
    setLoading('google_sheets:sync_all');
    try {
      const response = await post('/api/integrations/google-sheets/sync-all-leads', { connectionId: gsConnectionId || undefined });
      toast.success(`Synced ${response.data.success || 0} leads`);
      loadSyncLogs();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Sync all failed');
    } finally {
      setLoading('');
    }
  };

  /* ── Gmail OAuth ── */
  const loadGmailStatus = async () => {
    try {
      const response = await get('/api/integrations/gmail/status');
      setGmailOAuthConnected(Boolean(response.data.connected));
      setGmailSenderEmail(response.data.email || '');
      setGmailLastSyncedAt(response.data.connection?.lastSyncedAt || '');
      setGmailTriggerDescription(response.data.triggerDescription || '');
    } catch {
      setGmailOAuthConnected(false);
      setGmailLastSyncedAt('');
    }
  };

  const loadGmailEmails = async () => {
    try {
      const response = await get('/api/integrations/gmail/emails');
      setGmailRecentEmails((response.data || []).slice(0, 5));
    } catch {
      setGmailRecentEmails([]);
    }
  };

  const connectGmail = async () => {
    setGmailOAuthLoading(true);
    setSetupError('');
    try {
      const resp = await get('/api/integrations/gmail/connect');
      const popup = window.open(resp.data.auth_url, 'gmail_oauth', 'width=600,height=700,left=200,top=100');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup was blocked. Please allow popups for this site in your browser settings, then try again.');
        setGmailOAuthLoading(false);
        return;
      }
      oauthPopupRef.current = popup;
      const handler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return;
        window.removeEventListener('message', handler);
        setGmailOAuthLoading(false);
        if (e.data?.type === 'gmail_connected') {
          setGmailOAuthConnected(true);
          if (e.data.email) setGmailSenderEmail(e.data.email);
          toast.success('Gmail connected!');
          refresh();
          loadGmailStatus();
          loadGmailEmails();
        } else if (e.data?.type === 'gmail_error') {
          setSetupError(`OAuth failed: ${e.data.error || 'unknown error'}`);
        }
      };
      window.addEventListener('message', handler);
    } catch {
      setGmailOAuthLoading(false);
      setSetupError('Could not start Gmail OAuth. Please check the Gmail connection setup.');
    }
  };

  const saveGmail = async () => {
    if (!gmailSenderEmail.trim() && !gmailOAuthConnected) { setSetupError('Connect your Gmail account first (Step 1).'); return; }
    setLoading('gmail:connect');
    setSetupError('');
    try {
      await loadGmailStatus();
      toast.success('Gmail setup saved');
      closeModal();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Save failed. Please try again.');
    } finally {
      setLoading('');
    }
  };

  const syncGmailNow = async () => {
    setGmailSyncLoading(true);
    setSetupError('');
    try {
      const response = await post('/api/integrations/gmail/sync', {});
      toast.success(`Gmail sync done: ${response.data.saved || 0} new email${response.data.saved === 1 ? '' : 's'}`);
      await loadGmailStatus();
      await loadGmailEmails();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Gmail sync failed. Reconnect Gmail and try again.');
    } finally {
      setGmailSyncLoading(false);
    }
  };

  const disconnectGmail = async () => {
    setLoading('gmail:disconnect');
    setSetupError('');
    try {
      await post('/api/integrations/gmail/disconnect', {});
      setGmailOAuthConnected(false);
      setGmailSenderEmail('');
      setGmailLastSyncedAt('');
      setGmailRecentEmails([]);
      toast.success('Gmail disconnected');
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Disconnect failed.');
    } finally {
      setLoading('');
    }
  };

  /* ── Generic save ── */
  const loadFacebookStatus = async () => {
    try {
      const response = await get('/api/integrations/facebook/status');
      setFacebookConnected(Boolean(response.data.connected));
      setFacebookAccountName(response.data.accountName || '');
      setFacebookWebhookUrl(response.data.webhookUrl || '');
      setFacebookWebhookSubscription(response.data.webhookSubscription || null);
      setFacebookLastSyncedAt(response.data.connection?.lastSyncedAt || '');
      setFacebookSelectedPageId(response.data.selectedPage?.pageId || '');
      setFacebookSelectedFormIds((response.data.selectedForms || []).map((form: any) => form.formId));
    } catch {
      setFacebookConnected(false);
    }
  };

  const loadFacebookLeads = async () => {
    try {
      const response = await get('/api/integrations/facebook/leads');
      setFacebookRecentLeads((response.data || []).slice(0, 5));
    } catch {
      setFacebookRecentLeads([]);
    }
  };

  const connectFacebook = async () => {
    if (!authToken) { toast.error('Session expired. Please refresh the page.'); return; }
    setFacebookOAuthLoading(true);
    setSetupError('');
    try {
      const response = await get('/api/integrations/facebook/connect');
      const popup = window.open(response.data.auth_url, 'facebook_oauth', 'width=700,height=760,left=200,top=80');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup was blocked. Please allow popups for this site in your browser settings, then try again.');
        setFacebookOAuthLoading(false);
        return;
      }
      oauthPopupRef.current = popup;
      const handler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return;
        window.removeEventListener('message', handler);
        setFacebookOAuthLoading(false);
        if (e.data?.type === 'facebook_connected') {
          setFacebookConnected(true);
          toast.success('Facebook connected');
          refresh();
          loadFacebookStatus();
          fetchFacebookPages();
        } else if (e.data?.type === 'facebook_error') {
          setSetupError(`OAuth failed: ${e.data.error || 'unknown error'}`);
        }
      };
      window.addEventListener('message', handler);
    } catch (err: any) {
      setFacebookOAuthLoading(false);
      setSetupError(err.response?.data?.detail || 'Could not start Facebook OAuth.');
    }
  };

  const fetchFacebookPages = async () => {
    setLoading('facebook:pages');
    setSetupError('');
    try {
      const response = await get('/api/integrations/facebook/pages');
      const pages = response.data.pages || [];
      setFacebookPages(pages);
      if (pages.length === 0) {
        setFacebookSelectedPageId('');
        setFacebookForms([]);
        setSetupError('No Facebook Pages found for this connected account. Make sure this Facebook user has Page access/admin permission, granted pages_show_list during reconnect, and the Meta app is Live or the user is added as an app tester/developer.');
      }
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not load Facebook pages.');
    } finally {
      setLoading('');
    }
  };

  const fetchFacebookForms = async (pageId = facebookSelectedPageId) => {
    if (!pageId) return;
    setLoading('facebook:forms');
    setSetupError('');
    try {
      const response = await get(`/api/integrations/facebook/pages/${encodeURIComponent(pageId)}/forms`);
      setFacebookForms(response.data.forms || []);
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not load lead forms for this page.');
    } finally {
      setLoading('');
    }
  };

  const saveFacebookSelection = async () => {
    if (!facebookSelectedPageId) { setSetupError('Select a Facebook Page first.'); return; }
    setLoading('facebook:save');
    setSetupError('');
    try {
      const response = await post('/api/integrations/facebook/save-selection', {
        pageId: facebookSelectedPageId,
        formIds: facebookSelectedFormIds,
      });
      if (response.data.webhookSubscription?.ok === false) {
        setFacebookWebhookSubscription(response.data.webhookSubscription);
        toast.error(response.data.webhookSubscription.message || 'Facebook saved, but webhook subscription failed');
      } else {
        toast.success('Facebook Lead Ads setup saved');
      }
      await loadFacebookStatus();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not save Facebook selection.');
    } finally {
      setLoading('');
    }
  };

  const syncFacebookNow = async () => {
    setFacebookSyncLoading(true);
    setSetupError('');
    try {
      const response = await post('/api/integrations/facebook/sync', {});
      toast.success(`Facebook sync done: ${response.data.saved || 0} new lead${response.data.saved === 1 ? '' : 's'}`);
      await loadFacebookStatus();
      await loadFacebookLeads();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Facebook lead sync failed.');
    } finally {
      setFacebookSyncLoading(false);
    }
  };

  const disconnectFacebook = async () => {
    setLoading('facebook:disconnect');
    setSetupError('');
    try {
      await post('/api/integrations/facebook/disconnect', {});
      setFacebookConnected(false);
      setFacebookAccountName('');
      setFacebookPages([]);
      setFacebookForms([]);
      setFacebookSelectedPageId('');
      setFacebookSelectedFormIds([]);
      toast.success('Facebook disconnected');
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Disconnect failed.');
    } finally {
      setLoading('');
    }
  };

  const loadInstagramStatus = async () => {
    try {
      const response = await get('/api/integrations/instagram/status');
      setInstagramConnected(Boolean(response.data.connected));
      setInstagramAccountName(response.data.accountName || '');
      setInstagramWebhookUrl(response.data.webhookUrl || '');
      setInstagramWebhookSubscription(response.data.webhookSubscription || null);
      setInstagramUsername(response.data.connection?.instagramUsername || '');
      setInstagramAutoCreateLeads(response.data.connection?.autoCreateLeads ?? true);
      if (response.data.connection?.pageId && response.data.connection?.instagramAccountId) {
        setInstagramSelectedAccount(`${response.data.connection.pageId}|${response.data.connection.instagramAccountId}`);
      }
    } catch {
      setInstagramConnected(false);
    }
  };

  const connectInstagram = async () => {
    if (!authToken) { toast.error('Session expired. Please refresh the page.'); return; }
    setInstagramOAuthLoading(true);
    setSetupError('');
    try {
      const response = await get('/api/integrations/instagram/connect');
      const popup = window.open(response.data.auth_url, 'instagram_oauth', 'width=700,height=760,left=200,top=80');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup was blocked. Please allow popups for this site in your browser settings, then try again.');
        setInstagramOAuthLoading(false);
        return;
      }
      oauthPopupRef.current = popup;
      const handler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return;
        window.removeEventListener('message', handler);
        setInstagramOAuthLoading(false);
        if (e.data?.type === 'instagram_connected') {
          setInstagramConnected(true);
          toast.success('Instagram connected');
          refresh();
          loadInstagramStatus();
          fetchInstagramAccounts();
        } else if (e.data?.type === 'instagram_error') {
          setSetupError(`OAuth failed: ${e.data.error || 'unknown error'}`);
        }
      };
      window.addEventListener('message', handler);
    } catch (err: any) {
      setInstagramOAuthLoading(false);
      setSetupError(err.response?.data?.detail || 'Could not start Instagram OAuth.');
    }
  };

  const fetchInstagramAccounts = async () => {
    setLoading('instagram:accounts');
    setSetupError('');
    try {
      const response = await get('/api/integrations/instagram/accounts');
      setInstagramAccounts(response.data.accounts || []);
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not load linked Instagram accounts.');
    } finally {
      setLoading('');
    }
  };

  const saveInstagramConnection = async () => {
    if (!instagramSelectedAccount) { setSetupError('Select a linked Instagram account first.'); return; }
    const [pageId, instagramAccountId] = instagramSelectedAccount.split('|');
    setLoading('instagram:save');
    setSetupError('');
    try {
      const response = await post('/api/integrations/instagram/save-connection', {
        pageId,
        instagramAccountId,
        autoCreateLeads: instagramAutoCreateLeads,
      });
      if (response.data.webhookSubscription?.ok === false) {
        setInstagramWebhookSubscription(response.data.webhookSubscription);
        toast.error(response.data.webhookSubscription.message || 'Instagram saved, but webhook subscription failed');
      } else {
        toast.success('Instagram DM setup saved');
      }
      await loadInstagramStatus();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Could not save Instagram connection.');
    } finally {
      setLoading('');
    }
  };

  const testInstagramConnection = async () => {
    setLoading('instagram:test');
    setSetupError('');
    try {
      await post('/api/integrations/instagram/test-connection', {});
      toast.success('Instagram connection is working');
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Instagram test failed.');
    } finally {
      setLoading('');
    }
  };

  const disconnectInstagram = async () => {
    setLoading('instagram:disconnect');
    setSetupError('');
    try {
      await post('/api/integrations/instagram/disconnect', {});
      setInstagramConnected(false);
      setInstagramAccounts([]);
      setInstagramSelectedAccount('');
      setInstagramUsername('');
      toast.success('Instagram disconnected');
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Disconnect failed.');
    } finally {
      setLoading('');
    }
  };

  const saveConnection = async (item: IntegrationCatalogItem) => {
    setLoading(`${item.provider}:connect`);
    setSetupError('');
    try {
      const boolValue = (key: string, fallback = true) => {
        const value = String(configForm[key] ?? '').trim().toLowerCase();
        if (!value) return fallback;
        return !['false', '0', 'no', 'off'].includes(value);
      };
      const eventList = (configForm.events || 'new_lead,payment_received')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const liveConnectors: Record<string, { endpoint: string; payload: Record<string, unknown>; success: string }> = {
        indiamart: {
          endpoint: '/api/indiamart/connect',
          payload: { crm_key: configForm.crm_key || '', mobile: configForm.mobile || '' },
          success: 'IndiaMART connected',
        },
        slack: {
          endpoint: '/api/slack/connect',
          payload: {
            webhook_url: configForm.webhook_url || '',
            channel_name: configForm.channel_name || '#general',
            notify_on_new_lead: true,
            notify_on_payment: true,
          },
          success: 'Slack connected',
        },
        twilio: {
          endpoint: '/api/twilio/connect',
          payload: {
            account_sid: configForm.account_sid || '',
            auth_token: configForm.auth_token || '',
            from_number: configForm.from_number || '',
          },
          success: 'Twilio connected',
        },
        calendly: {
          endpoint: '/api/calendly/connect',
          payload: {
            personal_access_token: configForm.personal_access_token || '',
            send_wa_confirmation: boolValue('send_wa_confirmation', true),
          },
          success: 'Calendly connected',
        },
        hubspot: {
          endpoint: '/api/hubspot/connect',
          payload: {
            access_token: configForm.access_token || '',
            auto_sync_leads: boolValue('auto_sync_leads', true),
          },
          success: 'HubSpot connected',
        },
        zoho: {
          endpoint: '/api/zoho/connect',
          payload: {
            access_token: configForm.access_token || '',
            refresh_token: configForm.refresh_token || '',
            region: configForm.region || 'com',
          },
          success: 'Zoho connected',
        },
        zapier: {
          endpoint: '/api/zapier/connect',
          payload: {
            zap_webhook_url: configForm.zap_webhook_url || '',
            events: eventList.length ? eventList : ['new_lead', 'payment_received'],
          },
          success: 'Zapier connected',
        },
        'google-calendar': {
          endpoint: '/api/google-calendar/connect',
          payload: {
            api_key: configForm.api_key || '',
            calendar_id: configForm.calendar_id || 'primary',
            auto_create_events: boolValue('auto_create_events', true),
          },
          success: 'Google Calendar connected',
        },
      };
      const live = liveConnectors[item.provider];
      if (live) {
        await post(live.endpoint, live.payload);
        toast.success(live.success);
        closeModal();
        refresh();
        return;
      }
      const hasConfig = Object.values(configForm).some((v) => v.trim());
      await post('/api/automation/integrations', {
        provider: item.provider, channel: item.channel,
        status: hasConfig ? 'needs_secret' : item.mode === 'webhook' ? 'needs_secret' : 'draft',
        config: { setup_mode: item.mode, ...configForm, required_env: requiredEnv[item.provider] || [] },
      });
      toast.success(`${item.label} setup saved`);
      closeModal();
      refresh();
    } catch (error: any) {
      setSetupError(error.response?.data?.detail || 'Connection failed');
    } finally {
      setLoading('');
    }
  };

  const runAction = async (template: (typeof actionTemplates)[number]) => {
    setLoading(template.key);
    try {
      await post('/api/automation/actions/execute', { action_type: template.key, payload: template.payload });
      toast.success(`${template.title} created`);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Action failed');
    } finally {
      setLoading('');
    }
  };

  const saveWhatsAppConnection = async () => {
    const businessAccountId = String(configForm.business_account_id || configForm.waba_id || '').trim();
    const phoneNumberId = String(configForm.phone_number_id || '').trim();
    const accessToken = String(configForm.permanent_access_token || '').trim();
    const verifyToken = String(configForm.verify_token || '').trim();
    const appSecret = String(configForm.app_secret || '').trim();

    if (!businessAccountId || !phoneNumberId) {
      setSetupError('Business Account ID and Phone Number ID are required.');
      return;
    }
    if (!whatsappConnected && !accessToken) {
      setSetupError('Permanent Access Token is required for first WhatsApp connection.');
      return;
    }
    if (!whatsappConnected && !verifyToken) {
      setSetupError('Verify Token is required for first WhatsApp connection.');
      return;
    }

    setLoading('whatsapp:connect');
    setSetupError('');
    try {
      await post('/api/integrations/whatsapp/connect', {
        businessAccountId,
        phoneNumberId,
        accessToken,
        verifyToken,
        appSecret: appSecret || undefined,
        defaultAssistantId: configForm.default_assistant_id || undefined,
        syncLeads: configForm.sync_leads !== 'false',
      });
      toast.success('WhatsApp setup saved');
      setWhatsappConnected(true);
      closeModal();
      refresh();
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Save failed. Please try again.');
    } finally {
      setLoading('');
    }
  };

  const testWhatsAppConnection = async () => {
    if (!whatsappConnected) {
      setSetupError('Save WhatsApp setup first, then send a test message.');
      return;
    }
    const to = String(configForm.test_to || '').trim();
    if (!to) {
      setSetupError('Enter a test recipient phone number with country code.');
      return;
    }

    setLoading('whatsapp:test');
    setSetupError('');
    try {
      await post('/api/integrations/whatsapp/test-message', {
        to,
        message: 'B9 Automation WhatsApp test message.',
      });
      toast.success('Test WhatsApp sent');
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || 'Test failed.');
    } finally {
      setLoading('');
    }
  };

  /* ── Meta Catalog handlers ── */
  const loadMetaCatalogStatus = async () => {
    try {
      const res = await get('/api/catalog/meta/connection');
      const d = res.data || {};
      setMetaCatalogConnected(Boolean(d.connected));
      setMetaCatalogId(d.catalog_id || '');
      setMetaCatalogName(d.catalog_name || '');
      setMetaCatalogProductCount(d.product_count || 0);
      setMetaCatalogLastSynced(d.last_synced_at || '');
      setMetaCatalogSyncError(d.sync_error || '');
    } catch {
      setMetaCatalogConnected(false);
    }
  };

  const connectMetaCatalog = async () => {
    if (!metaCatalogId.trim() || !metaCatalogToken.trim()) {
      setMetaCatalogSyncError('Catalog ID and Access Token are required');
      return;
    }
    setMetaCatalogLoading('connect');
    setMetaCatalogSyncError('');
    try {
      const res = await post('/api/catalog/meta/connect', {
        catalog_id: metaCatalogId.trim(),
        access_token: metaCatalogToken.trim(),
      });
      setMetaCatalogConnected(true);
      setMetaCatalogName(res.data?.catalog_name || metaCatalogId);
      toast.success(res.data?.message || 'Meta Catalog connected!');
    } catch (e: any) {
      setMetaCatalogSyncError(e?.response?.data?.detail || 'Connection failed. Check Catalog ID and token.');
    } finally {
      setMetaCatalogLoading('');
    }
  };

  const syncMetaCatalog = async () => {
    setMetaCatalogLoading('sync');
    setMetaCatalogSyncError('');
    try {
      const res = await post('/api/catalog/meta/sync', {});
      setMetaCatalogProductCount(res.data?.total || 0);
      setMetaCatalogLastSynced(res.data?.last_synced_at || new Date().toISOString());
      toast.success(res.data?.message || `Synced ${res.data?.total || 0} products from Meta!`);
    } catch (e: any) {
      setMetaCatalogSyncError(e?.response?.data?.detail || 'Sync failed. Try again.');
    } finally {
      setMetaCatalogLoading('');
    }
  };

  const disconnectMetaCatalog = async () => {
    setMetaCatalogLoading('disconnect');
    try {
      await del('/api/catalog/meta/disconnect');
      setMetaCatalogConnected(false);
      setMetaCatalogId('');
      setMetaCatalogToken('');
      setMetaCatalogName('');
      setMetaCatalogProductCount(0);
      setMetaCatalogLastSynced('');
      toast.success('Meta Catalog disconnected');
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setMetaCatalogLoading('');
    }
  };

  const closeModal = () => {
    setSelectedIntegration(null);
    setSetupError('');
    setConfigForm({});
    setGsFiles([]);
    setGsColumns([]);
    setGsShowFilePicker(false);
  };

  /* ── Render helpers ── */
  const needsOperationFields = (resource: string, op: string) =>
    (resource === 'message' && (op === 'send' || op === 'reply')) ||
    (resource === 'draft' && (op === 'create' || op === 'send'));

  const fieldsFor = (item: IntegrationCatalogItem) =>
    setupFields[item.provider] || [
      { key: 'account_name', label: 'Account or workspace name', placeholder: `${item.label} workspace` },
      { key: 'external_id', label: 'External account ID', placeholder: 'Provider account ID' },
      { key: 'secret_hint', label: 'Secret/token last 4 characters', placeholder: 'AB12', secret: true, help: 'Keep full credentials in backend environment variables or the secure connector flow.' },
      { key: 'notes', label: 'Setup notes', placeholder: 'Default channel, owner, mapping, or sync notes' },
    ];

  const accentFor = (provider: string, channel: string) => {
    const key = `${provider}:${channel}`.toLowerCase();
    if (key.includes('whatsapp') || key.includes('meta:whatsapp')) return { bar: 'from-emerald-500 to-green-400', icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', hover: 'hover:border-emerald-200 hover:shadow-emerald-500/10' };
    if (key.includes('instagram')) return { bar: 'from-pink-500 to-fuchsia-400', icon: 'bg-pink-50 text-pink-700 ring-pink-100', hover: 'hover:border-pink-200 hover:shadow-pink-500/10' };
    if (key.includes('facebook')) return { bar: 'from-blue-600 to-blue-400', icon: 'bg-blue-50 text-blue-700 ring-blue-100', hover: 'hover:border-blue-200 hover:shadow-blue-500/10' };
    if (key.includes('gmail') || key.includes('email')) return { bar: 'from-red-500 to-rose-400', icon: 'bg-red-50 text-red-700 ring-red-100', hover: 'hover:border-red-200 hover:shadow-red-500/10' };
    if (key.includes('sheet') || key.includes('google_sheets')) return { bar: 'from-green-500 to-emerald-400', icon: 'bg-green-50 text-green-700 ring-green-100', hover: 'hover:border-green-200 hover:shadow-green-500/10' };
    if (key.includes('razorpay') || key.includes('payment')) return { bar: 'from-blue-500 to-cyan-400', icon: 'bg-blue-50 text-blue-700 ring-blue-100', hover: 'hover:border-blue-200 hover:shadow-blue-500/10' };
    if (key.includes('shopify') || key.includes('ecommerce')) return { bar: 'from-green-600 to-lime-400', icon: 'bg-green-50 text-green-700 ring-green-100', hover: 'hover:border-green-200 hover:shadow-green-500/10' };
    if (key.includes('indiamart')) return { bar: 'from-amber-500 to-orange-400', icon: 'bg-amber-50 text-amber-700 ring-amber-100', hover: 'hover:border-amber-200 hover:shadow-amber-500/10' };
    if (key.includes('slack')) return { bar: 'from-purple-600 to-violet-400', icon: 'bg-purple-50 text-purple-700 ring-purple-100', hover: 'hover:border-purple-200 hover:shadow-purple-500/10' };
    if (key.includes('hubspot')) return { bar: 'from-orange-500 to-amber-400', icon: 'bg-orange-50 text-orange-700 ring-orange-100', hover: 'hover:border-orange-200 hover:shadow-orange-500/10' };
    if (key.includes('zoho')) return { bar: 'from-red-600 to-rose-400', icon: 'bg-red-50 text-red-700 ring-red-100', hover: 'hover:border-red-200 hover:shadow-red-500/10' };
    if (key.includes('twilio') || key.includes('sms')) return { bar: 'from-red-500 to-pink-400', icon: 'bg-red-50 text-red-700 ring-red-100', hover: 'hover:border-red-200 hover:shadow-red-500/10' };
    if (key.includes('calendly')) return { bar: 'from-blue-500 to-indigo-400', icon: 'bg-blue-50 text-blue-700 ring-blue-100', hover: 'hover:border-blue-200 hover:shadow-blue-500/10' };
    if (key.includes('calendar')) return { bar: 'from-blue-400 to-sky-300', icon: 'bg-sky-50 text-sky-700 ring-sky-100', hover: 'hover:border-sky-200 hover:shadow-sky-500/10' };
    if (key.includes('zapier')) return { bar: 'from-orange-600 to-red-400', icon: 'bg-orange-50 text-orange-700 ring-orange-100', hover: 'hover:border-orange-200 hover:shadow-orange-500/10' };
    if (key.includes('catalog')) return { bar: 'from-sky-500 to-cyan-400', icon: 'bg-sky-50 text-sky-700 ring-sky-100', hover: 'hover:border-sky-200 hover:shadow-sky-500/10' };
    return { bar: 'from-cyan-500 to-sky-400', icon: 'bg-cyan-50 text-cyan-700 ring-cyan-100', hover: 'hover:border-cyan-200 hover:shadow-cyan-500/10' };
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="absolute right-5 top-5 h-20 w-20 rounded-full bg-cyan-100 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              AI actions across your tools
            </p>
            <h1 className="text-3xl font-bold text-gray-950">Integrations</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Connect business tools in draft mode today. When live credentials are added, these same actions can send, sync, book, and notify automatically.
            </p>
          </div>
          <Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" />Refresh</Button>
        </div>
      </div>


      {/* ── Integration Health Banner ── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { label: 'WhatsApp', connected: whatsappConnected, icon: '💬', detail: whatsappConnected ? '' : 'Not connected' },
          { label: 'Instagram', connected: instagramConnected, icon: '📸', detail: instagramConnected ? (instagramUsername ? `@${instagramUsername}` : 'Connected') : 'Not connected' },
          { label: 'Facebook', connected: facebookConnected, icon: '📘', detail: facebookConnected ? (facebookAccountName || 'Connected') : 'Not connected' },
          { label: 'Google Sheets', connected: gsOAuthConnected, icon: '📊', detail: gsOAuthConnected ? (gsConnectedEmail || 'Connected') : 'Not connected' },
        ].map(ch => (
          <div key={ch.label} className={`rounded-xl border p-3 flex items-center gap-2.5 transition ${ch.connected ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <span className="text-lg shrink-0">{ch.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900">{ch.label}</p>
              <p className={`text-[10px] font-semibold truncate ${ch.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
                {ch.connected ? `✓ ${ch.detail || 'Connected'}` : `⚠ ${ch.detail}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Catalog grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {catalogLoading && catalog.length === 0 && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
            <div className="h-1 w-full rounded-full bg-gray-100 mb-4" />
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-lg bg-gray-100" />
              <div className="h-6 w-20 rounded-full bg-gray-100" />
            </div>
            <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-full rounded bg-gray-100 mb-1" />
            <div className="h-3 w-5/6 rounded bg-gray-100" />
          </div>
        ))}
        {catalog.map((item) => {
          const Icon = iconFor(item.channel);
          const feature = featureForProvider(item.provider);
          const available = planAccess.canUse(feature);
          const badge = item.connected ? 'Connected' : available ? 'Not connected' : 'Upgrade required';
          const statusLabel = String(item.status || (item.connected ? 'connected' : available ? 'not_connected' : 'upgrade_required'))
            .split('_')
            .join(' ');
          const accent = accentFor(item.provider, item.channel);
          return (
            <Card key={`${item.provider}-${item.channel}`} className={`relative overflow-hidden border-gray-200 shadow-sm transition hover:shadow-lg ${accent.hover}`} hoverable={false}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.bar}`} />
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-lg p-3 ring-1 ${accent.icon}`}><Icon className="h-5 w-5" /></div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.connected ? 'bg-emerald-50 text-emerald-700' : available ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{badge}</span>
              </div>
              <h2 className="mt-4 font-bold text-gray-950">{item.label}</h2>
              <p className="mt-2 min-h-12 text-sm text-gray-600">{item.description}</p>
              {/* Connected account detail — read directly from item.config (no extra state) */}
              {item.connected && (() => {
                const cfg = (item.config || {}) as any;
                const detail =
                  (item.provider === 'meta' || item.provider === 'whatsapp')
                    ? cfg.display_phone_number || cfg.phone_number_id ? `📞 ${cfg.display_phone_number || cfg.phone_number_id}` : ''
                  : item.provider === 'instagram'
                    ? cfg.instagram_username || cfg.username ? `@${cfg.instagram_username || cfg.username}` : ''
                  : item.provider === 'facebook'
                    ? cfg.page_name || cfg.account_name ? `🏢 ${cfg.page_name || cfg.account_name}` : ''
                  : item.provider === 'google_sheets'
                    ? cfg.email || cfg.connected_email ? `📧 ${cfg.email || cfg.connected_email}` : ''
                  : item.provider === 'gmail'
                    ? cfg.sender_email || cfg.email ? `📧 ${cfg.sender_email || cfg.email}` : ''
                  : '';
                return detail ? <p className="mt-1 text-xs font-semibold text-gray-500 truncate">{detail}</p> : null;
              })()}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${item.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-gray-600">{statusLabel}</span>
              </div>
              <Button variant={item.connected ? 'secondary' : 'primary'} className="mt-4 w-full"
                loading={loading === `${item.provider}:connect`} onClick={() => openSetup(item)}>
                <Plug className="h-4 w-4" />{!available ? 'Upgrade' : item.connected ? 'Update Setup' : 'Setup'}
              </Button>
            </Card>
          );
        })}

      </section>


      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-blue-100 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Test Multi-channel Actions</h2>
          <p className="mt-1 text-sm text-gray-600">These actions create real dashboard records now. Sending and syncing will turn live after provider connections are ready.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {actionTemplates.map((template) => (
              <button key={template.key} type="button" onClick={() => runAction(template)} disabled={!!loading}
                className="rounded-lg border border-gray-100 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-950">{template.title}</p>
                  {loading === template.key ? <RefreshCw className="h-4 w-4 animate-spin text-primary-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <p className="mt-2 text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="border-blue-100 shadow-sm" hoverable={false}>
          <h2 className="text-xl font-bold text-gray-950">Latest Action Drafts</h2>
          <div className="mt-5 space-y-3">
            {drafts.length === 0 ? (
              <p className="rounded-lg bg-blue-50 p-4 text-sm text-gray-600">No integration drafts yet.</p>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">{draft.channel}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-700">{draft.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{draft.provider || 'draft'} {draft.recipient ? `-> ${draft.recipient}` : ''}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{draft.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>


      {/* ════════════════ Setup Modal ════════════════ */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto border-gray-200 shadow-2xl" hoverable={false}>

            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Integration setup</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-950">{selectedIntegration.label}</h2>
                <p className="mt-2 text-sm text-gray-600">{selectedIntegration.description}</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-gray-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {setupError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{setupError}</p>
              </div>
            )}

            {/* ════ GOOGLE SHEETS ════ */}
            {selectedIntegration.provider === 'google_sheets' && (
              <div className="mt-5 space-y-5">
                {/* Step 1 — Auth */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 — Authentication</p>
                  {gsOAuthConnected ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-950">Google account connected</p>
                        <p className="text-xs text-gray-500">{gsConnectedEmail || 'Ready to sync leads'}</p>
                      </div>
                      <Button variant="secondary" className="ml-auto" onClick={connectGoogleSheets} loading={gsOAuthLoading}>Reconnect</Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Authorize Brain AI to access your Google Sheets and Drive.</p>
                      <Button className="mt-3" onClick={connectGoogleSheets} loading={gsOAuthLoading}>
                        <ExternalLink className="h-4 w-4" />Connect Google Account
                      </Button>
                      <p className="mt-2 text-xs text-gray-400">Access: Sheets plus spreadsheet picker.</p>
                    </div>
                  )}
                </div>

                {/* Step 2 — Operation */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 2 — Operation</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {GS_OPERATION_OPTIONS.map((op) => (
                      <button key={op.value} type="button" onClick={() => setGsOperation(op.value)}
                        className={`rounded-lg border p-3 text-left transition ${gsOperation === op.value ? 'border-primary-500 bg-orange-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="text-sm font-semibold">{op.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{op.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3 — Spreadsheet */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 3 — Spreadsheet</p>
                  <div className="mt-3 flex items-end gap-3">
                    <label className="flex-1 text-sm font-semibold text-gray-700">
                      Sheet ID
                      <input value={gsSheetId || ''} onChange={(e) => { setGsSheetId(e.target.value); setGsShowFilePicker(false); }}
                        className="input-field mt-1" placeholder="1AbcDEFghi... (from Sheet URL)" />
                      <span className="mt-1 block text-xs font-normal text-gray-400">Paste from URL, or pick below.</span>
                    </label>
                    <Button variant="secondary" className="shrink-0" loading={gsFetchingFiles}
                      onClick={() => {
                        if (gsShowFilePicker) { setGsShowFilePicker(false); return; }
                        if (!gsOAuthConnected) { setSetupError('Connect Google account first (Step 1).'); return; }
                        fetchDriveFiles(gsSharedDrive);
                      }}>
                      <Sheet className="h-4 w-4" />{gsShowFilePicker ? 'Hide' : 'Pick from Drive'}
                    </Button>
                  </div>
                  {gsShowFilePicker && (
                    <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-md">
                      {gsFiles.length === 0
                        ? <p className="p-4 text-sm text-gray-500">No spreadsheets found.</p>
                        : gsFiles.map((file) => (
                          <button key={file.id} type="button"
                            className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left hover:bg-orange-50 last:border-0"
                            onClick={() => { setGsSheetId(file.id); setGsSheetName(file.name); setGsShowFilePicker(false); fetchTabs(file.id); }}>
                            <Sheet className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate text-sm text-gray-900">{file.name}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={gsSharedDrive}
                      onChange={(e) => { setGsSharedDrive(e.target.checked); if (gsOAuthConnected && gsShowFilePicker) fetchDriveFiles(e.target.checked); }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    Include Shared Drive (team folders)
                  </label>
                </div>

                {/* Step 4 — Sheet Details */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 4 — Sheet Details</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Display Name
                      <input value={gsSheetName || ''} onChange={(e) => setGsSheetName(e.target.value)} className="input-field mt-1" placeholder="Website Leads" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Tab / Sheet Name
                      {gsTabs.length > 0 ? (
                        <select value={gsTabName || ''} onChange={(e) => setGsTabName(e.target.value)} className="input-field mt-1">
                          {gsTabs.map((tab) => <option key={tab.sheetId} value={tab.title}>{tab.title}</option>)}
                        </select>
                      ) : (
                        <input value={gsTabName || ''} onChange={(e) => setGsTabName(e.target.value)} className="input-field mt-1" placeholder="Sheet1" />
                      )}
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Header Row
                      <input type="number" min={1} max={10} value={gsHeaderRow || ''} onChange={(e) => setGsHeaderRow(e.target.value)} className="input-field mt-1" placeholder="1" />
                    </label>
                  </div>
                </div>

                {/* Step 5 — Column Mapping */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 5 — Column Mapping</p>
                    <Button variant="secondary" loading={gsFetchingColumns} onClick={fetchColumns}>
                      <RefreshCw className={`h-4 w-4 ${gsFetchingColumns ? 'animate-spin' : ''}`} />Refresh Columns
                    </Button>
                  </div>
                  {gsColumns.length === 0 ? (
                    <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                      <p>{gsOAuthConnected ? 'No headers found. Create default headers or refresh after adding row 1 headers.' : 'Connect Google account first.'}</p>
                      {gsOAuthConnected && (
                        <Button className="mt-3" variant="secondary" loading={gsFetchingColumns} onClick={createDefaultHeaders}>
                          Create default headers
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-gray-500">Map each B9 lead field to a Google Sheet column.</p>
                      {B9_LEAD_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center gap-3">
                          <div className="w-36 shrink-0 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">{field.label}</div>
                          <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-gray-400" />
                          <select value={gsColumnMappings[field.key] || ''} onChange={(e) => setGsColumnMappings({ ...gsColumnMappings, [field.key]: e.target.value })} className="input-field flex-1">
                            <option value="">Do not sync</option>
                            {gsColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
               
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Sync tools</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" loading={loading === 'google_sheets:test'} onClick={testGoogleSheetsSync}>Test Sync</Button>
                    <Button type="button" variant="secondary" loading={loading === 'google_sheets:sync_all'} onClick={syncAllGoogleSheetLeads}>Sync All Existing Leads</Button>
                  </div>
                  {gsSyncLogs.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Last sync: {gsSyncLogs[0].status} {gsSyncLogs[0].rowNumber ? `· row ${gsSyncLogs[0].rowNumber}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" loading={loading === 'google_sheets:connect'} onClick={saveGoogleSheets}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>
              </div>
            )}

            {/* ════ GMAIL ════ */}
            {selectedIntegration.provider === 'gmail' && (
              <div className="mt-5 space-y-5">

                {/* Step 1 — Connect Gmail */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 — Gmail Account</p>
                  {gmailOAuthConnected ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-950">Gmail connected</p>
                          {gmailSenderEmail && <p className="text-xs text-gray-500">{gmailSenderEmail}</p>}
                          <p className="text-xs text-gray-400">
                            Last checked: {gmailLastSyncedAt ? new Date(gmailLastSyncedAt).toLocaleString('en-IN') : 'Not synced yet'}
                          </p>
                          {gmailTriggerDescription && <p className="mt-1 text-xs text-primary-700">{gmailTriggerDescription}</p>}
                        </div>
                        <Button variant="secondary" className="ml-auto" onClick={connectGmail} loading={gmailOAuthLoading}>Reconnect</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" loading={gmailSyncLoading} onClick={syncGmailNow}>
                          <RefreshCw className={`h-4 w-4 ${gmailSyncLoading ? 'animate-spin' : ''}`} />Sync Now
                        </Button>
                        <Button type="button" variant="secondary" loading={loading === 'gmail:disconnect'} onClick={disconnectGmail}>
                          Disconnect
                        </Button>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-600">Recent synced emails</p>
                        {gmailRecentEmails.length === 0 ? (
                          <p className="mt-2 text-xs text-gray-400">No emails synced yet. Click Sync Now to fetch unread Gmail emails.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {gmailRecentEmails.map((email) => (
                              <div key={email.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                                <p className="truncate text-sm font-semibold text-gray-900">{email.subject || 'No subject'}</p>
                                <p className="truncate text-xs text-gray-500">{email.fromName || email.fromEmail} · {email.fromEmail}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Authorize Brain AI to send emails via your Gmail account.</p>
                      <Button className="mt-3" onClick={connectGmail} loading={gmailOAuthLoading}>
                        <Mail className="h-4 w-4" />Connect Gmail Account
                      </Button>
                      <p className="mt-2 text-xs text-gray-400">Scopes: Send + Read emails. Tokens stay on your backend.</p>
                    </div>
                  )}
                </div>

                {/* Step 2 — Resource */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 2 — Resource</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {GMAIL_RESOURCES.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => { setGmailResource(r.value); setGmailOperation(GMAIL_OPERATIONS[r.value][0].value); }}
                        className={`rounded-lg border p-3 text-left transition ${gmailResource === r.value ? 'border-primary-500 bg-orange-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="text-sm font-semibold">{r.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3 — Operation */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 3 — Operation</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(GMAIL_OPERATIONS[gmailResource] || []).map((op) => (
                      <button key={op.value} type="button" onClick={() => setGmailOperation(op.value)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${gmailOperation === op.value ? 'border-primary-500 bg-orange-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4 — Fields (only for send/reply/create) */}
                {needsOperationFields(gmailResource, gmailOperation) && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 4 — Default Field Values</p>
                    <p className="mt-1 text-xs text-gray-400">Use automation variables like {'{{name}}'}, {'{{email}}'} in templates.</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-sm font-semibold text-gray-700">
                        To (email)
                        <input value={gmailTo || ''} onChange={(e) => setGmailTo(e.target.value)} className="input-field mt-1" placeholder="{{email}} or fixed@email.com" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Subject
                        <input value={gmailSubject || ''} onChange={(e) => setGmailSubject(e.target.value)} className="input-field mt-1" placeholder="Thanks for contacting us, {{name}}" />
                      </label>
                      <label className="md:col-span-2 text-sm font-semibold text-gray-700">
                        Message Body
                        <textarea
                          value={gmailBody || ''}
                          onChange={(e) => setGmailBody(e.target.value)}
                          rows={4}
                          className="input-field mt-1 resize-none"
                          placeholder={`Hi {{name}},\n\nThank you for reaching out. Our team will contact you shortly regarding {{requirement}}.\n\nBest regards`}
                        />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        CC (optional)
                        <input value={gmailCc || ''} onChange={(e) => setGmailCc(e.target.value)} className="input-field mt-1" placeholder="owner@business.com" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        BCC (optional)
                        <input value={gmailBcc || ''} onChange={(e) => setGmailBcc(e.target.value)} className="input-field mt-1" placeholder="archive@business.com" />
                      </label>
                    </div>

                    {/* Variable quick reference */}
                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-600">Available variables</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {GMAIL_TEMPLATE_VARS.filter((v) => v.value).map((v) => (
                          <code key={v.value} className="rounded bg-white px-2 py-0.5 text-xs font-mono text-primary-700 border border-gray-200">{v.value}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" loading={loading === 'gmail:connect'} onClick={saveGmail}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>
              </div>
            )}

            {/* ════ WHATSAPP / META ════ */}
            {selectedIntegration.provider === 'facebook' && (
              <div className="mt-5 space-y-5">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 - Facebook Account</p>
                  {facebookConnected ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-950">Facebook connected</p>
                          <p className="text-xs text-gray-500">{facebookAccountName || 'Lead Ads account ready'}</p>
                          <p className="text-xs text-gray-400">Last sync: {facebookLastSyncedAt ? new Date(facebookLastSyncedAt).toLocaleString('en-IN') : 'Not synced yet'}</p>
                        </div>
                        <Button variant="secondary" className="ml-auto" onClick={connectFacebook} loading={facebookOAuthLoading}>Reconnect</Button>
                      </div>
                      {/* 5-step health checklist */}
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-5">
                        {[
                          { label: 'Account', done: true },
                          { label: 'Page selected', done: !!facebookSelectedPageId },
                          { label: 'Form selected', done: facebookSelectedFormIds.length > 0 },
                          { label: 'Webhook', done: facebookWebhookSubscription?.ok === true },
                          { label: 'Last sync', done: !!facebookLastSyncedAt },
                        ].map(s => (
                          <div key={s.label} className={`rounded-lg px-2 py-1.5 text-center text-[10px] font-bold ${s.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.done ? '✓' : '○'} {s.label}
                          </div>
                        ))}
                      </div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Webhook URL
                        <input value={facebookWebhookUrl || 'https://b9-automation-backend.onrender.com/api/webhooks/facebook'} readOnly className="input-field mt-1 font-mono text-xs" />
                      </label>
                      {facebookWebhookSubscription && (
                        <p className={`rounded-lg p-2 text-xs ${facebookWebhookSubscription.ok === false ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                          {facebookWebhookSubscription.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Connect Meta to read Facebook Lead Ads pages and lead forms.</p>
                      <Button className="mt-3" onClick={connectFacebook} loading={facebookOAuthLoading}>
                        <ExternalLink className="h-4 w-4" />Connect Facebook
                      </Button>
                      <p className="mt-2 text-xs text-gray-400">Permissions: pages list, lead retrieval, page engagement and metadata.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 2 - Select Page</p>
                    <Button type="button" variant="secondary" loading={loading === 'facebook:pages'} onClick={fetchFacebookPages}>
                      <RefreshCw className={`h-4 w-4 ${loading === 'facebook:pages' ? 'animate-spin' : ''}`} />Load Pages
                    </Button>
                  </div>
                  <select
                    value={facebookSelectedPageId}
                    onChange={(e) => {
                      setFacebookSelectedPageId(e.target.value);
                      setFacebookSelectedFormIds([]);
                      fetchFacebookForms(e.target.value);
                    }}
                    className="input-field mt-3"
                  >
                    <option value="">Select Facebook Page</option>
                    {facebookPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
                  </select>
                  {facebookPages.length === 0 && (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      No pages loaded yet. Click Load Pages after reconnecting with a Facebook user that manages at least one Page.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 3 - Lead Forms</p>
                    <Button type="button" variant="secondary" loading={loading === 'facebook:forms'} onClick={() => fetchFacebookForms()}>
                      <RefreshCw className={`h-4 w-4 ${loading === 'facebook:forms' ? 'animate-spin' : ''}`} />Load Forms
                    </Button>
                  </div>
                  {facebookForms.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">No forms loaded yet. Select a page and load forms.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {facebookForms.map((form) => (
                        <label key={form.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={facebookSelectedFormIds.includes(form.id)}
                            onChange={(e) => {
                              setFacebookSelectedFormIds((current) =>
                                e.target.checked ? [...current, form.id] : current.filter((id) => id !== form.id)
                              );
                            }}
                          />
                          <span className="flex-1">{form.name}</span>
                          {form.status && <span className="text-xs text-gray-400">{form.status}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Sync tools</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" loading={loading === 'facebook:save'} onClick={saveFacebookSelection}>Save Selection</Button>
                    <Button type="button" variant="secondary" loading={facebookSyncLoading} onClick={syncFacebookNow}>
                      <RefreshCw className={`h-4 w-4 ${facebookSyncLoading ? 'animate-spin' : ''}`} />Sync Now
                    </Button>
                    <Button type="button" variant="secondary" loading={loading === 'facebook:disconnect'} onClick={disconnectFacebook}>Disconnect</Button>
                  </div>
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-600">Recent Facebook leads</p>
                    {facebookRecentLeads.length === 0 ? (
                      <p className="mt-2 text-xs text-gray-400">No Facebook leads synced yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {facebookRecentLeads.map((lead) => (
                          <div key={lead.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                            <p className="truncate text-sm font-semibold text-gray-900">{lead.fieldData?.full_name || lead.fieldData?.name || lead.leadId}</p>
                            <p className="truncate text-xs text-gray-500">{lead.fieldData?.email || lead.fieldData?.phone_number || lead.formId}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" loading={loading === 'facebook:save'} onClick={saveFacebookSelection}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>
              </div>
            )}

            {selectedIntegration.provider === 'instagram' && (
              <div className="mt-5 space-y-5">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 - Meta Account</p>
                  {instagramConnected ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                          <CheckCircle2 className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-950">Instagram connected</p>
                          <p className="text-xs text-gray-500">{instagramUsername || instagramAccountName || 'Professional account ready'}</p>
                        </div>
                        <Button variant="secondary" className="ml-auto" onClick={connectInstagram} loading={instagramOAuthLoading}>Reconnect</Button>
                      </div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Webhook URL
                        <input value={instagramWebhookUrl || 'https://b9-automation-backend.onrender.com/api/webhooks/instagram'} readOnly className="input-field mt-1 font-mono text-xs" />
                      </label>
                      {instagramWebhookSubscription && (
                        <p className={`rounded-lg p-2 text-xs ${instagramWebhookSubscription.ok === false ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                          {instagramWebhookSubscription.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Connect Meta to use Instagram DMs from a Professional account linked to a Facebook Page.</p>
                      <Button className="mt-3" onClick={connectInstagram} loading={instagramOAuthLoading}>
                        <ExternalLink className="h-4 w-4" />Connect Instagram
                      </Button>
                      <p className="mt-2 text-xs text-gray-400">Permissions: Instagram basic, messages, pages list and page metadata.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 2 - Linked Instagram Account</p>
                    <Button type="button" variant="secondary" loading={loading === 'instagram:accounts'} onClick={fetchInstagramAccounts}>
                      <RefreshCw className={`h-4 w-4 ${loading === 'instagram:accounts' ? 'animate-spin' : ''}`} />Load Accounts
                    </Button>
                  </div>
                  <select value={instagramSelectedAccount} onChange={(e) => setInstagramSelectedAccount(e.target.value)} className="input-field mt-3">
                    <option value="">Select Instagram account</option>
                    {instagramAccounts.map((account) => (
                      <option key={`${account.pageId}|${account.instagramAccountId}`} value={`${account.pageId}|${account.instagramAccountId}`}>
                        @{account.username || account.instagramAccountId} - {account.pageName}
                      </option>
                    ))}
                  </select>
                  {instagramAccounts.length === 0 && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 space-y-1">
                      <p className="font-semibold">No Instagram accounts found.</p>
                      <p>To fix this:</p>
                      <ol className="ml-4 list-decimal text-xs space-y-1">
                        <li>Go to <strong>Instagram Settings → Account Type</strong> — switch to <strong>Professional</strong></li>
                        <li>Go to <strong>Facebook Page → Settings → Linked Accounts</strong> — connect your Instagram</li>
                        <li>Come back and click <strong>Load Accounts</strong> again</li>
                      </ol>
                    </div>
                  )}
                  <label className="mt-4 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={instagramAutoCreateLeads} onChange={(e) => setInstagramAutoCreateLeads(e.target.checked)} />
                    Save incoming Instagram DMs as leads
                  </label>
                  {integrationAssistants.length > 0 && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">AI Assistant for DM replies</label>
                      <select value={instagramDefaultAssistantId} onChange={e => setInstagramDefaultAssistantId(e.target.value)} className="input-field text-sm">
                        <option value="">Use default assistant</option>
                        {integrationAssistants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">This assistant will auto-reply to incoming Instagram DMs.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" variant="secondary" loading={loading === 'instagram:test'} onClick={testInstagramConnection}>Test Connection</Button>
                  <Button type="button" variant="secondary" loading={loading === 'instagram:disconnect'} onClick={disconnectInstagram}>Disconnect</Button>
                  <Button type="button" loading={loading === 'instagram:save'} onClick={saveInstagramConnection}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>
              </div>
            )}

            {(selectedIntegration.provider === 'meta' || selectedIntegration.provider === 'whatsapp') && (
              <div className="mt-5 space-y-5">
                {/* 2 connect options at top of modal */}
                {!selectedIntegration.connected && (
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          const base = process.env.NEXT_PUBLIC_API_URL || '';
                          const token = useAuthStore.getState().token;
                          const r = await fetch(`${base}/api/meta/onboarding/init`, { headers: { Authorization: `Bearer ${token}` } });
                          const data = await r.json();
                          if (!data.app_id) { toast.error('Meta app not configured'); return; }
                          // FB.login() requires HTTPS — use it only in production, OAuth popup on localhost
                          if ((window as any).FB && window.location.protocol === 'https:') {
                            (window as any).FB.login((response: any) => {
                              if (response.authResponse) {
                                window.location.href = `${base}/api/meta/onboarding/callback?code=${response.authResponse.code}&state=${data.state}`;
                              }
                            }, { config_id: data.config_id, response_type: 'code', override_default_response_type: true });
                          } else {
                            const params = new URLSearchParams({ client_id: data.app_id, redirect_uri: `${base}/api/meta/onboarding/callback`, state: data.state, scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management', response_type: 'code' });
                            window.open(`https://www.facebook.com/dialog/oauth?${params}`, '_blank', 'width=600,height=700');
                          }
                        } catch (e: any) { toast.error(e?.message || 'Could not start Meta connection'); }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-bold py-2.5 transition"
                    >
                      <span className="text-base">𝐟</span> Connect via Facebook Login
                      <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5 font-semibold">Recommended</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-400 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 text-center">Enter credentials manually ↓</p>
                  </div>
                )}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">WhatsApp Business</p>
                      <p className="mt-1 text-sm text-gray-600">{selectedIntegration.connected ? 'Connected' : 'Not Connected'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedIntegration.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedIntegration.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-gray-700">
                    Webhook URL
                    <input value={whatsappWebhookUrl || 'https://b9-automation-backend.onrender.com/api/webhooks/whatsapp'} readOnly className="input-field mt-1 font-mono text-xs" />
                  </label>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 — Meta Cloud API Credentials</p>

                    <div className="mt-3 mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                      <p className="font-bold mb-1.5">Where to find these credentials:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to <strong>Meta for Developers</strong> → Your App → WhatsApp → API Setup</li>
                        <li>Copy <strong>Phone Number ID</strong> from the &ldquo;From&rdquo; section on the setup page</li>
                        <li>Copy <strong>WhatsApp Business Account ID</strong> shown just below</li>
                        <li>Generate a <strong>Permanent Access Token</strong> via System Users in Meta Business Suite</li>
                        <li>Paste the <strong>Webhook URL</strong> shown above into your app&rsquo;s Webhook configuration</li>
                        <li>Use the <strong>Verify Token</strong> below when Meta prompts during webhook setup</li>
                      </ol>
                    </div>

                    {/* Required fields */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Phone Number ID <span className="text-red-500">*</span>
                        <input value={configForm.phone_number_id || ''} onChange={(e) => setConfigForm({...configForm, phone_number_id: e.target.value})} className="input-field mt-1" placeholder="e.g. 102345678901234" />
                      </label>
                      <label className="block text-sm font-semibold text-gray-700">
                        WhatsApp Business Account ID (WABA ID) <span className="text-red-500">*</span>
                        <input value={configForm.waba_id || ''} onChange={(e) => setConfigForm({...configForm, waba_id: e.target.value})} className="input-field mt-1" placeholder="e.g. 102345678901234" />
                      </label>
                      <label className="block text-sm font-semibold text-gray-700">
                        Permanent Access Token <span className="text-red-500">*</span>
                        <input value={configForm.permanent_access_token || ''} onChange={(e) => setConfigForm({...configForm, permanent_access_token: e.target.value})} className="input-field mt-1" placeholder="EAAxxxx..." type="password" />
                        <p className="text-[10px] text-gray-400 mt-0.5">Meta Business Suite → System Users → Generate token</p>
                      </label>

                      {/* Test number + send test */}
                      <label className="block text-sm font-semibold text-gray-700">
                        Test Phone Number
                        <div className="flex gap-2 mt-1">
                          <input value={configForm.test_to || ''} onChange={(e) => setConfigForm({...configForm, test_to: e.target.value})} className="input-field flex-1" placeholder="919876543210 (with country code)" />
                          <button type="button"
                            disabled={!configForm.test_to || !configForm.phone_number_id || !configForm.permanent_access_token}
                            onClick={testWhatsAppConnection}
                            className="px-3 py-2 text-xs font-bold rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-40 transition whitespace-nowrap">
                            Send Test
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">First send a WhatsApp message TO your B9 number, then test here within 24 hours.</p>
                        {configForm.test_to && (
                          <p className="text-[10px] text-emerald-600 mt-1">Ready to test — click &ldquo;Send Test&rdquo; in the button row below.</p>
                        )}
                      </label>

                      {/* Sync leads toggle */}
                      <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 cursor-pointer">
                        <input type="checkbox" checked={configForm.sync_leads !== 'false'} onChange={(e) => setConfigForm({...configForm, sync_leads: String(e.target.checked)})} className="rounded" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Save inbound messages as leads</p>
                          <p className="text-[10px] text-gray-400">Incoming WhatsApp messages will automatically create leads in CRM</p>
                        </div>
                      </label>
                    </div>

                  </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" variant="secondary" onClick={testWhatsAppConnection} loading={loading === 'whatsapp:test'}>
                    <Send className="h-4 w-4" />Send Test
                  </Button>
                  <Button type="button" loading={loading === 'whatsapp:connect'} onClick={saveWhatsAppConnection}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>


              {/* ── Business Profile ── */}
              {whatsappConnected && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between"
                    onClick={() => {
                      setBpEditing(v => !v);
                      if (!bpEditing && !waBusinessProfile) {
                        get('/api/automation/whatsapp/business-profile')
                          .then(r => {
                            const p = r.data?.profile || {};
                            setWaBusinessProfile(p);
                            setBpForm({
                              about: p.about || '',
                              address: p.address || '',
                              description: p.description || '',
                              email: p.email || '',
                              websites: (p.websites || []).join(', '),
                              vertical: p.vertical || '',
                            });
                          })
                          .catch(() => {});
                      }
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-700">WhatsApp Business Profile</span>
                    <span className="text-xs text-blue-500">{bpEditing ? '▲ collapse' : '▼ edit'}</span>
                  </button>

                  {bpEditing && (
                    <div className="mt-3 space-y-2">
                      {[
                        { key: 'about', label: 'About (max 139 chars)', placeholder: 'Brief business description shown in WA profile' },
                        { key: 'address', label: 'Address', placeholder: '123 Business Park, Mumbai' },
                        { key: 'email', label: 'Email', placeholder: 'support@yourbusiness.com' },
                        { key: 'websites', label: 'Website URLs (comma separated, max 2)', placeholder: 'https://yourbusiness.com' },
                        { key: 'vertical', label: 'Business Vertical', placeholder: 'RETAIL / HEALTH / BEAUTY / EDUCATION…' },
                      ].map(f => (
                        <div key={f.key}>
                          <p className="text-[10px] font-semibold text-gray-600 mb-0.5">{f.label}</p>
                          <input
                            value={(bpForm as any)[f.key]}
                            onChange={e => setBpForm(prev => ({...prev, [f.key]: e.target.value}))}
                            placeholder={f.placeholder}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ))}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-600 mb-0.5">Description</p>
                        <textarea
                          value={bpForm.description}
                          onChange={e => setBpForm(prev => ({...prev, description: e.target.value}))}
                          placeholder="Detailed description of your business"
                          rows={2}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await post('/api/automation/whatsapp/business-profile', {
                              ...bpForm,
                              websites: bpForm.websites.split(',').map(s => s.trim()).filter(Boolean),
                            });
                            toast.success('Business profile updated on WhatsApp!');
                            setBpEditing(false);
                          } catch { toast.error('Failed to update profile'); }
                        }}
                        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Save to WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* ════ GENERIC providers ════ */}
            {/* ── Razorpay ── */}
            {selectedIntegration.provider === 'razorpay' && (
              <div className="mt-5 space-y-4">
                {rzpConnected ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">✓ Razorpay connected</p>
                      <p className="text-xs text-emerald-600 font-mono mt-0.5">{rzpKeyIdMasked}</p>
                    </div>
                    <Button variant="outline" onClick={disconnectRazorpay} className="text-xs text-red-500 border-red-200 hover:bg-red-50">Disconnect</Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Key ID (starts with rzp_)
                      <input type="text" value={rzpKeyId} onChange={e => setRzpKeyId(e.target.value)} placeholder="rzp_live_xxxxxxxxxxxx" className="input-field mt-1 w-full" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      Key Secret
                      <input type="password" value={rzpSecret} onChange={e => setRzpSecret(e.target.value)} placeholder="••••••••••••••••" className="input-field mt-1 w-full" />
                    </label>
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <Button onClick={saveRazorpay} disabled={rzpSaving || !rzpKeyId.trim() || !rzpSecret.trim()}>
                        {rzpSaving ? 'Saving…' : '💳 Connect Razorpay'}
                      </Button>
                      <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Get API keys →</a>
                    </div>
                    <p className="sm:col-span-2 text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">rzp_test_</code> keys for testing, <code className="bg-gray-100 px-1 rounded">rzp_live_</code> for real payments.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Shopify ── */}
            {selectedIntegration.provider === 'shopify' && (
              <div className="mt-5 space-y-4">
                {shopifyConnected ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700">Connected Store</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{shopifyDomain}</p>
                      </div>
                    </div>
                    {shopifyWebhookUrl && (
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Webhook URL (add in Shopify → Settings → Notifications)</p>
                        <p className="text-xs font-mono text-gray-800 break-all">{`${process.env.NEXT_PUBLIC_API_URL || ''}${shopifyWebhookUrl}`}</p>
                      </div>
                    )}
                    <Button variant="outline" onClick={disconnectShopify} className="text-xs text-red-500 border-red-200 hover:bg-red-50">Disconnect Shopify</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Shop Domain *
                      <input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="mystore.myshopify.com" className="input-field mt-1 w-full" />
                    </label>
                    <label className="block text-sm font-semibold text-gray-700">
                      Webhook Signing Secret
                      <input type="password" value={shopifySecret} onChange={e => setShopifySecret(e.target.value)} placeholder="From Shopify → Notifications → Webhooks" className="input-field mt-1 w-full" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={shopifySendConfirm} onChange={e => setShopifySendConfirm(e.target.checked)} className="accent-green-600" />
                      Auto-send WhatsApp order confirmation on new orders
                    </label>
                    <Button onClick={saveShopify} disabled={shopifySaving || !shopifyDomain.trim()} className="bg-green-600 hover:bg-green-700">
                      {shopifySaving ? 'Connecting…' : '🛍️ Connect Shopify'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Slack / HubSpot / Zoho / Twilio / Calendly / Zapier / Google Calendar / IndiaMART ── */}
            {['slack','hubspot','zoho','twilio','calendly','zapier','google-calendar','indiamart'].includes(selectedIntegration.provider) && (
              <div className="mt-5 space-y-4">
                {extraConn[selectedIntegration.provider]?.connected && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-sm">✓ Connected</span>
                  </div>
                )}
                <div className="grid gap-3">
                  {(setupFields[selectedIntegration.provider] || []).map(f => (
                    <label key={f.key} className="block text-sm font-semibold text-gray-700">
                      {f.label}
                      <input
                        type={f.secret ? 'password' : 'text'}
                        value={configForm[f.key] || ''}
                        onChange={e => setConfigForm({ ...configForm, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="input-field mt-1 w-full"
                      />
                      {f.help && <span className="mt-1 block text-xs font-normal text-gray-500">{f.help}</span>}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => {
                      const p = selectedIntegration.provider;
                      const connectMap: Record<string, string> = {
                        slack: 'slack/connect', hubspot: 'hubspot/connect', zoho: 'zoho/connect',
                        twilio: 'twilio/connect', calendly: 'calendly/connect', zapier: 'zapier/connect',
                        'google-calendar': 'google-calendar/connect', indiamart: 'indiamart/connect',
                      };
                      saveExtraConnection(p, connectMap[p] || `${p}/connect`, configForm);
                    }}
                    disabled={extraSaving === selectedIntegration.provider}
                    loading={extraSaving === selectedIntegration.provider}
                  >
                    <Plug className="h-4 w-4" /> {extraConn[selectedIntegration.provider]?.connected ? 'Update' : 'Connect'}
                  </Button>
                </div>
              </div>
            )}

            {selectedIntegration.provider !== 'razorpay' && selectedIntegration.provider !== 'shopify' && !['slack','hubspot','zoho','twilio','calendly','zapier','google-calendar','indiamart'].includes(selectedIntegration.provider) && selectedIntegration.provider !== 'google_sheets' && selectedIntegration.provider !== 'gmail' && selectedIntegration.provider !== 'facebook' && selectedIntegration.provider !== 'instagram' && selectedIntegration.provider !== 'meta' && selectedIntegration.provider !== 'whatsapp' && (
              <>
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Secret-safe setup</p>
                  <p className="mt-1">Full access tokens stay secure on the server. This form saves business configuration and masked metadata only.</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fieldsFor(selectedIntegration).map((field) => (
                    <label key={field.key} className={field.key.includes('template') ? 'md:col-span-2 text-sm font-semibold text-gray-700' : 'text-sm font-semibold text-gray-700'}>
                      {field.label}
                      <input value={configForm[field.key] || ''} onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                        type={field.secret ? 'password' : 'text'}
                        className="input-field mt-2" placeholder={field.placeholder} />
                      {field.help && <span className="mt-1 block text-xs font-normal text-gray-500">{field.help}</span>}
                    </label>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-bold text-gray-950">Live connection requirements</p>
                  <p className="mt-1 text-xs text-gray-600">Secure provider credentials are required before this integration can send live actions.</p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" loading={loading === `${selectedIntegration.provider}:connect`} onClick={() => saveConnection(selectedIntegration)}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      <UpgradeModal
        isOpen={!!lockedFeature}
        onClose={() => setLockedFeature(null)}
        currentPlan={planAccess.currentPlan}
        feature={lockedFeature || undefined}
      />

      {/* ════ Meta Catalog Modal ════ */}
      {showMetaCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛍</span>
                <div>
                  <h2 className="font-bold text-gray-950">Meta Product Catalog</h2>
                  <p className="text-xs text-gray-500">Facebook Business Manager → Commerce Manager</p>
                </div>
              </div>
              <button onClick={() => setShowMetaCatalog(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Status banner */}
              {metaCatalogConnected ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">✓ Connected — {metaCatalogName}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {metaCatalogProductCount} products synced
                      {metaCatalogLastSynced ? ` · Last synced ${new Date(metaCatalogLastSynced).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={disconnectMetaCatalog}
                    disabled={metaCatalogLoading === 'disconnect'}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    {metaCatalogLoading === 'disconnect' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <p className="font-semibold">How to get your Catalog ID & Access Token:</p>
                  <ol className="mt-2 list-decimal pl-4 text-xs space-y-1 text-blue-700">
                    <li>Go to <strong>Facebook Business Manager</strong> → <strong>Commerce Manager</strong></li>
                    <li>Open your catalog → Settings → copy the <strong>Catalog ID</strong></li>
                    <li>Get a <strong>Page Access Token</strong> from Graph API Explorer with <code>catalog_management</code> permission</li>
                  </ol>
                </div>
              )}

              {metaCatalogSyncError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {metaCatalogSyncError}
                </div>
              )}

              {/* Connect form */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Facebook Catalog ID *</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    placeholder="e.g. 1234567890123456"
                    value={metaCatalogId}
                    onChange={e => setMetaCatalogId(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-400">Found in Business Manager → Commerce Manager → Catalog Settings</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Page Access Token *</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    placeholder="EAAxxxxxx..."
                    value={metaCatalogToken}
                    onChange={e => setMetaCatalogToken(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-400">Token must have <code>catalog_management</code> or <code>business_management</code> scope</p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 border-t border-gray-100 px-6 py-4 flex-shrink-0">
              <Button variant="secondary" className="flex-1" onClick={() => setShowMetaCatalog(false)}>
                Cancel
              </Button>
              {metaCatalogConnected ? (
                <Button
                  variant="primary"
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={syncMetaCatalog}
                  loading={metaCatalogLoading === 'sync'}
                >
                  <RefreshCw className="h-4 w-4" />
                  {metaCatalogLoading === 'sync' ? 'Syncing...' : 'Sync Products Now'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={connectMetaCatalog}
                  loading={metaCatalogLoading === 'connect'}
                >
                  <Plug className="h-4 w-4" />
                  {metaCatalogLoading === 'connect' ? 'Connecting...' : 'Connect & Verify'}
                </Button>
              )}
            </div>

            {/* After connect — show sync button too */}
            {metaCatalogConnected && (
              <div className="border-t border-gray-100 px-6 pb-5 pt-3">
                <p className="text-xs text-gray-500 mb-2">Update credentials to reconnect with a different catalog or token:</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-violet-400 focus:outline-none"
                    placeholder="New Catalog ID"
                    value={metaCatalogId}
                    onChange={e => setMetaCatalogId(e.target.value)}
                  />
                  <input
                    type="password"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-violet-400 focus:outline-none"
                    placeholder="New Access Token"
                    value={metaCatalogToken}
                    onChange={e => setMetaCatalogToken(e.target.value)}
                  />
                  <Button variant="secondary" onClick={connectMetaCatalog} loading={metaCatalogLoading === 'connect'} className="shrink-0 text-xs px-3">
                    Update
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

