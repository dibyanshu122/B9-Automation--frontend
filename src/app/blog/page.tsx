'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { blogPosts } from '@/lib/marketing';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing-shell';
import { ArrowRight, Mail, Linkedin, Instagram, Youtube, Globe } from 'lucide-react';
import { Button } from '@/components/button';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function BlogPage() {

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
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm mb-6">
              <span className="text-sm font-medium text-gray-300">From the Blog</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Insights & Guides
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn how to automate your business, leverage AI, and grow faster with B9 Automation.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FEATURED POST */}
      {blogPosts.length > 0 && (
        <section className="relative border-b border-white/[0.06] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.10] bg-white/[0.02] p-8 lg:p-12 hover:border-white/[0.15] transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-gray-500">{blogPosts[0].category}</span>
                <span>•</span>
                <span>{new Date(blogPosts[0].date).toLocaleDateString('en-US')}</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 hover:text-gray-200 transition-colors">
                {blogPosts[0].title}
              </h2>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">{blogPosts[0].description}</p>
              <Link href="/blog" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                Read article <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* BLOG GRID */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {blogPosts.slice(1, 4).map((post) => (
              <motion.a
                key={post.title}
                href="/blog"
                variants={fadeUp}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 lg:p-8 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300 group flex flex-col"
              >
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-gray-500">{post.category}</span>
                  <span>•</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US')}</span>
                </div>
                <h3 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{post.description}</p>
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors flex items-center gap-1">
                  Read article <ArrowRight className="h-3 w-3" />
                </span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
              Stay updated
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 mb-8 max-w-xl mx-auto">
              Get the latest insights on automation, AI, and business growth delivered to your inbox.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/[0.20] transition-all"
              />
              <button className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all whitespace-nowrap">
                Subscribe
              </button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs text-gray-600 mt-4">
              No spam, unsubscribe anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-white/[0.04]">
            <div>
              <div className="mb-4">
                <Logo variant="dark" />
              </div>
              <p className="text-sm text-gray-600 mt-4 max-w-xs leading-relaxed">
                AI automation for Indian businesses. WhatsApp bots, lead capture, AI chat, and document intelligence — all in one platform.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { icon: <Globe className="h-4 w-4" />, label: 'Website', href: 'https://b9automation.com' },
                  { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn', href: 'https://linkedin.com/company/b9automation' },
                  { icon: <Instagram className="h-4 w-4" />, label: 'Instagram', href: 'https://instagram.com/b9automation' },
                  { icon: <Youtube className="h-4 w-4" />, label: 'YouTube', href: 'https://youtube.com/@b9automation' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-gray-600 hover:text-white hover:border-white/[0.15] transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
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
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Careers', href: 'mailto:hello@b9automation.com?subject=Careers' },
                  { label: 'Contact', href: 'mailto:hello@b9automation.com' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {[
                  { label: 'Help Center', href: 'mailto:hello@b9automation.com' },
                  { label: 'Book a Demo', href: '/signup?demo=1' },
                  { label: 'Community', href: 'https://wa.me/919999999999' },
                  { label: 'Status Page', href: 'https://b9automation.com' },
                  { label: 'Roadmap', href: '/blog' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-gray-300 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm">
                <a href="mailto:hello@b9automation.com" className="flex items-center gap-2 text-gray-600 hover:text-gray-300">
                  <Mail className="h-4 w-4" />
                  hello@b9automation.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-gray-700">
            <p>© 2026 B9 Automation Pvt. Ltd. All rights reserved.</p>
            <p>Made with ♥ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
