'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CreditCard,
  FileText,
  MessageCircle,
  MousePointer2,
  Send,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';

const phrases = ['AI reads your intent.', 'AI drafts the workflow.', 'Business runs 24/7.'];

const agentNodes = [
  { label: 'WhatsApp', detail: 'Replies and campaigns', icon: MessageCircle, accent: '#25D366' },
  { label: 'Lead Capture', detail: 'Hot leads and fields', icon: Users, accent: '#00F2FE' },
  { label: 'Payments', detail: 'Razorpay links', icon: CreditCard, accent: '#4F8CFF' },
  { label: 'Templates', detail: 'Meta-ready drafts', icon: FileText, accent: '#A855F7' },
  { label: 'Flows', detail: 'Forms inside chat', icon: Workflow, accent: '#F97316' },
  { label: 'Handover', detail: 'Human fallback', icon: Send, accent: '#F43F5E' },
];

const nodePositions = [
  [0, -168],
  [168, -78],
  [158, 94],
  [0, 160],
  [-158, 94],
  [-168, -78],
];

export function HeroAnimation() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [cursor, setCursor] = useState({ x: -100, y: -100, active: false });

  const metrics = useMemo(
    () => [
      { label: 'AI replies left', value: '20K' },
      { label: 'Setup time', value: '5 min' },
      { label: 'Channels', value: '9' },
    ],
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let rafId = 0;
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let ctx: { revert: () => void } | null = null;

    const setup = async () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mobile = window.matchMedia('(max-width: 767px)').matches;

      const [{ gsap }, { ScrollTrigger }, lenisModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
      ]);
      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      if (!reduceMotion && !mobile) {
        const Lenis = lenisModule.default;
        lenis = new Lenis({
          duration: 0.72,
          smoothWheel: true,
          wheelMultiplier: 1.25,
          touchMultiplier: 0,
        }) as typeof lenis;

        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      }

      ctx = gsap.context(() => {
        const nodes = gsap.utils.toArray<HTMLElement>('[data-agent-node]');
        const phraseEls = gsap.utils.toArray<HTMLElement>('[data-hero-phrase]');

        gsap.set('[data-ai-core], [data-core-ring], [data-agent-node], [data-dashboard-card]', {
          willChange: 'transform, opacity',
          force3D: true,
        });

        if (reduceMotion || mobile) {
          gsap.fromTo(
            '[data-agent-node]',
            { opacity: 0, y: 18, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
          );
          gsap.fromTo(
            '[data-dashboard-card]',
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.35, ease: 'power3.out' }
          );
          return;
        }

        gsap.set(nodes, {
          x: (index) => nodePositions[index][0] * 0.28,
          y: (index) => nodePositions[index][1] * 0.28,
          scale: 0.7,
          opacity: 0.46,
          rotate: 0,
        });
        gsap.set(phraseEls, { autoAlpha: 0, y: 20 });
        gsap.set(phraseEls[0], { autoAlpha: 1, y: 0 });
        gsap.set('[data-dashboard-card]', { opacity: 0.52, y: 12, scale: 0.96 });
        gsap.set('[data-agent-stream]', { scaleX: 0.2, opacity: 0.22, transformOrigin: 'left center' });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=135%',
            scrub: 0.35,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            '[data-ai-core]',
            { opacity: 0.9, scale: 0.9, rotate: -10 },
            { opacity: 1, scale: 1.03, rotate: 0, duration: 0.14, ease: 'power2.out' },
            0
          )
          .to('[data-core-ring]', { rotate: 250, scale: 1.16, duration: 0.82, ease: 'none' }, 0)
          .to('[data-agent-stream]', { scaleX: 1, opacity: 0.65, duration: 0.2, stagger: 0.025, ease: 'power2.out' }, 0.05)
          .to(
            nodes,
            {
              x: (index) => nodePositions[index][0],
              y: (index) => nodePositions[index][1],
              opacity: 1,
              scale: 1,
              rotate: (index) => (index % 2 === 0 ? 4 : -4),
              duration: 0.28,
              stagger: 0.035,
              ease: 'power3.out',
            },
            0.08
          )
          .to(phraseEls[0], { autoAlpha: 0, y: -16, duration: 0.06 }, 0.28)
          .to(phraseEls[1], { autoAlpha: 1, y: 0, duration: 0.08 }, 0.31)
          .to('[data-agent-node]', { scale: 1.06, duration: 0.14, stagger: 0.02, ease: 'power2.out' }, 0.36)
          .to('[data-dashboard-card]', { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power3.out' }, 0.42)
          .to(phraseEls[1], { autoAlpha: 0, y: -16, duration: 0.06 }, 0.58)
          .to(phraseEls[2], { autoAlpha: 1, y: 0, duration: 0.08 }, 0.61)
          .to('[data-agent-node]', {
            x: (index) => nodePositions[index][0] * 0.82,
            y: (index) => nodePositions[index][1] * 0.82,
            scale: 0.92,
            opacity: 0.82,
            duration: 0.18,
            ease: 'power2.inOut',
          }, 0.72)
          .to('[data-agent-stream]', { opacity: 0.3, duration: 0.16 }, 0.72);
      }, rootRef);

      ScrollTrigger.refresh();
    };

    setup();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      ctx?.revert();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(max-width: 767px)').matches) return;
    const onMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      setCursor({
        x: event.clientX,
        y: event.clientY,
        active: Boolean(target?.closest('a, button')),
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden border-b border-white/[0.04] bg-[#030712] pt-24 md:pt-28"
    >
      <style>{`
        @media (min-width: 768px) and (max-height: 720px) {
          .b9-hero-orbit-stage {
            transform: translateY(-32px) scale(0.78);
            transform-origin: center top;
          }
        }
      `}</style>
      <motion.div
        aria-hidden="true"
        animate={{ x: cursor.x - 9, y: cursor.y - 9, scale: cursor.active ? 1.9 : 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.4 }}
        className="pointer-events-none fixed left-0 top-0 z-[80] hidden h-[18px] w-[18px] rounded-full border border-[#00F2FE]/45 bg-[#00F2FE]/20 mix-blend-screen md:block"
      />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F2FE]/[0.055] blur-[140px]" />
        <div className="absolute right-[-10%] top-[15%] h-[500px] w-[500px] rounded-full bg-[#FF5722]/[0.035] blur-[130px]" />
        <div className="absolute left-[12%] top-[18%] h-[360px] w-[360px] rounded-full bg-[#25D366]/[0.025] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[28%] h-[300px] w-[300px] rounded-full bg-[#A855F7]/[0.025] blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:38px_38px] opacity-[0.25]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-14 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:pb-20 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BFFF8]">
            <Sparkles className="h-3.5 w-3.5" />
            India's Agentic Automation OS
          </span>

          <h1 className="relative z-20 mt-7 max-w-[720px] text-5xl font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-[5.8rem]">
            <span className="block text-white" style={{ WebkitTextFillColor: '#ffffff', textShadow: '0 0 1px rgba(255,255,255,0.35)' }}>Your AI sales team,</span>
            <span className="block text-[#22F3DF] md:bg-gradient-to-r md:from-[#25D366] md:via-[#00F2FE] md:to-[#7BFFF8] md:bg-clip-text md:text-transparent" style={{ WebkitTextFillColor: 'currentColor', textShadow: '0 0 1px rgba(34,243,223,0.35)' }}>
              running on WhatsApp.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 md:text-lg">
            B9 Agentic Core turns plain-English intent into WhatsApp replies, Meta templates, lead flows,
            campaigns, payments, and human handover. You review, approve, and your business keeps moving.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <button className="group inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.14] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_35px_rgba(0,242,254,0.18)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_48px_rgba(0,242,254,0.28)] active:scale-[0.98]">
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/signup?demo=1">
              <button className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-7 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] active:scale-[0.98]">
                Book Demo
              </button>
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-200">
              How it works
              <MousePointer2 className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl">
                <p className="text-xl font-bold text-white">{metric.value}</p>
                <p className="mt-1 text-[11px] leading-4 text-zinc-500">{metric.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative mx-auto flex min-h-[560px] w-full max-w-[680px] items-center justify-center md:min-h-[680px]">
          <div className="absolute left-1/2 -top-5 z-40 h-16 w-[min(520px,80vw)] -translate-x-1/2 md:-top-20">
            {phrases.map((phrase, index) => (
              <p
                key={phrase}
                data-hero-phrase
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-[#030712]/55 px-5 text-center text-xl font-semibold tracking-tight text-[#EAFDFF] shadow-[0_18px_50px_rgba(0,0,0,0.3),0_0_26px_rgba(0,242,254,0.18)] backdrop-blur-md md:text-3xl ${index === 0 ? '' : 'opacity-0'}`}
              >
                {phrase}
              </p>
            ))}
          </div>

          <div className="b9-hero-orbit-stage relative mt-6 h-[430px] w-[430px] max-w-[90vw] md:-mt-20 md:h-[550px] md:w-[550px] md:-translate-x-10">
            <div data-core-ring className="absolute inset-8 rounded-full border border-[#00F2FE]/18 bg-[conic-gradient(from_130deg,rgba(0,242,254,0),rgba(37,211,102,0.24),rgba(168,85,247,0.24),rgba(255,87,34,0.18),rgba(0,242,254,0))] shadow-[0_0_80px_rgba(0,242,254,0.12)]" />
            <div className="absolute inset-16 rounded-full border border-white/[0.08] bg-white/[0.018] backdrop-blur-2xl" />
            {agentNodes.map((node, index) => {
              const [x, y] = nodePositions[index];
              const length = Math.max(88, Math.sqrt(x * x + y * y) - 54);
              const angle = Math.atan2(y, x) * (180 / Math.PI);
              return (
                <span
                  key={`${node.label}-stream`}
                  data-agent-stream
                  className="absolute left-1/2 top-1/2 z-[5] h-[2px] rounded-full"
                  style={{
                    width: length,
                    transform: `rotate(${angle}deg) translateX(48px)`,
                    background: `linear-gradient(90deg, ${node.accent}00, ${node.accent}cc, ${node.accent}22)`,
                    boxShadow: `0 0 18px ${node.accent}55`,
                  }}
                />
              );
            })}

            <div data-ai-core className="absolute left-1/2 top-1/2 z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-[#00F2FE]/30 bg-[#03121b]/90 shadow-[0_0_65px_rgba(0,242,254,0.24)]">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#00F2FE]/22 via-[#25D366]/10 to-[#FF5722]/18" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06]">
                <Bot className="h-9 w-9 text-[#7BFFF8]" />
              </div>
            </div>

            {agentNodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  data-agent-node
                  className="absolute left-1/2 top-1/2 z-10 w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.1] bg-[#07111f]/82 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
                  style={{ boxShadow: `0 18px 50px rgba(0,0,0,0.38), 0 0 28px ${node.accent}22` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-white"
                      style={{ borderColor: `${node.accent}40`, background: `${node.accent}18`, color: node.accent }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-white">{node.label}</span>
                      <span className="block text-[10px] leading-3 text-zinc-500">{node.detail}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            <div data-dashboard-card className="absolute left-1/2 top-[calc(100%+96px)] z-30 w-[min(420px,88vw)] -translate-x-1/2 rounded-3xl border border-white/[0.09] bg-[#07111f]/92 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Agentic workflow ready</p>
                  <p className="text-xs text-zinc-500">Intent, template, flow and payment path generated.</p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                  REVIEW
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Reply', 'Flow', 'Payment'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-center text-xs font-semibold text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[11px] font-semibold text-zinc-500 backdrop-blur-xl md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] shadow-[0_0_14px_rgba(0,242,254,0.8)]" />
            Scroll to watch B9 build the workflow
          </div>
        </div>
      </div>
    </section>
  );
}
