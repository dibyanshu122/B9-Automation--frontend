'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, CheckCircle2, Clock, Edit2, Loader2, MessageSquare, Plus,
  ToggleLeft, ToggleRight, Trash2, X, Zap, UserCheck, PhoneOff, Bot,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rule {
  id: string; rule_type: string; name: string; is_active: boolean;
  trigger_keywords: string[]; match_exact: boolean; response_text: string | null;
  template_name: string | null; working_hours: Record<string, any>;
  timezone: string; priority: number; created_at: string;
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

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_LABELS: Record<string, string> = { mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun' };

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d, { open: ['mon','tue','wed','thu','fri'].includes(d), start: '09:00', end: '18:00' }])
);

// ─── Rule Form Slide-over ─────────────────────────────────────────────────────

function RuleForm({ ruleType, existing, onClose, onSaved }: {
  ruleType: string; existing?: Rule | null; onClose: () => void; onSaved: () => void;
}) {
  const { post, put } = useApi();
  const [name, setName] = useState(existing?.name || '');
  const [keywords, setKeywords] = useState((existing?.trigger_keywords || []).join(', '));
  const [matchExact, setMatchExact] = useState(existing?.match_exact || false);
  const [responseText, setResponseText] = useState(existing?.response_text || '');
  const [templateName, setTemplateName] = useState(existing?.template_name || '');
  const [workingHours, setWorkingHours] = useState<any>(existing?.working_hours && Object.keys(existing.working_hours).length > 0 ? existing.working_hours : DEFAULT_HOURS);
  const [timezone, setTimezone] = useState(existing?.timezone || 'Asia/Kolkata');
  const [alertEmail, setAlertEmail] = useState((existing as any)?.alert_email || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    const payload: any = {
      rule_type: ruleType, name: name.trim(), is_active: true,
      trigger_keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      match_exact: matchExact,
      response_text: responseText.trim() || null,
      template_name: templateName.trim() || null,
      working_hours: ruleType === 'out_of_office' ? workingHours : {},
      timezone, alert_email: alertEmail.trim() || null,
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{existing ? 'Edit' : 'Create'} {TABS.find(t => t.key === ruleType)?.label}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rule Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Price Inquiry Reply" className={inputCls} />
            </div>

            {['keyword_reply', 'keyword_alert', 'opt_out', 'auto_assign'].includes(ruleType) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Trigger Keywords <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder={ruleType === 'opt_out' ? 'STOP, UNSUBSCRIBE, OPT OUT' : 'price, cost, rate, fees'}
                  className={inputCls} />
                {ruleType === 'keyword_reply' && (
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={matchExact} onChange={e => setMatchExact(e.target.checked)} className="rounded" />
                    Exact match only (not partial)
                  </label>
                )}
              </div>
            )}

            {ruleType !== 'keyword_alert' && ruleType !== 'auto_assign' && ruleType !== 'icebreaker' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Response Message</label>
                <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3}
                  placeholder="Hi! Thanks for reaching out. Our pricing starts at ₹999..."
                  className={`${inputCls} resize-none`} />
                <p className="text-xs text-gray-400 mt-1">Or use a template instead:</p>
                <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                  placeholder="Template name (APPROVED templates only)" className={`${inputCls} mt-1`} />
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
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
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
    if (icebreakers.length >= 5) { toast.error('Max 5 icebreakers allowed'); return; }
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
        <p>Icebreakers appear as clickable buttons when a customer opens your WhatsApp for the first time. They help customers quickly start a conversation by tapping common questions. Max 5 allowed by Meta.</p>
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
        {icebreakers.length < 5 && (
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
    get('/api/quick-replies')
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
        const token = localStorage.getItem('token');
        const axios = (await import('axios')).default;
        await axios.put(`${apiUrl}/api/quick-replies/${editingQr.id}`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        toast.success('Quick reply updated');
      } else {
        await post('/api/quick-replies', payload);
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
      const token = localStorage.getItem('token');
      const axios = (await import('axios')).default;
      await axios.delete(`${apiUrl}/api/quick-replies/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
    try {
      await post(`/api/auto-replies/rules/${rule.id}/toggle`, {});
      setRules(prev => prev.map(r => r.id === rule.id ? {...r, is_active: !r.is_active} : r));
    } catch { toast.error('Toggle failed'); }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/api/auto-replies/rules/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      toast.success('Rule deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const tabRules = rules.filter(r => r.rule_type === activeTab);
  const tab = TABS.find(t => t.key === activeTab)!;
  const isSingleRule = ['welcome', 'out_of_office'].includes(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auto Replies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automate WhatsApp responses — keyword replies, welcome, out of office, and more</p>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{tab.desc}</p>
          {(!isSingleRule || tabRules.length === 0) && (
            <Button onClick={() => { setEditingRule(null); setShowForm(true); }} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> {isSingleRule ? 'Set Up' : 'Add Rule'}
            </Button>
          )}
        </div>
      )}

      {/* Icebreaker tab */}
      {activeTab === 'icebreaker' && <IcebreakerPanel />}

      {/* ── Quick Replies tab ──────────────────────────────────────────────── */}
      {activeTab === 'quick_replies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Inbox ke ⚡ button se select karke instantly bhejo — type karne ki zarurat nahi.</p>
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
              <p className="font-semibold text-gray-500">Koi Quick Reply nahi hai abhi</p>
              <p className="text-sm text-gray-400">Add karo — inbox mein ⚡ button se instantly bhej sakte ho</p>
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
              <div key={rule.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition">
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
