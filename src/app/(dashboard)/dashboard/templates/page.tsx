'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2, Clock, FileText, Image, MapPin, MessageSquare,
  Plus, Search, Trash2, Video, X, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  PAUSED:   'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  PENDING:  <Clock className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
};
const CAT_STYLE: Record<string, string> = {
  MARKETING:      'bg-violet-50 text-violet-700',
  UTILITY:        'bg-blue-50 text-blue-700',
  AUTHENTICATION: 'bg-orange-50 text-orange-700',
};
const CAT_ACTIVE: Record<string, string> = {
  MARKETING:      'bg-violet-600 text-white',
  UTILITY:        'bg-blue-600 text-white',
  AUTHENTICATION: 'bg-orange-500 text-white',
};
const LANGUAGES = [
  { code: 'en_US', label: 'English' },
  { code: 'hi',    label: 'Hindi' },
  { code: 'gu',    label: 'Gujarati' },
  { code: 'ta',    label: 'Tamil' },
  { code: 'te',    label: 'Telugu' },
  { code: 'bn',    label: 'Bengali' },
  { code: 'mr',    label: 'Marathi' },
  { code: 'kn',    label: 'Kannada' },
  { code: 'ml',    label: 'Malayalam' },
  { code: 'pa',    label: 'Punjabi' },
];
const HEADER_TYPES = ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'] as const;
type HeaderType = typeof HEADER_TYPES[number];
type TemplateType = 'standard' | 'carousel' | 'lto' | 'authentication';
type BtnType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

// ─── Template Library ─────────────────────────────────────────────────────────

const TEMPLATE_LIBRARY = [
  { key: 'order_confirmed', category: 'UTILITY', name: 'Order Confirmed', tags: ['ecommerce', 'order'],
    body: 'Hi {{1}}, your order #{{2}} has been confirmed! Expected delivery: {{3}}.',
    varLabels: ['Customer name', 'Order number', 'Delivery date'],
    buttons: [{ type: 'URL', text: 'Track Order', url: 'https://' }] },
  { key: 'payment_received', category: 'UTILITY', name: 'Payment Received', tags: ['billing', 'payment'],
    body: 'Hi {{1}}, we received your payment of ₹{{2}} for order #{{3}}. Thank you!',
    varLabels: ['Customer name', 'Amount', 'Order number'], buttons: [] },
  { key: 'delivery_update', category: 'UTILITY', name: 'Out for Delivery', tags: ['delivery', 'logistics'],
    body: 'Hi {{1}}, your order #{{2}} is out for delivery and will arrive today!',
    varLabels: ['Customer name', 'Order number'], buttons: [] },
  { key: 'appointment_reminder', category: 'UTILITY', name: 'Appointment Reminder', tags: ['booking', 'reminder'],
    body: 'Hi {{1}}, reminder: your appointment is on {{2}} at {{3}}. Reply to confirm.',
    varLabels: ['Name', 'Date', 'Time'],
    buttons: [{ type: 'QUICK_REPLY', text: 'Confirm' }, { type: 'QUICK_REPLY', text: 'Reschedule' }] },
  { key: 'invoice_ready', category: 'UTILITY', name: 'Invoice Ready', tags: ['billing', 'invoice'],
    body: 'Hi {{1}}, your invoice #{{2}} for ₹{{3}} is ready. Due date: {{4}}.',
    varLabels: ['Name', 'Invoice number', 'Amount', 'Due date'], buttons: [] },
  { key: 'subscription_expiry', category: 'UTILITY', name: 'Subscription Expiring', tags: ['subscription', 'renewal'],
    body: 'Hi {{1}}, your {{2}} subscription expires on {{3}}. Renew to avoid interruption.',
    varLabels: ['Name', 'Plan name', 'Expiry date'],
    buttons: [{ type: 'URL', text: 'Renew Now', url: 'https://' }] },
  { key: 'support_ticket', category: 'UTILITY', name: 'Support Ticket Update', tags: ['support', 'helpdesk'],
    body: 'Hi {{1}}, your support ticket #{{2}} has been updated. Status: {{3}}.',
    varLabels: ['Name', 'Ticket number', 'Status'], buttons: [] },
  { key: 'welcome_customer', category: 'MARKETING', name: 'Welcome New Customer', tags: ['welcome', 'onboarding'],
    body: 'Welcome to {{1}}, {{2}}! 🎉 We are excited to have you. Enjoy {{3}}% off your first order.',
    varLabels: ['Business name', 'Customer name', 'Discount'],
    buttons: [{ type: 'URL', text: 'Shop Now', url: 'https://' }] },
  { key: 'special_offer', category: 'MARKETING', name: 'Special Offer', tags: ['offer', 'discount'],
    body: 'Hi {{1}}, exclusive offer just for you! Get {{2}}% off on {{3}}. Valid till {{4}}.',
    varLabels: ['Name', 'Discount %', 'Product', 'Expiry date'],
    buttons: [{ type: 'URL', text: 'Claim Offer', url: 'https://' }] },
  { key: 'abandoned_cart', category: 'MARKETING', name: 'Abandoned Cart', tags: ['ecommerce', 'cart'],
    body: 'Hi {{1}}, you left {{2}} in your cart! Complete your purchase now.',
    varLabels: ['Name', 'Product name'],
    buttons: [{ type: 'URL', text: 'Complete Purchase', url: 'https://' }] },
  { key: 'new_product_launch', category: 'MARKETING', name: 'New Product Launch', tags: ['product', 'launch'],
    body: 'Hi {{1}}, exciting news! We just launched {{2}}. Be among the first to try it!',
    varLabels: ['Name', 'Product name'],
    buttons: [{ type: 'URL', text: 'View Product', url: 'https://' }] },
  { key: 'lead_followup', category: 'MARKETING', name: 'Lead Follow-up', tags: ['sales', 'lead'],
    body: 'Hi {{1}}, thanks for your interest in {{2}}! Can we schedule a quick call to discuss?',
    varLabels: ['Name', 'Product/service'],
    buttons: [{ type: 'QUICK_REPLY', text: 'Yes, call me' }, { type: 'QUICK_REPLY', text: 'Send info' }] },
  { key: 'feedback_request', category: 'MARKETING', name: 'Feedback Request', tags: ['review', 'feedback'],
    body: 'Hi {{1}}, how was your experience with {{2}}? Your feedback helps us improve!',
    varLabels: ['Name', 'Product/service'],
    buttons: [{ type: 'URL', text: 'Rate Us', url: 'https://' }] },
  { key: 'event_invite', category: 'MARKETING', name: 'Event Invitation', tags: ['event', 'invite'],
    body: 'Hi {{1}}, you are invited to {{2}} on {{3}} at {{4}}. We would love to see you!',
    varLabels: ['Name', 'Event name', 'Date', 'Location'],
    buttons: [{ type: 'QUICK_REPLY', text: 'I will attend' }, { type: 'QUICK_REPLY', text: 'Cannot make it' }] },
  { key: 'referral_program', category: 'MARKETING', name: 'Referral Program', tags: ['referral', 'rewards'],
    body: 'Hi {{1}}, love {{2}}? Refer a friend and both get {{3}} off! Your code: {{4}}',
    varLabels: ['Name', 'Business name', 'Discount', 'Referral code'], buttons: [] },
  { key: 'otp_login', category: 'AUTHENTICATION', name: 'Login OTP', tags: ['otp', 'login'],
    body: 'Your {{1}} login OTP is {{2}}. Valid for 10 minutes. Do not share this code.',
    varLabels: ['App name', 'OTP code'], buttons: [] },
  { key: 'otp_signup', category: 'AUTHENTICATION', name: 'Signup Verification', tags: ['otp', 'signup'],
    body: 'Welcome to {{1}}! Your verification code is {{2}}. Enter it to activate your account.',
    varLabels: ['Business name', 'Code'], buttons: [] },
  { key: 'password_reset', category: 'AUTHENTICATION', name: 'Password Reset', tags: ['otp', 'password'],
    body: 'Hi {{1}}, your password reset code for {{2}} is {{3}}. Valid for 15 minutes.',
    varLabels: ['Name', 'App name', 'Code'], buttons: [] },
  { key: 'payment_otp', category: 'AUTHENTICATION', name: 'Payment OTP', tags: ['otp', 'payment'],
    body: 'Your OTP for payment of ₹{{1}} to {{2}} is {{3}}. Valid for 5 minutes. Do not share.',
    varLabels: ['Amount', 'Merchant', 'OTP'], buttons: [] },
  { key: 'account_alert', category: 'AUTHENTICATION', name: 'Account Security Alert', tags: ['security', 'alert'],
    body: 'Hi {{1}}, a login was detected on your {{2}} account from a new device on {{3}}. Was this you?',
    varLabels: ['Name', 'App name', 'Date/time'],
    buttons: [{ type: 'QUICK_REPLY', text: 'Yes, it was me' }, { type: 'QUICK_REPLY', text: 'No, secure account' }] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BtnEntry { type: BtnType; text: string; url: string; phone: string; codeExample: string }
interface CarouselCard { headerFormat: 'IMAGE' | 'VIDEO'; headerUrl: string; body: string; buttons: BtnEntry[] }
interface FormState {
  name: string; category: string; language: string; templateType: TemplateType;
  headerType: HeaderType; headerText: string; headerMediaUrl: string; headerMediaHandle: string;
  bodyText: string; examples: string[]; footerText: string; buttons: BtnEntry[];
  carouselCards: CarouselCard[];
  ltoText: string; ltoHasExpiration: boolean; ltoPromoExample: string;
  authOtpType: 'COPY_CODE' | 'ONE_TAP' | 'ZERO_TAP';
  authSecurityRec: boolean; authExpiryMins: number;
  authAndroidPkg: string; authSigHash: string;
}
const EMPTY_BTN: BtnEntry = { type: 'QUICK_REPLY', text: '', url: '', phone: '', codeExample: '' };
const EMPTY_CARD: CarouselCard = { headerFormat: 'IMAGE', headerUrl: '', body: '', buttons: [] };
const EMPTY_FORM: FormState = {
  name: '', category: 'MARKETING', language: 'en_US', templateType: 'standard',
  headerType: 'NONE', headerText: '', headerMediaUrl: '', headerMediaHandle: '',
  bodyText: '', examples: [], footerText: '', buttons: [],
  carouselCards: [{ ...EMPTY_CARD }, { ...EMPTY_CARD }],
  ltoText: 'Offer expires in', ltoHasExpiration: true, ltoPromoExample: '',
  authOtpType: 'COPY_CODE', authSecurityRec: true, authExpiryMins: 10,
  authAndroidPkg: '', authSigHash: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectVarCount(text: string): number {
  return new Set((text.match(/\{\{(\d+)\}\}/g) || []).map(m => m.replace(/\D/g, ''))).size;
}
function applyExamples(text: string, examples: string[]): string {
  return examples.reduce((t, v, i) => t.replace(`{{${i + 1}}}`, v || `{{${i + 1}}}`), text);
}
function newBtn(type: BtnType): BtnEntry { return { ...EMPTY_BTN, type }; }

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────

function WaPreview({ form }: { form: FormState }) {
  const [cardIdx, setCardIdx] = useState(0);
  const body = applyExamples(form.bodyText, form.examples);

  if (form.templateType === 'authentication') {
    return (
      <div className="sticky top-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
        <div className="bg-[#e5ddd5] rounded-2xl p-4">
          <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3 max-w-[260px]">
            <p className="text-xs text-gray-500 mb-1">🔐 <strong>Authentication Code</strong></p>
            <p className="text-sm text-gray-800">Your verification code is <strong>123456</strong></p>
            {form.authSecurityRec && <p className="text-xs text-gray-400 mt-1">For your security, do not share this code.</p>}
            {form.authExpiryMins > 0 && <p className="text-xs text-gray-400">This code expires in {form.authExpiryMins} minutes.</p>}
            <p className="text-right text-[10px] text-gray-400 mt-1">12:00 PM ✓✓</p>
          </div>
          {form.authOtpType !== 'ZERO_TAP' && (
            <button className="mt-1 w-full max-w-[260px] bg-white rounded-lg py-2 text-sm font-semibold text-[#00a5f4] text-center shadow-sm">
              {form.authOtpType === 'ONE_TAP' ? 'Autofill' : 'Copy Code'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (form.templateType === 'carousel') {
    const card = form.carouselCards[cardIdx];
    return (
      <div className="sticky top-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
        <div className="bg-[#e5ddd5] rounded-2xl p-4">
          {body && (
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3 mb-2 max-w-[260px]">
              <p className="text-sm text-gray-800">{body}</p>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-[260px]">
            <div className={`h-28 flex items-center justify-center ${card?.headerUrl ? '' : 'bg-gray-200'}`}>
              {card?.headerUrl
                ? <img src={card.headerUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                : <div className="text-gray-400 flex flex-col items-center gap-1">
                    {card?.headerFormat === 'VIDEO' ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
                    <span className="text-xs">{card?.headerFormat || 'IMAGE'}</span>
                  </div>
              }
            </div>
            {card?.body && <p className="px-3 py-2 text-sm text-gray-800">{card.body}</p>}
            {(card?.buttons || []).map((b, i) => (
              <button key={i} className="w-full border-t border-gray-100 py-2 text-sm font-semibold text-[#00a5f4] text-center">{b.text || `Button ${i+1}`}</button>
            ))}
          </div>
          {form.carouselCards.length > 1 && (
            <div className="flex items-center justify-between mt-2 max-w-[260px]">
              <button onClick={() => setCardIdx(i => Math.max(0, i-1))} disabled={cardIdx === 0} className="p-1 rounded bg-white/60 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-gray-500">{cardIdx+1} / {form.carouselCards.length}</span>
              <button onClick={() => setCardIdx(i => Math.min(form.carouselCards.length-1, i+1))} disabled={cardIdx === form.carouselCards.length-1} className="p-1 rounded bg-white/60 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (form.templateType === 'lto') {
    return (
      <div className="sticky top-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
        <div className="bg-[#e5ddd5] rounded-2xl p-4">
          <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden max-w-[260px]">
            {form.headerMediaUrl && <img src={form.headerMediaUrl} alt="" className="w-full h-28 object-cover" onError={() => {}} />}
            {body && <p className="px-3 py-2 text-sm text-gray-800">{body}</p>}
            {form.ltoHasExpiration && (
              <div className="px-3 py-2 border-t border-dashed border-orange-200 bg-orange-50">
                <p className="text-xs text-orange-600 font-semibold">🕐 {form.ltoText || 'Offer expires in'}</p>
                {form.ltoPromoExample && <p className="text-sm font-mono font-bold text-gray-800 mt-0.5">{form.ltoPromoExample}</p>}
              </div>
            )}
            <p className="text-right text-[10px] text-gray-400 px-3 pb-1">12:00 PM ✓✓</p>
          </div>
          <button className="mt-1 w-full max-w-[260px] bg-white rounded-lg py-2 text-sm font-semibold text-[#00a5f4] text-center shadow-sm">Copy Code</button>
        </div>
      </div>
    );
  }

  // Standard preview
  const hasContent = form.headerText || form.headerMediaUrl || body || form.footerText || form.buttons.length > 0;
  return (
    <div className="sticky top-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
      <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[180px] flex items-start">
        {!hasContent ? (
          <p className="text-xs text-gray-400 m-auto text-center">Fill the form to see preview</p>
        ) : (
          <div className="max-w-[260px] w-full">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden">
              {/* Header */}
              {form.headerType === 'TEXT' && form.headerText && (
                <div className="px-3 pt-3 pb-1"><p className="text-sm font-bold text-gray-900">{form.headerText}</p></div>
              )}
              {form.headerType === 'IMAGE' && (
                <div className="h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {form.headerMediaUrl
                    ? <img src={form.headerMediaUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    : <Image className="w-8 h-8 text-gray-300" />}
                </div>
              )}
              {form.headerType === 'VIDEO' && (
                <div className="h-28 bg-gray-900 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white/60" />
                  {form.headerMediaUrl && <span className="text-xs text-white/40 ml-2">Video</span>}
                </div>
              )}
              {form.headerType === 'DOCUMENT' && (
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-blue-700 font-medium truncate">{form.headerMediaUrl ? form.headerMediaUrl.split('/').pop() : 'Document.pdf'}</span>
                </div>
              )}
              {form.headerType === 'LOCATION' && (
                <div className="h-24 bg-emerald-50 flex items-center justify-center gap-2 border-b border-emerald-100">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Location</span>
                </div>
              )}
              {body && <div className="px-3 py-2"><p className="text-sm text-gray-800 whitespace-pre-wrap">{body}</p></div>}
              {form.footerText && <div className="px-3 pb-2"><p className="text-xs text-gray-400">{form.footerText}</p></div>}
              <p className="text-right text-[10px] text-gray-400 px-3 pb-1">12:00 PM ✓✓</p>
            </div>
            {form.buttons.map((btn, i) => (
              <button key={i} className="mt-1 w-full bg-white rounded-lg py-2 text-sm font-semibold text-[#00a5f4] text-center shadow-sm">
                {btn.text || `Button ${i+1}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flow Picker ──────────────────────────────────────────────────────────────

function CreatePicker({
  onScratch, onEdit, onClose, existingTemplates,
}: {
  onScratch: () => void;
  onEdit: (tpl: any) => void;
  onClose: () => void;
  existingTemplates: any[];
}) {
  const [mode, setMode] = useState<'choose' | 'existing'>('choose');
  const getBody = (components: any[]) => components?.find((c: any) => c.type === 'BODY')?.text || '';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {mode === 'existing' && (
                <button onClick={() => setMode('choose')} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-bold text-gray-900">
                {mode === 'choose' ? 'Create Template' : 'Modify Existing Template'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Choose mode */}
          {mode === 'choose' && (
            <div className="p-5 space-y-3">
              <button onClick={onScratch}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-orange-700">Create from Scratch</p>
                    <p className="text-xs text-gray-500 mt-0.5">Build a brand new template</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setMode('existing')}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️📋</span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700">Modify Existing Template</p>
                    <p className="text-xs text-gray-500 mt-0.5">Edit and re-submit an already created template</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Existing templates list */}
          {mode === 'existing' && (
            <div className="p-5">
              {existingTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No templates created yet.</p>
                  <button onClick={onScratch} className="mt-3 text-sm text-orange-600 font-semibold underline">
                    Create your first template →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {existingTemplates.map(t => (
                    <button key={t.id || t.name} onClick={() => onEdit(t)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">{t.name}</span>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          t.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'}`}>
                          {t.status}
                        </span>
                      </div>
                      {getBody(t.components) && (
                        <p className="text-xs text-gray-400 line-clamp-2">{getBody(t.components)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Create Template Modal ────────────────────────────────────────────────────

function CreateTemplateModal({ isOpen, onClose, onSuccess, prefill }: {
  isOpen: boolean; onClose: () => void; onSuccess: (tpl: any) => void; prefill?: Partial<FormState> | null;
}) {
  const { post } = useApi();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<'beginner' | 'advanced'>('beginner');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleMediaUpload = async (file: File) => {
    setUploading(true);
    // Preview locally while uploading
    setField('headerMediaUrl', URL.createObjectURL(file));
    setField('headerMediaHandle', '');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await post('/api/automation/whatsapp/upload-media', formData);
      if (res.data?.handle) {
        setField('headerMediaHandle', res.data.handle);
        toast.success('Media uploaded to Meta');
      }
    } catch {
      toast.error('Upload failed — you can still enter a sample URL below');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm(prefill ? { ...EMPTY_FORM, ...prefill } : EMPTY_FORM);
      setErrors({});
      setEditorMode(prefill ? 'advanced' : 'beginner');
    }
  }, [isOpen, prefill]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const setBody = (text: string) => {
    const count = detectVarCount(text);
    setForm(f => ({ ...f, bodyText: text, examples: Array(count).fill('').map((_, i) => f.examples[i] ?? '') }));
  };

  // Button helpers
  const addBtn = (type: BtnType) => { if (form.buttons.length < 10) setField('buttons', [...form.buttons, newBtn(type)]); };
  const updBtn = (i: number, p: Partial<BtnEntry>) => setField('buttons', form.buttons.map((b, idx) => idx === i ? { ...b, ...p } : b));
  const delBtn = (i: number) => setField('buttons', form.buttons.filter((_, idx) => idx !== i));
  const hasQR = form.buttons.some(b => b.type === 'QUICK_REPLY');
  const hasCTA = form.buttons.some(b => b.type !== 'QUICK_REPLY');

  // Carousel card helpers
  const addCard = () => { if (form.carouselCards.length < 10) setField('carouselCards', [...form.carouselCards, { ...EMPTY_CARD }]); };
  const delCard = (i: number) => { if (form.carouselCards.length > 2) setField('carouselCards', form.carouselCards.filter((_, idx) => idx !== i)); };
  const updCard = (i: number, p: Partial<CarouselCard>) => setField('carouselCards', form.carouselCards.map((c, idx) => idx === i ? { ...c, ...p } : c));
  const addCardBtn = (ci: number, type: BtnType) => {
    const card = form.carouselCards[ci];
    if (card.buttons.length < 2) updCard(ci, { buttons: [...card.buttons, newBtn(type)] });
  };
  const updCardBtn = (ci: number, bi: number, p: Partial<BtnEntry>) => {
    const card = form.carouselCards[ci];
    updCard(ci, { buttons: card.buttons.map((b, idx) => idx === bi ? { ...b, ...p } : b) });
  };
  const delCardBtn = (ci: number, bi: number) => {
    const card = form.carouselCards[ci];
    updCard(ci, { buttons: card.buttons.filter((_, idx) => idx !== bi) });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    else if (!/^[a-z0-9_]+$/.test(form.name)) e.name = 'Only lowercase letters, numbers, underscores';
    if (!form.category) e.category = 'Select a category';
    if (form.templateType === 'standard' || form.templateType === 'lto') {
      if (!form.bodyText.trim()) e.body = 'Body text is required';
      form.examples.forEach((v, i) => { if (!v.trim()) e[`ex_${i}`] = `Required`; });
    }
    if (form.templateType === 'carousel') {
      if (form.carouselCards.length < 2) e.cards = 'Minimum 2 cards required';
      form.carouselCards.forEach((c, ci) => {
        if (!c.headerUrl.trim()) e[`card_img_${ci}`] = 'Image URL required';
        if (!c.body.trim()) e[`card_body_${ci}`] = 'Card body required';
      });
    }
    if (form.templateType === 'lto' && !form.ltoPromoExample.trim()) e.lto_code = 'Sample promo code required';
    form.buttons.forEach((b, i) => {
      if (!b.text.trim()) e[`btn_text_${i}`] = 'Required';
      if (b.type === 'URL' && !b.url.trim()) e[`btn_url_${i}`] = 'Required';
      if (b.type === 'PHONE_NUMBER' && !b.phone.trim()) e[`btn_ph_${i}`] = 'Required';
    });
    setErrors(e);
    if (Object.keys(e).length > 0) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await post('/api/automation/whatsapp/templates', {
        name: form.name,
        language: form.language,
        category: form.category,
        template_type: form.templateType,
        header_type: form.headerType,
        header_text: form.headerText,
        header_media_url: form.headerMediaUrl,
        header_media_handle: form.headerMediaHandle,
        body_text: form.bodyText,
        body_variables: form.examples,
        footer_text: form.footerText,
        buttons: form.buttons.map(b => ({ type: b.type, text: b.text, url: b.url, phone_number: b.phone, example: b.codeExample || undefined })),
        carousel_cards: form.carouselCards.map(c => ({
          header_format: c.headerFormat, header_url: c.headerUrl,
          body: c.body, buttons: c.buttons.map(b => ({ type: b.type, text: b.text, url: b.url, phone_number: b.phone })),
        })),
        lto_text: form.ltoText, lto_has_expiration: form.ltoHasExpiration, lto_promo_code_example: form.ltoPromoExample,
        auth_otp_type: form.authOtpType, auth_add_security_rec: form.authSecurityRec,
        auth_code_expiry_minutes: form.authExpiryMins, auth_android_package: form.authAndroidPkg, auth_signature_hash: form.authSigHash,
      });
      toast.success('Template submitted for approval — usually takes a few minutes to hours');
      onSuccess(res.data.template);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail) toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (err?: string) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${err ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
            onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative z-50 w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col my-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create WhatsApp Template</h2>
                <p className="text-xs text-gray-500 mt-0.5">Submit for Meta approval — approved within minutes to 24 hours</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Body — two columns */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              {/* LEFT: Form */}
              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">

                {/* Template type */}
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-sm font-semibold text-gray-700">Template Type</label>
                    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
                      <button type="button" onClick={() => setEditorMode('beginner')}
                        className={`rounded-md px-2.5 py-1 ${editorMode === 'beginner' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}>
                        Beginner
                      </button>
                      <button type="button" onClick={() => setEditorMode('advanced')}
                        className={`rounded-md px-2.5 py-1 ${editorMode === 'advanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                        Advanced
                      </button>
                    </div>
                  </div>
                  {editorMode === 'beginner' && (
                    <div className="mb-3 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-800">
                      Fill name, category, language and body. Advanced controls stay available, but AI draft is recommended for fastest setup.
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { v: 'standard', label: '📝 Standard' },
                      { v: 'carousel', label: '🎠 Carousel' },
                      { v: 'lto', label: '⏰ Limited Time Offer' },
                      { v: 'authentication', label: '🔐 Authentication' },
                    ] as const).map(({ v, label }) => (
                      <button key={v} onClick={() => setField('templateType', v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${form.templateType === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setField('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. diwali_offer_2025" className={inputCls(errors.name)} />
                  <p className="text-xs text-gray-400 mt-1">Lowercase, numbers, underscores only</p>
                  {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
                </div>

                {/* Category + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map(cat => (
                        <button key={cat} onClick={() => setField('category', cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${form.category === cat ? CAT_ACTIVE[cat] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {cat === 'MARKETING' ? '📣' : cat === 'UTILITY' ? '🔧' : '🔐'} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                    <select value={form.language} onChange={e => setField('language', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── AUTHENTICATION form ── */}
                {form.templateType === 'authentication' && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm font-semibold text-orange-800">🔐 Authentication Template</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">OTP Button Type</label>
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { v: 'COPY_CODE', label: 'Copy Code', desc: 'User copies OTP' },
                          { v: 'ONE_TAP', label: 'One-tap Autofill', desc: 'Auto-fills in your app' },
                          { v: 'ZERO_TAP', label: 'Zero-tap', desc: 'No button needed' },
                        ] as const).map(({ v, label, desc }) => (
                          <button key={v} onClick={() => setField('authOtpType', v)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition ${form.authOtpType === v ? 'border-orange-500 bg-orange-100' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            <p className="font-semibold">{label}</p>
                            <p className="text-gray-400">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form.authSecurityRec} onChange={e => setField('authSecurityRec', e.target.checked)} className="rounded" />
                      Add security recommendation ("Do not share this code")
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code expiry (minutes) <span className="text-gray-400 font-normal">— 0 = don't show</span></label>
                      <input type="number" min={0} max={60} value={form.authExpiryMins}
                        onChange={e => setField('authExpiryMins', parseInt(e.target.value) || 0)}
                        className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    {form.authOtpType === 'ONE_TAP' && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600">Android App Details (optional)</p>
                        <input value={form.authAndroidPkg} onChange={e => setField('authAndroidPkg', e.target.value)}
                          placeholder="Android package name (e.g. com.yourapp)" className={inputCls()} />
                        <input value={form.authSigHash} onChange={e => setField('authSigHash', e.target.value)}
                          placeholder="Signature hash" className={inputCls()} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── CAROUSEL form ── */}
                {form.templateType === 'carousel' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Intro Message <span className="text-gray-400 font-normal">(optional)</span></label>
                      <textarea value={form.bodyText} onChange={e => setBody(e.target.value.slice(0, 1024))}
                        rows={2} placeholder="Check out our latest collection!" className={`${inputCls()} resize-none`} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-700">Cards ({form.carouselCards.length}/10) <span className="text-red-500">*</span></label>
                        {form.carouselCards.length < 10 && (
                          <button onClick={addCard} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Add Card
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {form.carouselCards.map((card, ci) => (
                          <div key={ci} className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Card {ci + 1}</span>
                              {form.carouselCards.length > 2 && (
                                <button onClick={() => delCard(ci)} className="p-1 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                            <div className="flex gap-2 mb-1">
                              {(['IMAGE', 'VIDEO'] as const).map(f => (
                                <button key={f} onClick={() => updCard(ci, { headerFormat: f })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${card.headerFormat === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                                  {f === 'IMAGE' ? '🖼️' : '🎬'} {f}
                                </button>
                              ))}
                            </div>
                            <input value={card.headerUrl} onChange={e => updCard(ci, { headerUrl: e.target.value })}
                              placeholder={`${card.headerFormat === 'VIDEO' ? 'Video' : 'Image'} URL (sample for Meta approval)`}
                              className={inputCls(errors[`card_img_${ci}`])} />
                            {errors[`card_img_${ci}`] && <p className="text-xs text-red-500">{errors[`card_img_${ci}`]}</p>}
                            <textarea value={card.body} onChange={e => updCard(ci, { body: e.target.value.slice(0, 160) })}
                              rows={2} placeholder="Card body text" className={`${inputCls(errors[`card_body_${ci}`])} resize-none`} />
                            {card.buttons.length < 2 && (
                              <div className="flex gap-1.5 flex-wrap">
                                <button onClick={() => addCardBtn(ci, 'URL')} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1"><Plus className="w-3 h-3" /> URL</button>
                                <button onClick={() => addCardBtn(ci, 'QUICK_REPLY')} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1"><Plus className="w-3 h-3" /> Quick Reply</button>
                              </div>
                            )}
                            {card.buttons.map((btn, bi) => (
                              <div key={bi} className="flex gap-2 items-center">
                                <input value={btn.text} onChange={e => updCardBtn(ci, bi, { text: e.target.value })}
                                  placeholder="Button label" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                                {btn.type === 'URL' && (
                                  <input value={btn.url} onChange={e => updCardBtn(ci, bi, { url: e.target.value })}
                                    placeholder="https://" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                                )}
                                <button onClick={() => delCardBtn(ci, bi)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── LTO form ── */}
                {form.templateType === 'lto' && (
                  <div className="space-y-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-semibold text-amber-800">⏰ Limited Time Offer Template</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Header Image URL <span className="text-gray-400">(optional)</span></label>
                      <input value={form.headerMediaUrl} onChange={e => setField('headerMediaUrl', e.target.value)}
                        placeholder="https://example.com/offer-banner.jpg" className={inputCls()} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body <span className="text-red-500">*</span></label>
                      <textarea value={form.bodyText} onChange={e => setBody(e.target.value.slice(0, 1024))}
                        rows={3} placeholder="Get {{1}}% off this Diwali! Use code below before offer expires." className={`${inputCls(errors.body)} resize-none`} />
                      {errors.body && <p className="text-xs text-red-500 mt-0.5">{errors.body}</p>}
                    </div>
                    {form.examples.length > 0 && form.examples.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-1 rounded w-14 text-center flex-shrink-0">{`{{${idx+1}}}`}</span>
                        <input value={val} onChange={e => setField('examples', form.examples.map((x, i) => i === idx ? e.target.value : x))}
                          placeholder={`Example for {{${idx+1}}}`} className={inputCls(errors[`ex_${idx}`])} />
                      </div>
                    ))}
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer label text (max 16)</label>
                        <input value={form.ltoText} onChange={e => setField('ltoText', e.target.value.slice(0, 16))}
                          placeholder="Offer expires in" className={inputCls()} />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sample promo code <span className="text-red-500">*</span></label>
                        <input value={form.ltoPromoExample} onChange={e => setField('ltoPromoExample', e.target.value)}
                          placeholder="e.g. DIWALI20" className={inputCls(errors.lto_code)} />
                        {errors.lto_code && <p className="text-xs text-red-500 mt-0.5">{errors.lto_code}</p>}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form.ltoHasExpiration} onChange={e => setField('ltoHasExpiration', e.target.checked)} className="rounded" />
                      Show expiration countdown in message
                    </label>
                  </div>
                )}

                {/* ── STANDARD form ── */}
                {form.templateType === 'standard' && (
                  <div className="space-y-5">
                    {/* Header */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Header <span className="text-gray-400 font-normal">(optional)</span></label>
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {HEADER_TYPES.map(ht => (
                          <button key={ht} onClick={() => setField('headerType', ht)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${form.headerType === ht ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                            {ht === 'NONE' ? 'None' : ht === 'TEXT' ? '✏️ Text' : ht === 'IMAGE' ? '🖼️ Image' : ht === 'VIDEO' ? '🎬 Video' : ht === 'DOCUMENT' ? '📄 Document' : '📍 Location'}
                          </button>
                        ))}
                      </div>
                      {form.headerType === 'TEXT' && (
                        <>
                          <input value={form.headerText} onChange={e => setField('headerText', e.target.value.slice(0, 60))}
                            placeholder="Header text (max 60 chars)" className={inputCls()} />
                          <p className="text-xs text-gray-400 mt-1">{form.headerText.length}/60 — No variables allowed in header</p>
                        </>
                      )}
                      {(form.headerType === 'IMAGE' || form.headerType === 'VIDEO' || form.headerType === 'DOCUMENT') && (
                        <div className="space-y-3">
                          {/* Upload button */}
                          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition ${uploading ? 'border-orange-300 bg-orange-50' : form.headerMediaHandle ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/30'}`}>
                            <input type="file"
                              accept={form.headerType === 'IMAGE' ? 'image/*' : form.headerType === 'VIDEO' ? 'video/*' : '*'}
                              className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f); e.target.value = ''; }}
                              disabled={uploading}
                            />
                            {uploading ? (
                              <><span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                              <span className="text-sm text-orange-600">Uploading to Meta…</span></>
                            ) : form.headerMediaHandle ? (
                              <><span className="text-lg">✅</span>
                              <div><p className="text-sm font-semibold text-green-700">Uploaded to Meta</p>
                              <p className="text-xs text-green-600">Handle ready for approval</p></div></>
                            ) : (
                              <><span className="text-lg">{form.headerType === 'IMAGE' ? '🖼️' : form.headerType === 'VIDEO' ? '🎬' : '📄'}</span>
                              <div><p className="text-sm font-semibold text-gray-700">Click to upload {form.headerType.toLowerCase()}</p>
                              <p className="text-xs text-gray-400">Or enter URL below</p></div></>
                            )}
                          </label>
                          {/* URL fallback */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium">Or paste a sample URL</p>
                            <input value={form.headerMediaHandle ? '' : form.headerMediaUrl}
                              onChange={e => { setField('headerMediaUrl', e.target.value); setField('headerMediaHandle', ''); }}
                              placeholder={`https://example.com/sample.${form.headerType === 'IMAGE' ? 'jpg' : form.headerType === 'VIDEO' ? 'mp4' : 'pdf'}`}
                              disabled={!!form.headerMediaHandle}
                              className={`${inputCls()} disabled:bg-gray-50 disabled:text-gray-400`} />
                          </div>
                          <p className="text-xs text-gray-400">Actual media is sent at message time, not stored in the template</p>
                        </div>
                      )}
                      {form.headerType === 'LOCATION' && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                          <p className="text-sm font-semibold text-emerald-800">📍 Location Header</p>
                          <p className="text-xs text-emerald-700">Shows a "Send Location" pin button in the message. The actual coordinates (latitude, longitude, name, address) are sent at message time when using this template in automations or campaigns.</p>
                          <p className="text-xs text-gray-500 mt-1">No upload or URL needed for location header.</p>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Body <span className="text-red-500">*</span>
                        {detectVarCount(form.bodyText) > 0 && (
                          <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                            {detectVarCount(form.bodyText)} variable{detectVarCount(form.bodyText) > 1 ? 's' : ''}
                          </span>
                        )}
                      </label>
                      <textarea value={form.bodyText} onChange={e => setBody(e.target.value.slice(0, 1024))}
                        rows={4} placeholder="Hi {{1}}, your order #{{2}} is confirmed! 🎉"
                        className={`${inputCls(errors.body)} resize-none`} />
                      <p className="text-xs text-gray-400 mt-1">{form.bodyText.length}/1024 — Use <code className="bg-gray-100 px-1 rounded">{'{{1}}'}</code> for variables</p>
                      {errors.body && <p className="text-xs text-red-500 mt-0.5">{errors.body}</p>}
                    </div>

                    {/* Variable examples */}
                    {form.examples.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Variable Examples <span className="text-red-500">*</span>
                          <span className="ml-1 text-xs text-gray-400 font-normal">Required by Meta for approval</span>
                        </label>
                        <div className="space-y-2">
                          {form.examples.map((val, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded w-14 text-center flex-shrink-0">{`{{${idx+1}}}`}</span>
                              <input value={val}
                                onChange={e => setField('examples', form.examples.map((x, i) => i === idx ? e.target.value : x))}
                                placeholder={`Example for {{${idx+1}}}`}
                                className={inputCls(errors[`ex_${idx}`])} />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Meta uses these to review your template. Not sent to customers.</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Footer <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input value={form.footerText} onChange={e => setField('footerText', e.target.value.slice(0, 60))}
                        placeholder="e.g. Reply STOP to unsubscribe" className={inputCls()} />
                      <p className="text-xs text-gray-400 mt-1">{form.footerText.length}/60</p>
                    </div>

                    {/* Buttons */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Buttons <span className="text-gray-400 font-normal">(optional, max 10 quick reply or 3 CTA)</span></label>
                      {form.buttons.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {form.buttons.map((btn, i) => (
                            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <select value={btn.type} onChange={e => updBtn(i, { type: e.target.value as BtnType })}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                                  {!hasCTA && <option value="QUICK_REPLY">Quick Reply</option>}
                                  {!hasQR && <option value="URL">Visit Website</option>}
                                  {!hasQR && <option value="PHONE_NUMBER">Call Phone</option>}
                                  {!hasQR && <option value="COPY_CODE">Copy Code</option>}
                                </select>
                                <button onClick={() => delBtn(i)} className="p-1 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <input value={btn.text} onChange={e => updBtn(i, { text: e.target.value })}
                                placeholder="Button label (max 25 chars)" className={inputCls(errors[`btn_text_${i}`])} />
                              {btn.type === 'URL' && <input value={btn.url} onChange={e => updBtn(i, { url: e.target.value })} placeholder="https://" className={inputCls(errors[`btn_url_${i}`])} />}
                              {btn.type === 'PHONE_NUMBER' && <input value={btn.phone} onChange={e => updBtn(i, { phone: e.target.value })} placeholder="+91 98765 43210" className={inputCls(errors[`btn_ph_${i}`])} />}
                              {btn.type === 'COPY_CODE' && <input value={btn.codeExample} onChange={e => updBtn(i, { codeExample: e.target.value })} placeholder="Sample code (e.g. DIWALI20)" className={inputCls()} />}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5 flex-wrap">
                        {!hasCTA && form.buttons.length < 10 && (
                          <button onClick={() => addBtn('QUICK_REPLY')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                            <Plus className="w-3.5 h-3.5" /> Quick Reply
                          </button>
                        )}
                        {!hasQR && form.buttons.length < 3 && (
                          <>
                            <button onClick={() => addBtn('URL')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"><Plus className="w-3.5 h-3.5" /> Visit Website</button>
                            <button onClick={() => addBtn('PHONE_NUMBER')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"><Plus className="w-3.5 h-3.5" /> Call Phone</button>
                            <button onClick={() => addBtn('COPY_CODE')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"><Plus className="w-3.5 h-3.5" /> Copy Code</button>
                          </>
                        )}
                      </div>
                      {(hasQR || hasCTA) && (
                        <p className="text-xs text-amber-600 mt-1.5">⚠️ Quick Reply and CTA buttons cannot be mixed (Meta rule)</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Preview */}
              <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-100 p-6 bg-gray-50 overflow-y-auto">
                <WaPreview form={form} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
              <p className="text-xs text-gray-400">Templates go to Meta for review. Status visible on this page after submission.</p>
              <div className="flex gap-3 flex-shrink-0">
                <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="min-w-[160px] justify-center flex items-center gap-2">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : 'Submit for Approval'}
                </Button>
              </div>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Full Preview Modal ───────────────────────────────────────────────────────

function TemplatePreviewModal({ template, onClose }: { template: any; onClose: () => void }) {
  const getComp = (type: string) => template.components?.find((c: any) => c.type === type);
  const headerComp = getComp('HEADER');
  const bodyText = getComp('BODY')?.text || '';
  const footerText = getComp('FOOTER')?.text || '';
  const buttons = getComp('BUTTONS')?.buttons || [];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Modal header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-900">{template.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  template.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  template.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                }`}>{template.status}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_STYLE[template.category] || 'bg-gray-100 text-gray-600'}`}>{template.category}</span>
                <span className="text-[10px] text-gray-400">{template.language}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          {/* WA preview */}
          <div className="bg-[#e5ddd5] p-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1ccc0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
            <div className="max-w-[280px] mx-auto">
              {/* Message bubble */}
              <div className="bg-white rounded-xl rounded-tl-none shadow-md overflow-hidden">
                {/* Header */}
                {headerComp?.format === 'TEXT' && headerComp.text && (
                  <div className="px-3.5 pt-3 pb-1">
                    <p className="text-sm font-bold text-gray-900">{headerComp.text}</p>
                  </div>
                )}
                {headerComp?.format === 'IMAGE' && (
                  <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    {headerComp.example?.header_url?.[0]
                      ? <img src={headerComp.example.header_url[0]} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      : <div className="text-center text-gray-400"><Image className="w-10 h-10 mx-auto mb-1" /><p className="text-xs">Image Header</p></div>
                    }
                  </div>
                )}
                {headerComp?.format === 'VIDEO' && (
                  <div className="h-40 bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-white/60"><span className="text-3xl">🎬</span><p className="text-xs mt-1">Video Header</p></div>
                  </div>
                )}
                {headerComp?.format === 'DOCUMENT' && (
                  <div className="px-3.5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2.5">
                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700 font-medium truncate">Document</p>
                  </div>
                )}
                {headerComp?.format === 'LOCATION' && (
                  <div className="h-24 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center gap-2">
                    <MapPin className="w-6 h-6 text-emerald-600" /><p className="text-sm text-emerald-700 font-medium">Location</p>
                  </div>
                )}
                {/* Body */}
                {bodyText && (
                  <div className="px-3.5 py-2.5">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{bodyText}</p>
                  </div>
                )}
                {/* Footer */}
                {footerText && (
                  <div className="px-3.5 pb-2">
                    <p className="text-xs text-gray-400">{footerText}</p>
                  </div>
                )}
                <p className="text-right text-[10px] text-gray-300 px-3.5 pb-2">12:00 PM ✓✓</p>
              </div>
              {/* Buttons */}
              {buttons.map((b: any, i: number) => (
                <button key={i} className="mt-1.5 w-full bg-white rounded-xl py-2.5 text-sm font-semibold text-[#00a5f4] text-center shadow-sm">
                  {b.type === 'URL' ? '🔗 ' : b.type === 'PHONE_NUMBER' ? '📞 ' : ''}{b.text}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Deactivate Button ───────────────────────────────────────────────────────

function DeactivateButton({ template, onDone }: { template: any; onDone: () => void }) {
  const { del } = useApi() as any;
  const { deleteReq } = (useApi() as any);
  const { get, post } = useApi();
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    if (!template.id) { toast.error('Template ID not available'); return; }
    if (!confirm(`Delete template "${template.name}" from Meta? This cannot be undone.`)) return;
    setLoading(true);
    try {
      // Use DELETE via axios directly
      const axios = (await import('axios')).default;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
      await axios.delete(
        `${apiUrl}/api/automation/whatsapp/templates/${template.id}`,
        {
          params: { template_name: template.name },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      toast.success(`Template "${template.name}" deleted`);
      onDone();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Could not delete template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDeactivate} disabled={loading}
      className="text-xs font-semibold text-red-400 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 hover:text-red-600 transition whitespace-nowrap disabled:opacity-40">
      {loading ? '…' : 'Delete'}
    </button>
  );
}

// ─── Template Library Tab ─────────────────────────────────────────────────────

function TemplateLibraryTab({ onUse }: { onUse: (tpl: any) => void }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('ALL');
  const filtered = TEMPLATE_LIBRARY.filter(t =>
    (cat === 'ALL' || t.category === cat) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase())))
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${cat === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">{filtered.length} template{filtered.length !== 1 ? 's' : ''} found</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(tpl => (
          <div key={tpl.key} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col overflow-hidden">
            {/* Card header strip */}
            <div className={`px-4 pt-4 pb-3 border-b border-gray-100`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-900 leading-tight truncate">{tpl.name}</p>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${CAT_STYLE[tpl.category]}`}>
                  {tpl.category.charAt(0) + tpl.category.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
            {/* Body */}
            <div className="px-4 py-3 flex-1">
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{tpl.body}</p>
            </div>
            {/* Buttons preview */}
            {tpl.buttons.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {tpl.buttons.map((b: any, i: number) => (
                  <span key={i} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-1 rounded-full font-medium">{b.text || b.type}</span>
                ))}
              </div>
            )}
            {/* CTA */}
            <div className="px-4 pb-4">
              <button onClick={() => onUse(tpl)}
                className="w-full py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition">
                Use Template →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Parse existing template into form state ──────────────────────────────────

function parseTemplateToForm(t: any): Partial<FormState> {
  const comps = t.components || [];
  const headerComp = comps.find((c: any) => c.type === 'HEADER');
  const bodyComp = comps.find((c: any) => c.type === 'BODY');
  const footerComp = comps.find((c: any) => c.type === 'FOOTER');
  const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');
  const bodyText = bodyComp?.text || '';
  const varCount = detectVarCount(bodyText);
  let headerType: HeaderType = 'NONE';
  let headerText = '';
  let headerMediaUrl = '';
  if (headerComp) {
    headerType = (headerComp.format || 'NONE') as HeaderType;
    if (headerComp.format === 'TEXT') headerText = headerComp.text || '';
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format || ''))
      headerMediaUrl = headerComp.example?.header_url?.[0] || '';
  }
  const buttons = (buttonsComp?.buttons || []).map((b: any) => ({
    type: (b.type || 'QUICK_REPLY') as BtnType,
    text: b.text || '', url: b.url || '',
    phone: b.phone_number || '', codeExample: b.example?.[0] || '',
  }));
  return {
    name: t.name || '', category: t.category || 'MARKETING',
    language: t.language || 'en_US',
    headerType, headerText, headerMediaUrl,
    bodyText, examples: Array(varCount).fill(''),
    footerText: footerComp?.text || '', buttons,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { get, post } = useApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [activeTab, setActiveTab] = useState<'mine' | 'library'>('mine');
  const [rejectionModal, setRejectionModal] = useState<any | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<FormState> | null>(null);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiCategory, setAiCategory] = useState('MARKETING');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiLang, setAiLang] = useState('en_US');
  const [aiMediaFile, setAiMediaFile] = useState<File | null>(null);
  const [aiMediaHandle, setAiMediaHandle] = useState('');
  const [aiMediaUploading, setAiMediaUploading] = useState(false);
  const [aiMediaPreview, setAiMediaPreview] = useState('');
  const [previewTpl, setPreviewTpl] = useState<any>(null);

  const loadTemplates = () => {
    setLoading(true);
    get('/api/automation/whatsapp/templates')
      .then(r => {
        setTemplates(r.data?.templates || []);
        setError(r.data?.error || r.data?.message || '');
      })
      .catch(() => setError('Could not load templates. Check your WhatsApp connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, []); // eslint-disable-line

  const handleTemplateCreated = (tpl: any) => {
    setTemplates(prev => [{ ...tpl, components: [] }, ...prev]);
    setActiveTab('mine');
    setStatusFilter('ALL');
  };

  const openCreate = (pf?: Partial<FormState>) => {
    setShowPicker(false);
    setPrefill(pf || null);
    setModalOpen(true);
  };

  const useLibraryTemplate = (tpl: any) => {
    const varCount = detectVarCount(tpl.body);
    openCreate({
      category: tpl.category, bodyText: tpl.body,
      examples: Array(varCount).fill(''),
      buttons: (tpl.buttons || []).map((b: any) => ({ type: b.type, text: b.text || '', url: b.url || '', phone: '', codeExample: '' })),
    });
  };

  const editTemplate = (t: any) => { openCreate(parseTemplateToForm(t)); };

  const [hoveredTpl, setHoveredTpl] = useState<any>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRowEnter = (e: React.MouseEvent, t: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverPos({ x: rect.right + 12, y: rect.top + rect.height / 2 });
    hoverTimerRef.current = setTimeout(() => setHoveredTpl(t), 300);
  };
  const onRowLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredTpl(null);
  };

  const filtered = statusFilter === 'ALL' ? templates : templates.filter(t => t.status === statusFilter);
  const getBody = (components: any[]) => components?.find((c: any) => c.type === 'BODY')?.text || '';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage message templates for your WhatsApp Business account</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAiDraft(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
            ✨ Generate Template with AI
          </button>
          <Button variant="secondary" onClick={() => setShowPicker(true)} className="flex items-center gap-2 flex-shrink-0">
            <Plus className="h-4 w-4" /> Create Manually
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-sm font-bold text-orange-950">Recommended path: AI draft -&gt; preview -&gt; submit to Meta</p>
        <p className="mt-1 text-xs text-orange-700">Advanced options like carousel, auth OTP, LTO, media headers, and library templates are still available in manual mode.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('mine')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          My Templates {templates.length > 0 && <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{templates.length}</span>}
        </button>
        <button onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'library' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Template Library <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{TEMPLATE_LIBRARY.length}</span>
        </button>
      </div>

      {/* Library tab */}
      {activeTab === 'library' && <TemplateLibraryTab onUse={useLibraryTemplate} />}

      {/* My Templates tab */}
      {activeTab === 'mine' && (
        <>
          {/* Stats */}
          {!loading && templates.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map(s => {
                const count = s === 'ALL' ? templates.length : templates.filter(t => t.status === s).length;
                const isActive = statusFilter === s;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      isActive
                        ? s === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600'
                          : s === 'PENDING' ? 'bg-amber-500 text-white border-amber-500'
                          : s === 'REJECTED' ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Could not load templates</p>
              <p>{error}</p>
              <p className="mt-2">Make sure you connected WhatsApp with a valid Business Account ID in <a href="/dashboard/integrations" className="font-semibold underline">Integrations</a>.</p>
            </div>
          )}

          {/* Template list — horizontal strips */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
              <MessageSquare className="h-10 w-10 text-gray-300" />
              <p className="text-lg font-semibold text-gray-500">No templates yet</p>
              <p className="text-sm text-gray-400">Create your first template and submit for Meta approval.</p>
              <Button onClick={() => setShowPicker(true)} className="mt-2 flex items-center gap-2"><Plus className="h-4 w-4" /> Create Template</Button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* List header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-white text-xs font-semibold uppercase tracking-wide rounded-t-2xl"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
                <div className="col-span-1">Sr</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1">Lang</div>
                <div className="col-span-2">Body Preview</div>
                <div className="col-span-2">Actions</div>
              </div>
              {filtered.map((t, idx) => (
                <div key={t.id || t.name}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition cursor-default ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>

                  {/* Sr. No. */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {STATUS_ICONS[t.status]}{t.status}
                    </span>
                    {t.status === 'REJECTED' && (
                      <button
                        onClick={() => setRejectionModal(t)}
                        className="mt-1 flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 hover:bg-red-100 transition">
                        ⚠️ Why rejected?
                      </button>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_STYLE[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-gray-400">{t.language}</span>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{getBody(t.components) || '—'}</p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => setPreviewTpl(t)}
                      onMouseEnter={e => onRowEnter(e, t)}
                      onMouseLeave={onRowLeave}
                      className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-100 hover:text-gray-800 transition whitespace-nowrap">
                      Preview
                    </button>
                    {t.status === 'REJECTED' ? (
                      <button onClick={() => editTemplate(t)}
                        className="text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition whitespace-nowrap">
                        Fix &amp; Resubmit
                      </button>
                    ) : (
                      <button onClick={() => editTemplate(t)}
                        className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-50 transition whitespace-nowrap">
                        Edit
                      </button>
                    )}
                    <DeactivateButton template={t} onDone={loadTemplates} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showPicker && (
        <CreatePicker
          onScratch={() => openCreate()}
          onEdit={t => openCreate(parseTemplateToForm(t))}
          onClose={() => setShowPicker(false)}
          existingTemplates={templates}
        />
      )}
      <CreateTemplateModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setPrefill(null); }} onSuccess={handleTemplateCreated} prefill={prefill} />
      {previewTpl && <TemplatePreviewModal template={previewTpl} onClose={() => setPreviewTpl(null)} />}

      {/* ── Rejection Reason Modal ────────────────────────────────────────── */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setRejectionModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-bold flex-shrink-0">✕</div>
                <div>
                  <p className="font-bold text-red-900 text-sm">Template Rejected by Meta</p>
                  <p className="text-[11px] text-red-600 font-mono mt-0.5">{rejectionModal.name}</p>
                </div>
              </div>
              <button onClick={() => setRejectionModal(null)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">

              {/* Rejection Reason */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Meta reason</p>
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-800 leading-relaxed">
                    {rejectionModal.rejected_reason || 'Meta did not provide a specific reason. Common causes include misleading content, restricted category, or variable format issues.'}
                  </p>
                </div>
              </div>

              {/* Quality Score */}
              {rejectionModal.quality_score && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Quality Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-red-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, parseFloat(rejectionModal.quality_score) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-red-600">{rejectionModal.quality_score}</span>
                  </div>
                </div>
              )}

              {/* Common fix tips */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Common fixes</p>
                <ul className="space-y-1.5">
                  {[
                    'Use the correct variable format — {{1}} with digits only',
                    'Guaranteed returns ya misleading claims mat write',
                    'A sample URL is required for image or video headers',
                    'Keep button text within 25 characters',
                    'Choose the correct category — MARKETING vs UTILITY',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setRejectionModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Close
              </button>
              <button
                onClick={() => {
                  editTemplate(rejectionModal);
                  setRejectionModal(null);
                }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                ✏️ Edit &amp; Resubmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed-position hover preview — renders outside table, no overlap issues */}
      {hoveredTpl && (() => {
        const t = hoveredTpl;
        const previewW = 240;
        const x = Math.min(hoverPos.x + 8, window.innerWidth - previewW - 16);
        const y = Math.max(8, Math.min(hoverPos.y - 60, window.innerHeight - 280));
        return (
          <div className="fixed z-[9999] pointer-events-none" style={{ left: x, top: y, width: previewW }}>
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-2.5 max-h-72 overflow-hidden">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Preview</p>
              <div className="bg-[#e5ddd5] rounded-lg p-2">
                <div className="bg-white rounded-md rounded-tl-none shadow-sm overflow-hidden">
                  {t.components?.find((c: any) => c.type === 'HEADER')?.format === 'TEXT' && (
                    <p className="px-2 pt-1.5 pb-0.5 text-[11px] font-bold text-gray-900 truncate">{t.components.find((c: any) => c.type === 'HEADER').text}</p>
                  )}
                  {t.components?.find((c: any) => c.type === 'HEADER')?.format === 'IMAGE' && (
                    <div className="h-10 bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">🖼️ Image</div>
                  )}
                  {t.components?.find((c: any) => c.type === 'HEADER')?.format === 'VIDEO' && (
                    <div className="h-10 bg-gray-900 flex items-center justify-center text-[10px] text-white">🎬 Video</div>
                  )}
                  {t.components?.find((c: any) => c.type === 'HEADER')?.format === 'DOCUMENT' && (
                    <div className="h-7 bg-blue-50 flex items-center gap-1.5 px-2 text-[10px] text-blue-600">📄 Doc</div>
                  )}
                  {getBody(t.components) && (
                    <p className="px-2 py-1.5 text-[10px] text-gray-800 line-clamp-3 leading-relaxed">{getBody(t.components)}</p>
                  )}
                  {t.components?.find((c: any) => c.type === 'FOOTER')?.text && (
                    <p className="px-2 pb-1 text-[9px] text-gray-400 truncate">{t.components.find((c: any) => c.type === 'FOOTER').text}</p>
                  )}
                  <p className="text-right text-[8px] text-gray-300 px-2 pb-1">12:00 ✓✓</p>
                </div>
                {t.components?.find((c: any) => c.type === 'BUTTONS')?.buttons?.slice(0, 2).map((b: any, bi: number) => (
                  <div key={bi} className="mt-0.5 bg-white rounded-md py-0.5 text-[9px] font-semibold text-[#00a5f4] text-center">{b.text}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── AI Template Generator Modal ────────────────────────────────────── */}
      {showAiDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => { if (!aiGenerating) setShowAiDraft(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold">✨</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">AI Template Generator</p>
                  <p className="text-[10px] text-gray-400">Describe → AI generates → Meta pe submit</p>
                </div>
              </div>
              <button onClick={() => setShowAiDraft(false)} disabled={aiGenerating}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40">✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Describe the template use case *</label>
                <textarea
                  value={aiDesc}
                  onChange={e => setAiDesc(e.target.value)}
                  rows={3}
                  disabled={aiGenerating}
                  placeholder="Example: Diwali sale — 30% off, valid until Oct 31. Add an image header and a Shop Now button."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none disabled:bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Tips: "image header", "video header", "carousel 3 products", "OTP template", "offer expires" write → AI can choose the right template type
                </p>
              </div>

              {/* Category + Language row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select value={aiCategory} onChange={e => setAiCategory(e.target.value)}
                    disabled={aiGenerating}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-50">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication (OTP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
                  <select value={aiLang} onChange={e => setAiLang(e.target.value)}
                    disabled={aiGenerating}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-50">
                    <option value="en_US">English</option>
                    <option value="hi">Hindi</option>
                    <option value="gu">Gujarati</option>
                    <option value="mr">Marathi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="bn">Bengali</option>
                  </select>
                </div>
              </div>

              {/* Optional image/video upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Image / Video (optional)
                  <span className="ml-1 font-normal text-gray-400">— if this template needs header media</span>
                </label>
                {aiMediaPreview ? (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                    {aiMediaPreview.startsWith('data:video') || aiMediaFile?.type.startsWith('video') ? (
                      <div className="w-12 h-12 rounded bg-gray-800 flex items-center justify-center text-white text-xl">▶</div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={aiMediaPreview} alt="preview" className="w-12 h-12 rounded object-cover border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{aiMediaFile?.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {aiMediaHandle ? '✓ Meta pe uploaded' : aiMediaUploading ? 'Uploading...' : 'Ready to upload'}
                      </p>
                    </div>
                    <button onClick={() => { setAiMediaFile(null); setAiMediaPreview(''); setAiMediaHandle(''); }}
                      className="text-gray-400 hover:text-red-500 transition p-1">✕</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition cursor-pointer">
                    <span>📎</span>
                    <span>Upload image / video / document</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
                      disabled={aiGenerating}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAiMediaFile(file);
                        setAiMediaPreview(URL.createObjectURL(file));
                        setAiMediaUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          const r = await post('/api/automation/whatsapp/upload-media', fd);
                          if (r.data?.handle) {
                            setAiMediaHandle(r.data.handle);
                            toast.success('Media uploaded to Meta ✓');
                          }
                        } catch { toast.error('Media upload failed — you can still generate without it'); }
                        finally { setAiMediaUploading(false); }
                        e.target.value = '';
                      }} />
                  </label>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setShowAiDraft(false)} disabled={aiGenerating}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Cancel
              </button>
              <button
                disabled={aiGenerating || aiDesc.trim().length < 5 || aiMediaUploading}
                onClick={async () => {
                  setAiGenerating(true);
                  try {
                    const r = await post('/api/automation/whatsapp/templates/generate', {
                      description: aiDesc,
                      category: aiCategory,
                      language: aiLang,
                      auto_submit: false,
                      header_media_handle: aiMediaHandle,
                    });
                    const draft = r.data?.template_draft;
                    if (draft) {
                      setPrefill({
                        name: draft.name || '',
                        category: draft.category || aiCategory,
                        language: draft.language || aiLang,
                        headerType: draft.header_type || 'NONE',
                        headerText: draft.header_text || '',
                        headerMediaHandle: aiMediaHandle || draft.header_media_handle || '',
                        bodyText: draft.body_text || '',
                        examples: draft.body_variables || [],
                        footerText: draft.footer_text || '',
                        buttons: draft.buttons || [],
                        templateType: draft.template_type || 'standard',
                        carouselCards: draft.carousel_cards || [],
                      } as any);
                      setShowAiDraft(false);
                      setShowPicker(false);
                      setModalOpen(true);
                      toast.success('AI draft ready — Review it and submit!');
                    }
                  } catch { toast.error('AI generation failed. Try again.'); }
                  finally { setAiGenerating(false); }
                }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40 transition"
                style={{ background: 'linear-gradient(135deg, #ea580c, #d97706)' }}>
                {aiGenerating
                  ? <><span className="animate-spin inline-block">⏳</span> Generating...</>
                  : <><span>✨</span> Generate Draft</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
