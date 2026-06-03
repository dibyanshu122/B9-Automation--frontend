'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, CheckCircle2, Clock, Edit2, Image as ImageIcon, Info, Loader2, MessageSquare, Plus,
  ToggleLeft, ToggleRight, Trash2, Upload, X, Zap, UserCheck, PhoneOff, Bot, ShieldAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rule {
  id: string; rule_type: string; name: string; is_active: boolean;
  trigger_keywords: string[]; match_exact: boolean; response_text: string | null;
  template_name: string | null; working_hours: Record<string, any>;
  timezone: string; priority: number; created_at: string;
  media_url?: string | null; media_type?: string | null; media_caption?: string | null;
  skip_automation_on_welcome?: boolean;
}
interface Icebreaker { type?: string; header: string; text: string }

// ─── Config ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'keyword_reply',  label: 'Keyword Reply',  icon: <Zap className="w-4 h-4" />,          desc: 'Auto-reply when message contains a keyword' },
  { key: 'welcome',        label: 'Welcome',        icon: <MessageSquare className="w-4 h-4" />, desc: 'First message from a new contact' },
  { key: 'out_of_office',  label: 'Out of Office',  icon: <Clock className="w-4 h-4" />,        desc: 'Auto-reply outside working hours' },
  { key: 'opt_out',        label: 'Opt Out',        icon: <PhoneOff className="w-4 h-4" />,     desc: 'Handle STOP / unsubscribe keywords' },
  { key: 'keyword_alert',  label: 'Keyword Alerts', icon: <Bell className="w-4 h-4" />,         desc: 'Get notified when keyword detected' },
  { key: 'auto_assign',    label: 'Auto Assign',    icon: <UserCheck className="w-4 h-4" />,    desc: 'Route chats to specific agents by keyword' },
  { key: 'quick_replies',  label: 'Quick Replies',  icon: <Zap className="w-4 h-4" />,          desc: 'Saved short replies — use ⚡ button in inbox to insert instantly' },
  { key: 'icebreaker',     label: 'Icebreaker',     icon: <Bot className="w-4 h-4" />,          desc: 'Conversation starters on WhatsApp profile' },
];

// ─── Tab Info Boxes ───────────────────────────────────────────────────────────

const TAB_INFO: Record<string, { title: string; body: string; tip?: string; color: string; bullets?: string[] }> = {
  keyword_reply: {
    title: '⚡ Keyword Reply — Instant FAQ Automation',
    body: 'When a customer sends a message containing your keywords (e.g. "price", "timing", "location"), the system instantly auto-replies. No agent needed.',
    bullets: [
      'Add multiple keywords per rule (comma separated)',
      'Choose exact match or partial match (contains)',
      'Attach an image or video along with the reply',
      'Meta allows unlimited keyword replies within the 24-hour messaging window',
    ],
    tip: '💡 Common uses: pricing, store timings, address, demo booking, catalogue link',
    color: 'orange',
  },
  welcome: {
    title: '👋 Welcome Message — Sent to First-Time Contacts',
    body: 'When a brand-new contact messages you for the very first time, this rule automatically sends a welcome message. Only 1 welcome rule is allowed per account.',
    bullets: [
      'Only sent to NEW contacts — never to returning ones',
      'Attach an image, video, or document alongside the message',
      'Enable "Skip automation" to prevent duplicate messages from workflows',
      'Approved WhatsApp templates can also be used here',
    ],
    tip: '⚠️ Meta Rule: Free-form text can only be sent within the first 24 hours. After that, use an approved template.',
    color: 'blue',
  },
  out_of_office: {
    title: '🕐 Out of Office — Auto-Reply Outside Working Hours',
    body: 'When someone messages you outside your set working hours (e.g. nights, weekends), this rule automatically replies so they know when you\'ll be available.',
    bullets: [
      'Set different hours for each day (Mon–Sun)',
      'Mark specific days as "Closed" (e.g. Sunday off)',
      'Set your timezone correctly — use Asia/Kolkata for India',
      'Use custom text or an approved WhatsApp template',
    ],
    tip: '💡 Example: "We\'re available Mon–Sat 9am–6pm IST. Your message has been noted — we\'ll reply shortly!"',
    color: 'purple',
  },
  opt_out: {
    title: '🚫 Opt Out — Handle STOP Requests (Meta Compliance)',
    body: 'When a customer sends "STOP" or "UNSUBSCRIBE", this rule automatically tags them as opted-out and sends a confirmation. This is a mandatory Meta compliance requirement.',
    bullets: [
      'Default keywords: STOP, UNSUBSCRIBE, OPTOUT — fully customizable',
      'Opted-out contacts are excluded from future bulk messages',
      'Customize the confirmation reply message',
      'Required by Meta policy — ignoring opt-outs can get your number blocked',
    ],
    tip: '⚠️ META COMPLIANCE: Honoring opt-out requests is MANDATORY. Messaging opted-out users can result in permanent WhatsApp number ban.',
    color: 'red',
  },
  keyword_alert: {
    title: '🔔 Keyword Alerts — Get Notified on Important Messages',
    body: 'When a customer sends a message containing specific keywords (e.g. "complaint", "refund", "urgent"), you receive an instant email alert. No auto-reply is sent to the customer — this is purely an internal notification.',
    bullets: [
      'Create multiple alert rules for different teams',
      'Set a different alert email per rule',
      'No reply goes to the customer — only an internal notification to you',
      'Use cases: complaint monitoring, VIP lead detection, escalation alerts',
    ],
    tip: '💡 Example: Trigger on "angry", "refund", "cancel" — get alerted instantly so a senior agent can take over.',
    color: 'yellow',
  },
  auto_assign: {
    title: '👤 Auto Assign — Automatically Route Leads to Teams',
    body: 'When a customer sends a message matching your keywords, the lead is automatically tagged and assigned to the right team. Perfect for routing enquiries without manual work.',
    bullets: [
      'Lead is automatically labeled/assigned on keyword match',
      'Create separate rules for different teams (Sales, Support, Billing)',
      'Leave keywords empty to apply to all incoming messages',
      'Assigned tags can be used to filter and search leads later',
    ],
    tip: '💡 Example: "demo" keyword → tag as "Sales" | "complaint" → assign to "Support" team',
    color: 'green',
  },
};

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_LABELS: Record<string, string> = { mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun' };

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d, { open: ['mon','tue','wed','thu','fri'].includes(d), start: '09:00', end: '18:00' }])
);

// ─── Rule Form Slide-over ─────────────────────────────────────────────────────

function RuleForm({ ruleType, existing, onClose, onSaved }: {
  ruleType: string; existing?: Rule | null; onClose: () => void; onSaved: () => void;
}) {
  const { post, put, get } = useApi();
  const [name, setName] = useState(existing?.name || '');
  const [keywords, setKeywords] = useState((existing?.trigger_keywords || []).join(', '));
  const [matchExact, setMatchExact] = useState(existing?.match_exact || false);
  const [useAiReply, setUseAiReply] = useState((existing as any)?.metadata?.use_ai_reply || false);
  const [responseText, setResponseText] = useState(existing?.response_text || '');
  // Single-rule types don't need a user-visible name — auto-set it
  const SINGLE_TYPES = ['welcome', 'out_of_office', 'opt_out'];
  const isSingleType = SINGLE_TYPES.includes(ruleType);
  const [templateName, setTemplateName] = useState(existing?.template_name || '');
  const [approvedTemplates, setApprovedTemplates] = useState<{name:string;language:string}[]>([]);
  useEffect(() => {
    get('/api/automation/whatsapp/templates')
      .then(r => setApprovedTemplates((r.data?.templates || []).filter((t: any) => t.status === 'APPROVED')))
      .catch(() => {});
  }, []); // eslint-disable-line
  const [workingHours, setWorkingHours] = useState<any>(existing?.working_hours && Object.keys(existing.working_hours).length > 0 ? existing.working_hours : DEFAULT_HOURS);
  const [timezone, setTimezone] = useState(existing?.timezone || 'Asia/Kolkata');
  const [alertEmail, setAlertEmail] = useState(
    ruleType === 'auto_assign'
      ? ((existing as any)?.assign_label || '')
      : ((existing as any)?.alert_email || '')
  );
  const [mediaUrl, setMediaUrl] = useState(existing?.media_url || '');
  const [mediaType, setMediaType] = useState(existing?.media_type || 'image');
  const [mediaCaption, setMediaCaption] = useState(existing?.media_caption || '');
  const [skipAutomation, setSkipAutomation] = useState(existing?.skip_automation_on_welcome !== false);
  const [saving, setSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaInputMode, setMediaInputMode] = useState<'url' | 'file'>('url');

  const save = async () => {
    const autoName = ruleType === 'welcome' ? 'Welcome Message' : ruleType === 'out_of_office' ? 'Out of Office' : ruleType === 'opt_out' ? 'Opt Out' : '';
    const finalName = isSingleType ? autoName : name.trim();
    if (!finalName) { toast.error('Name required'); return; }
    setSaving(true);
    const payload: any = {
      rule_type: ruleType, name: finalName, is_active: true,
      trigger_keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      match_exact: matchExact,
      use_ai_reply: useAiReply,
      response_text: (!useAiReply && responseText.trim()) ? responseText.trim() : null,
      template_name: (!useAiReply && templateName.trim()) ? templateName.trim() : null,
      working_hours: ruleType === 'out_of_office' ? workingHours : {},
      timezone,
      // keyword_alert uses alert_email; auto_assign uses assign_label (same UI field, different key)
      alert_email: ruleType !== 'auto_assign' ? (alertEmail.trim() || null) : null,
      assign_label: ruleType === 'auto_assign' ? (alertEmail.trim() || null) : null,
      media_url: mediaUrl.trim() || null,
      media_type: mediaUrl.trim() ? mediaType : null,
      media_caption: mediaCaption.trim() || null,
      skip_automation_on_welcome: skipAutomation,
    };
    try {
      if (existing) await put(`/api/auto-replies/rules/${existing.id}`, payload);
      else await post('/api/auto-replies/rules', payload);
      toast.success(existing ? 'Rule updated' : 'Rule created');
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-bold text-gray-900">{existing ? 'Edit' : 'Create'} {TABS.find(t => t.key === ruleType)?.label}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
            {!isSingleType && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rule Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Price Inquiry Reply" className={inputCls} />
              </div>
            )}

            {['keyword_reply', 'keyword_alert', 'opt_out', 'auto_assign'].includes(ruleType) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Trigger Keywords <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder={ruleType === 'opt_out' ? 'STOP, UNSUBSCRIBE, OPT OUT' : 'price, cost, rate, fees'}
                  className={inputCls} />
                {ruleType === 'keyword_reply' && (
                  <>
                    <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={matchExact} onChange={e => setMatchExact(e.target.checked)} className="rounded" />
                      Exact match only (not partial)
                    </label>
                    <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={useAiReply} onChange={e => setUseAiReply(e.target.checked)} className="rounded mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-purple-800">Let AI reply instead of fixed text</p>
                          <p className="text-xs text-purple-600 mt-0.5">When keyword matches, AI agent will generate a personalized reply using your knowledge base. The fixed reply below will be ignored.</p>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {ruleType !== 'keyword_alert' && ruleType !== 'auto_assign' && ruleType !== 'icebreaker' && !useAiReply && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Response Message</label>
                  <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3}
                    placeholder="Hi! Thanks for reaching out. Our pricing starts at ₹999..."
                    className={`${inputCls} resize-none`} />
                  <p className="text-xs text-gray-400 mt-1">Or select an approved WhatsApp template (overrides text above):</p>
                  <select value={templateName} onChange={e => setTemplateName(e.target.value)} className={`${inputCls} mt-1`}>
                    <option value="">— Use text reply above —</option>
                    {approvedTemplates.map(t => (
                      <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                  {approvedTemplates.length === 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">No approved templates yet. <a href="/dashboard/templates" className="text-orange-500 underline">Create one →</a></p>
                  )}
                </div>

                {/* Media attachment — welcome and keyword_reply */}
                {['welcome', 'keyword_reply'].includes(ruleType) && (
                  <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Attach Media <span className="text-xs font-normal text-gray-400">(optional)</span></span>
                      </div>
                      {/* Toggle: upload file vs paste URL */}
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px]">
                        <button type="button" onClick={() => setMediaInputMode('file')}
                          className={`px-2.5 py-1 font-semibold transition ${mediaInputMode === 'file' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                          Upload File
                        </button>
                        <button type="button" onClick={() => setMediaInputMode('url')}
                          className={`px-2.5 py-1 font-semibold transition ${mediaInputMode === 'url' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                          Paste URL
                        </button>
                      </div>
                    </div>

                    {mediaInputMode === 'file' ? (
                      <div className="space-y-2">
                        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-orange-50 transition ${mediaUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {mediaUploading
                            ? <><Loader2 className="w-6 h-6 animate-spin text-primary-500" /><span className="text-xs text-gray-500">Uploading to WhatsApp...</span></>
                            : mediaUrl
                              ? <><span className="text-xs text-green-600 font-semibold">✅ File uploaded!</span><span className="text-[10px] text-gray-400 break-all text-center">{mediaUrl.slice(0, 60)}...</span><span className="text-[10px] text-primary-500">Click to replace</span></>
                              : <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-600 font-medium">Click to upload image, video, or PDF</span><span className="text-[10px] text-gray-400">JPEG, PNG, MP4, PDF — max 15MB</span></>
                          }
                          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setMediaUploading(true);
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
                                // Use public_url if available, else handle
                                const url = data.public_url || data.media_handle || '';
                                setMediaUrl(url);
                                const mime = file.type;
                                setMediaType(mime.startsWith('video') ? 'video' : mime === 'application/pdf' ? 'document' : 'image');
                                toast.success('Media uploaded!');
                              } catch (err: any) {
                                toast.error(err.message || 'Upload failed');
                              } finally {
                                setMediaUploading(false);
                              }
                            }} />
                        </label>
                        {mediaUrl && (
                          <button type="button" onClick={() => setMediaUrl('')}
                            className="text-[10px] text-red-500 hover:underline">Remove media</button>
                        )}
                      </div>
                    ) : (
                      <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg or video URL"
                        className={inputCls} />
                    )}

                    {mediaUrl && (
                      <>
                        <select value={mediaType} onChange={e => setMediaType(e.target.value)} className={inputCls}>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="document">Document</option>
                          <option value="audio">Audio</option>
                        </select>
                        <input value={mediaCaption} onChange={e => setMediaCaption(e.target.value)}
                          placeholder="Caption (optional)" className={inputCls} />
                      </>
                    )}
                    <p className="text-[10px] text-gray-400">File is uploaded to WhatsApp and sent with the reply.</p>
                  </div>
                )}

                {/* Automation skip toggle — welcome only */}
                {ruleType === 'welcome' && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <input type="checkbox" id="skipAuto" checked={skipAutomation} onChange={e => setSkipAutomation(e.target.checked)}
                      className="rounded mt-0.5" />
                    <label htmlFor="skipAuto" className="text-sm text-blue-800 cursor-pointer">
                      <span className="font-semibold">Skip lead automation for new contacts</span>
                      <p className="text-xs text-blue-600 mt-0.5">When this welcome fires, the "New WhatsApp Lead" automation workflow won't also run — prevents duplicate messages for new contacts only. AI agentic replies are handled separately.</p>
                    </label>
                  </div>
                )}
              </div>
            )}

            {ruleType === 'keyword_alert' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alert Email</label>
                <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} type="email"
                  placeholder="your@email.com" className={inputCls} />
              </div>
            )}

            {ruleType === 'auto_assign' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Label to add on match</label>
                <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                  placeholder="e.g. sales, support" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Lead will be tagged with this label when keyword matches.</p>
              </div>
            )}

            {ruleType === 'out_of_office' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Working Hours</label>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="Asia/Kolkata">India (IST) — Asia/Kolkata</option>
                    <option value="Asia/Dubai">Dubai (GST) — Asia/Dubai</option>
                    <option value="Asia/Singapore">Singapore (SGT) — Asia/Singapore</option>
                    <option value="America/New_York">New York (EST) — America/New_York</option>
                    <option value="America/Los_Angeles">Los Angeles (PST) — America/Los_Angeles</option>
                    <option value="Europe/London">London (GMT) — Europe/London</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-8">{DAY_LABELS[day]}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={workingHours[day]?.open !== false}
                          onChange={e => setWorkingHours((h: any) => ({...h, [day]: {...h[day], open: e.target.checked}}))} className="rounded" />
                        <span className="text-xs text-gray-500">Open</span>
                      </label>
                      {workingHours[day]?.open !== false && (
                        <>
                          <input type="time" value={workingHours[day]?.start || '09:00'}
                            onChange={e => setWorkingHours((h: any) => ({...h, [day]: {...h[day], start: e.target.value}}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs" />
                          <span className="text-xs text-gray-400">to</span>
                          <input type="time" value={workingHours[day]?.end || '18:00'}
                            onChange={e => setWorkingHours((h: any) => ({...h, [day]: {...h[day], end: e.target.value}}))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {existing ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Icebreaker Panel ─────────────────────────────────────────────────────────

function IcebreakerPanel() {
  const { get, post } = useApi();
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get('/api/auto-replies/icebreakers')
      .then(r => setIcebreakers(r.data?.icebreakers || []))
      .catch(() => toast.error('Could not load icebreakers'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const addIcebreaker = () => {
    if (icebreakers.length >= 4) { toast.error('Max 4 icebreakers allowed (Meta limit)'); return; }
    setIcebreakers(prev => [...prev, { header: '', text: '' }]);
  };

  const save = async () => {
    const valid = icebreakers.filter(i => i.header.trim() && i.text.trim());
    if (!valid.length) { toast.error('Add at least one icebreaker'); return; }
    setSaving(true);
    try {
      await post('/api/auto-replies/icebreakers', { icebreakers: valid });
      toast.success('Icebreakers saved to WhatsApp profile');
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 What are Icebreakers?</p>
        <p>Icebreakers are clickable conversation starters shown when a customer opens your WhatsApp Business profile for the first time. They make it easy for customers to start a chat by tapping a pre-set question. Maximum 4 icebreakers allowed by Meta.</p>
      </div>
      <div className="space-y-3">
        {icebreakers.map((ib, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Icebreaker {i + 1}</span>
              <button onClick={() => setIcebreakers(prev => prev.filter((_, idx) => idx !== i))}
                className="p-1 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <input value={ib.header} onChange={e => setIcebreakers(prev => prev.map((x, idx) => idx === i ? {...x, header: e.target.value} : x))}
              placeholder="Button label (e.g. What is your pricing?)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input value={ib.text} onChange={e => setIcebreakers(prev => prev.map((x, idx) => idx === i ? {...x, text: e.target.value} : x))}
              placeholder="Full message sent when customer taps this" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {icebreakers.length < 4 && (
          <Button variant="secondary" onClick={addIcebreaker} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Icebreaker
          </Button>
        )}
        <Button onClick={save} disabled={saving} className="flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save to WhatsApp Profile
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutoRepliesPage() {
  const { get, post } = useApi();
  const [activeTab, setActiveTab] = useState('keyword_reply');
  const [rules, setRules] = useState<Rule[]>([]);
  const [dismissedInfoTabs, setDismissedInfoTabs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ar_dismissed_info');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });
  const dismissInfo = (tab: string) => {
    const next = new Set(dismissedInfoTabs).add(tab);
    setDismissedInfoTabs(next);
    try { localStorage.setItem('ar_dismissed_info', JSON.stringify([...next])); } catch { /* ignore */ }
  };
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Quick Replies state
  const [qrs, setQrs] = useState<{id:string;title:string;message:string;shortcut?:string}[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrForm, setShowQrForm] = useState(false);
  const [editingQr, setEditingQr] = useState<{id:string;title:string;message:string;shortcut?:string}|null>(null);
  const [qrTitle, setQrTitle] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [qrShortcut, setQrShortcut] = useState('');
  const [qrSaving, setQrSaving] = useState(false);

  const loadQrs = () => {
    setQrLoading(true);
    get('/api/auto-replies/quick-replies')
      .then(r => setQrs(r.data?.quick_replies || r.data || []))
      .catch(() => {})
      .finally(() => setQrLoading(false));
  };

  const saveQr = async () => {
    if (!qrTitle.trim() || !qrMessage.trim()) { toast.error('Title and message required'); return; }
    setQrSaving(true);
    try {
      const payload = { title: qrTitle.trim(), message: qrMessage.trim(), shortcut: qrShortcut.trim() || undefined };
      if (editingQr) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const token = useAuthStore.getState().token;
        const axios = (await import('axios')).default;
        await axios.put(`${apiUrl}/api/auto-replies/quick-replies/${editingQr.id}`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        toast.success('Quick reply updated');
      } else {
        await post('/api/auto-replies/quick-replies', payload);
        toast.success('Quick reply saved');
      }
      setShowQrForm(false); setEditingQr(null); setQrTitle(''); setQrMessage(''); setQrShortcut('');
      loadQrs();
    } catch { toast.error('Save failed'); }
    finally { setQrSaving(false); }
  };

  const deleteQr = async (id: string) => {
    if (!confirm('Delete this quick reply?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = useAuthStore.getState().token;
      const axios = (await import('axios')).default;
      await axios.delete(`${apiUrl}/api/auto-replies/quick-replies/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      toast.success('Deleted'); loadQrs();
    } catch { toast.error('Delete failed'); }
  };

  const load = () => {
    setLoading(true);
    get('/api/auto-replies/rules')
      .then(r => setRules(r.data?.rules || []))
      .catch(() => toast.error('Failed to load rules'))
      .finally(() => setLoading(false));
  };


  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { if (activeTab === 'quick_replies') loadQrs(); }, [activeTab]); // eslint-disable-line

  const toggle = async (rule: Rule) => {
    // Optimistic update with rollback
    const prev = rules;
    setRules(r => r.map(x => x.id === rule.id ? { ...x, is_active: !x.is_active } : x));
    try {
      await post(`/api/auto-replies/rules/${rule.id}/toggle`, {});
    } catch {
      setRules(prev); // rollback to previous state
      toast.error('Toggle failed — changes reverted');
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = useAuthStore.getState().token;
      await axios.delete(`${apiUrl}/api/auto-replies/rules/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      toast.success('Rule deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const tabRules = rules.filter(r => r.rule_type === activeTab);
  const tab = TABS.find(t => t.key === activeTab)!;
  const isSingleRule = ['welcome', 'out_of_office', 'opt_out'].includes(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox Automation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Auto-reply rules, welcome messages, out-of-office, opt-out, keyword alerts, auto-assign, quick replies &amp; icebreakers — all in one place
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-gray-200 pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition -mb-px ${activeTab === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.label}
            {rules.filter(r => r.rule_type === t.key).length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                {rules.filter(r => r.rule_type === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab description + add button */}
      {activeTab !== 'icebreaker' && activeTab !== 'quick_replies' && (
        <div className="space-y-3">
          {/* Info box — dismissible per tab */}
          {TAB_INFO[activeTab] && !dismissedInfoTabs.has(activeTab) && (() => {
            const info = TAB_INFO[activeTab];
            const colors: Record<string, string> = {
              orange: 'bg-orange-50 border-orange-200 text-orange-900',
              blue:   'bg-blue-50 border-blue-200 text-blue-900',
              purple: 'bg-purple-50 border-purple-200 text-purple-900',
              red:    'bg-red-50 border-red-200 text-red-900',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
              green:  'bg-green-50 border-green-200 text-green-900',
            };
            const tipColors: Record<string, string> = {
              orange: 'text-orange-700', blue: 'text-blue-700', purple: 'text-purple-700',
              red: 'text-red-600 font-semibold', yellow: 'text-yellow-700', green: 'text-green-700',
            };
            return (
              <div className={`rounded-xl border p-4 text-sm ${colors[info.color]}`}>
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold mb-1">{info.title}</p>
                    <p className="text-xs opacity-85 leading-relaxed">{info.body}</p>
                    {info.bullets && (
                      <ul className="mt-2 space-y-0.5">
                        {info.bullets.map((b, i) => (
                          <li key={i} className="text-xs opacity-80 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-current shrink-0 opacity-60" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {info.tip && <p className={`text-xs mt-2 ${tipColors[info.color]}`}>{info.tip}</p>}
                  </div>
                  <button onClick={() => dismissInfo(activeTab)} className="shrink-0 opacity-50 hover:opacity-100 transition p-0.5 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Active welcome + skip notice */}
          {activeTab === 'welcome' && tabRules.some(r => r.is_active && r.skip_automation_on_welcome !== false) && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span><strong>Active:</strong> The &quot;New WhatsApp Lead&quot; automation workflow will be skipped for new contacts — they&apos;ll receive this welcome message instead. Agentic AI replies are not affected.</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span />
            {(!isSingleRule || tabRules.length === 0) && (
              <Button onClick={() => { setEditingRule(null); setShowForm(true); }} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> {isSingleRule ? 'Set Up' : 'Add Rule'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Icebreaker tab */}
      {activeTab === 'icebreaker' && <IcebreakerPanel />}


      {/* ── Quick Replies tab ──────────────────────────────────────────────── */}
      {activeTab === 'quick_replies' && (
        <div className="space-y-4">
          {/* Info box */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold mb-1">⚡ Quick Replies — Save Once, Send Instantly</p>
                <p className="text-xs opacity-85 leading-relaxed">
                  Save your most common replies here. In the inbox, click the ⚡ button in the reply box — pick a saved reply — it fills in with one click. No typing needed.
                </p>
                <ul className="mt-2 space-y-0.5">
                  {[
                    'Save greetings, pricing info, FAQs, follow-up messages',
                    'Add an optional shortcut command (e.g. /greet, /price)',
                    'Access via the ⚡ button in the inbox reply box',
                    'Saved to your account — only you can see and use them',
                  ].map((b, i) => (
                    <li key={i} className="text-xs opacity-80 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-current shrink-0 opacity-60" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Saved replies — click ⚡ in the inbox reply box to insert instantly.</p>
            <Button onClick={() => { setEditingQr(null); setQrTitle(''); setQrMessage(''); setQrShortcut(''); setShowQrForm(true); }}
              className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Quick Reply</Button>
          </div>

          {/* Add / Edit form */}
          {showQrForm && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">{editingQr ? 'Edit Quick Reply' : 'New Quick Reply'}</p>
                <button onClick={() => setShowQrForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Title <span className="text-gray-400">(shown in dropdown)</span></p>
                <input value={qrTitle} onChange={e => setQrTitle(e.target.value)}
                  placeholder="e.g. Greeting, Price Info, Follow Up..."
                  className="input-field text-sm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Message <span className="text-gray-400">(what gets sent)</span></p>
                <textarea value={qrMessage} onChange={e => setQrMessage(e.target.value)}
                  rows={3} placeholder="Namaste! Aapki query ke liye shukriya. Hum 10 minute mein aapse contact karenge."
                  className="input-field text-sm resize-none" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Shortcut <span className="text-gray-400">(optional — e.g. /greet)</span></p>
                <input value={qrShortcut} onChange={e => setQrShortcut(e.target.value)}
                  placeholder="/greet" className="input-field text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowQrForm(false)}>Cancel</Button>
                <Button onClick={saveQr} loading={qrSaving}>
                  {editingQr ? 'Update' : 'Save Quick Reply'}
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {qrLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : qrs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <Zap className="w-5 h-5" />
              </div>
              <p className="font-semibold text-gray-500">No quick replies yet</p>
              <p className="text-sm text-gray-400">Add some — use ⚡ in the inbox reply box to send them instantly</p>
              <Button onClick={() => setShowQrForm(true)} className="mt-1 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Quick Reply
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {qrs.map(qr => (
                <div key={qr.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{qr.title}</span>
                      {qr.shortcut && (
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{qr.shortcut}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{qr.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => {
                      setEditingQr(qr); setQrTitle(qr.title); setQrMessage(qr.message);
                      setQrShortcut(qr.shortcut || ''); setShowQrForm(true);
                    }} className="p-1.5 text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteQr(qr.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules list */}
      {activeTab !== 'icebreaker' && activeTab !== 'quick_replies' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : tabRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">{tab.icon}</div>
            <p className="font-semibold text-gray-500">No {tab.label} rules yet</p>
            <p className="text-sm text-gray-400">{tab.desc}</p>
            <Button onClick={() => { setEditingRule(null); setShowForm(true); }} className="mt-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {isSingleRule ? 'Set Up' : 'Create First Rule'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tabRules.map(rule => (
              <div key={rule.id} className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50 grayscale-[30%]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{rule.name}</span>
                      {rule.is_active
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />Active</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                      }
                    </div>
                    {rule.trigger_keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {rule.trigger_keywords.map((kw, i) => (
                          <span key={i} className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">{kw}</span>
                        ))}
                      </div>
                    )}
                    {rule.response_text && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 bg-gray-50 rounded-lg p-2">{rule.response_text}</p>
                    )}
                    {rule.template_name && (
                      <p className="text-xs text-gray-500 mt-1">📋 Template: <span className="font-medium">{rule.template_name}</span></p>
                    )}
                    {rule.media_url && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span className="capitalize">{rule.media_type || 'image'}</span> attached
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggle(rule)} className="text-gray-400 hover:text-gray-700 transition" title="Toggle">
                      {rule.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button onClick={() => { setEditingRule(rule); setShowForm(true); }}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition">
                      Edit
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Rule form */}
      {showForm && (
        <RuleForm
          ruleType={activeTab}
          existing={editingRule}
          onClose={() => { setShowForm(false); setEditingRule(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
