'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';
import { marketingNav, allFeatures } from '@/lib/marketing';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { MagneticButton } from '@/components/premium-motion';

export function MarketingNav({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { user } = useAuthStore();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const isDark = variant === 'dark';

  return (
    <header
      className={`sticky top-0 z-50 border-b ${
        isDark
          ? 'bg-slate-950/95 backdrop-blur-xl border-white/[0.06]'
          : 'bg-white/90 backdrop-blur border-orange-100'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant={isDark ? 'dark' : 'light'} />

        <nav className="hidden items-center gap-7 md:flex">
          {/* Home */}
          <MagneticButton strength={0.3}>
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Home
            </Link>
          </MagneticButton>

          {/* Features dropdown */}
          <div className="relative">
            <MagneticButton strength={0.3}>
              <button
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Features
                <ChevronDown className={`h-4 w-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
            </MagneticButton>
            <AnimatePresence>
              {featuresOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-96 rounded-xl border border-white/10 bg-black p-4 shadow-2xl shadow-black/80 max-h-[500px] overflow-y-auto z-50"
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <div className="space-y-1">
                    {allFeatures.map((f) => {
                      const Icon = f.icon;
                      return (
                        <Link
                          key={f.title}
                          href={f.href}
                          onClick={() => setFeaturesOpen(false)}
                          className="flex gap-3 rounded-lg p-2.5 hover:bg-white/5 hover:translate-x-1.5 transition-all duration-300 group"
                        >
                          <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-300 group-hover:scale-110 transition-transform duration-300 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-300 group-hover:text-white">{f.title}</p>
                            <p className="text-xs text-gray-600 group-hover:text-gray-500">{f.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other nav links */}
          {marketingNav.map((item) => (
            <MagneticButton key={item.href} strength={0.3}>
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                {item.label}
              </Link>
            </MagneticButton>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={user ? '/dashboard' : '/login'}
            className={`hidden sm:block text-sm font-medium transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-950'
            }`}
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
          <MagneticButton>
            <Link
              href={user ? '/dashboard' : '/signup'}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                isDark
                  ? 'border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] text-white backdrop-blur-xl hover:bg-[#00F2FE]/[0.22] hover:shadow-[0_0_20px_rgba(0,242,254,0.25)]'
                  : 'bg-gray-950 text-white hover:bg-gray-800'
              }`}
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <footer className={`border-t ${isDark ? 'bg-black border-white/[0.06]' : 'bg-white border-orange-100'}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Logo variant={isDark ? 'dark' : 'light'} size="lg" />
          <p className={`mt-4 max-w-sm text-sm leading-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            India&apos;s WhatsApp Agentic AI platform — qualify leads, collect payments, and run campaigns automatically.
          </p>
        </div>

        {[
          { title: 'Product', links: [['Features', '/features'], ['How It Works', '/how-it-works'], ['Integrations', '/integrations'], ['Pricing', '/pricing']] },
          { title: 'Resources', links: [['Blog', '/blog'], ['Changelog', '/changelog'], ['API Docs', '/api-docs'], ['FAQ', '/features#faq']] },
          { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Data Deletion', '/deletion']] },
        ].map((group) => (
          <div key={group.title}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>{group.title}</h3>
            <div className="mt-4 space-y-3">
              {group.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`block text-sm ${isDark ? 'text-zinc-500 hover:text-[#00F2FE] transition-colors' : 'text-gray-600 hover:text-gray-950 transition-colors'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`border-t py-5 ${isDark ? 'border-white/[0.06]' : 'border-orange-100'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className={isDark ? 'text-gray-600' : 'text-gray-500'}>© 2026 B9 Automation. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Data Deletion', '/deletion']].map(([label, href]) => (
              <Link key={label} href={href} className={`${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingCta({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <section className={`relative border-t px-6 py-20 lg:px-8 ${isDark ? 'bg-black border-white/[0.04]' : 'bg-gray-50 border-gray-200'}`}>
      {isDark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="h-[300px] w-[600px] rounded-full bg-[#00F2FE]/[0.04] blur-[100px]" />
        </div>
      )}
      <div className="relative mx-auto max-w-3xl text-center">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] mb-5 ${isDark ? 'border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] text-[#00F2FE]' : 'border border-gray-200 bg-white text-gray-500'}`}>
          Get Started
        </span>
        <h2 className={`mb-4 text-4xl font-bold tracking-tight ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400' : 'text-gray-950'}`} style={{ letterSpacing: '-0.02em' }}>
          Turn your knowledge into an AI assistant today.
        </h2>
        <p className={`mb-8 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
          Start free, create your first assistant, upload documents, and ask your first question in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-bold backdrop-blur-xl transition-all duration-300 ${isDark ? 'border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] text-white hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]' : 'bg-gray-950 text-white hover:bg-gray-800'}`}
          >
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-semibold transition-all duration-300 ${isDark ? 'border border-white/[0.08] bg-white/[0.03] text-zinc-300 backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.06]' : 'border border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
