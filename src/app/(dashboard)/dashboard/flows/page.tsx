'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, ChevronDown, Clock,
  Copy, Layers, Loader2, Plus, Save, Trash2, X,
  Type, AlignLeft, Circle, CheckSquare, Calendar, ToggleLeft,
  Smartphone, Eye, ArrowRight, Settings2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaFlow { id: string; name: string; status: string; categories?: string[] }

type ComponentType =
  | 'TextHeading' | 'TextBody' | 'TextCaption'
  | 'TextInput' | 'TextArea' | 'Dropdown'
  | 'RadioButtonsGroup' | 'CheckboxGroup'
  | 'DatePicker' | 'OptIn' | 'Footer';

interface FlowComponent {
  _id: string; // internal UI id
  type: ComponentType;
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

// ─── Constants ────────────────────────────────────────────────────────────────

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
    default:                  return base;
  }
};

// ─── Flow JSON Builder ────────────────────────────────────────────────────────

function buildFlowJson(screens: FlowScreen[]): object {
  const routing: Record<string, string[]> = {};
  const builtScreens = screens.map((s, idx) => {
    const footer = s.components.find(c => c.type === 'Footer');
    const next = footer?.nextScreen;
    routing[s.id] = next ? [next] : [];

    const formInputTypes: ComponentType[] = ['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'];
    const formChildren = s.components.filter(c => formInputTypes.includes(c.type));
    const textChildren = s.components.filter(c => !formInputTypes.includes(c.type) && c.type !== 'Footer');

    const buildComp = (c: FlowComponent): object => {
      switch (c.type) {
        case 'TextHeading': return { type: 'TextHeading', text: c.text || '' };
        case 'TextBody':    return { type: 'TextBody', text: c.text || '', markdown: true };
        case 'TextCaption': return { type: 'TextCaption', text: c.text || '' };
        case 'TextInput':   return { type: 'TextInput', name: c.name, label: c.label, 'input-type': c['input-type'] || 'text', required: c.required ?? true, ...(c['helper-text'] ? { 'helper-text': c['helper-text'] } : {}) };
        case 'TextArea':    return { type: 'TextArea', name: c.name, label: c.label, required: c.required ?? false };
        case 'Dropdown':    return { type: 'Dropdown', name: c.name, label: c.label, required: c.required ?? true, 'data-source': (c.options || []).map(o => ({ id: o.id, title: o.title })) };
        case 'RadioButtonsGroup': return { type: 'RadioButtonsGroup', name: c.name, label: c.label, required: c.required ?? true, 'data-source': (c.options || []).map(o => ({ id: o.id, title: o.title })) };
        case 'CheckboxGroup': return { type: 'CheckboxGroup', name: c.name, label: c.label, required: c.required ?? true, 'data-source': (c.options || []).map(o => ({ id: o.id, title: o.title })), ...(c.min_selected_items ? { min_selected_items: c.min_selected_items } : {}), ...(c.max_selected_items ? { max_selected_items: c.max_selected_items } : {}) };
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

  return { version: '7.0', routing_model: routing, screens: builtScreens };
}

// ─── WhatsApp Phone Preview ───────────────────────────────────────────────────

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
    default: return null;
  }
}

// ─── Component Editor ─────────────────────────────────────────────────────────

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
    </div>
  );
}

// ─── Flow Designer ────────────────────────────────────────────────────────────

function FlowDesigner({ flow, onBack, onFlowUpdated }: { flow: WaFlow; onBack: () => void; onFlowUpdated: () => void }) {
  const { get, post } = useApi();
  const [screens, setScreens] = useState<FlowScreen[]>([
    { _id: uid(), id: 'SCREEN_1', title: 'Screen 1', terminal: false, components: [] },
  ]);
  const [activeScreen, setActiveScreen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

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
      .finally(() => setLoading(false));
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
      else toast.success('Flow saved! ✓ Screens uploaded to Meta.');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save flow');
    } finally { setSaving(false); }
  };

  const publish = async () => {
    if (!confirm('Publish this flow? Once published it cannot be edited.')) return;
    setPublishing(true);
    try {
      await post(`/api/automation/whatsapp/flows/${flow.id}/publish`, {});
      toast.success('Flow published successfully! 🎉');
      onFlowUpdated();
      onBack();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Publish failed');
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
            ← Back
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

      {/* Live warning */}
      {flow.status === 'PUBLISHED' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium">
          ⚠️ This flow is Published and cannot be edited. Duplicate it to make changes.
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
            {['Text', 'Input', 'Navigation'].map(group => (
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlowsPage() {
  const { get, post, delete: del } = useApi();
  const [flows, setFlows] = useState<WaFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('LEAD_GENERATION');
  const [creating, setCreating] = useState(false);
  const [designing, setDesigning] = useState<WaFlow | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    get('/api/automation/whatsapp/flows')
      .then(r => setFlows(r.data?.data || []))
      .catch((e: any) => {
        if (e?.response?.status === 400) setNotConnected(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const createFlow = async () => {
    if (!newName.trim()) { toast.error('Flow name required'); return; }
    setCreating(true);
    try {
      const r = await post('/api/automation/whatsapp/flows', { name: newName.trim(), categories: [newCategory] });
      const newFlow: WaFlow = { id: r.data.id, name: newName.trim(), status: 'DRAFT', categories: [newCategory] };
      setFlows(prev => [...prev, newFlow]);
      setNewName(''); setShowCreate(false);
      toast.success('Flow created! Opening designer...');
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
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Delete failed'); }
    finally { setActing(null); }
  };

  const copyId = (id: string) => { navigator.clipboard.writeText(id); toast.success('Flow ID copied!'); };

  // Show designer if editing
  if (designing) {
    return <FlowDesigner flow={designing} onBack={() => { setDesigning(null); load(); }} onFlowUpdated={load} />;
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
            Build interactive forms that open inside WhatsApp — lead capture, surveys, bookings. Design everything here, no external tools needed.
          </p>
        </div>
        {!notConnected && (
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Flow
          </Button>
        )}
      </div>

      {/* Not connected */}
      {notConnected && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <p className="font-semibold text-gray-700">WhatsApp not connected</p>
          <p className="text-sm text-gray-400">Connect your WhatsApp account in Integrations first.</p>
          <a href="/dashboard/integrations" className="mt-1 text-sm font-semibold text-orange-600 hover:underline">
            Go to Integrations →
          </a>
        </div>
      )}

      {/* Loading */}
      {!notConnected && loading && (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      )}

      {/* Empty */}
      {!notConnected && !loading && flows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <Layers className="w-10 h-10 text-purple-300" />
          <p className="font-semibold text-gray-500">No flows yet</p>
          <p className="text-sm text-gray-400">Create your first interactive form for WhatsApp</p>
          <Button onClick={() => setShowCreate(true)} className="mt-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First Flow
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
                  {CATEGORIES.find(c => c.value === f.categories?.[0])?.label || f.categories?.[0] || '—'}
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
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
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={createFlow} disabled={creating || !newName.trim()} className="flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Design
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
