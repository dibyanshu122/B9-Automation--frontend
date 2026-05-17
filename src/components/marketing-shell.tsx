'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { marketingNav, allFeatures } from '@/lib/marketing';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, ChevronDown } from 'lucide-react';

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
        {isDark ? (
          <Logo variant="dark" />
        ) : (
          <Link href="/" className="flex items-center">
            <Image
              src="/b9-automation-logo.jpg"
              alt="B9 Automation logo"
              width={165}
              height={110}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        )}

        <nav className="hidden items-center gap-7 md:flex">
          {/* Features dropdown */}
          <div className="relative">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Features
              <ChevronDown className={`h-4 w-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
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
                          className="flex gap-3 rounded-lg p-2.5 hover:bg-white/5 transition group"
                        >
                          <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-300 shrink-0 mt-0.5" />
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
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              {item.label}
            </Link>
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
          <Link href={user ? '/dashboard' : '/signup'}>
            <Button
              variant="primary"
              size="sm"
              style={isDark ? { background: 'white', color: '#111827', boxShadow: 'none' } : undefined}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <footer className={`border-t ${isDark ? 'bg-slate-900 border-white/[0.06]' : 'bg-white border-orange-100'}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          {isDark ? (
            <Logo variant="dark" />
          ) : (
            <div className="flex items-center">
              <Image
                src="/b9-automation-logo.jpg"
                alt="B9 Automation logo"
                width={220}
                height={147}
                className="h-24 w-auto object-contain"
              />
            </div>
          )}
          <p className={`mt-4 max-w-sm text-sm leading-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Upload, organize, chat, and embed AI assistants trained on your own knowledge.
          </p>
        </div>

        {[
          { title: 'Product', links: [['Features', '/features'], ['How It Works', '/how-it-works'], ['Pricing', '/pricing'], ['Dashboard', '/dashboard']] },
          { title: 'Resources', links: [['Blog', '/blog'], ['Changelog', '/changelog'], ['FAQ', '/features#faq']] },
          { title: 'Company', links: [['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/privacy']] },
        ].map((group) => (
          <div key={group.title}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>{group.title}</h3>
            <div className="mt-4 space-y-3">
              {group.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`block text-sm ${isDark ? 'text-gray-500 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`border-t py-5 text-center text-sm ${isDark ? 'border-white/[0.06] text-gray-600' : 'border-orange-100 text-gray-500'}`}>
        © 2026 B9 Automation. All rights reserved.
      </div>
    </footer>
  );
}

export function MarketingCta({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <section className={`px-4 py-20 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950' : ''}`}>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-orange-100 bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-white shadow-xl shadow-orange-100 md:p-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.6fr] md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Turn your knowledge into an AI assistant today.</h2>
            <p className="mt-3 text-orange-50">Start free, create your first assistant, upload documents, and ask your first question in minutes.</p>
          </div>
          <Link href="/signup" className="md:justify-self-end">
            <Button className="w-full bg-white text-primary-600 hover:bg-orange-50 md:w-auto" size="lg">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
