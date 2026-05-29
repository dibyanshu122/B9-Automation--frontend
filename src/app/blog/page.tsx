'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { blogPosts } from '@/lib/marketing';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

export default function BlogPage() {
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
            <pattern id="dots-blog" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-blog)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.04] px-6 pb-24 pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center gap-5">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                From the Blog
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              Insights & Guides
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400">
              Learn how to automate your business, leverage AI, and grow faster with B9 Automation.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FEATURED POST */}
      {blogPosts.length > 0 && (
        <section className="relative border-b border-white/[0.04] px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
            >
              <Link href="/blog" className="group block">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.04)] lg:p-12">
                  {/* Inner glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex items-center gap-2 text-xs text-zinc-600 mb-4">
                    <span className="rounded-full border border-[#00F2FE]/15 bg-[#00F2FE]/[0.06] px-2.5 py-0.5 font-semibold text-[#00F2FE]/80">
                      {blogPosts[0].category}
                    </span>
                    <span>·</span>
                    <span className="text-zinc-500">{new Date(blogPosts[0].date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  <h2
                    className="relative text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 mb-4 lg:text-4xl"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {blogPosts[0].title}
                  </h2>
                  <p className="relative text-zinc-400 text-base leading-relaxed mb-6 max-w-3xl">{blogPosts[0].description}</p>

                  <span className="relative inline-flex items-center gap-2 text-sm font-semibold text-[#00F2FE]/80 transition-all duration-300 group-hover:gap-3 group-hover:text-[#00F2FE]">
                    Read article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* BLOG GRID */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {blogPosts.slice(1, 4).map((post) => (
              <motion.div key={post.title} variants={fadeUp}>
                <Link href="/blog" className="group block h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.04)] lg:p-8">
                    {/* Inner glow */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex items-center gap-2 text-xs text-zinc-600 mb-4">
                      <span className="rounded-full border border-[#00F2FE]/15 bg-[#00F2FE]/[0.06] px-2.5 py-0.5 font-semibold text-[#00F2FE]/80">
                        {post.category}
                      </span>
                      <span>·</span>
                      <span className="text-zinc-500">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>

                    <h3 className="relative text-lg font-bold text-white mb-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="relative text-zinc-500 text-sm leading-relaxed flex-1 mb-5">{post.description}</p>

                    <span className="relative inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-all duration-300 group-hover:gap-2 group-hover:text-[#00F2FE]/80">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-5">
                Newsletter
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mb-4 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
              style={{ letterSpacing: '-0.02em' }}
            >
              Stay updated
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-8 max-w-xl mx-auto text-zinc-400 leading-relaxed">
              Get the latest insights on automation, AI, and business growth delivered to your inbox.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 backdrop-blur-xl transition-all duration-300 focus:outline-none focus:border-[#00F2FE]/30 focus:bg-[#00F2FE]/[0.02] focus:shadow-[0_0_20px_rgba(0,242,254,0.08)]"
              />
              <button className="rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_24px_rgba(0,242,254,0.2)] whitespace-nowrap">
                Subscribe
              </button>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-4 text-xs text-zinc-600">
              No spam, unsubscribe anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
