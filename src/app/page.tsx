'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { SplineViewer } from '@/components/spline-viewer';
import { featureHighlights, workflowSteps, allFeatures } from '@/lib/marketing';
import {
  ArrowRight, Bot, ChevronDown, MessageCircle, Sparkles, Users,
  CheckCircle2,
  Menu, X,
} from 'lucide-react';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// Inline data
const faqs = [
  {
    q: 'What is B9 Automation?',
    a: 'B9 Automation is an AI-powered no-code platform that automates customer interactions across WhatsApp, email, chat, and more. Set up AI chatbots, lead capture, automation workflows, and customer support in minutes without writing code.',
  },
  {
    q: 'Do I need coding knowledge to use B9?',
    a: 'No. B9 is a completely no-code platform. If you can describe what you want, our visual builder handles the rest. Thousands of non-technical users have deployed automations successfully.',
  },
  {
    q: 'Which platforms does B9 integrate with?',
    a: 'WhatsApp (Official Meta Cloud API), Gmail, Google Sheets, Facebook Lead Ads, Instagram DM, Razorpay, IndiaMART, and Shopify are live today. Webhook support and REST API v1 (22 scopes) let you connect any external tool.',
  },
  {
    q: 'How does the AI learn my business?',
    a: 'Upload your documents, FAQs, product catalog, URLs, or YouTube links. Our AI reads and understands everything, then answers customer questions with citations pointing to the source.',
  },
  {
    q: 'Can I use B9 for multiple businesses?',
    a: 'Yes. Our Growth, Pro, and Business plans support multiple assistants and workspaces. Agencies can manage client accounts from one dashboard — each with separate WhatsApp connections, leads, and automations.',
  },
  {
    q: 'Is my customer data safe?',
    a: 'Yes. All data is encrypted at rest and in transit (256-bit AES). We never train AI models on your data. WhatsApp tokens are stored encrypted using PBKDF2. We follow GDPR-ready practices: opt-out is durable and consent is logged.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes! Our free plan includes 30 AI credits, 1 PDF assistant, and 50MB storage. No WhatsApp or automation on the free plan. Upgrade to Starter (Rs. 1,499/mo) for WhatsApp + automation. No hidden charges, cancel anytime.',
  },
  {
    q: 'Do you offer onboarding or support?',
    a: 'Yes. We provide video tutorials, documentation, live chat support, and free 30-minute onboarding calls for paid plans.',
  },
  {
    q: 'Can I build WhatsApp bot automation?',
    a: 'Yes. B9 uses the official Meta WhatsApp Cloud API. Build broadcast campaigns, automated reply sequences, lead qualification bots, catalog+payment flows, and AI-generated Meta templates. 24-hour window rules are enforced automatically — only approved templates go out after the window closes.',
  },
  {
    q: 'What if I need a custom integration?',
    a: 'Use our Webhook feature to connect ANY external tool or API. Full REST API available for custom integrations.',
  },
];

const liveIntegrations = [
  { label: 'WhatsApp Business', icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, desc: 'Official Meta Cloud API — send, receive, automate' },
  { label: 'Instagram DM',     icon: <svg viewBox="0 0 24 24" width="28" height="28"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>, desc: 'Auto-reply to DMs, capture as leads' },
  { label: 'Facebook Lead Ads',icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, desc: 'Auto-capture form leads into CRM' },
  { label: 'Gmail',            icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#EA4335"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>, desc: 'Sync inbox, create draft replies, send' },
  { label: 'Google Sheets',    icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#0F9D58"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>, desc: 'Push leads and data to sheets automatically' },
  { label: 'Razorpay',         icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#3395FF"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-8h7v2h-7zm0 4h7v2h-7zm-4-4h2v6H8z"/></svg>, desc: 'Payment links, invoices, webhook triggers' },
  { label: 'IndiaMART',        icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#E65100"><path d="M12 2L2 12h3v8h14v-8h3L12 2zM9 18H7v-2h2v2zm0-4H7v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>, desc: 'Auto-capture B2B leads from IndiaMART' },
  { label: 'Shopify',          icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="#95BF47"><path d="M19 6h-3V5c0-2.8-2.2-5-5-5S6 2.2 6 5v1H3l-1.5 16h21L19 6zm-8-4c1.7 0 3 1.3 3 3v1H10V5c0-1.7 1.3-3 3-3zM8 8v3a1 1 0 102 0V8h4v3a1 1 0 102 0V8h3.3l1.1 12H3.6l1.1-12H8z"/></svg>, desc: 'Order webhooks, customer sync' },
  { label: 'Webhooks / REST',  icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>, desc: 'Connect any external tool or API' },
];


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">{children}</span>
      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
    </div>
  );
}

function SectionLabelLeft({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">{children}</span>
      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
    </div>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  // Suppress Spline viewer console errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalError = console.error.bind(console);
      console.error = (...args: any[]) => {
        const first = args[0];
        const isEmptyObjectError =
          args.length === 1 &&
          first &&
          typeof first === 'object' &&
          !Array.isArray(first) &&
          Object.keys(first).length === 0;
        if (
          isEmptyObjectError ||
          first?.message?.includes('buildTimeline') ||
          first?.toString?.().includes('spline') ||
          first?.toString?.().includes('Missing property')
        ) {
          return;
        }
        originalError(...args);
      };
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-gray-200 selection:bg-white/20 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* JSON-LD structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'B9 Automation',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'AI-powered WhatsApp bot, lead capture, and business automation platform for Indian SMEs.',
          url: 'https://b9automation.com',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          author: { '@type': 'Organization', name: 'B9 Automation', url: 'https://b9automation.com' },
        })}}
      />
      <style>{`
        spline-viewer::part(button), spline-viewer::part(logo), spline-viewer::part(hint),
        spline-viewer button, spline-viewer .logo, spline-viewer .hint,
        spline-viewer a, spline-viewer #logo,
        [data-spline-logo], .spline-logo, .spline-hint {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .premium-glow { box-shadow: 0 0 80px rgba(255,255,255,0.03); }
        .premium-text-gradient { background: linear-gradient(to bottom right, #ffffff 30%, #a1a1aa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
      
      {/* Premium Background Layer */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#030303] to-[#030303]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#030303]/70 backdrop-blur-2xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo variant="dark" />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button onClick={() => setFeaturesOpen(!featuresOpen)} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Features
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-4 w-[400px] rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl max-h-[500px] overflow-y-auto"
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
                            className="flex gap-4 rounded-xl p-3 hover:bg-white/[0.04] transition-all group"
                          >
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                              <Icon className="h-4 w-4 text-gray-400 group-hover:text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{f.title}</p>
                              <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5 transition-colors">{f.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Blog</Link>
            <Link href="/about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">About</Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <button className="relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full bg-white px-5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all duration-300">
                Get Started
              </button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.04] bg-[#030303]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-6 space-y-4">
                <Link href="/features" className="block text-sm font-medium text-gray-300 hover:text-white">Features</Link>
                <Link href="/pricing" className="block text-sm font-medium text-gray-300 hover:text-white">Pricing</Link>
                <Link href="/blog" className="block text-sm font-medium text-gray-300 hover:text-white">Blog</Link>
                <Link href="/about" className="block text-sm font-medium text-gray-300 hover:text-white">About</Link>
                <div className="pt-4 border-t border-white/[0.04]">
                  <Link href="/login" className="block text-center w-full py-3 text-sm font-medium text-gray-300 bg-white/[0.04] rounded-xl hover:bg-white/[0.08] transition-colors">
                    Log In
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO — Full Screen with 3D Orb */}
      <section className="relative h-screen min-h-[750px] overflow-hidden border-b border-white/[0.04]">
        {/* Spline 3D Viewer - Right Side */}
        <div className="absolute top-0 right-0 bottom-0 left-[45%] z-0">
          <SplineViewer
            scene="https://prod.spline.design/3rBV1FmC9K7vx6ax/scene.splinecode"
            className="absolute inset-0 w-full h-full"
          />
          {/* Cover "Built with Spline" watermark */}
          <div className="absolute bottom-0 right-0 w-[260px] h-24 z-20 pointer-events-auto bg-[#030303]" />
        </div>

        {/* Background match — fill right side before Spline loads */}
        <div className="absolute top-0 right-0 bottom-0 left-[45%] bg-[#030303] z-[-1]" />

        {/* Blend Gradients */}
        <div className="absolute inset-y-0 left-[40%] w-96 bg-gradient-to-r from-[#030303] via-[#030303]/80 to-transparent z-[1] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030303] to-transparent z-[1] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#030303] to-transparent z-[1] pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-[1] pointer-events-none" />
        
        {/* Vignette */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: 'radial-gradient(ellipse 30% 20% at 75% 50%, rgba(3,3,3,0.7) 0%, transparent 100%)' }} />

        {/* Hero Text — Left Side */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-[3] h-full flex flex-col justify-center pl-6 sm:pl-16 lg:pl-24 pr-4 max-w-[800px]"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 backdrop-blur-md mb-8 hover:bg-white/[0.04] transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-[11px] font-semibold tracking-wide text-gray-300 uppercase">India&apos;s Agentic Automation OS</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-[80px] font-bold leading-[1.02] tracking-[-0.03em] premium-text-gradient"
          >
            Your AI sales team,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700">running on WhatsApp.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-8 text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed font-light"
          >
            B9 Agentic Core drafts WhatsApp bots, Meta templates, lead qualification flows, and campaigns. Just describe your business — no code required.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row gap-5">
            <Link href="/signup">
              <button className="group relative inline-flex h-12 sm:h-14 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-medium text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto">
                <span className="mr-2 text-[15px]">Start Free Trial</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/signup?demo=1">
              <button className="group inline-flex h-12 sm:h-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] px-8 font-medium text-white backdrop-blur-md hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 w-full sm:w-auto text-[15px]">
                Book a Demo
              </button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
            {['✓ Free forever plan', '✓ No credit card', '✓ Setup in 5 mins'].map((b) => (
              <span key={b} className="flex items-center gap-1.5 opacity-80">{b}</span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 border-b border-white/[0.04] bg-[#030303]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-gray-500 mb-8">
            Trusted by modern Indian businesses
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center opacity-70">
            {[
              'Coaching Centers', 'Real Estate', 'Fitness Studios', 'Salons & Spas',
              'Agencies', 'E-commerce', 'Healthcare', 'Legal', 'Fintech'
            ].map((industry) => (
              <div
                key={industry}
                className="px-5 py-2.5 rounded-full border border-white/[0.04] bg-white/[0.01] text-gray-400 text-xs font-semibold uppercase tracking-wider hover:bg-white/[0.03] transition-colors"
              >
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-24 lg:py-32 border-b border-white/[0.04] relative">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mb-20 text-center mx-auto">
            <SectionLabel>Core Capabilities</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight premium-text-gradient">One AI. Complete WhatsApp stack.</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          >
            {[
              {
                title: 'WhatsApp Agentic AI',
                desc: 'AI receives customer messages, understands intent, searches your knowledge, sends catalog, creates payment links, and books follow-ups.',
                tag: 'Agentic 24/7',
                icon: Bot,
              },
              {
                title: 'AI Template & Flow Builder',
                desc: 'Describe a campaign in plain English. B9 AI drafts approved Meta templates and WhatsApp Forms in seconds — ready to submit to Meta.',
                tag: 'No manual editing',
                icon: Sparkles,
              },
              {
                title: 'Lead + Payment Automation',
                desc: 'Capture, qualify, and route leads automatically. Send Razorpay payment links, GST invoices, and WhatsApp receipts without lifting a finger.',
                tag: 'Close faster',
                icon: Users,
              },
              {
                title: 'Broadcast Campaigns',
                desc: 'Reach hot/warm/cold leads with approved templates. A/B test subject lines, schedule for peak hours, track delivery and read rates.',
                tag: 'At scale',
                icon: MessageCircle,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  className="group relative rounded-[2rem] border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 lg:p-10 backdrop-blur-xl hover:border-white/[0.12] transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.04] group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-500">
                      <Icon className="h-6 w-6 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-gray-100 mb-3">{card.title}</h3>
                    <p className="text-[15px] text-gray-400 leading-relaxed font-light mb-6">{card.desc}</p>
                    <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {card.tag}
                    </span>

                    {i === 0 && (
                      <div className="mt-8 p-5 rounded-2xl bg-[#030303]/80 border border-white/[0.06] text-xs space-y-3 font-mono shadow-inner shadow-black/50">
                        <div className="text-gray-500">
                          Customer: <span className="text-gray-200 ml-2">"Kya price hai?"</span>
                        </div>
                        <div className="text-gray-500 flex items-start gap-2">
                          <span className="mt-0.5">B9 AI:</span> 
                          <span className="text-gray-300 leading-relaxed">Searches knowledge → Sends pricing → Asks details → Saves lead → Sends payment link</span>
                        </div>
                        <div className="pt-2 border-t border-white/[0.04] text-[10px] text-gray-600 flex justify-between">
                          <span>Intent: pricing</span>
                          <span>4 steps · 2.1s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* DEEP FEATURES GRID */}
      <section className="py-24 lg:py-32 border-b border-white/[0.04] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <SectionLabel>Deep Features</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight premium-text-gradient">Every tool you need to scale</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.03] border border-white/[0.03] rounded-[2rem] overflow-hidden"
          >
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="bg-[#050505] p-10 group hover:bg-[#0A0A0A] transition-colors duration-500"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-white/[0.1] transition-all duration-500 shadow-lg shadow-black/50">
                    <Icon className="h-5 w-5 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100 mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed font-light group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 lg:py-32 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* Left — Sticky */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="lg:sticky lg:top-32"
            >
              <motion.div variants={fadeUp}>
                <SectionLabelLeft>How It Works</SectionLabelLeft>
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight premium-text-gradient max-w-md">Set up in minutes, scale in days.</h2>
                <p className="text-gray-400 mt-6 text-lg font-light max-w-md leading-relaxed">No complex technical setup. B9 reads your documents, learns your business style, and starts automating instantly.</p>
                <Link href="/signup" className="mt-10 inline-block group">
                  <div className="flex items-center gap-3 text-sm font-semibold tracking-wider uppercase text-white hover:text-gray-300 transition-colors">
                    Start Building Now
                    <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Steps */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-12"
            >
              {workflowSteps.map((step, i) => {
                return (
                  <motion.div key={step.title} variants={fadeUp} className="relative pl-20 group">
                    <div className="absolute left-0 top-0 h-12 w-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-center text-sm font-bold text-gray-300 shadow-xl group-hover:scale-110 group-hover:bg-white/[0.06] group-hover:border-white/[0.15] transition-all duration-500 z-10">
                      0{i + 1}
                    </div>
                    {i < workflowSteps.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-[-3rem] w-[1px] bg-gradient-to-b from-white/[0.15] to-transparent" />
                    )}
                    <div className="pt-1">
                      <h3 className="text-2xl font-semibold mb-3 tracking-tight text-gray-100 flex items-center gap-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 text-[15px] leading-relaxed font-light">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* AUTOMATION SPOTLIGHT — Robot 3D */}
      <section className="py-0 border-b border-white/[0.04] bg-[#030303] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-screen">
          {/* Left — Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center lg:justify-end lg:pr-20"
          >
            <div className="max-w-md w-full">
              <motion.div variants={fadeUp}>
                <SectionLabelLeft>Workflow Automation</SectionLabelLeft>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight premium-text-gradient">
                  Your business runs 24/7.
                </h2>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-600 mt-2">
                  Even when you don't.
                </h2>
                <p className="mt-8 text-gray-400 text-[17px] font-light leading-relaxed">Set up automation workflows once. B9 handles lead capture, follow-ups, appointment booking, and support seamlessly in the background while you focus on growth.</p>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 space-y-4">
                {[
                  'Automated WhatsApp sequences',
                  'AI-powered lead qualification',
                  'Multi-channel response routing',
                  'Smart escalation to humans',
                  'Real-time analytics dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[15px] text-gray-300 font-light">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right — 3D Robot Scene */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative h-[500px] lg:h-full overflow-hidden"
          >
            <SplineViewer
              scene="https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode"
              className="absolute inset-0 w-full h-full scale-[1.1]"
            />
            {/* Blend edges for the 3D scene */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#030303] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#030303] to-transparent z-10 pointer-events-none" />
            
            {/* Cover "Built with Spline" watermark */}
            <div className="absolute bottom-0 right-0 w-[240px] h-20 bg-[#030303] z-20 pointer-events-auto" />
          </motion.div>
        </div>
      </section>

      {/* META COMPLIANCE TRUST */}
      <section className="py-20 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent p-10 lg:p-12 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3">Meta Compliant Infrastructure</p>
                <h3 className="text-3xl font-semibold text-white mb-6 tracking-tight">WhatsApp policies, enforced automatically.</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Official API', desc: 'No unofficial bans. 100% Meta Cloud.' },
                    { title: '24h Window', desc: 'Strict enforcement. No accidental spam.' },
                    { title: 'Opt-out Safe', desc: 'STOP blocks sends permanently.' },
                    { title: 'Pre-Approved', desc: 'Only valid templates get dispatched.' },
                  ].map((item) => (
                    <div key={item.title} className="bg-black/40 rounded-2xl p-5 border border-white/[0.04] backdrop-blur-sm">
                      <p className="text-emerald-400 font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-24 lg:py-32 border-b border-white/[0.04] relative">
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <SectionLabel>Integrations</SectionLabel>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight premium-text-gradient">9 integrations. Day one.</h2>
              <p className="mt-6 text-gray-400 text-lg font-light max-w-2xl mx-auto">
                Connect your existing tools instantly. WhatsApp, Instagram, Google Sheets, Razorpay, and more — all production-ready.
              </p>
            </motion.div>
          </div>

          <div className="mb-4">
            <div className="flex justify-center mb-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                All Systems Live
              </span>
            </div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 mb-10"
            >
              {liveIntegrations.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="group rounded-3xl border border-white/[0.04] bg-white/[0.02] p-6 lg:p-8 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 backdrop-blur-sm cursor-default"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner shadow-black/20">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-200 tracking-tight mb-2">{item.label}</p>
                  <p className="text-[13px] text-gray-500 font-light leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-24 lg:py-32 border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight premium-text-gradient">Common questions</h2>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                variants={fadeUp}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  openFaq === i 
                    ? 'border-white/[0.15] bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.02)]' 
                    : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 lg:p-8 text-left"
                >
                  <p className="text-lg font-medium text-gray-200 tracking-tight pr-4">{faq.q}</p>
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${
                    openFaq === i ? 'border-white/[0.2] bg-white/[0.1]' : 'border-white/[0.1] bg-transparent'
                  }`}>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-0 text-gray-400 text-[15px] font-light leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 lg:py-40 border-b border-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="rounded-[3rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-12 lg:p-24 text-center backdrop-blur-2xl shadow-2xl shadow-black/50"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Ready to scale?</SectionLabel>
              <h2 className="text-5xl lg:text-7xl font-bold tracking-tight premium-text-gradient">
                Automate today.
              </h2>
              <p className="text-xl text-gray-400 mt-8 max-w-2xl mx-auto font-light leading-relaxed">
                Join modern Indian businesses saving 20+ hours per week with B9's Agentic Automation OS.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/signup">
                <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-white px-10 font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto">
                  <span className="mr-2 text-[15px]">Start Building Now</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-gray-500 font-medium">
              {['Free forever plan', 'No credit card required', 'Setup in 5 minutes'].map((badge) => (
                <span key={badge} className="flex items-center gap-2">
                  <span className="text-white/40">✓</span> {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#020202] pt-20 pb-10 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-16 pb-16 border-b border-white/[0.04]">
            {/* Column 1 */}
            <div>
              <div className="mb-6 opacity-90">
                <Logo variant="dark" />
              </div>
              <p className="text-[14px] text-gray-500 mt-6 max-w-sm leading-relaxed font-light">
                Agentic AI automation for modern businesses. WhatsApp bots, lead capture, AI chat, and document intelligence — natively unified.
              </p>
              <div className="flex gap-4 mt-8">
                {[
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, label: 'Website', href: 'https://b9automation.com' },
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, label: 'LinkedIn', href: 'https://linkedin.com/company/b9automation' },
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>, label: 'Instagram', href: 'https://instagram.com/b9automation' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-6">Product</h4>
              <ul className="space-y-4 text-[14px] text-gray-500 font-light">
                {Object.entries({
                  Features: '/features',
                  Pricing: '/pricing',
                  Blog: '/blog',
                  Changelog: '/changelog',
                  Integrations: '/integrations',
                  'API Docs': '/api-docs',
                }).map(([link, href]) => (
                  <li key={link}>
                    <a href={href} className="hover:text-gray-200 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-6">Company</h4>
              <ul className="space-y-4 text-[14px] text-gray-500 font-light">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Careers', href: '/about#careers' },
                  { label: 'Contact', href: 'mailto:hello@b9automation.com' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-200 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-6">Support</h4>
              <ul className="space-y-4 text-[14px] text-gray-500 font-light mb-8">
                {[
                  { label: 'Help Center', href: 'mailto:hello@b9automation.com' },
                  { label: 'Book a Demo', href: '/signup?demo=1' },
                  { label: 'Community', href: 'https://wa.me/919999999999' },
                  { label: 'System Status', href: 'https://b9automation.com' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-200 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[13px] text-gray-600 font-light">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">Built with <span className="text-gray-400">♥</span> in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
