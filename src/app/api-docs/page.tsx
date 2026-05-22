'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing-shell';
import { ChevronDown, Copy, Check } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

type ApiEndpoint = {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  body?: Record<string, string>;
  params?: Array<{ name: string; desc: string }>;
};

type ApiGroup = {
  tag: string;
  label: string;
  color: string;
  description: string;
  endpoints: ApiEndpoint[];
};

const apiGroups: ApiGroup[] = [
  {
    tag: 'v1',
    label: 'REST API v1 — External Integrations',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    description: 'These endpoints use API Key authentication (b9_xxx). Generate a key from your dashboard → API Access. Pass it as: Authorization: Bearer YOUR_API_KEY',
    endpoints: [
      { method: 'GET',   path: '/api/v1/',                        description: 'API info — version, available endpoints, your plan',         auth: true },
      { method: 'GET',   path: '/api/v1/leads',                   description: 'List leads. Filters: ?status=hot&tag=opted_out&phone=91xxx', auth: true },
      { method: 'POST',  path: '/api/v1/leads',                   description: 'Create a new lead in CRM',                                  auth: true, body: { name: 'string', phone: 'string (E.164)', email: 'string (optional)', source: 'string' } },
      { method: 'GET',   path: '/api/v1/leads/{id}',              description: 'Get lead by ID with full conversation history',              auth: true },
      { method: 'PATCH', path: '/api/v1/leads/{id}',              description: 'Update lead status, tag, score, or pipeline stage',         auth: true, body: { status: 'hot | warm | cold | contacted | won | lost', tag: 'string', score: 'number 0-10' } },
      { method: 'POST',  path: '/api/v1/whatsapp/send-template',  description: 'Send approved WhatsApp template. Works anytime (no 24h limit)',auth: true, body: { phone: 'string (E.164)', template_name: 'string', language_code: 'en_US | hi | gu ...', variables: ['string'] } },
      { method: 'POST',  path: '/api/v1/whatsapp/send-text',      description: 'Send plain text. Only within 24h of customer last message', auth: true, body: { phone: 'string', message: 'string' } },
      { method: 'GET',   path: '/api/v1/whatsapp/status',         description: 'WhatsApp connection health + phone number details',          auth: true },
      { method: 'GET',   path: '/api/v1/messages',                description: 'List outbound messages. Filters: ?status=sent&limit=20',    auth: true },
      { method: 'GET',   path: '/api/v1/templates',               description: 'List APPROVED WhatsApp templates with components',           auth: true },
      { method: 'GET',   path: '/api/v1/catalog',                 description: 'List products in your catalog',                             auth: true },
      { method: 'GET',   path: '/api/v1/campaigns',               description: 'List campaigns with delivery stats',                        auth: true },
      { method: 'GET',   path: '/api/v1/automations',             description: 'List all automation workflows',                             auth: true },
      { method: 'POST',  path: '/api/v1/automations/{id}/run',    description: 'Trigger a workflow run with custom context',                auth: true, body: { context: { lead_id: 'string (optional)', message: 'string (optional)' } } },
      { method: 'GET',   path: '/api/v1/payments',                description: 'List customer payment records',                             auth: true },
      { method: 'POST',  path: '/api/v1/payments/link',           description: 'Create Razorpay payment link for a customer',               auth: true, body: { phone: 'string', amount: 'number (paise)', description: 'string', lead_id: 'string (optional)' } },
      { method: 'GET',   path: '/api/v1/analytics',               description: '30-day usage summary: leads, messages, campaigns, revenue', auth: true },
    ],
  },
  {
    tag: 'auth',
    label: 'Authentication',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    description: 'Sign up, log in, verify email, reset password.',
    endpoints: [
      { method: 'POST', path: '/api/auth/signup', description: 'Register a new user account', body: { email: 'string', password: 'string', name: 'string' } },
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate and get access token', body: { email: 'string', password: 'string' } },
      { method: 'GET', path: '/api/auth/verify-email', description: 'Verify email address with token', params: [{ name: 'token', desc: 'Email verification token' }] },
      { method: 'POST', path: '/api/auth/forgot-password', description: 'Send password reset email', body: { email: 'string' } },
      { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password with token', body: { token: 'string', password: 'string' } },
    ],
  },
  {
    tag: 'assistants',
    label: 'AI Assistants',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    description: 'Create and manage AI assistants powered by your knowledge base.',
    endpoints: [
      { method: 'POST', path: '/api/assistants', description: 'Create a new AI assistant', auth: true, body: { name: 'string', description: 'string', workspace_id: 'string' } },
      { method: 'GET', path: '/api/assistants', description: 'List all assistants for current user', auth: true },
      { method: 'GET', path: '/api/assistants/{workspace_id}', description: 'Get assistants for a workspace', auth: true },
      { method: 'PUT', path: '/api/assistants/{assistant_id}', description: 'Update assistant settings', auth: true },
      { method: 'DELETE', path: '/api/assistants/{assistant_id}', description: 'Delete an assistant', auth: true },
    ],
  },
  {
    tag: 'documents',
    label: 'Documents',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    description: 'Upload and manage knowledge documents for AI training.',
    endpoints: [
      { method: 'POST', path: '/api/documents/{assistant_id}/upload', description: 'Upload a document (PDF, DOCX, etc.)', auth: true, body: { file: 'File (multipart/form-data)' } },
      { method: 'POST', path: '/api/documents/{assistant_id}/url', description: 'Ingest content from a URL', auth: true, body: { url: 'string' } },
      { method: 'POST', path: '/api/documents/{assistant_id}/youtube', description: 'Ingest a YouTube video', auth: true, body: { url: 'string (YouTube URL)' } },
      { method: 'GET', path: '/api/documents/{assistant_id}', description: 'List all documents for an assistant', auth: true },
      { method: 'DELETE', path: '/api/documents/{document_id}', description: 'Delete a document', auth: true },
    ],
  },
  {
    tag: 'chat',
    label: 'Chat',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    description: 'Chat with AI assistants via REST or WebSocket.',
    endpoints: [
      { method: 'POST', path: '/api/chat/{assistant_id}/message', description: 'Send a message and get AI response', body: { message: 'string', session_id: 'string (optional)' } },
      { method: 'WS', path: '/api/chat/ws/{assistant_id}', description: 'WebSocket: real-time streaming chat', body: { message: 'string' } },
      { method: 'GET', path: '/api/chat/{session_id}/history', description: 'Get full chat history for a session', auth: true },
    ],
  },
  {
    tag: 'leads',
    label: 'Leads',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    description: 'Capture, qualify, and manage leads from chatbot interactions.',
    endpoints: [
      { method: 'GET', path: '/api/leads', description: 'List all leads', auth: true },
      { method: 'GET', path: '/api/leads/pipeline', description: 'Get leads grouped by pipeline stage', auth: true },
      { method: 'GET', path: '/api/leads/inbox', description: 'Get live chat inbox', auth: true },
      { method: 'PATCH', path: '/api/leads/{lead_id}', description: 'Update lead details or status', auth: true },
      { method: 'POST', path: '/api/leads/{lead_id}/qualify', description: 'AI-qualify a lead automatically', auth: true },
      { method: 'POST', path: '/api/leads/{lead_id}/follow-up', description: 'Schedule a follow-up for a lead', auth: true },
    ],
  },
  {
    tag: 'automation',
    label: 'Automation & Workflows',
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    description: 'Build and run no-code automation workflows.',
    endpoints: [
      { method: 'GET', path: '/api/automation/workflows', description: 'List all workflows', auth: true },
      { method: 'POST', path: '/api/automation/workflows', description: 'Create a new workflow', auth: true },
      { method: 'PUT', path: '/api/automation/workflows/{workflow_id}', description: 'Update a workflow', auth: true },
      { method: 'POST', path: '/api/automation/workflows/{workflow_id}/run', description: 'Trigger a workflow run', auth: true },
      { method: 'GET', path: '/api/automation/runs', description: 'List workflow runs', auth: true },
      { method: 'GET', path: '/api/automation/schedules', description: 'List scheduled workflows', auth: true },
      { method: 'POST', path: '/api/automation/schedules', description: 'Create a schedule trigger', auth: true },
      { method: 'WS', path: '/api/automation/ws/runs/{run_id}', description: 'WebSocket: real-time workflow run events' },
    ],
  },
  {
    tag: 'widgets',
    label: 'Widgets',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    description: 'Embed chatbot widgets on any website.',
    endpoints: [
      { method: 'POST', path: '/api/widgets/{assistant_id}/config', description: 'Configure widget appearance', auth: true },
      { method: 'POST', path: '/api/widgets/{assistant_id}/domains', description: 'Add an allowed domain', auth: true },
      { method: 'GET', path: '/api/widgets/{assistant_id}/domains', description: 'List allowed domains', auth: true },
      { method: 'DELETE', path: '/api/widgets/{assistant_id}/domains/{domain_id}', description: 'Remove a domain', auth: true },
      { method: 'GET', path: '/api/widgets/{assistant_id}/embed-code', description: 'Get embed script for website', auth: true },
      { method: 'POST', path: '/api/widgets/{assistant_id}/message', description: 'Public widget chat endpoint', body: { message: 'string', session_id: 'string' } },
    ],
  },
  {
    tag: 'analytics',
    label: 'Analytics',
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    description: 'Track usage, conversations, and business impact.',
    endpoints: [
      { method: 'GET', path: '/api/analytics/dashboard', description: 'Get analytics dashboard summary', auth: true },
      { method: 'GET', path: '/api/analytics/business-impact', description: 'Get business impact metrics', auth: true },
      { method: 'GET', path: '/api/analytics/assistant/{assistant_id}', description: 'Get analytics for a specific assistant', auth: true },
      { method: 'GET', path: '/api/analytics/usage-trends', description: 'Get usage trend data over time', auth: true },
    ],
  },
  {
    tag: 'billing',
    label: 'Billing',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    description: 'Manage plans, payments, and invoices via Razorpay.',
    endpoints: [
      { method: 'GET', path: '/api/billing/current-plan', description: 'Get current subscription plan', auth: true },
      { method: 'POST', path: '/api/billing/create-order/{plan}', description: 'Create a Razorpay payment order', auth: true },
      { method: 'POST', path: '/api/billing/upgrade', description: 'Confirm plan upgrade after payment', auth: true },
      { method: 'GET', path: '/api/billing/invoices', description: 'List all invoices', auth: true },
      { method: 'POST', path: '/api/billing/webhook/razorpay', description: 'Razorpay webhook (server-to-server)' },
    ],
  },
  {
    tag: 'quota',
    label: 'Quota',
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    description: 'Check usage limits and quota status.',
    endpoints: [
      { method: 'GET', path: '/api/quota/status', description: 'Get current quota usage and limits', auth: true },
      { method: 'GET', path: '/api/quota/usage-log', description: 'Get detailed quota usage log', auth: true },
    ],
  },
  {
    tag: 'tasks',
    label: 'Tasks',
    color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    description: 'Manage tasks linked to leads and workflows.',
    endpoints: [
      { method: 'GET', path: '/api/tasks', description: 'List all tasks', auth: true },
      { method: 'POST', path: '/api/tasks', description: 'Create a new task', auth: true, body: { title: 'string', lead_id: 'string', due_date: 'ISO datetime' } },
      { method: 'PUT', path: '/api/tasks/{task_id}', description: 'Update a task', auth: true },
      { method: 'DELETE', path: '/api/tasks/{task_id}', description: 'Delete a task', auth: true },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-400 border-green-500/20',
  PUT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  WS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ApiDocsPage() {
  const [openGroup, setOpenGroup] = useState<string>('auth');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="0.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.06] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-6">
              <span className="text-sm font-medium text-gray-300">API Reference</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-bold mb-4">
              B9 Automation API
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Build custom integrations with B9. REST API v1 uses API Key auth. Internal APIs use JWT. All responses are JSON.
            </motion.p>

            {/* Base URL */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.03] px-5 py-3 font-mono text-sm mb-6">
              <span className="text-gray-500">Base URL</span>
              <span className="text-white">{BASE_URL}</span>
              <CopyButton text={BASE_URL} />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/api" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors">
                Get API Key →
              </Link>
              <a href={`${BASE_URL}/docs`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                Open Swagger UI ↗
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AUTH HEADER NOTE */}
      <section className="border-b border-white/[0.06] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key auth */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">REST API v1</span>
                <h3 className="font-semibold text-white text-sm">API Key Authentication</h3>
              </div>
              <p className="text-gray-400 text-xs mb-3">
                For external integrations — CRMs, Shopify, custom apps. Generate key from Dashboard → API Access. 22 permission scopes available.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-black/50 border border-white/[0.06] px-3 py-2 font-mono text-xs">
                <span className="text-gray-500">Authorization:</span>
                <span className="text-emerald-400">Bearer b9_xxxxxxxxxxxx</span>
                <CopyButton text="Authorization: Bearer b9_xxxxxxxxxxxx" />
              </div>
            </div>
            {/* JWT auth */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Dashboard APIs</span>
                <h3 className="font-semibold text-white text-sm">JWT Authentication</h3>
              </div>
              <p className="text-gray-400 text-xs mb-3">
                For dashboard access. Get token from <code className="bg-white/5 px-1 rounded text-gray-300">POST /api/auth/login</code>, then pass in every request.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-black/50 border border-white/[0.06] px-3 py-2 font-mono text-xs">
                <span className="text-gray-500">Authorization:</span>
                <span className="text-blue-400">Bearer eyJhbGciOiJIUzI1...</span>
                <CopyButton text="Authorization: Bearer <jwt_token>" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API GROUPS */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-1">
                {apiGroups.map((g) => (
                  <button
                    key={g.tag}
                    onClick={() => setOpenGroup(g.tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      openGroup === g.tag
                        ? 'bg-white/10 text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {g.label}
                    <span className="ml-2 text-xs text-gray-600">({g.endpoints.length})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Groups */}
            <div className="space-y-4">
              {apiGroups.map((group) => (
                <motion.div
                  key={group.tag}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.01] overflow-hidden"
                  id={group.tag}
                >
                  {/* Group Header */}
                  <button
                    className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
                    onClick={() => setOpenGroup(openGroup === group.tag ? '' : group.tag)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${group.color}`}>
                        {group.endpoints.length} endpoints
                      </span>
                      <h2 className="text-xl font-bold">{group.label}</h2>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openGroup === group.tag ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {openGroup === group.tag && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-2">
                          <p className="text-sm text-gray-500 mb-4">{group.description}</p>
                        </div>

                        <div className="divide-y divide-white/[0.04]">
                          {group.endpoints.map((ep, idx) => (
                            <div key={idx} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-start gap-3 flex-wrap mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${methodColors[ep.method] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                                  {ep.method}
                                </span>
                                {ep.auth && (
                                  <span className="text-xs text-yellow-500">🔒 Auth</span>
                                )}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <code className="text-sm text-gray-300 font-mono break-all">{ep.path}</code>
                                  <CopyButton text={`${BASE_URL}${ep.path}`} />
                                </div>
                              </div>

                              <p className="text-sm text-gray-500 mb-3">{ep.description}</p>

                              {ep.params && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Query Params</p>
                                  <div className="space-y-1">
                                    {ep.params.map((p, i) => (
                                      <div key={i} className="flex gap-3 text-xs">
                                        <code className="text-blue-400 font-mono">{p.name}</code>
                                        <span className="text-gray-600">{p.desc}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {ep.body && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Request Body</p>
                                  <div className="rounded-lg bg-black/50 border border-white/[0.06] p-3 font-mono text-xs">
                                    <pre className="text-gray-400 whitespace-pre-wrap">
                                      {JSON.stringify(ep.body, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black pt-16 pb-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-700">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p>Made with ♥ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
