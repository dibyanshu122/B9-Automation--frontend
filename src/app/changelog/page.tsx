'use client';

import { MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { changelog } from '@/lib/marketing';
import { motion } from 'framer-motion';
import { CheckCircle2, GitBranch, Sparkles, Zap } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const tagColors: Record<string, string> = {
  feature: 'bg-[#00F2FE]/[0.07] border-[#00F2FE]/20 text-[#00F2FE]',
  fix: 'bg-orange-500/[0.07] border-orange-500/20 text-orange-400',
  improvement: 'bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-400',
};

const versionTags: Record<string, { type: keyof typeof tagColors; label: string }[]> = {
  'v1.0': [{ type: 'feature', label: 'New Feature' }, { type: 'improvement', label: 'Improvement' }],
  'v0.9': [{ type: 'fix', label: 'Bug Fix' }, { type: 'improvement', label: 'Improvement' }],
  'v0.8': [{ type: 'feature', label: 'New Feature' }, { type: 'fix', label: 'Bug Fix' }],
};

export default function ChangelogPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="relative px-6 pb-16 pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-5"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                <Sparkles className="h-3 w-3" />
                Product Updates
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-2xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              What's new in B9 Automation
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-xl text-lg font-light text-zinc-400">
              Product updates across the dashboard, WhatsApp AI, automation canvas, campaigns, and integrations.
            </motion.p>
          </motion.div>

          {/* Divider */}
          <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-[#00F2FE]/20 to-transparent" />
        </div>
      </section>

      {/* Timeline */}
      <section className="relative px-6 pb-32 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-6"
          >
            {changelog.map((entry, i) => (
              <motion.article
                key={entry.version}
                variants={fadeUp}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/25 hover:bg-white/[0.025] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,254,0.04)]"
              >
                {/* Inner glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[#00F2FE]/[0.025] blur-[60px] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                {/* Header row */}
                <div className="relative flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] px-3 py-1 text-xs font-bold text-[#00F2FE]">
                    <GitBranch className="h-3 w-3" />
                    {entry.version}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">{entry.date}</span>

                  {/* Tags */}
                  <div className="ml-auto flex flex-wrap gap-2">
                    {(versionTags[entry.version] || []).map((tag) => (
                      <span
                        key={tag.label}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagColors[tag.type]}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-white">
                  {entry.title}
                </h2>

                {/* Items */}
                <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
                  {entry.items.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                        <CheckCircle2 className="h-2.5 w-2.5 text-[#00F2FE]" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                {/* Release number */}
                <div className="relative mt-5 flex items-center gap-2 border-t border-white/[0.04] pt-4">
                  <Zap className="h-3 w-3 text-zinc-600" />
                  <span className="text-[11px] text-zinc-600">
                    Release {i === 0 ? 'latest' : `${changelog.length - i} version${changelog.length - i > 1 ? 's' : ''} ago`}
                  </span>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 flex flex-col items-center gap-4 text-center"
          >
            <p className="text-sm text-zinc-500">More updates shipping weekly. Follow our roadmap.</p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/25 bg-[#00F2FE]/[0.07] px-6 py-3 text-sm font-semibold text-[#00F2FE] transition-all duration-300 hover:bg-[#00F2FE]/[0.12] hover:shadow-[0_0_30px_rgba(0,242,254,0.15)]"
            >
              <Sparkles className="h-4 w-4" />
              Try B9 for free
            </a>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
