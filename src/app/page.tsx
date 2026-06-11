'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
// import { Button } from '@/components/button'; // reserved for future use
import { HeroAnimation } from '@/components/hero-animation';
import { SplineViewer } from '@/components/spline-viewer';
import { TiltCard, CountUp, MagneticButton } from '@/components/premium-motion';
import { Logo } from '@/components/logo';
import { featureHighlights, workflowSteps, trustPoints, blogPosts, allFeatures } from '@/lib/marketing';
import {
  ArrowRight, Bot, Brain, Building2, ChevronDown, MessageCircle, Sparkles, Users,
  CheckCircle2, Mail, ExternalLink, Menu, X, Shield, Zap, Globe,
} from 'lucide-react';

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

// ─── Static Data ───────────────────────────────────────────────────────────────
const faqs = [
  { q: 'What is B9 Automation?', a: 'B9 Automation is an AI-powered no-code platform that automates customer interactions across WhatsApp, email, chat, and more. Set up AI chatbots, lead capture, automation workflows, and customer support in minutes without writing code.' },
  { q: 'Do I need coding knowledge to use B9?', a: 'No. Describe what you want and use the visual builder to review, edit, and activate your automation.' },
  { q: 'Which platforms does B9 integrate with?', a: 'B9 supports WhatsApp (Official Meta Cloud API), Gmail, Google Sheets, Facebook Lead Ads, Instagram DM, Razorpay, IndiaMART, Shopify, and custom webhooks. Provider account setup and connection health checks are required before live use.' },
  { q: 'How does the AI learn my business?', a: 'Upload your documents, FAQs, product catalog, URLs, or YouTube links. Our AI reads and understands everything, then answers customer questions with citations pointing to the source.' },
  { q: 'Can I use B9 for multiple businesses?', a: 'Yes. Our Growth, Pro, and Business plans support multiple assistants and workspaces. Agencies can manage client accounts from one dashboard — each with separate WhatsApp connections, leads, and automations.' },
  { q: 'Is my customer data safe?', a: 'We encrypt supported sensitive connection credentials at rest and use HTTPS in production. We never train AI models on your data. Opt-out records are durable, consent is logged, and SOC2/ISO 27001 remain on our roadmap.' },
  { q: 'Is there a free plan?', a: 'Yes! Our free plan includes 30 AI credits, 1 PDF assistant, and 50MB storage. No WhatsApp or automation on the free plan. Upgrade to Starter (Rs. 1,499/mo) for WhatsApp + automation. No hidden charges, cancel anytime.' },
  { q: 'Do you offer onboarding or support?', a: 'Yes. We provide video tutorials, documentation, live chat support, and free 30-minute onboarding calls for paid plans.' },
  { q: 'Can I build WhatsApp bot automation?', a: 'Yes. B9 uses the official Meta WhatsApp Cloud API. Build broadcast campaigns, automated reply sequences, lead qualification bots, catalog+payment flows, and AI-generated Meta templates. 24-hour window rules are enforced automatically — only approved templates go out after the window closes.' },
  { q: 'What if I need a custom integration?', a: 'Use our Webhook feature to connect ANY external tool or API. Full REST API available for custom integrations.' },
];

const liveIntegrations = [
  { label: 'WhatsApp Business', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, desc: 'Official Meta Cloud API — send, receive, automate' },
  { label: 'Instagram DM', icon: <svg viewBox="0 0 24 24" width="24" height="24"><defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>, desc: 'Auto-reply to DMs, capture as leads' },
  { label: 'Facebook Lead Ads', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, desc: 'Auto-capture form leads into CRM' },
  { label: 'Gmail', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#EA4335"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>, desc: 'Sync inbox, create draft replies, send' },
  { label: 'Google Sheets', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#0F9D58"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>, desc: 'Push leads and data to sheets automatically' },
  { label: 'Razorpay', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#3395FF"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-8h7v2h-7zm0 4h7v2h-7zm-4-4h2v6H8z"/></svg>, desc: 'Payment links, invoices, webhook triggers' },
  { label: 'IndiaMART', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#E65100"><path d="M12 2L2 12h3v8h14v-8h3L12 2zM9 18H7v-2h2v2zm0-4H7v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>, desc: 'Auto-capture B2B leads from IndiaMART' },
  { label: 'Shopify', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="#95BF47"><path d="M19 6h-3V5c0-2.8-2.2-5-5-5S6 2.2 6 5v1H3l-1.5 16h21L19 6zm-8-4c1.7 0 3 1.3 3 3v1H10V5c0-1.7 1.3-3 3-3zM8 8v3a1 1 0 102 0V8h4v3a1 1 0 102 0V8h3.3l1.1 12H3.6l1.1-12H8z"/></svg>, desc: 'Order webhooks, customer sync' },
  { label: 'Webhooks / REST', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00F2FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>, desc: 'Connect any external tool or API' },
];

const extendedUseCases = [
  { industry: 'Coaching Centers', icon: Brain, flow: 'Inquiry → AI qualifies (class/subject) → Demo booked via WhatsApp Flow → Fee WhatsApp sent → Razorpay payment link', stat: '3x More Demo Bookings' },
  { industry: 'Real Estate', icon: Building2, flow: 'IndiaMART / Facebook lead → AI sends property details + catalog → Site visit booked → Follow-up until site visit', stat: '60% Faster Response' },
  { industry: 'D2C & E-commerce', icon: Users, flow: 'Shopify order → WhatsApp confirmation sent → Delivery follow-up → Review request → Upsell campaign', stat: '2x Repeat Orders' },
  { industry: 'Clinics & Healthcare', icon: Sparkles, flow: 'Inquiry → AI collects symptoms + preferred doctor → Appointment booked → Reminder 1 hour before', stat: 'Zero Missed Appointments' },
];

// ─── Marquee ───────────────────────────────────────────────────────────────────
function InfiniteMarquee({ items }: { items: typeof liveIntegrations }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const doubled = [...items, ...items];

  useAnimationFrame((_, delta) => {
    if (!containerRef.current) return;
    xRef.current -= delta * 0.028;
    const itemWidth = containerRef.current.scrollWidth / 2;
    if (Math.abs(xRef.current) >= itemWidth) xRef.current = 0;
    containerRef.current.style.transform = `translateX(${xRef.current}px)`;
  });

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
      <div ref={containerRef} className="flex gap-4 w-max">
        {doubled.map((item, i) => (
          <div key={i} className="group flex-shrink-0 w-[220px] rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-white/[0.025] hover:border-[#00F2FE]/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,254,0.04)] cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center group-hover:border-[#00F2FE]/20 transition-all duration-300">{item.icon}</div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-sm font-semibold text-white/90">{item.label}</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bento Card ────────────────────────────────────────────────────────────────
function BentoCard({ title, desc, tag, icon: Icon }: {
  title: string; desc: string; tag: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <TiltCard className="h-full rounded-2xl">
    <div className="group relative h-full rounded-2xl p-8 bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.025] hover:border-[#00F2FE]/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,254,0.04)] overflow-hidden cursor-default">
      {/* Inner top glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#00F2FE]/[0.025] rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center text-[#00F2FE] mb-6 group-hover:scale-110 group-hover:border-[#00F2FE]/25 group-hover:shadow-[0_0_20px_rgba(0,242,254,0.12)] transition-all duration-300">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-3 tracking-tight transition-all duration-300">
          {title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed transition-colors duration-300 group-hover:text-zinc-400 mb-5">{desc}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00F2FE]">
          {tag}
        </span>
      </div>
    </div>
    </TiltCard>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-white/[0.03] border border-white/[0.08] text-[#00F2FE] shadow-[0_0_20px_rgba(0,242,254,0.06)] mb-5">
      {children}
    </span>
  );
}

// ─── Premium H2 ────────────────────────────────────────────────────────────────
function PremiumH2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 ${className}`}>
      {children}
    </h2>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqTyping, setFaqTyping] = useState(false);

  const askFaq = (i: number) => {
    if (openFaq === i) { setOpenFaq(null); return; }
    setOpenFaq(i);
    setFaqTyping(true);
    setTimeout(() => setFaqTyping(false), 750);
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const orig = console.error.bind(console);
    console.error = (...args: any[]) => {
      const f = args[0];
      if ((args.length === 1 && f && typeof f === 'object' && !Array.isArray(f) && Object.keys(f).length === 0) ||
        f?.message?.includes('buildTimeline') || f?.toString?.().includes('spline') || f?.toString?.().includes('Missing property')) return;
      orig(...args);
    };
    return () => { console.error = orig; };
  }, []);

  return (
    /* ①  Global Wrapper & Interactive Light Mesh */
    <div className="min-h-screen bg-[#030712] text-white selection:bg-[#00F2FE]/30 selection:text-white overflow-x-hidden relative antialiased font-sans">

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'B9 Automation', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'AI-powered WhatsApp bot, lead capture, and business automation platform for Indian SMEs.', url: 'https://b9automation.com', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } }) }} />

      {/* Spline watermark suppression */}
      <style>{`
        spline-viewer::part(button),spline-viewer::part(logo),spline-viewer::part(hint),
        spline-viewer button,spline-viewer .logo,spline-viewer .hint,
        spline-viewer a,spline-viewer #logo,[data-spline-logo],.spline-logo,.spline-hint{
          display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;
        }
        @keyframes shimmerBtn{0%{background-position:-200% center}100%{background-position:200% center}}
        .btn-shimmer{background-size:200% auto;animation:shimmerBtn 3s linear infinite;}
      `}</style>

      {/* Ambient Mesh Blobs — #1 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.016]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="white"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
        {/* Cyan blob — top-left */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00F2FE]/[0.03] rounded-full blur-[140px] animate-glow-pulse" />
        {/* Orange blob — middle-right */}
        <div className="absolute top-[40%] right-10 w-[500px] h-[500px] bg-[#FF5722]/[0.02] rounded-full blur-[160px]" />
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00F2FE]/[0.015] rounded-full blur-[120px]" />
      </div>

      {/* ② NAVBAR — Glassmorphism Island */}
      <nav className={`fixed top-0 inset-x-0 z-50 px-6 transition-all duration-500 ${scrolled ? 'py-3 backdrop-blur-2xl bg-[#030712]/80 border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03)]' : 'py-5 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Logo variant="dark" />

          {/* Desktop Nav with gradient underline hover */}
          <div className="hidden md:flex items-center gap-8">
            {/* Features dropdown */}
            <div className="relative">
              <MagneticButton strength={0.3}>
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="group relative flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 py-1"
                >
                  Features
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${featuresOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#00F2FE] to-[#FF5722] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />
                </button>
              </MagneticButton>

              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="absolute top-full left-0 z-[70] mt-3 w-[420px] overscroll-contain rounded-2xl border border-white/[0.07] bg-[#030712]/95 backdrop-blur-2xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,242,254,0.03)] max-h-[480px] overflow-y-auto"
                    onWheel={(event) => event.stopPropagation()}
                    onMouseLeave={() => setFeaturesOpen(false)}
                  >
                    <div className="space-y-0.5">
                      {allFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Link key={f.title} href={f.href} onClick={() => setFeaturesOpen(false)}
                            className="flex gap-3 rounded-xl p-3 hover:bg-white/[0.04] hover:translate-x-1.5 transition-all duration-300 group/item">
                            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-[#00F2FE]/10 border border-[#00F2FE]/20 flex items-center justify-center transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-3">
                              <Icon className="h-4 w-4 text-[#00F2FE]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">{f.title}</p>
                              <p className="text-xs text-zinc-600 group-hover/item:text-zinc-500 mt-0.5">{f.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {['Pricing', 'Blog', 'About'].map((label) => (
              <MagneticButton key={label} strength={0.3}>
                <Link href={`/${label.toLowerCase()}`}
                  className="group relative text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 py-1">
                  {label}
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#00F2FE] to-[#FF5722] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />
                </Link>
              </MagneticButton>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <MagneticButton strength={0.3}>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300">Log In</Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/signup">
                <button className="relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#00F2FE]/[0.12] border border-[#00F2FE]/35 rounded-full backdrop-blur-xl overflow-hidden transition-all duration-300 hover:bg-[#00F2FE]/[0.22] hover:shadow-[0_0_20px_rgba(0,242,254,0.3)] active:scale-[0.98]">
                  Get Started
                </button>
              </Link>
            </MagneticButton>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 rounded-2xl border border-white/[0.06] bg-[#030712]/95 backdrop-blur-2xl overflow-hidden">
              <div className="px-4 py-4 space-y-1">
                {[['Home', '/'], ['Features', '/features'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['About', '/about'], ['Log In', '/login']].map(([link, href]) => (
                  <Link key={link} href={href}
                    className="block text-sm font-medium text-zinc-400 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-all">{link}</Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <HeroAnimation />

      {/* ─── LIVE PROOF TICKER ────────────────────────────────────────── */}
      <section className="relative z-10 border-b border-white/[0.04] bg-white/[0.008]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px md:grid-cols-4">
          {[
            { value: 12480, suffix: '+', label: 'Messages sent this week' },
            { value: 2340, suffix: '+', label: 'Leads captured this week' },
            { value: 890, suffix: '+', label: 'Automations running daily' },
            { value: 98, suffix: '%', label: 'Delivery success rate' },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex flex-col items-center gap-1 px-4 py-7 text-center ${i > 0 ? 'border-l border-white/[0.04]' : ''} ${i === 2 ? 'max-md:border-l-0' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <CountUp to={stat.value} suffix={stat.suffix} className="text-2xl font-bold tracking-tight text-white md:text-3xl" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─────────────────────────────────────────────── */}
      <section className="py-12 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-8">
            Trusted across 100+ Indian businesses
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Coaching Centers', 'Real Estate Firms', 'Gyms & Fitness', 'Salons & Spas', 'IT Agencies', 'E-commerce Stores', 'Clinics & Healthcare', 'Legal Practices', 'Fintech Startups', 'Educational Institutes'].map((ind, i) => {
              // Dynamically generate a premium tech gradient/color for each badge
              const hue = (i * 36) % 360;
              return (
                <div 
                  key={ind} 
                  className="px-4 py-2 rounded-full border backdrop-blur-md text-xs font-semibold tracking-wide transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 cursor-default"
                  style={{
                    backgroundColor: `hsla(${hue}, 85%, 55%, 0.12)`,
                    borderColor: `hsla(${hue}, 85%, 55%, 0.25)`,
                    color: `hsl(${hue}, 90%, 75%)`,
                    boxShadow: `0 4px 14px hsla(${hue}, 85%, 55%, 0.06)`
                  }}
                >
                  {ind}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ④ CORE FEATURES — Elite Bento Grid */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mb-20">
            <motion.div variants={fadeUp}><SectionLabel>⚡ Core Capabilities</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl">One AI. Complete WhatsApp stack.</PremiumH2></motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title: 'WhatsApp Agentic AI', desc: 'AI receives customer messages, understands intent, searches your knowledge, sends catalog, creates payment links, and books follow-ups — fully automated.', tag: 'Agentic 24/7', icon: Bot },
              { title: 'AI Template & Flow Builder', desc: 'Describe a campaign in plain English. B9 AI drafts approved Meta templates and WhatsApp Forms in seconds — ready to submit to Meta.', tag: 'No manual editing', icon: Sparkles },
              { title: 'Lead + Payment Automation', desc: 'Capture, qualify, and route leads automatically. Send Razorpay payment links, GST invoices, and WhatsApp receipts without lifting a finger.', tag: 'Close faster', icon: Users },
              { title: 'Broadcast Campaigns', desc: 'Reach hot/warm/cold leads with approved templates. A/B test subject lines, schedule for peak hours, track delivery and read rates.', tag: 'At scale', icon: MessageCircle },
            ].map((card) => (
              <motion.div key={card.title} variants={fadeUp}>
                <BentoCard {...card} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DEEP FEATURES 6-Grid */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-20 max-w-3xl mx-auto">
            <motion.div variants={fadeUp}><SectionLabel>🛠 Deep Features</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl">Every tool you need to scale</PremiumH2></motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureHighlights.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp}
                  className="group relative rounded-2xl p-7 bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-white/[0.025] hover:border-[#00F2FE]/25 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(0,242,254,0.03)] overflow-hidden cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00F2FE]/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:border-[#00F2FE]/20 group-hover:scale-105 transition-all duration-300">
                    <Icon className="h-5 w-5 text-[#00F2FE]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2.5 tracking-tight">{f.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed group-hover:text-zinc-500 transition-colors">{f.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — Vertical Timeline */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* Left sticky */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="lg:sticky lg:top-28 lg:self-start">
              <motion.div variants={fadeUp}>
                <SectionLabel>🔄 How It Works</SectionLabel>
                <PremiumH2 className="text-4xl lg:text-5xl mt-3">Set up in minutes,<br/>scale in days.</PremiumH2>
                <p className="text-zinc-500 mt-5 text-lg font-light leading-relaxed max-w-sm">No complex setup. B9 learns your business and starts automating instantly.</p>
                <Link href="/signup" className="mt-8 inline-block">
                  <button className="px-7 py-3.5 text-white font-semibold rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.22] hover:shadow-[0_0_28px_rgba(0,242,254,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                    Start Building <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right timeline */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-0">
              {workflowSteps.map((step, i) => {
                const Icon = step.icon;
                const isLast = i === workflowSteps.length - 1;
                return (
                  <motion.div key={step.title} variants={fadeUp} className="relative flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 shrink-0 rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/[0.08] flex items-center justify-center text-sm font-bold text-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.1)]">
                        {i + 1}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-[#00F2FE]/20 to-transparent mt-2 mb-2 min-h-[40px]" />}
                    </div>
                    <div className={`${isLast ? 'pb-0' : 'pb-10'} pt-1`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-[#00F2FE]" />
                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* AUTOMATION SPOTLIGHT — Robot 3D */}
      <section className="border-b border-white/[0.04] overflow-hidden relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-screen">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="py-24 lg:py-32 px-6 lg:px-16 flex items-center">
            <div className="max-w-md w-full">
              <motion.div variants={fadeUp}>
                <SectionLabel>🤖 Workflow Automation</SectionLabel>
                <PremiumH2 className="text-4xl lg:text-5xl leading-tight mt-3">
                  Your business runs 24/7.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-500 to-zinc-700">
                    Even when you don&apos;t.
                  </span>
                </PremiumH2>
                <p className="mt-6 text-zinc-400 text-lg font-light leading-relaxed">
                  Set up automation workflows once. B9 handles lead capture, follow-ups, appointment booking, and support while you focus on growing.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 space-y-3">
                {['Automated WhatsApp sequences', 'AI-powered lead qualification', 'Multi-channel response routing', 'Smart escalation to humans', 'Real-time analytics dashboard'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border border-[#00F2FE]/30 bg-[#00F2FE]/[0.07] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-[#00F2FE]" />
                    </div>
                    <span className="text-sm text-zinc-400">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1.4 }} viewport={{ once: true }}
            className="relative h-[500px] lg:h-full overflow-hidden bg-[#030712]">
            <SplineViewer scene="https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode" className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030712] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[240px] h-20 bg-[#030712] z-20" />
          </motion.div>
        </div>
      </section>

      {/* AGENTIC AI — 5-Step */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[300px] bg-[#00F2FE]/[0.025] rounded-full blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-20 max-w-3xl mx-auto">
            <motion.div variants={fadeUp}><SectionLabel>🧠 B9 Agentic Core</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl mt-3">Describe it. B9 builds it.</PremiumH2></motion.div>
            <motion.p variants={fadeUp} className="mt-5 text-zinc-400 text-lg font-light">
              B9 Agentic AI drafts your entire automation — templates, flows, campaigns, follow-ups — from a plain-English description.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { step: '1', label: 'Connect Meta', desc: 'Link your WhatsApp Business number via official Meta OAuth' },
              { step: '2', label: 'Upload Knowledge', desc: 'PDFs, catalog, pricing, FAQs — AI reads everything' },
              { step: '3', label: 'Describe Automation', desc: '"Send catalog when someone asks about pricing"' },
              { step: '4', label: 'AI Drafts Flow', desc: 'Templates, reply sequences, forms, payment links — generated instantly' },
              { step: '5', label: 'Review & Go Live', desc: 'One click to activate. AI handles the rest 24/7' },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 text-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-[#00F2FE]/30 hover:bg-white/[0.025] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,254,0.04)] cursor-default">
                {i < 4 && <div className="hidden md:block absolute top-7 left-full w-3 h-px bg-gradient-to-r from-[#00F2FE]/30 to-transparent z-10" />}
                <div className="w-9 h-9 rounded-xl border border-[#00F2FE]/25 bg-[#00F2FE]/[0.07] flex items-center justify-center text-sm font-bold text-[#00F2FE] mx-auto mb-4 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.15)] transition-all duration-500">
                  {s.step}
                </div>
                <p className="text-sm font-semibold text-white mb-1.5">{s.label}</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* META COMPLIANCE */}
      <section className="py-16 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.02] backdrop-blur-xl p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-emerald-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-2">Built for Meta Compliance</p>
                <h3 className="text-2xl font-semibold text-white mb-5 tracking-tight">WhatsApp rules enforced automatically</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: Shield, text: 'Official Meta Cloud API — no unofficial workarounds' },
                    { icon: Zap, text: '24-hour window enforced — templates only after window closes' },
                    { icon: Globe, text: 'Durable opt-out — STOP blocks all future sends permanently' },
                    { icon: CheckCircle2, text: 'Only APPROVED templates used in campaigns and follow-ups' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text} className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3.5">
                        <Icon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400 leading-relaxed">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS MARQUEE */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] overflow-hidden relative z-10">
        <div className="mx-auto max-w-7xl px-6 mb-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.div variants={fadeUp}><SectionLabel>🔗 Integrations</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl mt-3">9 live integrations. All working today.</PremiumH2></motion.div>
            <motion.p variants={fadeUp} className="mt-5 text-zinc-400 text-lg font-light max-w-2xl mx-auto">
              Connect WhatsApp, Instagram, Facebook, Gmail, Google Sheets, Razorpay, IndiaMART, Shopify, and Webhooks. Each connection includes setup and health checks before live use.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">All 9 Systems Live</span>
            </motion.div>
          </motion.div>
        </div>
        <InfiniteMarquee items={liveIntegrations} />
        <div className="mt-10 text-center">
          <p className="text-xs text-zinc-700">More integrations shipping every month. <Link href="/features" className="text-zinc-500 hover:text-white transition-colors underline">View roadmap →</Link></p>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mb-20">
            <motion.div variants={fadeUp}><SectionLabel>🏢 Use Cases</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl mt-3 leading-tight">Built for businesses that move fast</PremiumH2></motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {extendedUseCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <motion.div key={uc.industry} variants={fadeUp}
                  className="group relative rounded-2xl p-8 bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:bg-white/[0.025] hover:border-[#00F2FE]/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,254,0.04)] overflow-hidden cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:border-[#00F2FE]/20 transition-all duration-300">
                      <Icon className="h-5 w-5 text-[#00F2FE]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">{uc.industry}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-5">{uc.flow}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00F2FE]">
                      {uc.stat}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* PRIVACY & TRUST */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-20 max-w-3xl mx-auto">
            <motion.div variants={fadeUp}><SectionLabel>🔒 Security & Privacy</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl lg:text-5xl mt-3">Your data. Your rules. Always.</PremiumH2></motion.div>
            <motion.p variants={fadeUp} className="mt-5 text-zinc-400 text-lg font-light">Built with encryption, access control, and GDPR-ready practices.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <motion.div key={point.title} variants={fadeUp}
                  className="group flex flex-col items-center text-center p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[#00F2FE]/25 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(0,242,254,0.03)]">
                  <div className="h-12 w-12 rounded-2xl border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-[#00F2FE]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{point.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{point.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex flex-wrap gap-3 justify-center">
            {['GDPR Ready', '256-bit Encryption', 'Opt-out Compliant', 'Meta Cloud API'].map((badge) => (
              <div key={badge} className="rounded-full border border-white/[0.05] bg-white/[0.01] px-5 py-2 text-xs text-zinc-600 font-medium hover:border-[#00F2FE]/20 hover:text-zinc-400 transition-all duration-300 cursor-default">
                ✓ {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — Ask the AI orb */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
          <div className="mt-32 w-[600px] h-[300px] bg-[#00F2FE]/[0.03] rounded-full blur-[130px]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp}><SectionLabel>💬 FAQ</SectionLabel></motion.div>
            <motion.div variants={fadeUp}><PremiumH2 className="text-4xl mt-3">Ask B9 anything</PremiumH2></motion.div>
            <motion.p variants={fadeUp} className="mt-4 text-zinc-500 text-sm">Tap a question — the AI answers, just like it will for your customers.</motion.p>
          </motion.div>

          {/* The Orb */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto mb-10 flex h-36 w-36 items-center justify-center">
            {/* Pulse rings — excited while "thinking" */}
            {[0, 1].map((r) => (
              <div key={r}
                className={`absolute inset-0 rounded-full border transition-colors duration-300 ${faqTyping ? 'border-[#00F2FE]/40' : 'border-[#00F2FE]/15'}`}
                style={{ animation: `b9-faq-ring ${faqTyping ? '1.1s' : '2.6s'} ease-out ${r * (faqTyping ? 0.55 : 1.3)}s infinite` }}
              />
            ))}
            <div className={`relative flex h-24 w-24 items-center justify-center rounded-[1.6rem] border bg-[#03121b]/90 transition-all duration-300 ${faqTyping ? 'border-[#00F2FE]/50 shadow-[0_0_60px_rgba(0,242,254,0.35)]' : 'border-[#00F2FE]/30 shadow-[0_0_45px_rgba(0,242,254,0.18)]'}`}>
              <div className="absolute inset-0 rounded-[1.6rem] bg-gradient-to-br from-[#00F2FE]/20 via-transparent to-[#A855F7]/15" />
              <Bot className={`relative h-10 w-10 text-[#7BFFF8] transition-transform duration-300 ${faqTyping ? 'scale-110' : ''}`} />
            </div>
            <style>{`
              @keyframes b9-faq-ring {
                0% { transform: scale(0.7); opacity: 0.9; }
                100% { transform: scale(1.45); opacity: 0; }
              }
            `}</style>
          </motion.div>

          {/* Answer bubble — AI types, then answers */}
          <div className="mx-auto mb-12 min-h-[110px] max-w-2xl">
            <AnimatePresence mode="wait">
              {openFaq !== null && (
                <motion.div
                  key={`${openFaq}-${faqTyping ? 'typing' : 'answer'}`}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-2xl rounded-tl-md border border-[#00F2FE]/20 bg-[#06111b]/80 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_30px_rgba(0,242,254,0.06)] backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#00F2FE]/30 bg-[#00F2FE]/10">
                      <Bot className="h-3 w-3 text-[#7BFFF8]" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F2FE]/80">B9 AI</span>
                  </div>
                  {faqTyping ? (
                    <div className="flex items-center gap-1.5 py-2">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-2 w-2 rounded-full bg-[#00F2FE]/60 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed text-zinc-300">{faqs[openFaq].a}</p>
                  )}
                </motion.div>
              )}
              {openFaq === null && (
                <motion.p
                  key="faq-hint"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="pt-8 text-center text-sm text-zinc-600"
                >
                  ↓ Pick a question below
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Question chips */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="flex flex-wrap justify-center gap-2.5">
            {faqs.map((faq, i) => (
              <motion.button
                key={faq.q}
                variants={fadeUp}
                onClick={() => askFaq(i)}
                className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                  openFaq === i
                    ? 'border-[#00F2FE]/45 bg-[#00F2FE]/[0.12] text-white shadow-[0_0_24px_rgba(0,242,254,0.15)]'
                    : 'border-white/[0.07] bg-white/[0.015] text-zinc-400 hover:border-[#00F2FE]/25 hover:text-zinc-200 hover:-translate-y-0.5'
                }`}
              >
                {faq.q}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-28 lg:py-36 border-b border-white/[0.04] relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}><SectionLabel>📝 Blog</SectionLabel></motion.div>
              <motion.div variants={fadeUp}><PremiumH2 className="text-4xl mt-3">Latest updates</PremiumH2></motion.div>
            </motion.div>
            <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
              Read all <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {blogPosts.slice(0, 4).map((post) => (
              <motion.a key={post.title} href="/blog" variants={fadeUp}
                className="group relative rounded-2xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl p-6 lg:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[#00F2FE]/25 hover:bg-white/[0.025] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(0,242,254,0.03)] flex flex-col overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#00F2FE]/[0.02] rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="flex items-center gap-2 text-xs text-zinc-700 mb-4">
                  <span className="rounded-full border border-[#00F2FE]/15 bg-[#00F2FE]/[0.05] px-2.5 py-0.5 font-medium text-[#00F2FE]/80">Automation</span>
                  <span>·</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US')}</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors mb-2 tracking-tight">{post.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-5 flex-1">{post.description}</p>
                <span className="text-xs text-zinc-700 group-hover:text-[#00F2FE] transition-colors flex items-center gap-1.5">
                  Read article <ArrowRight className="h-3 w-3" />
                </span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 lg:py-36 relative z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[350px] bg-[#00F2FE]/[0.04] rounded-full blur-[120px]" />
          <div className="absolute w-[500px] h-[250px] bg-[#FF5722]/[0.025] rounded-full blur-[100px] translate-y-16" />
        </div>

        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="relative rounded-3xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-2xl p-12 lg:p-20 text-center overflow-hidden">
            {/* Dual gradient border mask */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(0,242,254,0.05) 0%, transparent 50%, rgba(255,87,34,0.04) 100%)' }} />
            {/* Top shimmer line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#00F2FE]/40 to-transparent" />

            <motion.div variants={fadeUp}>
              <SectionLabel>🚀 Get Started</SectionLabel>
              <PremiumH2 className="text-5xl lg:text-6xl mt-4 leading-[1.04] tracking-[-0.03em]">Start automation today.</PremiumH2>
              <p className="text-xl text-zinc-500 mt-6 max-w-2xl mx-auto font-light leading-relaxed">
                Join 100+ Indian businesses who save 20+ hours per week with B9 Automation.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-8 py-4 text-white font-semibold rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.22] hover:shadow-[0_0_32px_rgba(0,242,254,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-base">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/signup?demo=1">
                <button className="px-8 py-4 bg-white/[0.03] border border-white/[0.08] text-white font-semibold rounded-xl backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(0,242,254,0.04)] active:scale-[0.98] text-base">
                  Book a Demo
                </button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-zinc-600">
              {['Free forever plan', 'No credit card required', 'Setup in under 5 minutes'].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />{b}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] bg-[#030712] pt-16 pb-8 relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-white/[0.04]">
            <div>
              <div className="mb-5"><Logo variant="dark" /></div>
              <p className="text-sm text-zinc-700 max-w-xs leading-relaxed">AI automation for Indian businesses. WhatsApp bots, lead capture, AI chat, and document intelligence — all in one platform.</p>
              <div className="flex gap-2.5 mt-6">
                {[
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, label: 'Website', href: 'https://b9automation.com' },
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, label: 'LinkedIn', href: 'https://linkedin.com/company/b9automation' },
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="ig-ft" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig-ft)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>, label: 'Instagram', href: 'https://instagram.com/b9automation' },
                  { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, label: 'YouTube', href: 'https://youtube.com/@b9automation' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-zinc-600 hover:text-white hover:border-[#00F2FE]/25 hover:bg-[#00F2FE]/[0.06] transition-all duration-300">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-5">Product</h4>
              <ul className="space-y-3 text-sm text-zinc-700">
                {Object.entries({ Features: '/features', Pricing: '/pricing', Blog: '/blog', Changelog: '/changelog', Integrations: '/integrations', 'API Docs': '/api-docs' }).map(([link, href]) => (
                  <li key={link}><a href={href} className="hover:text-zinc-300 transition-colors duration-300">{link}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-5">Company</h4>
              <ul className="space-y-3 text-sm text-zinc-700">
                {[{ label: 'About Us', href: '/about' }, { label: 'Careers', href: '/about#careers' }, { label: 'Contact', href: 'mailto:hello@b9automation.com' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Cookie Policy', href: '/cookies' }].map(({ label, href }) => (
                  <li key={label}><a href={href} className="hover:text-zinc-300 transition-colors duration-300">{label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-zinc-700 mb-6">
                {[{ label: 'Help Center', href: 'mailto:hello@b9automation.com' }, { label: 'Book a Demo', href: '/signup?demo=1' }, { label: 'Community', href: 'https://wa.me/910000000000' }, { label: 'Status Page', href: 'https://b9automation.com' }, { label: 'Roadmap', href: '/blog' }].map(({ label, href }) => (
                  <li key={label}><a href={href} className="hover:text-zinc-300 transition-colors duration-300">{label}</a></li>
                ))}
              </ul>
              <a href="mailto:hello@b9automation.com" className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-300 transition-colors duration-300">
                <Mail className="h-4 w-4" /> hello@b9automation.com
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-zinc-800">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p>Made with ♥ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
