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
        desc: 'Get an access token',
        body: `{"email": "you@company.com", "password": "yourpassword"}`,
        response: `{"access_token": "eyJ...", "user": {"id": "...", "email": "...", "plan": "GROWTH"}}`,
      },
      {
        method: 'POST', path: '/api/auth/refresh',
        desc: 'Refresh access token using cookie',
        body: null,
        response: `{"access_token": "eyJ...new..."}`,
      },
    ],
  },
  {
    group: 'Leads',
    color: 'blue',
    items: [
      {
        method: 'GET', path: '/api/leads?limit=50',
        desc: 'List leads (cursor pagination supported)',
        body: null,
        response: `[{"id": "...", "name": "Rahul Sharma", "phone": "+91XXXXXXXXXX", "score_label": "hot", "status": "new", "created_at": "2026-05-30T10:00:00"}]`,
      },
      {
        method: 'GET', path: '/api/leads?cursor=2026-05-30T10:00:00&limit=50',
        desc: 'Next page via cursor (faster than offset)',
        body: null,
        response: `[/* next 50 leads */]  // Header: X-Next-Cursor: 2026-05-29T...`,
      },
      {
        method: 'PATCH', path: '/api/leads/{lead_id}',
        desc: 'Update lead status or score',
        body: `{"status": "converted", "score_label": "hot"}`,
        response: `{"id": "...", "status": "converted", ...}`,
      },
      {
        method: 'POST', path: '/api/leads/merge',
        desc: 'Merge duplicate leads into one',
        body: `{"primary_lead_id": "abc", "duplicate_lead_ids": ["def", "ghi"]}`,
        response: `{"merged": 2, "primary_lead_id": "abc"}`,
      },
    ],
  },
  {
    group: 'Campaigns',
    color: 'emerald',
    items: [
      {
        method: 'GET', path: '/api/campaigns',
        desc: 'List all campaigns with status',
        body: null,
        response: `{"campaigns": [{"name": "Diwali 2026", "status": "completed", "sent": 450, "total": 500, "delivery_rate": 90}]}`,
      },
      {
        method: 'POST', path: '/api/campaigns/send',
        desc: 'Send a broadcast campaign',
        body: `{"name": "Diwali Sale", "message": "Hi {name}, 20% off today!", "recipient_filter": "hot", "msg_type": "template", "template_name": "diwali_offer", "language_code": "en_US"}`,
        response: `{"status": "queued", "queued": 245, "campaign_name": "Diwali Sale"}`,
      },
    ],
  },
  {
    group: 'WhatsApp',
    color: 'green',
    items: [
      {
        method: 'GET', path: '/api/automation/whatsapp/templates',
        desc: 'List approved WhatsApp templates',
        body: null,
        response: `{"data": [{"name": "diwali_offer", "status": "APPROVED", "language": "en_US", "category": "MARKETING"}]}`,
      },
      {
        method: 'POST', path: '/api/automation/outbound-messages',
        desc: 'Send a single WhatsApp message',
        body: `{"recipient": "+91XXXXXXXXXX", "message": "Hello Rahul!", "channel": "whatsapp"}`,
        response: `{"status": "sent", "message_id": "wamid..."}`,
      },
    ],
  },
  {
    group: 'Analytics',
    color: 'amber',
    items: [
      {
        method: 'GET', path: '/api/analytics/dashboard?days=30',
        desc: 'Get dashboard metrics',
        body: null,
        response: `{"leads_captured": 142, "hot_leads": 38, "messages_sent": 890, "ai_responses": 654, "conversion_rate": 26.7}`,
      },
    ],
  },
];

const CODE_EXAMPLES: Record<string, string> = {
  curl: `# Get your API key from Settings → API Keys
curl -X GET "${API_BASE}/api/leads?limit=10" \\
  -H "X-API-Key: b9_live_your_key_here" \\
  -H "Content-Type: application/json"`,

  javascript: `const B9_KEY = 'b9_live_your_key_here';
const BASE = '${API_BASE}';

async function getLeads(limit = 50) {
  const res = await fetch(\`\${BASE}/api/leads?limit=\${limit}\`, {
    headers: { 'X-API-Key': B9_KEY },
  });
  return res.json();
}

// Cursor pagination — efficient for large datasets
async function getAllLeads() {
  const all = [];
  let cursor = null;
  do {
    const url = cursor
      ? \`\${BASE}/api/leads?limit=50&cursor=\${cursor}\`
      : \`\${BASE}/api/leads?limit=50\`;
    const res = await fetch(url, { headers: { 'X-API-Key': B9_KEY } });
    const leads = await res.json();
    all.push(...leads);
    cursor = res.headers.get('x-next-cursor');
  } while (cursor);
  return all;
}`,

  python: `import requests

B9_KEY = 'b9_live_your_key_here'
BASE = '${API_BASE}'
HEADERS = {'X-API-Key': B9_KEY}

def get_leads(limit=50):
    r = requests.get(f'{BASE}/api/leads', params={'limit': limit}, headers=HEADERS)
    r.raise_for_status()
    return r.json()

# Send a campaign
def send_campaign(name, template_name, recipient_filter='hot'):
    r = requests.post(f'{BASE}/api/campaigns/send', headers=HEADERS, json={
        'name': name,
        'msg_type': 'template',
        'template_name': template_name,
        'recipient_filter': recipient_filter,
        'language_code': 'en_US',
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
            <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer"
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition">
              <ExternalLink className="h-3.5 w-3.5" /> Swagger UI
            </a>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex gap-1">
            {([
              { key: 'endpoints', icon: BookOpen, label: 'Endpoints' },
              { key: 'examples', icon: Terminal, label: 'Code Examples' },
              { key: 'auth', icon: Key, label: 'Authentication' },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === key ? 'bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* AUTH TAB */}
        {activeTab === 'auth' && (
          <div className="space-y-6 max-w-2xl">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-4 w-4 text-[#00F2FE]" />
                <h2 className="text-base font-bold">API Key Authentication</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Pass your API key in the <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-[#00F2FE]">X-API-Key</code> header on every request.</p>
              <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 font-mono">Request header</span>
                  <CopyButton text="X-API-Key: b9_live_your_key_here" />
                </div>
                <pre className="text-xs text-emerald-400 font-mono">X-API-Key: b9_live_your_key_here</pre>
              </div>
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                API keys require the <strong>PRO plan</strong>. Generate keys at <strong>Dashboard → API Keys</strong>.
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-base font-bold mb-4">Rate Limits</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['PRO plan', '1,000 requests / minute'],
                  ['BUSINESS plan', '5,000 requests / minute'],
                  ['Rate limit header', 'X-RateLimit-Remaining'],
                  ['Exceeded response', 'HTTP 429 Too Many Requests'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/[0.04] pb-2">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-zinc-300 font-mono text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === 'endpoints' && (
          <div className="space-y-8">
            {ENDPOINTS.map((group) => (
              <div key={group.group}>
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#00F2FE]" />
                  <h2 className="text-sm font-bold text-white">{group.group}</h2>
                </div>
                <div className="space-y-2">
                  {group.items.map((ep) => {
                    const key = `${ep.method}${ep.path}`;
                    const isOpen = openEndpoint === key;
                    return (
                      <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                        <button
                          onClick={() => setOpenEndpoint(isOpen ? null : key)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition"
                        >
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold font-mono ${METHOD_COLORS[ep.method] || ''}`}>{ep.method}</span>
                          <code className="text-sm text-zinc-300 font-mono flex-1">{ep.path}</code>
                          <span className="text-xs text-zinc-500">{ep.desc}</span>
                          <span className="text-zinc-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-white/[0.06] px-4 py-4 space-y-3">
                            {ep.body && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Request Body</span>
                                  <CopyButton text={ep.body} />
                                </div>
                                <pre className="rounded-xl bg-black/40 border border-white/[0.06] p-3 text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">{ep.body}</pre>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Response</span>
                                <CopyButton text={ep.response} />
                              </div>
                              <pre className="rounded-xl bg-black/40 border border-white/[0.06] p-3 text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
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

        {/* CODE EXAMPLES TAB */}
        {activeTab === 'examples' && (
          <div className="space-y-4">
            <div className="flex gap-1">
              {(['curl', 'javascript', 'python'] as const).map((lang) => (
                <button key={lang} onClick={() => setCodeLang(lang)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${codeLang === lang ? 'bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20' : 'text-zinc-500 border border-white/[0.06] hover:text-zinc-300'}`}>
                  {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : 'Python'}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/40 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                <span className="text-xs text-zinc-500 font-mono">{codeLang === 'curl' ? 'shell' : codeLang}</span>
                <CopyButton text={CODE_EXAMPLES[codeLang]} />
              </div>
              <pre className="p-5 text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre leading-relaxed">{CODE_EXAMPLES[codeLang]}</pre>
            </div>

            {/* Postman badge */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-sm">📮</div>
              <div>
                <p className="text-xs font-bold text-white">Postman Collection</p>
                <p className="text-xs text-zinc-500">Import all endpoints into Postman — set <code className="text-zinc-300">b9_key</code> variable and start testing</p>
              </div>
              <a href={`${API_BASE}/openapi.json`} target="_blank" rel="noreferrer"
                className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition">
                <ExternalLink className="h-3 w-3" /> OpenAPI JSON
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
