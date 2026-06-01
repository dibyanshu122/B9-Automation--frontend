'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import { Rocket, ShieldCheck, LockKeyhole, Brain, Users, Globe } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#00F2FE] mb-4">{children}</p>;
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
      description: 'AI answers can cite connected knowledge sources and hand over when human help is needed.',
    },
  ];

  const impactPoints = [
    { metric: '24/7', label: 'Automation Ready' },
    { metric: 'Meta', label: 'Cloud API First' },
    { metric: 'India', label: 'SMB Focused' },
  ];

  const missionItems = [
    { icon: Rocket, text: 'Empower' },
    { icon: Brain, text: 'Innovate' },
    { icon: Users, text: 'Connect' },
    { icon: ShieldCheck, text: 'Secure' },
  ];

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
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots-about" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-about)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* HERO */}
      <section className="relative border-b border-white/[0.06] py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.06] px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]">About Us</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl lg:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              Built for the next generation of Indian businesses
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              We started B9 Automation to solve a simple problem: most automation tools are built for global enterprises, not Indian SMBs. We're changing that.
            </motion.p>

            {/* Impact Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {impactPoints.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#00F2FE]/20 hover:bg-white/[0.025]">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-2">{item.metric}</div>
                  <div className="text-sm text-zinc-500">{item.label}</div>
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
              <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">Automate what matters</h2>
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
                  <div key={item.text} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center backdrop-blur-xl transition-all duration-300 hover:border-[#00F2FE]/20">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                      <Icon className="h-6 w-6 text-[#00F2FE]" />
                    </div>
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
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">What drives us</h2>
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
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#00F2FE]/25 hover:bg-white/[0.025] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.04)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-all duration-300 group-hover:border-[#00F2FE]/20 group-hover:bg-[#00F2FE]/[0.07]">
                    <Icon className="h-5 w-5 text-zinc-400 transition-colors duration-300 group-hover:text-[#00F2FE]" />
                  </div>
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
              <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">Why we started B9</h2>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-12 backdrop-blur-xl transition-all duration-300 hover:border-[#00F2FE]/15">
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
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-12 lg:p-16 text-center backdrop-blur-xl"
          >
            {/* CTA corner blobs */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#00F2FE]/[0.04] blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#FF5722]/[0.03] blur-[80px]" />

            <motion.h2
              variants={fadeUp}
              className="relative text-4xl lg:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400"
              style={{ letterSpacing: '-0.02em' }}
            >
              Join us in building the future of automation
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Whether you're looking to automate your business or join our team, we'd love to hear from you.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="relative inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-8 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
              >
                Start Free Trial
              </Link>
              <a
                href="mailto:hello@b9automation.com?subject=Careers at B9 Automation"
                className="relative inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3 text-sm font-semibold text-zinc-300 backdrop-blur transition-all duration-300 hover:text-white"
              >
                We're Hiring
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
