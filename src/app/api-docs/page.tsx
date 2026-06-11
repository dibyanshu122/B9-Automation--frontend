'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { ChevronDown, Copy, Check, KeyRound, Send, Zap, AlertCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

/* ──────────────────────────────────────────────────────────────────────────
   Public REST API v1 — the ONLY surface documented here.
   Every endpoint below is verified against the live backend.
   ────────────────────────────────────────────────────────────────────────── */

type ApiEndpoint = {
  method: string;
  path: string;
  summary: string;
  scope: string;
  note?: string;
  body?: Record<string, string>;
  params?: Array<{ name: string; desc: string }>;
  response?: string;
};

type ApiGroup = {
  id: string;
  label: string;
  icon: string;
  description: string;
  endpoints: ApiEndpoint[];
};

const apiGroups: ApiGroup[] = [
  {
    id: 'messaging',
    label: 'WhatsApp Messaging',
    icon: '💬',
    description: 'Send messages through your connected WhatsApp Business number.',
    endpoints: [
      {
        method: 'POST', path: '/api/v1/whatsapp/send-template', scope: 'messages:send',
        summary: 'Send an approved template — works any time, no 24-hour limit',
        body: { to: '"+91XXXXXXXXXX"', template_name: '"order_confirmed"', language_code: '"en_US"', variables: '["Rahul", "ORD-123"]' },
        response: '{ "sent": true, "to": "+91XXXXXXXXXX", "template": "order_confirmed" }',
      },
      {
        method: 'POST', path: '/api/v1/whatsapp/send-text', scope: 'messages:send',
        summary: 'Send plain text — only within 24h of the customer\'s last message',
        note: 'Returns 400 if the 24-hour window is closed. Use send-template instead.',
        body: { to: '"+91XXXXXXXXXX"', message: '"Hi! Your order is ready for pickup."' },
        response: '{ "sent": true, "to": "+91XXXXXXXXXX", "message_id": "wamid.xxx" }',
      },
      {
        method: 'POST', path: '/api/v1/whatsapp/send-media', scope: 'messages:send',
        summary: 'Send an image, video, document or audio file by public URL',
        note: 'media_type: image | video | document | audio. Caption is ignored for audio. 24h window applies.',
        body: { to: '"+91XXXXXXXXXX"', media_type: '"image"', media_url: '"https://example.com/offer.jpg"', caption: '"Festive offer — 20% off!"' },
        response: '{ "sent": true, "media_type": "image", "message_id": "...", "wa_message_id": "wamid.xxx" }',
      },
      {
        method: 'POST', path: '/api/v1/whatsapp/send-bulk', scope: 'messages:send',
        summary: 'Send one template to up to 100 numbers in a single call',
        note: 'Returns per-number status. For larger audiences use POST /campaigns/send.',
        body: { recipients: '["+91XXXXXXXXXX", "+91YYYYYYYYYY"]', template_name: '"diwali_offer"', language_code: '"en_US"', variables: '["Customer"]' },
        response: '{ "total": 2, "sent": 2, "failed": 0, "results": [{ "phone": "...", "status": "sent" }] }',
      },
      {
        method: 'GET', path: '/api/v1/whatsapp/status', scope: 'integrations:read',
        summary: 'WhatsApp connection health — is your number ready to send?',
        response: '{ "connected": true, "send_enabled": true, "display_phone_number": "+91...", "phone_number_id": "..." }',
      },
    ],
  },
  {
    id: 'messages',
    label: 'Message History & Delivery',
    icon: '📨',
    description: 'Track what was sent and whether it was delivered and read.',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/messages', scope: 'messages:read',
        summary: 'List outbound messages, newest first',
        params: [{ name: 'limit', desc: '1–200, default 50' }, { name: 'offset', desc: 'pagination offset' }],
        response: '{ "total": 248, "messages": [{ "id": "...", "recipient": "...", "status": "sent", "sent_at": "..." }] }',
      },
      {
        method: 'GET', path: '/api/v1/messages/{id}/status', scope: 'messages:read',
        summary: 'Delivery status of one message: sent → delivered → read (or failed)',
        response: '{ "id": "...", "delivery_status": "read", "sent_at": "...", "delivered_at": "...", "read_at": "..." }',
      },
    ],
  },
  {
    id: 'leads',
    label: 'Leads & Contacts',
    icon: '👥',
    description: 'Create, read and update leads in your B9 CRM from any external system.',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/leads', scope: 'leads:read',
        summary: 'List leads with filters',
        params: [
          { name: 'status', desc: 'new | contacted | hot | warm | cold | won | lost' },
          { name: 'tag', desc: 'filter by tag' },
          { name: 'phone', desc: 'exact phone lookup (with or without +)' },
          { name: 'limit / offset', desc: 'pagination (limit 1–200)' },
        ],
        response: '{ "total": 513, "leads": [{ "id": "...", "name": "...", "phone": "...", "status": "new", "score_label": "hot" }] }',
      },
      {
        method: 'POST', path: '/api/v1/leads', scope: 'leads:write',
        summary: 'Create a lead — phone or email required',
        body: { name: '"Rahul Sharma"', phone: '"+91XXXXXXXXXX"', email: '"rahul@example.com"', requirement: '"Interested in demo"', tag: '"webinar"', source: '"shopify"' },
        response: '{ "created": true, "lead": { "id": "...", ... } }',
      },
      {
        method: 'GET', path: '/api/v1/leads/{id}', scope: 'leads:read',
        summary: 'Get one lead by ID',
      },
      {
        method: 'PATCH', path: '/api/v1/leads/{id}', scope: 'leads:write',
        summary: 'Update lead — send only the fields you want to change',
        body: { status: '"won"', tag: '"converted"', score_label: '"hot"', name: '"..."', phone: '"..."', email: '"..."' },
        response: '{ "updated": true, "lead": { ... } }',
      },
      {
        method: 'GET', path: '/api/v1/contacts/exist', scope: 'leads:read',
        summary: 'Check whether a phone number already exists in your CRM',
        params: [{ name: 'phone', desc: 'required — with or without +' }],
        response: '{ "exists": true, "lead_id": "...", "name": "...", "status": "new" }',
      },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: '📣',
    description: 'Broadcast approved templates to your lead segments and track results.',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/campaigns', scope: 'campaigns:read',
        summary: 'List campaigns with sent/failed counts',
        response: '{ "campaigns": [{ "name": "june_promo", "total": 480, "sent": 472, "failed": 8, "status": "completed" }] }',
      },
      {
        method: 'GET', path: '/api/v1/campaigns/{name}', scope: 'campaigns:read',
        summary: 'One campaign with per-recipient delivery breakdown',
        response: '{ "name": "june_promo", "total": 480, "recipients": [{ "recipient": "+91...", "status": "sent" }] }',
      },
      {
        method: 'POST', path: '/api/v1/campaigns/send', scope: 'campaigns:write',
        summary: 'Broadcast a template to filtered leads (hot / warm / cold / all)',
        note: 'Runs in the background — poll GET /campaigns/{name} for progress.',
        body: { name: '"june_promo"', template_name: '"diwali_offer"', recipient_filter: '"hot"', language_code: '"en_US"', variables: '["Customer"]' },
        response: '{ "status": "queued", "queued": 122, "campaign_name": "june_promo" }',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Templates, Catalog, Automations',
    icon: '⚡',
    description: 'Read your WhatsApp templates and products; trigger automation workflows.',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/templates', scope: 'templates:read',
        summary: 'List WhatsApp templates synced from Meta',
        params: [{ name: 'status', desc: 'APPROVED | PENDING | REJECTED' }],
      },
      {
        method: 'GET', path: '/api/v1/catalog', scope: 'catalog:read',
        summary: 'List products in your catalog',
        params: [{ name: 'limit / offset', desc: 'pagination' }],
      },
      {
        method: 'GET', path: '/api/v1/automations', scope: 'automations:read',
        summary: 'List automation workflows with status and trigger type',
      },
      {
        method: 'POST', path: '/api/v1/automations/{id}/run', scope: 'automations:run',
        summary: 'Trigger a workflow with custom context',
        body: { lead_id: '"lead_abc123" (optional)', message: '"interested in product" (optional)' },
        response: '{ "triggered": true, "workflow_id": "...", "runs": 1 }',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Analytics',
    icon: '💳',
    description: 'Create Razorpay payment links and read your usage summary.',
    endpoints: [
      {
        method: 'POST', path: '/api/v1/payments/link', scope: 'payments:write',
        summary: 'Create a Razorpay payment link (amount in INR, not paise)',
        body: { amount_inr: '499', description: '"Coaching fee — June batch"', customer_phone: '"+91XXXXXXXXXX"', lead_id: '"lead_abc123" (optional)' },
      },
      {
        method: 'GET', path: '/api/v1/payments', scope: 'payments:read',
        summary: 'List customer payment records',
        params: [{ name: 'limit / offset', desc: 'pagination' }],
      },
      {
        method: 'GET', path: '/api/v1/analytics', scope: 'analytics:read',
        summary: '30-day summary: leads created, messages sent, automation runs, AI usage',
        response: '{ "period_days": 30, "leads_created": 122, "messages_sent": 480, "automation_runs": 268, "plan": "PRO" }',
      },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-400 border-green-500/20',
  PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all shrink-0"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function curlFor(ep: ApiEndpoint): string {
  const lines = [`curl ${ep.method !== 'GET' ? `-X ${ep.method} ` : ''}"${BASE_URL}${ep.path.replace('{id}', 'LEAD_ID').replace('{name}', 'CAMPAIGN_NAME')}" \\`];
  lines.push(`  -H "Authorization: Bearer YOUR_API_KEY"`);
  if (ep.body) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    const bodyJson = '{ ' + Object.entries(ep.body).map(([k, v]) => `"${k}": ${v.replace(/ \(optional\)/, '')}`).join(', ') + ' }';
    lines[lines.length - 2] = lines[lines.length - 2] + ' \\';
    lines.push(`  -d '${bodyJson}'`);
  }
  return lines.join('\n');
}

function EndpointCard({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(ep.body || ep.params || ep.response || ep.note);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden transition-colors hover:border-white/[0.12]">
      <button
        onClick={() => hasDetail && setOpen(o => !o)}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${methodColors[ep.method] || 'bg-white/5 text-gray-300 border-white/10'}`}>
          {ep.method}
        </span>
        <code className="font-mono text-[13px] text-white/90 shrink-0">{ep.path}</code>
        <span className="hidden md:block flex-1 truncate text-[13px] text-zinc-500">{ep.summary}</span>
        <span className="hidden lg:block shrink-0 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-500">{ep.scope}</span>
        <CopyButton text={`${BASE_URL}${ep.path}`} />
        {hasDetail && <ChevronDown className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {/* Mobile summary */}
      <p className="md:hidden px-4 pb-3 -mt-1 text-[12px] text-zinc-500">{ep.summary}</p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-4 py-4 space-y-4 bg-black/30">
              {ep.note && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-[12px] leading-relaxed text-amber-200/80">{ep.note}</p>
                </div>
              )}
              {ep.params && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Query Parameters</p>
                  <div className="space-y-1">
                    {ep.params.map(p => (
                      <div key={p.name} className="flex gap-3 text-[12.5px]">
                        <code className="shrink-0 font-mono text-[#00F2FE]">{p.name}</code>
                        <span className="text-zinc-500">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ep.body && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Request Body</p>
                  <pre className="rounded-lg border border-white/[0.06] bg-black/60 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-zinc-300 overflow-x-auto">
{'{\n' + Object.entries(ep.body).map(([k, v]) => `  "${k}": ${v}`).join(',\n') + '\n}'}
                  </pre>
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">cURL</p>
                  <CopyButton text={curlFor(ep)} />
                </div>
                <pre className="rounded-lg border border-white/[0.06] bg-black/60 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-emerald-300/90 overflow-x-auto">{curlFor(ep)}</pre>
              </div>
              {ep.response && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Response 200</p>
                  <pre className="rounded-lg border border-white/[0.06] bg-black/60 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">{ep.response}</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#A78BFA]/[0.02] blur-[160px]" />
      </div>

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.06] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">REST API v1</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
              B9 Automation API
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-zinc-400 max-w-xl mx-auto">
              Send WhatsApp messages, sync leads, run campaigns and trigger automations
              from any system. One API key, JSON in, JSON out.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* QUICKSTART — 3 steps */}
      <section className="relative border-b border-white/[0.06] py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">Start in 3 steps</h2>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00F2FE]/25 bg-[#00F2FE]/[0.08] text-sm font-bold text-[#00F2FE]">1</span>
                <KeyRound className="h-4 w-4 text-zinc-500" />
                <h3 className="font-semibold">Get your API key</h3>
              </div>
              <p className="text-sm text-zinc-400 ml-11">
                Go to <Link href="/dashboard/api" className="text-[#00F2FE] hover:underline">Dashboard → API Keys</Link>, create a key, and select the scopes you need.
                Keys look like <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">b9_xxxx…</code> — shown only once, store it safely.
              </p>
            </div>
            {/* Step 2 */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00F2FE]/25 bg-[#00F2FE]/[0.08] text-sm font-bold text-[#00F2FE]">2</span>
                <Send className="h-4 w-4 text-zinc-500" />
                <h3 className="font-semibold">Make your first call</h3>
              </div>
              <div className="ml-11">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">Send a WhatsApp template to any number:</p>
                  <CopyButton text={`curl -X POST "${BASE_URL}/api/v1/whatsapp/send-template" -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d '{ "to": "+91XXXXXXXXXX", "template_name": "hello_world", "language_code": "en_US" }'`} />
                </div>
                <pre className="rounded-lg border border-white/[0.06] bg-black/60 px-4 py-3 font-mono text-[12px] leading-relaxed text-emerald-300/90 overflow-x-auto">{`curl -X POST "${BASE_URL}/api/v1/whatsapp/send-template" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "to": "+91XXXXXXXXXX", "template_name": "hello_world", "language_code": "en_US" }'`}</pre>
              </div>
            </div>
            {/* Step 3 */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00F2FE]/25 bg-[#00F2FE]/[0.08] text-sm font-bold text-[#00F2FE]">3</span>
                <Zap className="h-4 w-4 text-zinc-500" />
                <h3 className="font-semibold">Check the result</h3>
              </div>
              <div className="ml-11">
                <pre className="rounded-lg border border-white/[0.06] bg-black/60 px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">{`{ "sent": true, "to": "+91XXXXXXXXXX", "template": "hello_world" }`}</pre>
                <p className="mt-2 text-sm text-zinc-500">That&apos;s it. Track delivery with <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">GET /api/v1/messages/{'{id}'}/status</code>.</p>
              </div>
            </div>
          </div>

          {/* Base URL + auth strip */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 font-mono text-[13px]">
              <span className="text-zinc-500">Base URL</span>
              <span className="truncate text-white/90">{BASE_URL}</span>
              <CopyButton text={BASE_URL} />
            </div>
            <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 font-mono text-[13px]">
              <span className="text-zinc-500">Auth header</span>
              <span className="truncate text-[#00F2FE]">Bearer b9_xxxx…</span>
              <CopyButton text="Authorization: Bearer YOUR_API_KEY" />
            </div>
          </div>
        </div>
      </section>

      {/* ENDPOINT REFERENCE */}
      <section className="relative py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-2 text-center text-2xl font-bold">API Reference</h2>
          <p className="mb-10 text-center text-sm text-zinc-500">Click any endpoint for request body, cURL example and response shape.</p>

          <div className="space-y-10">
            {apiGroups.map(group => (
              <div key={group.id}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h3 className="text-lg font-semibold">{group.icon} {group.label}</h3>
                  <span className="text-[13px] text-zinc-500">— {group.description}</span>
                </div>
                <div className="space-y-2">
                  {group.endpoints.map(ep => <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ERRORS & LIMITS */}
      <section className="relative border-t border-white/[0.06] py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">Errors & limits</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { code: '401', title: 'Invalid or missing API key', fix: 'Check the Authorization header. Keys are shown only once at creation.' },
              { code: '403', title: 'Missing scope', fix: 'Your key lacks the required scope (e.g. messages:send). Create a key with the right scopes.' },
              { code: '400', title: 'Validation error', fix: 'The response body explains the exact field problem — e.g. 24-hour window closed, invalid phone.' },
              { code: '429', title: 'Rate limited', fix: 'Slow down and retry after a minute. Bulk endpoints have their own caps (100 numbers/call).' },
            ].map(err => (
              <div key={err.code} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-red-400">{err.code}</span>
                  <span className="text-sm font-semibold">{err.title}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-500">{err.fix}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#00F2FE]/15 bg-[#00F2FE]/[0.03] p-6 text-center">
            <p className="text-sm text-zinc-400">
              Need an endpoint that isn&apos;t here? The full interactive Swagger spec is at{' '}
              <a href={`${BASE_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-[#00F2FE] hover:underline">{BASE_URL}/docs</a>
              {' '}— or tell us what you&apos;re building and we&apos;ll prioritise it.
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
