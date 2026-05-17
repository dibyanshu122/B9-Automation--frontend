'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing-shell';
import { Mail, MessageSquare, Zap, Database, BarChart3, Lock, Cloud, BookOpen, Wifi, Code2, Settings, Send, Linkedin, Instagram, Youtube, Globe } from 'lucide-react';

const INTEGRATIONS = [
  {
    name: 'Email (SMTP)',
    description: 'Send automated emails to your customers with full tracking and analytics.',
    icon: Mail,
    category: 'Communication',
    status: 'Active',
  },
  {
    name: 'WhatsApp',
    description: 'Connect WhatsApp Business to send messages, handle conversations, and automate responses.',
    icon: MessageSquare,
    category: 'Communication',
    status: 'Active',
  },
  {
    name: 'Webhooks',
    description: 'Trigger workflows and receive events from external applications in real-time.',
    icon: Send,
    category: 'Developer Tools',
    status: 'Active',
  },
  {
    name: 'REST API',
    description: 'Full-featured API to build custom integrations and automate any workflow.',
    icon: Code2,
    category: 'Developer Tools',
    status: 'Active',
  },
  {
    name: 'Google Sheets',
    description: 'Sync data between B9 and Google Sheets automatically.',
    icon: Database,
    category: 'Data & Storage',
    status: 'Active',
  },
  {
    name: 'Zapier',
    description: 'Connect B9 with 5000+ apps through Zapier automation platform.',
    icon: Zap,
    category: 'Integration Platforms',
    status: 'Active',
  },
  {
    name: 'Make',
    description: 'Build complex workflows connecting B9 with dozens of other tools.',
    icon: Settings,
    category: 'Integration Platforms',
    status: 'Active',
  },
  {
    name: 'Slack',
    description: 'Receive notifications and manage conversations directly from Slack.',
    icon: Wifi,
    category: 'Communication',
    status: 'Active',
  },
  {
    name: 'Google Drive',
    description: 'Access and manage documents stored in Google Drive.',
    icon: Cloud,
    category: 'Data & Storage',
    status: 'Active',
  },
  {
    name: 'OpenAI',
    description: 'Leverage GPT models for advanced AI-powered automations.',
    icon: BookOpen,
    category: 'AI & Machine Learning',
    status: 'Active',
  },
  {
    name: 'Analytics',
    description: 'Export automation metrics to your favorite analytics tool.',
    icon: BarChart3,
    category: 'Analytics',
    status: 'Active',
  },
  {
    name: 'Security & SSO',
    description: 'Enterprise-grade authentication and access control for teams.',
    icon: Lock,
    category: 'Security',
    status: 'Active',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 mb-6 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Ecosystem</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Integrations & API</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Connect B9 with your favorite tools and build custom automations. Choose from pre-built integrations or use
            our REST API for unlimited possibilities.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-8">Available Integrations</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INTEGRATIONS.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={integration.name}
                    className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{integration.name}</h3>
                          <p className="text-xs text-gray-500">{integration.category}</p>
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        {integration.status}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{integration.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Powerful REST API</h2>
              <ul className="space-y-4">
                {['Complete API documentation', 'Authentication & authorization', 'Webhooks & real-time events', 'Rate limiting & quotas', 'SDKs in multiple languages', 'Comprehensive error handling'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <a
                  href="/api-docs"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  View API Docs
                </a>
                <a
                  href="/signup"
                  className="px-6 py-3 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Get API Key
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`curl -X GET \\
  https://api.b9automation.com/v1/automations \\
  -H "Authorization: Bearer YOUR_API_KEY"

{
  "data": [
    {
      "id": "auto_123",
      "name": "Welcome Email",
      "status": "active",
      "trigger": "lead_captured"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to integrate?</h2>
            <p className="text-lg text-gray-400 mb-8">Start building powerful automations with B9 today.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors">
                Get Started Free
              </button>
              <button className="px-8 py-3 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-white/[0.04]">
            <div>
              <div className="mb-4">
                <Logo variant="dark" />
              </div>
              <p className="text-sm text-gray-600 mt-4 max-w-xs leading-relaxed">Connect B9 with your favorite tools and build custom automations.</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {Object.entries({
                  Features: '/features',
                  Pricing: '/pricing',
                  Blog: '/blog',
                  Changelog: '/changelog',
                  Integrations: '/integrations',
                  'API Docs': '/api-docs',
                }).map(([link, href]) => (
                  <li key={link}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {[['About', '/about'], ['Blog', '/blog'], ['Careers', '#']].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Follow</h4>
              <div className="flex gap-4">
                {[
                  { icon: Linkedin, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: Youtube, href: '#' },
                  { icon: Globe, href: '#' },
                ].map(({ icon: Icon, href }, idx) => (
                  <a key={idx} href={href} className="text-gray-600 hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-700 pt-8">
            <p>© 2026 B9 Automation. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-gray-300">Privacy</a>
              <a href="/terms" className="hover:text-gray-300">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
