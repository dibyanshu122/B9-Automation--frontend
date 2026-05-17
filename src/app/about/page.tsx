'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing-shell';
import { Rocket, ShieldCheck, LockKeyhole, Brain, Users, Globe, Mail, Linkedin, Instagram, Youtube } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-4">{children}</p>;
}

export default function AboutPage() {

  const values = [
    {
      icon: Rocket,
      title: 'Fast to launch',
      description: 'No coding required. Set up in minutes, not weeks.',
    },
    {
      icon: Brain,
      title: 'AI-native workflow',
      description: 'Built from the ground up for AI. Not just a plugin.',
    },
    {
      icon: Users,
      title: 'Built for teams',
      description: 'Collaborate, assign roles, and scale together.',
    },
    {
      icon: ShieldCheck,
      title: 'Private by default',
      description: 'Your data stays yours. Enterprise-grade security.',
    },
    {
      icon: Globe,
      title: 'Made in India',
      description: 'Built for Indian businesses, by Indian teams.',
    },
    {
      icon: LockKeyhole,
      title: 'Grounded by sources',
      description: 'AI answers cite their sources. No hallucinations.',
    },
  ];

  const impactPoints = [
    { metric: '1000+', label: 'Businesses Automated' },
    { metric: '10M+', label: 'Messages Processed' },
    { metric: '₹50Cr+', label: 'Revenue Influenced' },
  ];

  const missionItems = [
    { icon: Rocket, text: 'Empower' },
    { icon: Brain, text: 'Innovate' },
    { icon: Users, text: 'Connect' },
    { icon: ShieldCheck, text: 'Secure' },
  ];

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
      <section className="relative border-b border-white/[0.06] py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm mb-6">
              <span className="text-sm font-medium text-gray-300">About Us</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Built for the next generation of Indian businesses
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              We started B9 Automation to solve a simple problem: most automation tools are built for global enterprises, not Indian SMBs. We're changing that.
            </motion.p>

            {/* Impact Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {impactPoints.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.10] bg-white/[0.02] p-6">
                  <div className="text-3xl font-bold text-white mb-2">{item.metric}</div>
                  <div className="text-sm text-gray-400">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Our Mission</SectionLabel>
              <h2 className="text-4xl font-bold mb-6">Automate what matters</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Every business has repetitive tasks that waste time and money. Customer inquiries, lead qualification, appointment booking, document processing. These should be automated, not outsourced.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                B9 Automation does exactly that. We help Indian businesses automate customer interactions, lead management, and document processing without code. No consultants. No 6-month implementation. Just smart automation that works.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              {missionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="rounded-2xl border border-white/[0.10] bg-white/[0.02] p-8 text-center">
                    <Icon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <div className="font-semibold text-white">{item.text}</div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* VALUES GRID */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Our Values</SectionLabel>
              <h2 className="text-4xl font-bold">What drives us</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-white/[0.15] transition-all"
                >
                  <Icon className="h-8 w-8 text-gray-500 mb-4" />
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Our Story</SectionLabel>
              <h2 className="text-4xl font-bold mb-8">Why we started B9</h2>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.10] bg-white/[0.03] p-12">
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                In 2023, we were working with dozens of Indian businesses—coaching centers, real estate companies, service providers, agencies. They all had the same problem: too many manual tasks, not enough team members.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                The solutions available were either too expensive (enterprise software costing lakhs per month) or too limited (generic chatbot builders). Nothing was built for the Indian market, in Indian languages, with Indian pricing.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                So we built B9. A platform that lets any Indian business automate customer interactions, lead management, and workflows without code, at prices that make sense. And we're just getting started.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative border-b border-white/[0.06] py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-12 lg:p-16 text-center"
          >
            <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-bold mb-6">
              Join us in building the future of automation
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Whether you're looking to automate your business or join our team, we'd love to hear from you.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                  Start Free Trial
                </button>
              </Link>
              <a href="mailto:hello@b9automation.com?subject=Careers at B9 Automation" className="px-8 py-3 rounded-lg bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all">
                We're Hiring
              </a>
            </motion.div>
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
                  { icon: <Globe className="h-4 w-4" />, label: 'Website' },
                  { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
                  { icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
                  { icon: <Youtube className="h-4 w-4" />, label: 'YouTube' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
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
                {['About Us', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {['Help Center', 'Book a Demo', 'Community', 'Status Page', 'Roadmap'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-gray-300 transition-colors">
                      {link}
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
