'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Key, Zap, Code2, BookOpen, Terminal } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

const ENDPOINTS = [
  {
    group: 'Authentication',
    color: 'violet',
    items: [
      {
        method: 'POST', path: '/api/auth/login',
        desc: 'Get an access token (session login)',
        body: `{"email": "you@company.com", "password": "yourpassword"}`,
        response: `{"access_token": "eyJ...", "user": {"id": "...", "email": "...", "plan": "GROWTH"}}`,
      },
    ],
  },
  {
    group: 'Leads',
    color: 'blue',
    items: [
      {
        method: 'GET', path: '/api/v1/leads?limit=50',
        desc: 'List leads — scope: leads:read',
        body: null,
        response: `[{"id": "...", "name": "Rahul Sharma", "phone": "+91XXXXXXXXXX", "score_label": "hot", "status": "new", "created_at": "2026-05-30T10:00:00"}]`,
      },
      {
        method: 'GET', path: '/api/v1/leads?status=hot&limit=20',
        desc: 'Filter hot leads — scope: leads:read',
        body: null,
        response: `[/* hot leads only */]`,
      },
      {
        method: 'POST', path: '/api/v1/leads',
        desc: 'Create a new lead — scope: leads:write',
        body: `{"name": "Rahul Sharma", "phone": "91XXXXXXXXXX", "email": "rahul@example.com", "source": "shopify"}`,
        response: `{"id": "...", "name": "Rahul Sharma", "status": "new", ...}`,
      },
      {
        method: 'PATCH', path: '/api/v1/leads/{id}',
        desc: 'Update lead status/tag/score — scope: leads:write',
        body: `{"status": "hot", "tag": "interested", "score": 8}`,
        response: `{"id": "...", "status": "hot", ...}`,
      },
    ],
  },
  {
    group: 'WhatsApp Messages',
    color: 'green',
    items: [
      {
        method: 'POST', path: '/api/v1/whatsapp/send-template',
        desc: 'Send approved template (any time) — scope: messages:send',
        body: `{"phone": "91XXXXXXXXXX", "template_name": "order_confirmed", "language_code": "en_US", "variables": ["Rahul", "ORD-123"]}`,
        response: `{"status": "sent", "message_id": "wamid..."}`,
      },
      {
        method: 'POST', path: '/api/v1/whatsapp/send-text',
        desc: 'Send plain text — 24h window only — scope: messages:send',
        body: `{"phone": "91XXXXXXXXXX", "message": "Hi! Your order is ready."}`,
        response: `{"status": "sent", "message_id": "wamid..."}`,
      },
      {
        method: 'GET', path: '/api/v1/whatsapp/status',
        desc: 'WhatsApp connection health — scope: integrations:read',
        body: null,
        response: `{"connected": true, "phone_number": "+91XXXXXXXXXX", "tier": "TIER_1"}`,
      },
      {
        method: 'GET', path: '/api/v1/messages?status=sent&limit=20',
        desc: 'List outbound messages — scope: messages:read',
        body: null,
        response: `[{"id": "...", "recipient": "91XXXXXXXXXX", "status": "delivered", ...}]`,
      },
      {
        method: 'GET', path: '/api/v1/templates',
        desc: 'List APPROVED WhatsApp templates — scope: templates:read',
        body: null,
        response: `[{"name": "order_confirmed", "status": "APPROVED", "language": "en_US", "category": "UTILITY"}]`,
      },
    ],
  },
  {
    group: 'Campaigns',
    color: 'emerald',
    items: [
      {
        method: 'GET', path: '/api/v1/campaigns',
        desc: 'List campaigns with stats — scope: campaigns:read',
        body: null,
        response: `[{"name": "Diwali 2026", "status": "completed", "sent": 450, "total": 500, "delivery_rate": 90}]`,
      },
    ],
  },
  {
    group: 'Analytics',
    color: 'amber',
    items: [
      {
        method: 'GET', path: '/api/v1/analytics',
        desc: '30-day usage summary — scope: analytics:read',
        body: null,
        response: `{"leads_captured": 142, "hot_leads": 38, "automations_run": 890, "conversion_rate": 26.7}`,
      },
    ],
  },
  {
    group: 'Payments',
    color: 'rose',
    items: [
      {
        method: 'GET', path: '/api/v1/payments',
        desc: 'List payment records — scope: payments:read',
        body: null,
        response: `[{"id": "...", "amount_paise": 49900, "status": "paid", "customer_phone": "91XXXXXXXXXX"}]`,
      },
      {
        method: 'POST', path: '/api/v1/payments/link',
        desc: 'Create Razorpay payment link — scope: payments:write',
        body: `{"phone": "91XXXXXXXXXX", "amount": 49900, "description": "Coaching fee - June batch", "lead_id": "lead_abc123"}`,
        response: `{"short_url": "https://rzp.io/...", "payment_link_id": "plink_..."}`,
      },
    ],
  },
  {
    group: 'Automations',
    color: 'purple',
    items: [
      {
        method: 'GET', path: '/api/v1/automations',
        desc: 'List workflows — scope: automations:read',
        body: null,
        response: `[{"id": "...", "name": "Welcome Flow", "status": "active", "trigger_type": "new_whatsapp_lead"}]`,
      },
      {
        method: 'POST', path: '/api/v1/automations/{id}/run',
        desc: 'Trigger a workflow — scope: automations:run',
        body: `{"context": {"lead_id": "lead_abc123", "message": "interested in product"}}`,
        response: `{"run_id": "...", "status": "running"}`,
      },
    ],
  },
];

const CODE_EXAMPLES: Record<string, string> = {
  curl: `# Get your API key from Dashboard → Settings → API Keys
# Auth: Authorization: Bearer b9_live_your_key_here

# List leads
curl -X GET "${API_BASE}/api/v1/leads?limit=10" \\
  -H "Authorization: Bearer b9_live_your_key_here" \\
  -H "Content-Type: application/json"

# Send WhatsApp template
curl -X POST "${API_BASE}/api/v1/whatsapp/send-template" \\
  -H "Authorization: Bearer b9_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"91XXXXXXXXXX","template_name":"order_confirmed","language_code":"en_US","variables":["Rahul","ORD-123"]}'`,

  javascript: `const B9_KEY = 'b9_live_your_key_here';
const BASE = '${API_BASE}';
const headers = {
  'Authorization': \`Bearer \${B9_KEY}\`,
  'Content-Type': 'application/json',
};

// List leads
async function getLeads(limit = 50) {
  const res = await fetch(\`\${BASE}/api/v1/leads?limit=\${limit}\`, { headers });
  return res.json();
}

// Send WhatsApp template
async function sendTemplate(phone, templateName, variables = []) {
  const res = await fetch(\`\${BASE}/api/v1/whatsapp/send-template\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone, template_name: templateName, language_code: 'en_US', variables }),
  });
  return res.json();
}`,

  python: `import requests

B9_KEY = 'b9_live_your_key_here'
BASE = '${API_BASE}'
HEADERS = {
    'Authorization': f'Bearer {B9_KEY}',
    'Content-Type': 'application/json',
}

# List leads
def get_leads(limit=50):
    r = requests.get(f'{BASE}/api/v1/leads', params={'limit': limit}, headers=HEADERS)
    r.raise_for_status()
    return r.json()

# Send WhatsApp template
def send_template(phone, template_name, variables=None):
    r = requests.post(f'{BASE}/api/v1/whatsapp/send-template', headers=HEADERS, json={
        'phone': phone,
        'template_name': template_name,
        'language_code': 'en_US',
        'variables': variables or [],
    })
    return r.json()`,
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PATCH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition">
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'examples' | 'auth'>('endpoints');
  const [codeLang, setCodeLang] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#030712]/80 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/20">
              <Code2 className="h-5 w-5 text-[#00F2FE]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">B9 Automation API</h1>
              <p className="text-xs text-zinc-500">REST API v1 · Requires PRO plan · Base URL: <span className="text-zinc-300 font-mono">{API_BASE}</span></p>
            </div>
          </div>

          <div className="mt-4 flex gap-1">
            {(['endpoints', 'examples', 'auth'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {tab === 'endpoints' ? 'Endpoints' : tab === 'examples' ? 'Code Examples' : 'Authentication'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* AUTH TAB */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Key className="h-5 w-5 text-[#00F2FE]" /> Authentication</h2>
              <p className="text-zinc-400 text-sm mb-4">All v1 API calls require an API key. Get yours from <strong>Dashboard → Settings → API Keys</strong>.</p>
              <div className="rounded-lg bg-black/40 p-4 font-mono text-sm text-zinc-300 border border-white/[0.06]">
                Authorization: Bearer b9_live_your_key_here
              </div>
              <p className="text-zinc-500 text-xs mt-3">Keys follow the format <code className="bg-white/5 px-1 rounded">b9_live_...</code> (production) or <code className="bg-white/5 px-1 rounded">b9_test_...</code> (sandbox).</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-sm font-semibold text-amber-400 mb-1">Scope-based access</p>
              <p className="text-xs text-amber-300/70">Each API key has specific scopes. Example: a key with only <code className="bg-black/20 px-1 rounded">leads:read</code> cannot send messages. Assign only the scopes your integration needs.</p>
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#00F2FE]/20 bg-[#00F2FE]/5 p-4 text-sm text-zinc-300">
              <strong className="text-[#00F2FE]">Base URL:</strong> <code className="font-mono">{API_BASE}/api/v1/</code>
              {' · '}
              <strong className="text-[#00F2FE]">Auth:</strong> <code className="font-mono">Authorization: Bearer b9_live_...</code>
            </div>
            {ENDPOINTS.map(group => (
              <div key={group.group}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">{group.group}</h2>
                <div className="space-y-2">
                  {group.items.map(ep => {
                    const key = `${ep.method}:${ep.path}`;
                    const isOpen = openEndpoint === key;
                    return (
                      <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition"
                          onClick={() => setOpenEndpoint(isOpen ? null : key)}>
                          <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold font-mono ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                          <code className="text-sm text-zinc-300 font-mono flex-1">{ep.path}</code>
                          <span className="text-xs text-zinc-500">{ep.desc}</span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-white/[0.06] px-4 py-4 space-y-3">
                            {ep.body && (
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Request body</p>
                                <pre className="rounded-lg bg-black/40 p-3 text-xs text-zinc-300 overflow-x-auto">{ep.body}</pre>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Response</p>
                              <pre className="rounded-lg bg-black/40 p-3 text-xs text-emerald-300 overflow-x-auto">{ep.response}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXAMPLES TAB */}
        {activeTab === 'examples' && (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
              {(['curl', 'javascript', 'python'] as const).map(lang => (
                <button key={lang} onClick={() => setCodeLang(lang)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${codeLang === lang ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : 'Python'}
                </button>
              ))}
            </div>
            <div className="relative rounded-xl border border-white/[0.06] bg-black/60 overflow-hidden">
              <div className="absolute top-3 right-3">
                <CopyButton text={CODE_EXAMPLES[codeLang]} />
              </div>
              <pre className="p-6 text-sm text-zinc-300 overflow-x-auto leading-relaxed">{CODE_EXAMPLES[codeLang]}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
