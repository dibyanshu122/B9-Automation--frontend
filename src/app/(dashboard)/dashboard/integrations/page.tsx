'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Database,
  ExternalLink,
  Instagram,
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
  const planAccess = usePlanAccess();
  const [catalog, setCatalog] = useState<IntegrationCatalogItem[]>([]);
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
  const [waFlows, setWaFlows] = useState<any[]>([]);
  const [waFlowsLoading, setWaFlowsLoading] = useState(false);
  const [waFlowsExpanded, setWaFlowsExpanded] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowCategory, setNewFlowCategory] = useState('LEAD_GENERATION');
  const [waBusinessProfile, setWaBusinessProfile] = useState<any>(null);
  const [bpEditing, setBpEditing] = useState(false);
  const [bpForm, setBpForm] = useState({ about: '', address: '', description: '', email: '', websites: '', vertical: '' });

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
  const [instagramOAuthLoading, setInstagramOAuthLoading] = useState(false);

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
  }, []);

  const refresh = () => {
    Promise.all([
      get('/api/automation/integrations/catalog').catch(() => ({ data: [] })),
      get('/api/automation/action-drafts').catch(() => ({ data: [] })),
    ]).then(([catRes, draftRes]) => {
      setCatalog(catRes.data || []);
      setDrafts((draftRes.data || []).slice(0, 8));
    });
  };

  useEffect(() => {
    refresh();
    get('/api/settings/razorpay').then(r => {
      setRzpConnected(r.data?.connected || false);
      setRzpKeyIdMasked(r.data?.key_id_masked || '');
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    } else if (item.provider === 'meta' || item.provider === 'whatsapp') {
      const cfg = (item.config || {}) as Record<string, unknown>;
      setConfigForm({
        mode: 'live',
        phone_number_id: String(cfg.phone_number_id || ''),
        waba_id: String(cfg.waba_id || ''),
        business_account_id: String(cfg.business_account_id || cfg.waba_id || ''),
        permanent_access_token: '',
        verify_token: String(cfg.verify_token || ''),
        app_secret: '',
        default_assistant_id: String(cfg.default_assistant_id || ''),
        sync_leads: String(cfg.sync_leads ?? 'true'),
      });
      loadWhatsAppStatus();
    } else {
      const fields = setupFields[item.provider] || [];
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

  const accentFor = (provider: string, channel: string) => {
    const key = `${provider}:${channel}`.toLowerCase();
    if (key.includes('whatsapp')) return { bar: 'from-emerald-500 to-green-400', icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', hover: 'hover:border-emerald-200 hover:shadow-emerald-500/10' };
    if (key.includes('gmail') || key.includes('email')) return { bar: 'from-pink-500 to-rose-400', icon: 'bg-pink-50 text-pink-700 ring-pink-100', hover: 'hover:border-pink-200 hover:shadow-pink-500/10' };
    if (key.includes('sheet') || key.includes('google_sheets')) return { bar: 'from-blue-500 to-cyan-400', icon: 'bg-blue-50 text-blue-700 ring-blue-100', hover: 'hover:border-blue-200 hover:shadow-blue-500/10' };
    if (key.includes('facebook') || key.includes('instagram')) return { bar: 'from-purple-500 to-violet-400', icon: 'bg-purple-50 text-purple-700 ring-purple-100', hover: 'hover:border-purple-200 hover:shadow-purple-500/10' };
    if (key.includes('calendar') || key.includes('calendly')) return { bar: 'from-amber-500 to-yellow-400', icon: 'bg-amber-50 text-amber-700 ring-amber-100', hover: 'hover:border-amber-200 hover:shadow-amber-500/10' };
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

      {/* ── Getting Started wizard — only shown when no channels connected ── */}
      {!whatsappConnected && !instagramConnected && !facebookConnected && !gsOAuthConnected && (
        <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="font-bold text-gray-950">Connect your first channel — 3 steps</h2>
              <p className="text-sm text-gray-600">Once connected, your AI can auto-reply to customers 24/7.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-3 border border-primary-100">
              <p className="text-xs font-bold text-emerald-700 mb-1">✓ Step 1 — Done</p>
              <p className="text-sm font-semibold text-gray-900">Create your account</p>
            </div>
            <div className="rounded-xl bg-white p-3 border-2 border-primary-300">
              <p className="text-xs font-bold text-primary-600 mb-1">→ Step 2 — Do this now</p>
              <p className="text-sm font-semibold text-gray-900 mb-2">Connect WhatsApp, Instagram, or Facebook</p>
              <div className="flex flex-wrap gap-2">
                {catalog.filter(c => ['meta','facebook','instagram'].includes(c.provider) && !c.connected).slice(0,3).map(c => (
                  <button key={c.provider} onClick={() => openSetup(c)} className="rounded-lg bg-primary-600 px-2 py-1 text-xs font-bold text-white hover:bg-primary-700">
                    Connect {c.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-gray-100 opacity-60">
              <p className="text-xs font-bold text-gray-400 mb-1">○ Step 3 — After connecting</p>
              <p className="text-sm font-semibold text-gray-900">Build your first automation</p>
              <a href="/dashboard/automations" className="mt-1 inline-block text-xs font-bold text-primary-600 hover:underline">Open Automation Builder →</a>
            </div>
          </div>
        </div>
      )}

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
        {catalog.map((item) => {
          const Icon = iconFor(item.channel);
          const feature = featureForProvider(item.provider);
          const available = planAccess.canUse(feature);
          const badge = item.connected ? 'Connected' : available ? 'Available' : 'Upgrade required';
          const accent = accentFor(item.provider, item.channel);
          return (
            <Card key={`${item.provider}-${item.channel}`} className={`relative overflow-hidden border-gray-200 shadow-sm transition hover:shadow-lg ${accent.hover}`} hoverable={false}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.bar}`} />
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-lg p-3 ring-1 ${accent.icon}`}><Icon className="h-5 w-5" /></div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.connected ? 'bg-emerald-50 text-emerald-700' : available ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>{badge}</span>
              </div>
              <h2 className="mt-4 font-bold text-gray-950">{item.label}</h2>
              <p className="mt-2 min-h-12 text-sm text-gray-600">{item.description}</p>
              {/* Show connected account details when connected */}
              {item.connected && (
                <p className="mt-1 text-xs font-semibold text-gray-500 truncate">
                  {item.provider === 'meta' || item.provider === 'whatsapp'
                    ? whatsappConnected && (item.config as any)?.phone_number_id ? `📞 ${(item.config as any)?.display_phone_number || (item.config as any)?.phone_number_id}` : ''
                    : item.provider === 'instagram'
                    ? instagramUsername ? `@${instagramUsername}` : ''
                    : item.provider === 'facebook'
                    ? facebookAccountName ? `🏢 ${facebookAccountName}` : ''
                    : item.provider === 'google_sheets'
                    ? gsConnectedEmail ? `📧 ${gsConnectedEmail}` : ''
                    : item.provider === 'gmail'
                    ? gmailSenderEmail ? `📧 ${gmailSenderEmail}` : ''
                    : ''}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${item.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-gray-600">{item.status.split('_').join(' ')}</span>
              </div>
              <Button variant={item.connected ? 'secondary' : 'primary'} className="mt-4 w-full"
                loading={loading === `${item.provider}:connect`} onClick={() => openSetup(item)}>
                <Plug className="h-4 w-4" />{!available ? 'Upgrade' : item.connected ? 'Update Setup' : 'Setup'}
              </Button>
            </Card>
          );
        })}

        {/* ── Meta Product Catalog card ── */}
        <Card
          className={`relative overflow-hidden border-gray-200 shadow-sm transition hover:shadow-lg ${metaCatalogConnected ? 'hover:border-blue-200 hover:shadow-blue-500/10' : 'hover:border-violet-200 hover:shadow-violet-500/10'}`}
          hoverable={false}
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${metaCatalogConnected ? 'from-blue-500 to-violet-500' : 'from-violet-400 to-pink-400'}`} />
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg bg-violet-50 p-3 ring-1 ring-violet-100 text-violet-700 text-xl">🛍</div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${metaCatalogConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {metaCatalogConnected ? 'Connected' : 'Available'}
            </span>
          </div>
          <h2 className="mt-4 font-bold text-gray-950">Meta Product Catalog</h2>
          <p className="mt-2 min-h-12 text-sm text-gray-600">
            Connect your Facebook Business Catalog — products sync automatically to B9 and can be sent via WhatsApp automation.
          </p>
          {metaCatalogConnected && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500">📦 <span className="font-semibold text-gray-700">{metaCatalogProductCount} products</span> synced</p>
              {metaCatalogLastSynced && <p className="text-xs text-gray-400">Last sync: {new Date(metaCatalogLastSynced).toLocaleString()}</p>}
              {metaCatalogName && <p className="text-xs text-violet-600 font-medium">{metaCatalogName}</p>}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
            <span className={`h-2 w-2 rounded-full ${metaCatalogConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-gray-600">{metaCatalogConnected ? 'catalog synced' : 'not connected'}</span>
          </div>
          <Button
            variant={metaCatalogConnected ? 'secondary' : 'primary'}
            className="mt-4 w-full"
            onClick={() => { setShowMetaCatalog(true); loadMetaCatalogStatus(); }}
          >
            <Plug className="h-4 w-4" />{metaCatalogConnected ? 'Manage Catalog' : 'Connect Catalog'}
          </Button>
        </Card>
      </section>

      {/* ── Razorpay Integration Card ── */}
      <Card className="border-green-100 shadow-sm" hoverable={false}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
              <span className="text-xl">💳</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-950">Razorpay — Payment Links</h2>
              <p className="text-sm text-gray-500">Send payment links to customers via WhatsApp automations. Money goes directly to your Razorpay account.</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${rzpConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {rzpConnected ? '✓ Connected' : 'Not connected'}
          </span>
        </div>

        {rzpConnected ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Razorpay connected</p>
              <p className="text-xs text-emerald-600 font-mono mt-0.5">{rzpKeyIdMasked}</p>
            </div>
            <Button variant="outline" onClick={disconnectRazorpay} className="text-xs text-red-500 border-red-200 hover:bg-red-50">
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Key ID <span className="text-gray-400">(starts with rzp_)</span></label>
              <input
                type="text"
                value={rzpKeyId}
                onChange={e => setRzpKeyId(e.target.value)}
                placeholder="rzp_live_xxxxxxxxxxxx"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Key Secret</label>
              <input
                type="password"
                value={rzpSecret}
                onChange={e => setRzpSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="input-field w-full"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button onClick={saveRazorpay} disabled={rzpSaving || !rzpKeyId.trim() || !rzpSecret.trim()} className="flex items-center gap-2">
                {rzpSaving ? 'Saving…' : '💳 Connect Razorpay'}
              </Button>
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                Get API keys from Razorpay dashboard →
              </a>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400">
          Use <code className="bg-gray-100 px-1 rounded">rzp_test_</code> keys for testing, <code className="bg-gray-100 px-1 rounded">rzp_live_</code> for real payments.
        </p>
      </Card>

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
                      <label className="block text-sm font-semibold text-gray-700">
                        Webhook URL
                        <input value={facebookWebhookUrl || 'http://localhost:8000/api/webhooks/facebook'} readOnly className="input-field mt-1 font-mono text-xs" />
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
                        <input value={instagramWebhookUrl || 'http://localhost:8000/api/webhooks/instagram'} readOnly className="input-field mt-1 font-mono text-xs" />
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
                  <label className="mt-4 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={instagramAutoCreateLeads} onChange={(e) => setInstagramAutoCreateLeads(e.target.checked)} />
                    Save incoming Instagram DMs as leads
                  </label>
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
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">WhatsApp Business</p>
                      <p className="mt-1 text-sm text-gray-600">{whatsappConnected ? 'Connected' : 'Not Connected'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${whatsappConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {whatsappConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-gray-700">
                    Webhook URL
                    <input value={whatsappWebhookUrl || 'http://localhost:8000/api/webhooks/whatsapp'} readOnly className="input-field mt-1 font-mono text-xs" />
                  </label>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 1 — Provider Mode</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setConfigForm({...configForm, mode: 'draft'})}
                      className={`rounded-lg border p-3 text-left transition ${configForm.mode === 'draft' || !configForm.mode ? 'border-primary-500 bg-emerald-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-semibold">Draft Mode</p>
                      <p className="mt-0.5 text-xs text-gray-500">Test automation without sending real messages.</p>
                    </button>
                    <button type="button" onClick={() => setConfigForm({...configForm, mode: 'live'})}
                      className={`rounded-lg border p-3 text-left transition ${configForm.mode === 'live' ? 'border-primary-500 bg-emerald-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-semibold">Live Mode</p>
                      <p className="mt-0.5 text-xs text-gray-500">Connect Meta Cloud API to send real messages.</p>
                    </button>
                  </div>
                </div>

                {configForm.mode === 'live' && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step 2 — Meta Credentials</p>

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

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Phone Number ID
                        <input value={configForm.phone_number_id || ''} onChange={(e) => setConfigForm({...configForm, phone_number_id: e.target.value})} className="input-field mt-1" placeholder="102345678901234" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        WhatsApp Business Account ID
                        <input value={configForm.waba_id || ''} onChange={(e) => setConfigForm({...configForm, waba_id: e.target.value})} className="input-field mt-1" placeholder="102345678901234" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Permanent Access Token
                        <input value={configForm.permanent_access_token || ''} onChange={(e) => setConfigForm({...configForm, permanent_access_token: e.target.value})} className="input-field mt-1" placeholder="EAA..." type="password" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Webhook Verify Token
                        <input value={configForm.verify_token || ''} onChange={(e) => setConfigForm({...configForm, verify_token: e.target.value})} className="input-field mt-1" placeholder="your_verify_token" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        App Secret optional
                        <input value={configForm.app_secret || ''} onChange={(e) => setConfigForm({...configForm, app_secret: e.target.value})} className="input-field mt-1" placeholder="optional" type="password" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Default Assistant ID optional
                        <input value={configForm.default_assistant_id || ''} onChange={(e) => setConfigForm({...configForm, default_assistant_id: e.target.value})} className="input-field mt-1" placeholder="assistant_id" />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Test recipient
                        <input value={configForm.test_to || ''} onChange={(e) => setConfigForm({...configForm, test_to: e.target.value})} className="input-field mt-1" placeholder="919876543210" />
                      </label>
                      <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-gray-700">
                        <input type="checkbox" checked={configForm.sync_leads !== 'false'} onChange={(e) => setConfigForm({...configForm, sync_leads: String(e.target.checked)})} />
                        Save inbound messages as leads
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                  <Button type="button" variant="secondary" onClick={testWhatsAppConnection} loading={loading === 'whatsapp:test'}>
                    <Send className="h-4 w-4" />Send Test
                  </Button>
                  <Button type="button" loading={loading === 'whatsapp:connect'} onClick={saveWhatsAppConnection}>
                    <Plug className="h-4 w-4" />Save Setup
                  </Button>
                </div>

                {/* Quick navigation to WhatsApp sections */}
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="col-span-2 text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">
                    After connecting, go to:
                  </p>
                  <Link
                    href="/dashboard/messages"
                    onClick={closeModal}
                    className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    WhatsApp Messages
                  </Link>
                  <Link
                    href="/dashboard/chat"
                    onClick={closeModal}
                    className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    AI Chat
                  </Link>
                </div>

              {/* ── WhatsApp Flows Management ── */}
              {whatsappConnected && (
                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between"
                    onClick={() => {
                      setWaFlowsExpanded(v => !v);
                      if (!waFlowsExpanded && waFlows.length === 0) {
                        setWaFlowsLoading(true);
                        get('/api/automation/whatsapp/flows')
                          .then(r => setWaFlows(r.data?.data || []))
                          .catch(() => toast.error('Could not load flows'))
                          .finally(() => setWaFlowsLoading(false));
                      }
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-purple-700">WhatsApp Flows (Interactive Forms)</span>
                    <span className="text-xs text-purple-500">{waFlowsExpanded ? '▲ collapse' : '▼ expand'}</span>
                  </button>

                  {waFlowsExpanded && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-purple-700">Flows are interactive forms that open inside WhatsApp — surveys, lead capture, bookings. Create them here, then use the <strong>WhatsApp Form (Flow)</strong> canvas node with the Flow ID.</p>

                      {/* Existing flows list */}
                      {waFlowsLoading ? (
                        <p className="text-xs text-purple-500 animate-pulse">Loading flows…</p>
                      ) : waFlows.length === 0 ? (
                        <p className="text-xs text-gray-400">No flows yet. Create one below.</p>
                      ) : (
                        <div className="space-y-2">
                          {waFlows.map((f: any) => (
                            <div key={f.id} className="flex items-center justify-between rounded-lg bg-white border border-purple-100 px-3 py-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{f.name}</p>
                                <p className="text-[10px] text-gray-400">ID: <span className="font-mono">{f.id}</span> · {f.status}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(f.id); toast.success('Flow ID copied!'); }}
                                  className="text-[10px] rounded px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold"
                                >Copy ID</button>
                                {f.status === 'DRAFT' && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await post(`/api/automation/whatsapp/flows/${f.id}/publish`, {});
                                        toast.success('Flow published!');
                                        setWaFlows(prev => prev.map(x => x.id === f.id ? {...x, status: 'PUBLISHED'} : x));
                                      } catch { toast.error('Publish failed'); }
                                    }}
                                    className="text-[10px] rounded px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold"
                                  >Publish</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Create new flow */}
                      <div className="rounded-lg border border-purple-200 bg-white p-3 space-y-2">
                        <p className="text-xs font-semibold text-purple-800">Create New Flow</p>
                        <input
                          value={newFlowName}
                          onChange={e => setNewFlowName(e.target.value)}
                          placeholder="Flow name (e.g. Lead Capture Form)"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                        <select
                          value={newFlowCategory}
                          onChange={e => setNewFlowCategory(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="LEAD_GENERATION">Lead Generation</option>
                          <option value="APPOINTMENT_BOOKING">Appointment Booking</option>
                          <option value="CUSTOMER_SUPPORT">Customer Support</option>
                          <option value="SURVEY">Survey / Feedback</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <button
                          type="button"
                          disabled={!newFlowName.trim()}
                          onClick={async () => {
                            if (!newFlowName.trim()) return;
                            try {
                              const r = await post('/api/automation/whatsapp/flows', { name: newFlowName.trim(), categories: [newFlowCategory] });
                              toast.success('Flow created! Edit its screens in Meta Flow Builder.');
                              setWaFlows(prev => [...prev, { id: r.data.id, name: newFlowName.trim(), status: 'DRAFT' }]);
                              setNewFlowName('');
                            } catch { toast.error('Failed to create flow'); }
                          }}
                          className="w-full rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-40 transition"
                        >
                          Create Flow
                        </button>
                        <p className="text-[10px] text-gray-400">After creating, design the screens at <a href="https://business.facebook.com/wa/manage/flows" target="_blank" rel="noreferrer" className="text-purple-600 underline">Meta Flow Builder</a>, then come back and click Publish.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
            {selectedIntegration.provider !== 'google_sheets' && selectedIntegration.provider !== 'gmail' && selectedIntegration.provider !== 'facebook' && selectedIntegration.provider !== 'instagram' && selectedIntegration.provider !== 'meta' && selectedIntegration.provider !== 'whatsapp' && (
              <>
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Secret-safe setup</p>
                  <p className="mt-1">Full access tokens stay secure on the server. This form saves business configuration and masked metadata only.</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {(setupFields[selectedIntegration.provider] || []).map((field) => (
                    <label key={field.key} className={field.key.includes('template') ? 'md:col-span-2 text-sm font-semibold text-gray-700' : 'text-sm font-semibold text-gray-700'}>
                      {field.label}
                      <input value={configForm[field.key] || ''} onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                        className="input-field mt-2" placeholder={field.placeholder} maxLength={field.secret ? 8 : undefined} />
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
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
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

            <div className="px-6 py-5 space-y-4">
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
            <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
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
