'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, ChevronDown, Clock,
  Copy, Layers, Loader2, Plus, Save, Trash2, X,
  Type, AlignLeft, Circle, CheckSquare, Calendar, ToggleLeft,
  Smartphone, Eye, ArrowRight, Settings2, GitBranch, Sparkles, Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';

function apiErrorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) {
    const first = Array.isArray(detail.errors) && detail.errors.length ? detail.errors[0] : null;
    const firstMessage = typeof first === 'string' ? first : first?.message || first?.error || '';
    return firstMessage ? `${detail.message} ${firstMessage}` : detail.message;
  }
  return fallback;
}

//  Types 

interface WaFlow { id: string; name: string; status: string; categories?: string[] }

type ComponentType =
  | 'TextHeading' | 'TextBody' | 'TextCaption'
  | 'TextInput' | 'TextArea' | 'Dropdown'
  | 'RadioButtonsGroup' | 'CheckboxGroup'
  | 'DatePicker' | 'OptIn' | 'Footer' | 'Condition';

interface FlowComponent {
  _id: string; // internal UI id
  type: ComponentType;
  // Condition fields
  conditionField?: string;   // which input field to check (name of another component)
  conditionValue?: string;   // value to compare against
  trueScreen?: string;       // screen ID to go to when condition is true
  falseScreen?: string;      // screen ID to go to when condition is false
  text?: string;          // TextHeading / TextBody / TextCaption / OptIn label
  name?: string;          // input field name (for form inputs)
  label?: string;         // input label
  'input-type'?: string;  // text/email/number/phone/password
  required?: boolean;
  'helper-text'?: string;
  options?: { id: string; title: string }[]; // Dropdown/Radio/Checkbox
  'min_selected_items'?: number;
  'max_selected_items'?: number;
  // Footer
  buttonLabel?: string;   // Footer button text
  nextScreen?: string;    // screen to navigate to
  isComplete?: boolean;   // complete action (last screen)
}

interface FlowScreen {
  _id: string;
  id: string;           // screen ID used in routing
  title: string;
  terminal?: boolean;
  components: FlowComponent[];
}

//  Constants 

const CATEGORIES = [
  { value: 'LEAD_GENERATION', label: 'Lead Generation' },
  { value: 'APPOINTMENT_BOOKING', label: 'Appointment Booking' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'SURVEY', label: 'Survey / Feedback' },
  { value: 'OTHER', label: 'Other' },
];

const COMPONENT_PALETTE: { type: ComponentType; label: string; icon: React.ReactNode; group: string }[] = [
  { type: 'TextHeading',       label: 'Heading',       icon: <Type className="w-4 h-4" />,         group: 'Text' },
  { type: 'TextBody',          label: 'Body Text',     icon: <AlignLeft className="w-4 h-4" />,    group: 'Text' },
  { type: 'TextCaption',       label: 'Caption',       icon: <AlignLeft className="w-3 h-3" />,    group: 'Text' },
  { type: 'TextInput',         label: 'Text Input',    icon: <Type className="w-4 h-4" />,         group: 'Input' },
  { type: 'TextArea',          label: 'Text Area',     icon: <AlignLeft className="w-4 h-4" />,    group: 'Input' },
  { type: 'Dropdown',          label: 'Dropdown',      icon: <ChevronDown className="w-4 h-4" />,  group: 'Input' },
  { type: 'RadioButtonsGroup', label: 'Radio',         icon: <Circle className="w-4 h-4" />,       group: 'Input' },
  { type: 'CheckboxGroup',     label: 'Checkboxes',    icon: <CheckSquare className="w-4 h-4" />,  group: 'Input' },
  { type: 'DatePicker',        label: 'Date Picker',   icon: <Calendar className="w-4 h-4" />,     group: 'Input' },
  { type: 'OptIn',             label: 'Opt-In',        icon: <ToggleLeft className="w-4 h-4" />,   group: 'Input' },
  { type: 'Footer',            label: 'Button/Footer', icon: <ArrowRight className="w-4 h-4" />,   group: 'Navigation' },
  { type: 'Condition',         label: 'If / Condition',icon: <GitBranch className="w-4 h-4" />,   group: 'Logic' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultComponent = (type: ComponentType): FlowComponent => {
  const base: FlowComponent = { _id: uid(), type };
  switch (type) {
    case 'TextHeading':       return { ...base, text: 'Heading text' };
    case 'TextBody':          return { ...base, text: 'Your body text here.' };
    case 'TextCaption':       return { ...base, text: 'Caption text' };
    case 'TextInput':         return { ...base, name: 'field_' + uid(), label: 'Label', 'input-type': 'text', required: true };
    case 'TextArea':          return { ...base, name: 'field_' + uid(), label: 'Label', required: false };
    case 'Dropdown':          return { ...base, name: 'field_' + uid(), label: 'Select an option', required: true, options: [{ id: '1', title: 'Option 1' }, { id: '2', title: 'Option 2' }] };
    case 'RadioButtonsGroup': return { ...base, name: 'field_' + uid(), label: 'Choose one', required: true, options: [{ id: '1', title: 'Option 1' }, { id: '2', title: 'Option 2' }] };
    case 'CheckboxGroup':     return { ...base, name: 'field_' + uid(), label: 'Select all that apply', required: true, options: [{ id: '1', title: 'Option 1' }, { id: '2', title: 'Option 2' }] };
    case 'DatePicker':        return { ...base, name: 'field_' + uid(), label: 'Select date', required: true };
    case 'OptIn':             return { ...base, name: 'opt_' + uid(), text: 'I agree to the terms' };
    case 'Footer':            return { ...base, buttonLabel: 'Continue', isComplete: false };
    case 'Condition':         return { ...base, conditionField: '', conditionValue: '', trueScreen: '', falseScreen: '' };
    default:                  return base;
  }
};

//  AI Generate Modal 

const FLOW_CATEGORIES = [
  { value: 'LEAD_GENERATION', label: 'Lead Generation' },
  { value: 'APPOINTMENT_BOOKING', label: 'Appointment Booking' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'SURVEY', label: 'Survey / Feedback' },
  { value: 'OTHER', label: 'Other' },
];

const EXAMPLE_PROMPTS = [
  'Lead form for coaching center  naam, phone, class (9th/10th/11th-12th), subject',
  'Appointment booking for clinic  patient name, phone, date, doctor choice',
  'Real estate inquiry  name, phone, budget, BHK type, preferred location',
  'Feedback form  rating (1-5), what they liked, suggestions, email',
  'Job application  name, phone, role applied for, experience years, city',
];

const INDIA_FLOW_PRESETS = [
  { label: 'Coaching', name: 'Coaching Lead Form', category: 'LEAD_GENERATION', prompt: 'Coaching center lead form - student name, parent phone, class 9th/10th/11th/12th, subject choice, preferred demo date.' },
  { label: 'Real Estate', name: 'Real Estate Inquiry', category: 'LEAD_GENERATION', prompt: 'Real estate inquiry form - name, phone, budget, BHK type, preferred location, buying timeline.' },
  { label: 'Clinic', name: 'Clinic Appointment', category: 'APPOINTMENT_BOOKING', prompt: 'Clinic appointment booking - patient name, phone, doctor/speciality, preferred date, symptoms.' },
  { label: 'D2C Store', name: 'Product Order Form', category: 'LEAD_GENERATION', prompt: 'D2C product order form - customer name, phone, product interest, quantity, city, delivery address.' },
  { label: 'Education', name: 'Admission Enquiry', category: 'LEAD_GENERATION', prompt: 'School admission enquiry - parent name, phone, student age, class applying for, location, callback preference.' },
];

function AiGenerateModal({
  isOpen,
  onClose,
  onGenerated,
  post,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (screens: FlowScreen[]) => void;
  post: (url: string, data: unknown) => Promise<{ data: unknown }>;
}) {
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('LEAD_GENERATION');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!desc.trim()) { toast.error('Describe the form you need'); return; }
    setLoading(true);
    try {
      const r = await post('/api/automation/whatsapp/flows/generate-ai', { description: desc.trim(), category });
      const raw = (r.data as { screens?: unknown }).screens;
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty response');
      // Convert raw AI output to FlowScreen[] with _id fields
      const screens: FlowScreen[] = (raw as unknown[]).map((s: unknown) => {
        const screen = s as Record<string, unknown>;
        const comps = ((screen.components as unknown[]) || []).map((c: unknown) => {
          const comp = c as Record<string, unknown>;
          const fc: FlowComponent = { _id: uid(), type: (comp.type as ComponentType) || 'TextBody' };
          if (comp.text) fc.text = comp.text as string;
          if (comp.name) fc.name = comp.name as string;
          if (comp.label) fc.label = comp.label as string;
          if (comp['input-type']) fc['input-type'] = comp['input-type'] as string;
          if (comp.required !== undefined) fc.required = comp.required as boolean;
          if (comp['helper-text']) fc['helper-text'] = comp['helper-text'] as string;
          if (Array.isArray(comp.options)) fc.options = comp.options as { id: string; title: string }[];
          if (comp.buttonLabel) fc.buttonLabel = comp.buttonLabel as string;
          if (comp.nextScreen) fc.nextScreen = comp.nextScreen as string;
          if (comp.isComplete !== undefined) fc.isComplete = comp.isComplete as boolean;
          return fc;
        });
        return {
          _id: uid(),
          id: (screen.id as string) || `SCREEN_${uid()}`,
          title: (screen.title as string) || (screen.id as string) || 'Screen',
          terminal: !!screen.terminal,
          components: comps,
        };
      });
      onGenerated(screens);
      toast.success(` ${screens.length} screen(s) generated! You can edit it now.`);
      onClose();
      setDesc('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (e as Error)?.message || 'Generation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">B9 Agentic Core  Form Generator</p>
              <p className="text-[10px] text-gray-400">Describe it, and AI will create a valid Meta Flow</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Describe the form use case *</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Example: Lead capture form for coaching - student name, phone, class (9th/10th), subject choice (Math/Science/English)"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              disabled={loading}
            />
            <p className="text-[10px] text-gray-400 mt-1">More detail creates a better form.</p>
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Examples (click to use):</p>
            <div className="space-y-1">
              {EXAMPLE_PROMPTS.slice(0, 3).map((ex, i) => (
                <button key={i} onClick={() => setDesc(ex)}
                  className="w-full text-left text-[10px] text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-1.5 transition truncate border border-violet-100">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              disabled={loading}
            >
              {FLOW_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancel
          </button>
          <Button onClick={generate} disabled={loading || !desc.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-sm">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Form</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

//  Flow JSON Builder 

function buildFlowJson(screens: FlowScreen[]): object {
  const routing: Record<string, string[]> = {};
  const builtScreens = screens.map((s, idx) => {
    const footer = s.components.find(c => c.type === 'Footer');
    const next = footer?.nextScreen;
    routing[s.id] = next ? [next] : [];

    const formInputTypes: ComponentType[] = ['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'];
    const conditionNodes = s.components.filter(c => c.type === 'Condition');
    const formChildren = s.components.filter(c => formInputTypes.includes(c.type));
    const textChildren = s.components.filter(c => !formInputTypes.includes(c.type) && c.type !== 'Footer' && c.type !== 'Condition');

    // Build routing additions from condition nodes
    conditionNodes.forEach(cond => {
      if (cond.trueScreen) routing[s.id] = [...(routing[s.id] || []), cond.trueScreen].filter((v, i, a) => a.indexOf(v) === i);
      if (cond.falseScreen) routing[s.id] = [...(routing[s.id] || []), cond.falseScreen].filter((v, i, a) => a.indexOf(v) === i);
    });

    const buildComp = (c: FlowComponent): object => {
      // For Dropdown/Radio with a matching Condition node, add per-option on-select-action
      // Meta Flow v7.0: routing is per data-source option, not a field-level ternary
      const cond = conditionNodes.find(cn => cn.conditionField === c.name);
      const buildOptionsWithRouting = (opts: { id: string; title: string }[], fieldCond: typeof cond) => {
        if (!fieldCond) return opts.map(o => ({ id: o.id, title: o.title }));
        return opts.map(o => {
          const targetScreen = o.id === fieldCond.conditionValue ? fieldCond.trueScreen : fieldCond.falseScreen;
          if (targetScreen) {
            return {
              id: o.id,
              title: o.title,
              'on-select-action': {
                name: 'navigate',
                next: { type: 'screen', name: targetScreen },
                payload: {},
              },
            };
          }
          return { id: o.id, title: o.title };
        });
      };

      switch (c.type) {
        case 'TextHeading': return { type: 'TextHeading', text: c.text || '' };
        case 'TextBody':    return { type: 'TextBody', text: c.text || '', markdown: true };
        case 'TextCaption': return { type: 'TextCaption', text: c.text || '' };
        case 'TextInput':   return { type: 'TextInput', name: c.name, label: c.label, 'input-type': c['input-type'] || 'text', required: c.required ?? true, ...(c['helper-text'] ? { 'helper-text': c['helper-text'] } : {}) };
        case 'TextArea':    return { type: 'TextArea', name: c.name, label: c.label, required: c.required ?? false };
        case 'Dropdown':    return { type: 'Dropdown', name: c.name, label: c.label, required: c.required ?? true, 'data-source': buildOptionsWithRouting(c.options || [], cond) };
        case 'RadioButtonsGroup': return { type: 'RadioButtonsGroup', name: c.name, label: c.label, required: c.required ?? true, 'data-source': buildOptionsWithRouting(c.options || [], cond) };
        case 'CheckboxGroup': return { type: 'CheckboxGroup', name: c.name, label: c.label, required: c.required ?? true, 'data-source': (c.options || []).map(o => ({ id: o.id, title: o.title })), ...(c['min_selected_items'] ? { min_selected_items: c['min_selected_items'] } : {}), ...(c['max_selected_items'] ? { max_selected_items: c['max_selected_items'] } : {}) };
        case 'DatePicker':  return { type: 'DatePicker', name: c.name, label: c.label, required: c.required ?? true };
        case 'OptIn':       return { type: 'OptIn', name: c.name, label: c.text || 'I agree', required: true };
        default:            return { type: c.type };
      }
    };

    const buildFooter = (c: FlowComponent): object => {
      const payload: Record<string, string> = {};
      formChildren.forEach(fc => { if (fc.name) payload[fc.name] = `\${form.flow_form.${fc.name}}`; });
      return {
        type: 'Footer',
        label: c.buttonLabel || 'Continue',
        'on-click-action': c.isComplete
          ? { name: 'complete', payload }
          : {
              name: 'navigate',
              next: { type: 'screen', name: c.nextScreen || screens[idx + 1]?.id || 'END' },
              payload,
            },
      };
    };

    const allFormChildren = formChildren.map(buildComp);
    const hasForm = allFormChildren.length > 0;
    const footerComp = footer ? buildFooter(footer) : null;

    const layoutChildren: object[] = [
      ...textChildren.map(buildComp),
      ...(hasForm ? [{ type: 'Form', name: 'flow_form', children: [...allFormChildren, ...(footerComp ? [footerComp] : [])] }] : []),
      ...(!hasForm && footerComp ? [footerComp] : []),
    ];

    return {
      id: s.id,
      title: s.title || undefined,
      terminal: s.terminal || idx === screens.length - 1,
      layout: { type: 'SingleColumnLayout', children: layoutChildren },
    };
  });

  // Clean routing_model: remove references to non-existent screen IDs
  const validIds = new Set(builtScreens.map(s => s.id));
  const cleanRouting: Record<string, string[]> = {};
  builtScreens.forEach(s => {
    cleanRouting[s.id] = (routing[s.id] || []).filter(id => validIds.has(id));
  });

  return { version: '7.0', routing_model: cleanRouting, screens: builtScreens };
}

//  WhatsApp Phone Preview 

function PhonePreview({ screen }: { screen: FlowScreen }) {
  return (
    <div className="relative mx-auto w-[220px]">
      <div className="rounded-[28px] border-4 border-gray-800 bg-white shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Smartphone className="w-3 h-3 text-white" />
          </div>
          <span className="text-white text-[10px] font-medium truncate flex-1">{screen.title || 'Form'}</span>
        </div>
        {/* Content */}
        <div className="bg-gray-50 min-h-[380px] p-3 space-y-2 text-[11px]">
          {screen.components.map(c => (
            <PreviewComponent key={c._id} c={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewComponent({ c }: { c: FlowComponent }) {
  switch (c.type) {
    case 'TextHeading': return <p className="font-bold text-gray-900 text-sm leading-tight">{c.text}</p>;
    case 'TextBody':    return <p className="text-gray-700 text-[11px] leading-relaxed">{c.text}</p>;
    case 'TextCaption': return <p className="text-gray-400 text-[10px]">{c.text}</p>;
    case 'TextInput':   return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-0.5">{c.label}{c.required && ' *'}</p>
        <div className="border border-gray-300 rounded bg-white px-2 py-1.5 text-gray-400 text-[10px]">Enter {c.label?.toLowerCase()}...</div>
        {c['helper-text'] && <p className="text-[9px] text-gray-400 mt-0.5">{c['helper-text']}</p>}
      </div>
    );
    case 'TextArea':    return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-0.5">{c.label}</p>
        <div className="border border-gray-300 rounded bg-white px-2 py-2 h-12 text-gray-400 text-[10px]">Type here...</div>
      </div>
    );
    case 'Dropdown':    return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-0.5">{c.label}{c.required && ' *'}</p>
        <div className="border border-gray-300 rounded bg-white px-2 py-1.5 flex items-center justify-between">
          <span className="text-gray-400 text-[10px]">Select...</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    );
    case 'RadioButtonsGroup': return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-1">{c.label}</p>
        <div className="space-y-1">
          {(c.options || []).slice(0, 3).map(o => (
            <div key={o.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-gray-400 bg-white shrink-0" />
              <span className="text-[10px] text-gray-700">{o.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
    case 'CheckboxGroup': return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-1">{c.label}</p>
        <div className="space-y-1">
          {(c.options || []).slice(0, 3).map(o => (
            <div key={o.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-gray-400 bg-white shrink-0" />
              <span className="text-[10px] text-gray-700">{o.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
    case 'DatePicker':  return (
      <div>
        <p className="text-[9px] font-semibold text-gray-500 mb-0.5">{c.label}</p>
        <div className="border border-gray-300 rounded bg-white px-2 py-1.5 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-400 text-[10px]">DD/MM/YYYY</span>
        </div>
      </div>
    );
    case 'OptIn':       return (
      <div className="flex items-start gap-1.5">
        <div className="w-3 h-3 rounded border border-gray-400 bg-white shrink-0 mt-0.5" />
        <span className="text-[10px] text-gray-700">{c.text}</span>
      </div>
    );
    case 'Footer':      return (
      <div className="mt-2 bg-[#25D366] rounded text-center py-1.5 text-white text-[11px] font-semibold">
        {c.buttonLabel || 'Continue'}
      </div>
    );
    case 'Condition':   return (
      <div className="mt-1 rounded border border-dashed border-amber-300 bg-amber-50 px-2 py-1 text-[9px] text-amber-700">
        <span className="font-bold">IF</span> {c.conditionField || '?'} = {c.conditionValue || '?'}<br/>
          {c.trueScreen || '?'} &nbsp;   {c.falseScreen || '?'}
      </div>
    );
    default: return null;
  }
}

//  Component Editor 

function ComponentEditor({ c, screens, screenId, onChange, onDelete }: {
  c: FlowComponent; screens: FlowScreen[]; screenId: string;
  onChange: (updated: FlowComponent) => void; onDelete: () => void;
}) {
  const inp = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400';

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">{COMPONENT_PALETTE.find(p => p.type === c.type)?.label || c.type}</span>
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Text components */}
      {(c.type === 'TextHeading' || c.type === 'TextBody' || c.type === 'TextCaption') && (
        <textarea value={c.text || ''} onChange={e => onChange({ ...c, text: e.target.value })}
          rows={c.type === 'TextBody' ? 3 : 2} className={`${inp} resize-none`} placeholder="Enter text..." />
      )}

      {/* Input components */}
      {(c.type === 'TextInput' || c.type === 'TextArea' || c.type === 'DatePicker') && (
        <>
          <input value={c.label || ''} onChange={e => onChange({ ...c, label: e.target.value })} className={inp} placeholder="Label *" />
          {c.type === 'TextInput' && (
            <select value={c['input-type'] || 'text'} onChange={e => onChange({ ...c, 'input-type': e.target.value })} className={inp}>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="phone">Phone</option>
              <option value="password">Password</option>
            </select>
          )}
          <input value={c['helper-text'] || ''} onChange={e => onChange({ ...c, 'helper-text': e.target.value })} className={inp} placeholder="Helper text (optional)" />
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={c.required ?? true} onChange={e => onChange({ ...c, required: e.target.checked })} />
            Required
          </label>
        </>
      )}

      {/* Options components */}
      {(c.type === 'Dropdown' || c.type === 'RadioButtonsGroup' || c.type === 'CheckboxGroup') && (
        <>
          <input value={c.label || ''} onChange={e => onChange({ ...c, label: e.target.value })} className={inp} placeholder="Label *" />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500">Options</p>
            {(c.options || []).map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-4">{i + 1}.</span>
                <input value={opt.title} onChange={e => onChange({ ...c, options: (c.options || []).map((o, j) => j === i ? { ...o, title: e.target.value } : o) })}
                  className={`${inp} flex-1`} placeholder={`Option ${i + 1}`} />
                <button onClick={() => onChange({ ...c, options: (c.options || []).filter((_, j) => j !== i) })}
                  className="text-gray-400 hover:text-red-500 transition shrink-0"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => onChange({ ...c, options: [...(c.options || []), { id: uid(), title: '' }] })}
              className="text-[10px] text-orange-600 font-semibold hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={c.required ?? true} onChange={e => onChange({ ...c, required: e.target.checked })} />
            Required
          </label>
        </>
      )}

      {/* OptIn */}
      {c.type === 'OptIn' && (
        <input value={c.text || ''} onChange={e => onChange({ ...c, text: e.target.value })} className={inp} placeholder="Agreement text *" />
      )}

      {/* Footer */}
      {c.type === 'Footer' && (
        <>
          <input value={c.buttonLabel || ''} onChange={e => onChange({ ...c, buttonLabel: e.target.value })} className={inp} placeholder="Button label (e.g. Continue, Submit)" />
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={!!c.isComplete} onChange={e => onChange({ ...c, isComplete: e.target.checked })} />
            This is the last screen (Complete flow)
          </label>
          {!c.isComplete && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Navigate to screen:</p>
              <select value={c.nextScreen || ''} onChange={e => onChange({ ...c, nextScreen: e.target.value })} className={inp}>
                <option value="">Next screen (auto)</option>
                {screens.filter(s => s._id !== screenId).map(s => (
                  <option key={s._id} value={s.id}>{s.title || s.id}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* Condition */}
      {c.type === 'Condition' && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500">Routes user to different screens based on their answer.</p>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1">Check field (input name):</p>
            <input value={c.conditionField || ''} onChange={e => onChange({ ...c, conditionField: e.target.value })} className={inp} placeholder="e.g. category, interests" />
            <p className="text-[9px] text-gray-400 mt-0.5">Must match the `name` of a Dropdown/Radio field on this screen</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1">Option ID that routes to True screen:</p>
            <input value={c.conditionValue || ''} onChange={e => onChange({ ...c, conditionValue: e.target.value })} className={inp} placeholder="e.g. 1 or opt_1 (the option's ID value)" />
            <p className="text-[9px] text-gray-400 mt-0.5">Other options route to the False screen. Each option routes individually.</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1"> If TRUE  go to screen:</p>
            <select value={c.trueScreen || ''} onChange={e => onChange({ ...c, trueScreen: e.target.value })} className={inp}>
              <option value="">Select screen...</option>
              {screens.filter(s => s._id !== screenId).map(s => (
                <option key={s._id} value={s.id}>{s.title || s.id}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1"> If FALSE  go to screen:</p>
            <select value={c.falseScreen || ''} onChange={e => onChange({ ...c, falseScreen: e.target.value })} className={inp}>
              <option value="">Select screen...</option>
              {screens.filter(s => s._id !== screenId).map(s => (
                <option key={s._id} value={s.id}>{s.title || s.id}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

//  Flow Designer 

function FlowDesigner({
  flow, onBack, onFlowUpdated, initialOpenAi = false, onAiModalOpened,
}: {
  flow: WaFlow; onBack: () => void; onFlowUpdated: () => void;
  initialOpenAi?: boolean; onAiModalOpened?: () => void;
}) {
  const { get, post } = useApi();
  const [screens, setScreens] = useState<FlowScreen[]>([
    { _id: uid(), id: 'SCREEN_1', title: 'Screen 1', terminal: false, components: [] },
  ]);
  const [activeScreen, setActiveScreen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);

  // Load existing flow document
  useEffect(() => {
    get(`/api/automation/whatsapp/flows/${flow.id}/document`)
      .then(r => {
        const doc = r.data?.flow_json;
        if (doc?.screens?.length) {
          const loaded: FlowScreen[] = doc.screens.map((s: any) => {
            const comps: FlowComponent[] = [];
            const processChildren = (children: any[]) => {
              children?.forEach((ch: any) => {
                if (ch.type === 'Form') { processChildren(ch.children); return; }
                if (ch.type === 'SingleColumnLayout') { processChildren(ch.children); return; }
                const c: FlowComponent = { _id: uid(), type: ch.type as ComponentType };
                if (ch.text) c.text = ch.text;
                if (ch.name) c.name = ch.name;
                if (ch.label) c.label = ch.label;
                if (ch['input-type']) c['input-type'] = ch['input-type'];
                if (ch.required !== undefined) c.required = ch.required;
                if (ch['helper-text']) c['helper-text'] = ch['helper-text'];
                if (ch['data-source']) c.options = ch['data-source'].map((o: any) => ({ id: o.id, title: o.title }));
                if (ch['on-click-action']) {
                  c.buttonLabel = ch.label;
                  c.isComplete = ch['on-click-action'].name === 'complete';
                  c.nextScreen = ch['on-click-action']?.next?.name;
                }
                comps.push(c);
              });
            };
            processChildren(s.layout?.children || []);
            return { _id: uid(), id: s.id, title: s.title || s.id, terminal: s.terminal, components: comps };
          });
          setScreens(loaded);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        if (initialOpenAi) {
          setShowAiModal(true);
          onAiModalOpened?.();
        }
      });
  }, []); // eslint-disable-line

  const addScreen = () => {
    const n = screens.length + 1;
    const s: FlowScreen = { _id: uid(), id: `SCREEN_${n}`, title: `Screen ${n}`, terminal: false, components: [] };
    setScreens(prev => [...prev, s]);
    setActiveScreen(screens.length);
  };

  const updateScreen = (idx: number, updated: FlowScreen) => {
    setScreens(prev => prev.map((s, i) => i === idx ? updated : s));
  };

  const deleteScreen = (idx: number) => {
    if (screens.length === 1) { toast.error('At least one screen required'); return; }
    setScreens(prev => prev.filter((_, i) => i !== idx));
    setActiveScreen(Math.max(0, idx - 1));
  };

  const addComponent = (type: ComponentType) => {
    const comp = defaultComponent(type);
    setScreens(prev => prev.map((s, i) => i === activeScreen
      ? { ...s, components: [...s.components, comp] }
      : s
    ));
  };

  const updateComponent = (screenIdx: number, compId: string, updated: FlowComponent) => {
    setScreens(prev => prev.map((s, i) => i === screenIdx
      ? { ...s, components: s.components.map(c => c._id === compId ? updated : c) }
      : s
    ));
  };

  const deleteComponent = (screenIdx: number, compId: string) => {
    setScreens(prev => prev.map((s, i) => i === screenIdx
      ? { ...s, components: s.components.filter(c => c._id !== compId) }
      : s
    ));
  };

  const save = async () => {
    setSaving(true);
    try {
      const flowJson = buildFlowJson(screens);
      const r = await post(`/api/automation/whatsapp/flows/${flow.id}/upload-document`, { flow_json: flowJson });
      const errs = r.data?.validation_errors || [];
      if (errs.length) toast.error(`Saved with warnings: ${errs[0]?.message || 'check flow JSON'}`);
      else toast.success('Flow saved. Screens uploaded to Meta.');
    } catch (e: any) {
      toast.error(apiErrorMessage(e, 'Failed to save flow'));
    } finally { setSaving(false); }
  };

  const publish = async () => {
    if (!confirm('Publish this flow? Once published it cannot be edited.')) return;
    setPublishing(true);
    try {
      await post(`/api/automation/whatsapp/flows/${flow.id}/publish`, {});
      toast.success('Flow published successfully.');
      onFlowUpdated();
      onBack();
    } catch (e: any) {
      toast.error(apiErrorMessage(e, 'Publish failed'));
    } finally { setPublishing(false); }
  };

  const screen = screens[activeScreen];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
      <p className="text-sm text-gray-500">Loading flow...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-88px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
             Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div>
            <span className="font-bold text-gray-900 text-sm">{flow.name}</span>
            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${flow.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {flow.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {flow.status === 'DRAFT' && (
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition"
              title="Generate a WhatsApp Flow with B9 Agentic Core">
              <Sparkles className="w-3.5 h-3.5" /> Generate with AI
            </button>
          )}
          <button onClick={() => setShowPreview(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${showPreview ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <Button variant="secondary" onClick={save} disabled={saving || flow.status === 'PUBLISHED'} className="flex items-center gap-1.5 text-sm py-1.5 px-3">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </Button>
          {flow.status === 'DRAFT' && (
            <Button onClick={publish} disabled={publishing} className="flex items-center gap-1.5 text-sm py-1.5 px-3">
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Publish
            </Button>
          )}
        </div>
      </div>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAiModal && (
          <AiGenerateModal
            isOpen={showAiModal}
            onClose={() => setShowAiModal(false)}
            onGenerated={(generated) => {
              setScreens(generated);
              setActiveScreen(0);
            }}
            post={post}
          />
        )}
      </AnimatePresence>

      {/* Live warning */}
      {flow.status === 'PUBLISHED' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium">
           This flow is Published and cannot be edited. Duplicate it to make changes.
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Screen list + component palette */}
        <div className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
          {/* Screens */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Screens</p>
              <button onClick={addScreen} className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition" title="Add screen">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {screens.map((s, idx) => (
                <div key={s._id}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 cursor-pointer group transition ${activeScreen === idx ? 'bg-orange-100 text-orange-800' : 'hover:bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveScreen(idx)}>
                  <span className={`w-5 h-5 rounded shrink-0 flex items-center justify-center text-[9px] font-bold ${activeScreen === idx ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'}`}>{idx + 1}</span>
                  <span className="text-xs truncate flex-1 font-medium">{s.title || s.id}</span>
                  {screens.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); deleteScreen(idx); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Component palette */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Add Component</p>
            {['Text', 'Input', 'Navigation', 'Logic'].map(group => (
              <div key={group} className="mb-3">
                <p className="text-[9px] text-gray-400 font-semibold uppercase mb-1">{group}</p>
                <div className="space-y-1">
                  {COMPONENT_PALETTE.filter(p => p.group === group).map(p => (
                    <button key={p.type} onClick={() => addComponent(p.type)}
                      disabled={flow.status === 'PUBLISHED'}
                      className="w-full flex items-center gap-2 text-xs text-gray-700 hover:bg-white hover:shadow-sm rounded-lg px-2 py-1.5 transition border border-transparent hover:border-gray-200 disabled:opacity-40">
                      <span className="text-gray-500">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Screen editor */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
          {screen && (
            <>
              {/* Screen title + ID */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                <input
                  value={screen.title}
                  onChange={e => updateScreen(activeScreen, { ...screen, title: e.target.value })}
                  className="text-sm font-bold text-gray-900 border-b border-transparent focus:border-orange-400 focus:outline-none bg-transparent flex-1"
                  placeholder="Screen title"
                  disabled={flow.status === 'PUBLISHED'}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">ID:</span>
                  <input
                    value={screen.id}
                    onChange={e => updateScreen(activeScreen, { ...screen, id: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                    className="text-[10px] font-mono text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none"
                    disabled={flow.status === 'PUBLISHED'}
                  />
                </div>
              </div>

              {/* Components */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {screen.components.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-2 rounded-xl border-2 border-dashed border-gray-200">
                    <Layers className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-400">Click components on the left to add them here</p>
                  </div>
                ) : (
                  screen.components.map((c) => (
                    <ComponentEditor
                      key={c._id}
                      c={c}
                      screens={screens}
                      screenId={screen._id}
                      onChange={updated => updateComponent(activeScreen, c._id, updated)}
                      onDelete={() => deleteComponent(activeScreen, c._id)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Phone preview */}
        {showPreview && screen && (
          <div className="w-72 shrink-0 border-l border-gray-200 bg-gray-100 flex flex-col items-center py-6 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-4">Live Preview</p>
            <PhonePreview screen={screen} />
            <p className="text-[9px] text-gray-400 mt-3">Approximate WhatsApp preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

//  Status Badge 

function StatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> Published
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
      <Clock className="w-3 h-3" /> Draft
    </span>
  );
}

//  Main Page 

export default function FlowsPage() {
  const { get, post, delete: del } = useApi();
  const [flows, setFlows] = useState<WaFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [flowError, setFlowError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('LEAD_GENERATION');
  const [creating, setCreating] = useState(false);
  const [designing, setDesigning] = useState<WaFlow | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [createWithAi, setCreateWithAi] = useState(false);

  const load = () => {
    setLoading(true);
    setNotConnected(false);
    setFlowError('');
    get('/api/automation/whatsapp/flows')
      .then(r => setFlows(r.data?.data || []))
      .catch((e: any) => {
        const detail = e?.response?.data?.detail || 'WhatsApp Flows did not load. Please retry.';
        if ([400, 401, 403].includes(e?.response?.status)) setNotConnected(true);
        setFlowError(detail);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const createFlow = async (useAi = false) => {
    if (!newName.trim()) { toast.error('Flow name required'); return; }
    setCreating(true);
    try {
      const r = await post('/api/automation/whatsapp/flows', { name: newName.trim(), categories: [newCategory] });
      const newFlow: WaFlow = { id: r.data.id, name: newName.trim(), status: 'DRAFT', categories: [newCategory] };
      setFlows(prev => [...prev, newFlow]);
      setNewName(''); setShowCreate(false);
      if (useAi) {
        toast.success('Flow created. Opening AI designer...');
        setCreateWithAi(true);
      } else {
        toast.success('Flow created! Opening designer...');
      }
      setDesigning(newFlow);
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed to create flow'); }
    finally { setCreating(false); }
  };

  const deleteFlow = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setActing(id + ':delete');
    try {
      await del(`/api/automation/whatsapp/flows/${id}`);
      toast.success('Deleted');
      setFlows(prev => prev.filter(f => f.id !== id));
    } catch (e: any) {
      if (e?.response?.status === 403) {
        toast.error('Only workspace admins can delete flows.');
      } else {
        toast.error(e.response?.data?.detail || 'Delete failed');
      }
    }
    finally { setActing(null); }
  };

  const copyId = (id: string) => { navigator.clipboard.writeText(id); toast.success('Flow ID copied!'); };

  const openPreset = (preset: typeof INDIA_FLOW_PRESETS[number]) => {
    setNewName(preset.name);
    setNewCategory(preset.category);
    setShowCreate(true);
    toast('Preset selected. Click Generate with AI, then use the prompt examples to create the form.', { icon: '' });
  };

  // Show designer if editing
  if (designing) {
    return (
      <FlowDesigner
        flow={designing}
        onBack={() => { setDesigning(null); setCreateWithAi(false); load(); }}
        onFlowUpdated={load}
        initialOpenAi={createWithAi}
        onAiModalOpened={() => setCreateWithAi(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Flows</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Build interactive forms that open inside WhatsApp  lead capture, surveys, bookings. Design everything here, no external tools needed.
          </p>
        </div>
        {!notConnected && (
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
            <Sparkles className="w-4 h-4" /> Generate Form with AI
          </Button>
        )}
      </div>

      {!notConnected && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-950">Recommended path: create a WhatsApp form with AI</p>
              <p className="mt-1 text-xs text-violet-700">Choose an India SMB preset. The manual designer and advanced controls remain available.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INDIA_FLOW_PRESETS.map((preset) => (
                <button key={preset.label} onClick={() => openPreset(preset)}
                  className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:border-violet-400 hover:bg-violet-100 transition">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Not connected */}
      {notConnected && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <p className="font-semibold text-gray-700">Connect WhatsApp First</p>
          <p className="max-w-md text-sm text-gray-400">WhatsApp Flows require an active WhatsApp connection. Connect your Meta account in Integrations to get started.</p>
          <button onClick={load} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Retry
          </button>
          <a href="/dashboard/integrations" className="mt-1 text-sm font-semibold text-orange-600 hover:underline">
            Go to Integrations →
          </a>
        </div>
      )}

      {/* API error (not a connection issue — e.g. 500, timeout) */}
      {!notConnected && !loading && flowError && flows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-red-200 bg-red-50 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="font-semibold text-gray-700">Failed to load flows</p>
          <p className="max-w-md text-sm text-gray-500">{flowError}</p>
          <button onClick={load} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {!notConnected && loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
            <div className="col-span-4">Flow Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center px-4 py-3 bg-white border border-gray-200 rounded-xl">
              <div className="col-span-4 space-y-1.5">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="col-span-2"><div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" /></div>
              <div className="col-span-2"><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></div>
              <div className="col-span-4 flex justify-end gap-2">
                <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!notConnected && !loading && flows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <Layers className="w-10 h-10 text-purple-300" />
          <p className="font-semibold text-gray-500">No flows yet</p>
          <p className="text-sm text-gray-400">Create your first interactive form with AI, then edit it manually.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-2 flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600">
            <Sparkles className="w-4 h-4" /> Generate First Flow with AI
          </Button>
        </div>
      )}

      {/* Flows table */}
      {!notConnected && !loading && flows.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
            <div className="col-span-4">Flow Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          {flows.map(f => (
            <div key={f.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition">
              <div className="col-span-4 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{f.name}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{f.id}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {CATEGORIES.find(c => c.value === f.categories?.[0])?.label || f.categories?.[0] || ''}
                </span>
              </div>
              <div className="col-span-2"><StatusBadge status={f.status} /></div>
              <div className="col-span-4 flex items-center justify-end gap-2 flex-wrap">
                <button onClick={() => setDesigning(f)}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg px-2.5 py-1.5 hover:bg-purple-50 transition">
                  <Settings2 className="w-3.5 h-3.5" /> {f.status === 'PUBLISHED' ? 'View' : 'Design'}
                </button>
                <button onClick={() => copyId(f.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition">
                  <Copy className="w-3.5 h-3.5" /> Copy ID
                </button>
                {f.status === 'DRAFT' && (
                  <button onClick={() => deleteFlow(f.id, f.name)} disabled={acting === f.id + ':delete'}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition disabled:opacity-50">
                    {acting === f.id + ':delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Create New Flow</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Flow Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Lead Capture Form, Demo Booking"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus onKeyDown={e => e.key === 'Enter' && createFlow()} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-400">After creating, you&apos;ll be taken directly to the flow designer.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 mt-5">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="secondary" onClick={() => createFlow(false)} disabled={creating || !newName.trim()} className="flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Manually Design
                </Button>
                <Button onClick={() => createFlow(true)} disabled={creating || !newName.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate with AI
                </Button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
