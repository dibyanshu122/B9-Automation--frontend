'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { ArrowRight, CheckCircle2, FileSearch, MessageSquare, UploadCloud, ChevronLeft } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const useCases = [
  'Customer support FAQs answered instantly from your docs',
  'Internal policy lookup without manual searching',
  'Legal and contract review with cited references',
  'Course and research material Q&A',
  'Sales enablement — answer objections from product docs',
  'Onboarding guides — new hires get accurate answers 24/7',
];

export default function DocumentChatPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>
      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-doc-chat" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-doc-chat)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="relative border-b border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-4">
              <Link href="/features" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#00F2FE] transition-colors">
                <ChevronLeft className="h-4 w-4" /> All Features
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">Document Intelligence</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 sm:text-5xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              Ask your documents anything. Get cited answers.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Upload files, URLs, and videos. B9 retrieves the most relevant source content and answers in natural language — with references users can verify.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-6 py-3 font-bold text-white backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_24px_rgba(0,242,254,0.2)]"
              >
                Try It Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 font-semibold text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                View Pricing
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-2xl font-bold mb-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
          >
            How it works in 3 steps
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="space-y-5"
          >
            {[
              { num: 1, Icon: UploadCloud, title: 'Upload your knowledge', desc: 'Go to Documents and upload PDFs, paste a URL, or add a YouTube video. B9 reads and indexes everything automatically.' },
              { num: 2, Icon: MessageSquare, title: 'Ask naturally', desc: 'Users ask normal questions without search syntax or manual filtering. The AI retrieves the most relevant passages.' },
              { num: 3, Icon: FileSearch, title: 'Get cited answers', desc: 'Every answer includes source references — document name, page, or URL — so users can verify and trust the response.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="flex gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-6 transition-all duration-300 hover:border-[#00F2FE]/20 hover:bg-white/[0.025]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/[0.08] font-black text-[#00F2FE] text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use cases */}
      <section className="relative border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-2xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
          >
            What you can do with it
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {useCases.map((uc) => (
              <motion.div
                key={uc}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-4 transition-all duration-300 hover:border-[#00F2FE]/20"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00F2FE] mt-0.5" />
                <p className="text-sm text-zinc-300">{uc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="h-[300px] w-[600px] rounded-full bg-[#00F2FE]/[0.04] blur-[100px]" />
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="relative"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-5">
              Get Started
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="mb-4 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
              style={{ letterSpacing: '-0.02em' }}
            >
              Start answering questions from your docs
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-8 text-zinc-400 leading-relaxed">
              Upload your first document and have a cited Q&A running in under 2 minutes.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-8 py-3 font-bold text-white backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3 font-semibold text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:border-white/20"
              >
                See Pricing
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
