'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Plus, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING:  'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
  PAUSED:   'bg-gray-100 text-gray-600',
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  PENDING:  <Clock className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};
const CATEGORY_COLORS: Record<string, string> = {
  MARKETING:      'bg-violet-50 text-violet-700',
  UTILITY:        'bg-blue-50 text-blue-700',
  AUTHENTICATION: 'bg-orange-50 text-orange-700',
};
const CATEGORY_ACTIVE: Record<string, string> = {
  MARKETING:      'bg-violet-600 text-white',
  UTILITY:        'bg-blue-600 text-white',
  AUTHENTICATION: 'bg-orange-500 text-white',
};
const LANGUAGES = [
  { code: 'en_US', label: 'English' },
  { code: 'hi',    label: 'Hindi — हिन्दी' },
  { code: 'gu',    label: 'Gujarati — ગુજરાતી' },
  { code: 'ta',    label: 'Tamil — தமிழ்' },
  { code: 'te',    label: 'Telugu — తెలుగు' },
  { code: 'bn',    label: 'Bengali — বাংলা' },
  { code: 'mr',    label: 'Marathi — मराठी' },
  { code: 'kn',    label: 'Kannada — ಕನ್ನಡ' },
  { code: 'ml',    label: 'Malayalam — മലയാളം' },
  { code: 'pa',    label: 'Punjabi — ਪੰਜਾਬੀ' },
];

type BtnType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
interface BtnEntry { type: BtnType; text: string; url: string; phone: string }
interface FormState {
  name: string;
  category: string;
  language: string;
  headerType: 'NONE' | 'TEXT';
  headerText: string;
  bodyText: string;
  examples: string[];
  footerText: string;
  buttons: BtnEntry[];
}

const EMPTY_FORM: FormState = {
  name: '', category: 'MARKETING', language: 'en_US',
  headerType: 'NONE', headerText: '',
  bodyText: '', examples: [],
  footerText: '', buttons: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectVarCount(text: string): number {
  const nums = new Set((text.match(/\{\{(\d+)\}\}/g) || []).map(m => m.replace(/\D/g, '')));
  return nums.size;
}

function applyExamples(text: string, examples: string[]): string {
  return examples.reduce((t, v, i) => t.replace(`{{${i + 1}}}`, v || `{{${i + 1}}}`), text);
}

// ─── WhatsApp preview bubble ──────────────────────────────────────────────────

function WaPreview({ form }: { form: FormState }) {
  const body = applyExamples(form.bodyText, form.examples);
  const hasContent = form.headerText || body || form.footerText || form.buttons.length > 0;
  return (
    <div className="sticky top-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
      <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[200px] flex items-start">
        {!hasContent ? (
          <p className="text-xs text-gray-400 m-auto text-center">Fill the form to see preview</p>
        ) : (
          <div className="max-w-[280px] w-full">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden">
              {/* header */}
              {form.headerType === 'TEXT' && form.headerText && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-sm font-bold text-gray-900">{form.headerText}</p>
                </div>
              )}
              {/* body */}
              {body && (
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{body}</p>
                </div>
              )}
              {/* footer */}
              {form.footerText && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-400">{form.footerText}</p>
                </div>
              )}
              {/* time */}
              <div className="px-3 pb-1 text-right">
                <span className="text-[10px] text-gray-400">12:00 PM ✓✓</span>
              </div>
            </div>
            {/* buttons */}
            {form.buttons.map((btn, i) => (
              <button key={i} className="mt-1 w-full bg-white rounded-lg py-2 text-sm font-semibold text-[#00a5f4] text-center shadow-sm">
                {btn.text || `Button ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Template Modal ────────────────────────────────────────────────────

function CreateTemplateModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tpl: any) => void;
}) {
  const { post } = useApi();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) { setForm(EMPTY_FORM); setErrors({}); }
  }, [isOpen]);

  // Sync variable examples when body changes
  const setBody = (text: string) => {
    const count = detectVarCount(text);
    setForm(f => ({
      ...f,
      bodyText: text,
      examples: Array(count).fill('').map((_, i) => f.examples[i] ?? ''),
    }));
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Button helpers
  const addButton = (type: BtnType) => {
    if (form.buttons.length >= 3) return;
    setField('buttons', [...form.buttons, { type, text: '', url: '', phone: '' }]);
  };
  const updateBtn = (i: number, patch: Partial<BtnEntry>) =>
    setField('buttons', form.buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  const removeBtn = (i: number) =>
    setField('buttons', form.buttons.filter((_, idx) => idx !== i));

  const hasQuickReply = form.buttons.some(b => b.type === 'QUICK_REPLY');
  const hasCta = form.buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Template name is required';
    else if (!/^[a-z0-9_]+$/.test(form.name)) e.name = 'Only lowercase letters, numbers, underscores';
    if (!form.category) e.category = 'Select a category';
    if (!form.bodyText.trim()) e.body = 'Body text is required';
    form.examples.forEach((v, i) => {
      if (!v.trim()) e[`ex_${i}`] = `Example for {{${i + 1}}} is required`;
    });
    form.buttons.forEach((b, i) => {
      if (!b.text.trim()) e[`btn_text_${i}`] = 'Button label required';
      if (b.type === 'URL' && !b.url.trim()) e[`btn_url_${i}`] = 'URL required';
      if (b.type === 'PHONE_NUMBER' && !b.phone.trim()) e[`btn_ph_${i}`] = 'Phone required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await post('/api/automation/whatsapp/templates', {
        name: form.name,
        language: form.language,
        category: form.category,
        header_type: form.headerType,
        header_text: form.headerText,
        body_text: form.bodyText,
        body_variables: form.examples,
        footer_text: form.footerText,
        buttons: form.buttons.map(b => ({
          type: b.type, text: b.text,
          ...(b.type === 'URL' ? { url: b.url } : {}),
          ...(b.type === 'PHONE_NUMBER' ? { phone_number: b.phone } : {}),
        })),
      });
      toast.success('Template submitted for approval — usually takes a few minutes to hours');
      onSuccess(res.data.template);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 422 && detail) toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create WhatsApp Template</h2>
                <p className="text-xs text-gray-500 mt-0.5">Submit for Meta approval — usually approved within minutes to 24 hours</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-column body */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* LEFT: Form */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Template Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                      setField('name', v);
                    }}
                    placeholder="e.g. diwali_offer_2025"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, underscores only. Spaces auto-replaced.</p>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 flex-wrap">
                    {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map(cat => (
                      <button key={cat} onClick={() => setField('category', cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${form.category === cat ? CATEGORY_ACTIVE[cat] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {cat === 'MARKETING' ? '📣 Marketing' : cat === 'UTILITY' ? '🔧 Utility' : '🔐 Authentication'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {form.category === 'MARKETING' && 'Promotions, offers, announcements — higher Meta fee'}
                    {form.category === 'UTILITY' && 'Order updates, confirmations, reminders — lower Meta fee'}
                    {form.category === 'AUTHENTICATION' && 'OTP, login codes — lowest Meta fee'}
                  </p>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                  <select value={form.language} onChange={e => setField('language', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Header <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex gap-2 mb-3">
                    {(['NONE', 'TEXT'] as const).map(ht => (
                      <button key={ht} onClick={() => setField('headerType', ht)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${form.headerType === ht ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {ht === 'NONE' ? 'None' : '✏️ Text'}
                      </button>
                    ))}
                  </div>
                  {form.headerType === 'TEXT' && (
                    <div>
                      <input value={form.headerText} onChange={e => setField('headerText', e.target.value.slice(0, 60))}
                        placeholder="Header text (max 60 chars)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      <p className="text-xs text-gray-400 mt-1">{form.headerText.length}/60 — No variables allowed in header</p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Body <span className="text-red-500">*</span>
                    {detectVarCount(form.bodyText) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                        {detectVarCount(form.bodyText)} variable{detectVarCount(form.bodyText) > 1 ? 's' : ''}
                      </span>
                    )}
                  </label>
                  <textarea value={form.bodyText} onChange={e => setBody(e.target.value.slice(0, 1024))}
                    rows={4} placeholder={`Hi {{1}}, your order {{2}} has been confirmed! 🎉`}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${errors.body ? 'border-red-400' : 'border-gray-200'}`} />
                  <p className="text-xs text-gray-400 mt-1">{form.bodyText.length}/1024 — Use <code className="bg-gray-100 px-1 rounded">{`{{1}}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{{2}}`}</code> for variables</p>
                  {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
                </div>

                {/* Variable examples */}
                {form.examples.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Variable Examples <span className="text-red-500">*</span>
                      <span className="ml-1 text-xs text-gray-400 font-normal">— required by Meta for approval</span>
                    </label>
                    <div className="space-y-2">
                      {form.examples.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded w-14 text-center flex-shrink-0">
                            {`{{${idx + 1}}}`}
                          </span>
                          <input value={val}
                            onChange={e => setField('examples', form.examples.map((x, i) => i === idx ? e.target.value : x))}
                            placeholder={`Example value for {{${idx + 1}}}`}
                            className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors[`ex_${idx}`] ? 'border-red-400' : 'border-gray-200'}`} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Meta uses these to review your template. They won't be sent to customers.</p>
                  </div>
                )}

                {/* Footer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Footer <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input value={form.footerText} onChange={e => setField('footerText', e.target.value.slice(0, 60))}
                    placeholder="e.g. Reply STOP to unsubscribe"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <p className="text-xs text-gray-400 mt-1">{form.footerText.length}/60</p>
                </div>

                {/* Buttons */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buttons <span className="text-gray-400 font-normal">(optional, max 3)</span>
                  </label>
                  {form.buttons.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {form.buttons.map((btn, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${btn.type === 'QUICK_REPLY' ? 'bg-gray-100 text-gray-600' : btn.type === 'URL' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                              {btn.type === 'QUICK_REPLY' ? 'Quick Reply' : btn.type === 'URL' ? 'Visit Website' : 'Call Phone'}
                            </span>
                            <button onClick={() => removeBtn(i)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input value={btn.text} onChange={e => updateBtn(i, { text: e.target.value })}
                            placeholder="Button label (max 25 chars)"
                            className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors[`btn_text_${i}`] ? 'border-red-400' : 'border-gray-200'}`} />
                          {btn.type === 'URL' && (
                            <input value={btn.url} onChange={e => updateBtn(i, { url: e.target.value })}
                              placeholder="https://example.com"
                              className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors[`btn_url_${i}`] ? 'border-red-400' : 'border-gray-200'}`} />
                          )}
                          {btn.type === 'PHONE_NUMBER' && (
                            <input value={btn.phone} onChange={e => updateBtn(i, { phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors[`btn_ph_${i}`] ? 'border-red-400' : 'border-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.buttons.length < 3 && (
                    <div className="flex gap-2 flex-wrap">
                      {!hasCta && (
                        <button onClick={() => addButton('QUICK_REPLY')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                          <Plus className="w-3.5 h-3.5" /> Quick Reply
                        </button>
                      )}
                      {!hasQuickReply && (
                        <>
                          <button onClick={() => addButton('URL')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                            <Plus className="w-3.5 h-3.5" /> Visit Website
                          </button>
                          <button onClick={() => addButton('PHONE_NUMBER')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                            <Plus className="w-3.5 h-3.5" /> Call Phone
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {(hasQuickReply || hasCta) && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      ⚠️ Quick Reply buttons cannot be mixed with URL/Phone buttons (Meta rule)
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT: Preview */}
              <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-100 p-6 bg-gray-50">
                <WaPreview form={form} />
              </div>
            </div>

            {/* Footer bar */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
              <p className="text-xs text-gray-400">Submitted templates go to Meta for review. Status visible on this page.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 min-w-[140px] justify-center">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    : 'Submit for Approval'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Templates Page ───────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { get } = useApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const loadTemplates = () => {
    setLoading(true);
    get('/api/automation/whatsapp/templates')
      .then(r => {
        setTemplates(r.data?.templates || []);
        if (r.data?.error) setError(r.data.error);
        else if (r.data?.message) setError(r.data.message);
        else setError('');
      })
      .catch(() => setError('Could not load templates. Check your WhatsApp connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, []); // eslint-disable-line

  const handleTemplateCreated = (newTpl: any) => {
    setTemplates(prev => [{ ...newTpl, components: [] }, ...prev]);
    setFilter('ALL');
  };

  const filtered = filter === 'ALL' ? templates : templates.filter(t => t.status === filter);

  const getBodyText = (components: any[]) => {
    const body = components?.find((c: any) => c.type === 'BODY');
    return body?.text || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage message templates for your WhatsApp Business account.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Stats */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['APPROVED', 'PENDING', 'REJECTED'] as const).map(status => (
            <Card key={status} hoverable
              className={`cursor-pointer border-gray-200 ${filter === status ? 'ring-2 ring-primary-300' : ''}`}
              onClick={() => setFilter(filter === status ? 'ALL' : status)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-600">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status]}`}>
                  {templates.filter(t => t.status === status).length}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Could not load templates</p>
          <p>{error}</p>
          <p className="mt-2">Make sure you have connected WhatsApp with a valid Business Account ID in <a href="/dashboard/integrations" className="font-semibold underline">Integrations</a>.</p>
        </div>
      )}

      {/* Template grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
            <Plus className="h-7 w-7 text-orange-500" />
          </div>
          <p className="text-lg font-semibold text-gray-500">No templates yet</p>
          <p className="text-sm text-gray-400">Create your first template and submit for Meta approval.</p>
          <Button onClick={() => setModalOpen(true)} className="mt-2 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card key={t.id || t.name} hoverable={false} className="border-gray-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_ICONS[t.status]}
                  {t.status}
                </span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                  {t.category}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  {t.language}
                </span>
              </div>
              {getBodyText(t.components) && (
                <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 rounded-lg p-2">
                  {getBodyText(t.components)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTemplateCreated}
      />
    </div>
  );
}
