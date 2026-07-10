'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MagneticButton } from '@/components/premium-motion';
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

const phrases = [
  'Turn every inquiry into action.',
  'Give every lead the right next step.',
  'Keep sales moving after your team logs off.',
];

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
          duration: 0.9,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.5,
          infinite: false,
          prevent: (node: HTMLElement) =>
            node.hasAttribute('data-lenis-prevent') ||
            node.classList.contains('brainai-panel') ||
            node.classList.contains('brainai-messages'),
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

        gsap.set('[data-ai-core], [data-core-ring], [data-agent-node]', {
          willChange: 'transform, opacity',
          force3D: true,
        });

        if (reduceMotion || mobile) {
          gsap.fromTo(
            '[data-agent-node]',
            { opacity: 0, y: 18, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
          );
          return;
        }

        gsap.set(phraseEls, { autoAlpha: 0, y: 20 });
        gsap.set(phraseEls[0], { autoAlpha: 1, y: 0 });

        // ── Phase 1: auto-play intro on load — the orbit assembles itself
        //    without needing a scroll, so the first impression is complete.
        gsap.set(nodes, { x: 0, y: 0, scale: 0.4, opacity: 0, rotate: 0 });
        gsap.set('[data-agent-stream]', { scaleX: 0, opacity: 0, transformOrigin: 'left center' });
        gsap.set('[data-ai-core]', { opacity: 0, scale: 0.7, rotate: -14 });

        const intro = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: buildScrollTimeline,
        });
        intro
          .to('[data-ai-core]', { opacity: 1, scale: 1, rotate: 0, duration: 0.55 }, 0.1)
          .to('[data-agent-stream]', { scaleX: 1, opacity: 0.6, duration: 0.5, stagger: 0.06 }, 0.35)
          .to(nodes, {
            x: (index) => nodePositions[index][0] * 0.92,
            y: (index) => nodePositions[index][1] * 0.92,
            opacity: 1,
            scale: 0.96,
            duration: 0.7,
            stagger: 0.07,
            ease: 'back.out(1.4)',
          }, 0.45);

        // Scroll-scrub/pin removed — it broke the orbit mid-scroll in both
        // themes. The load intro above is the full experience now.
        function buildScrollTimeline() { /* intentionally empty */ }
        void buildScrollTimeline;
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

  // Cursor parallax — orbit nodes lean toward the cursor at different depths.
  // Applied to an INNER wrapper so it composes with GSAP's outer x/y transforms.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;   // -1..1
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06; // lazy follow — feels weighty
      curY += (targetY - curY) * 0.06;
      const inners = root.querySelectorAll<HTMLElement>('[data-node-parallax]');
      inners.forEach((el) => {
        const depth = parseFloat(el.dataset.nodeParallax || '10');
        el.style.transform = `translate3d(${curX * depth}px, ${curY * depth}px, 0)`;
      });
      const core = root.querySelector<HTMLElement>('[data-core-parallax]');
      if (core) core.style.transform = `translate3d(${curX * 5}px, ${curY * 5}px, 0)`;
      const blobs = root.querySelectorAll<HTMLElement>('[data-blob-parallax]');
      blobs.forEach((el, i) => {
        const d = 14 + i * 6;
        el.style.transform = `translate3d(${-curX * d}px, ${-curY * d}px, 0)`; // opposite = depth
      });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden border-b border-white/[0.04] bg-[#030712] pt-20 md:pt-20"
    >
      <style>{`
        @media (min-width: 768px) and (max-height: 720px) {
          .b9-hero-orbit-stage {
            transform: translateY(-32px) scale(0.78);
            transform-origin: center top;
          }
        }
        /* Data pulses travelling from the AI core out along each wire */
        .b9-stream-pulse {
          position: absolute;
          top: 50%;
          left: 0;
          height: 5px;
          width: 5px;
          border-radius: 9999px;
          transform: translateY(-50%);
          animation: b9-pulse-travel 2.4s linear infinite;
          opacity: 0;
        }
        @keyframes b9-pulse-travel {
          0%   { left: 0%;   opacity: 0; }
          12%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .b9-stream-pulse { animation: none; opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F2FE]/[0.055] blur-[140px]" />
        <div data-blob-parallax className="absolute right-[-10%] top-[15%] h-[500px] w-[500px] rounded-full bg-[#FF5722]/[0.035] blur-[130px]" />
        <div data-blob-parallax className="absolute left-[12%] top-[18%] h-[360px] w-[360px] rounded-full bg-[#25D366]/[0.025] blur-[120px]" />
        <div data-blob-parallax className="absolute bottom-[10%] right-[28%] h-[300px] w-[300px] rounded-full bg-[#A855F7]/[0.025] blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:38px_38px] opacity-[0.25]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl grid-cols-1 items-start gap-10 px-6 pb-14 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:pt-2 md:pb-20 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl md:pt-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BFFF8]">
            <Sparkles className="h-3.5 w-3.5" />
            India's Agentic Automation OS
          </span>

          <h1 className="relative z-20 mt-7 max-w-[680px] text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-[4.9rem]">
            <span className="block text-white" style={{ WebkitTextFillColor: '#ffffff', textShadow: '0 0 1px rgba(255,255,255,0.35)' }}>Your AI sales team,</span>
            <span
              className="block bg-gradient-to-r from-[#25D366] via-[#00F2FE] to-[#7BFFF8] bg-clip-text text-transparent"
              style={{ textShadow: '0 0 1px rgba(34,243,223,0.15)' }}
            >
              running on WhatsApp.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 md:text-lg">
            Tell B9 the outcome you want. Its Agentic Core builds the WhatsApp journey, qualifies every lead,
            follows up automatically, collects payments, and brings your team in exactly when a human is needed.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton>
              <Link href="/signup">
                <button className="group inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.14] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_35px_rgba(0,242,254,0.18)] transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_48px_rgba(0,242,254,0.28)] active:scale-[0.98]">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25}>
              <Link href="/signup?demo=1">
                <button className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-7 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] active:scale-[0.98]">
                  Book Demo
                </button>
              </Link>
            </MagneticButton>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-200">
              How it works
              <MousePointer2 className="h-4 w-4" />
            </Link>
          </div>

        </motion.div>

        <div className="relative mx-auto flex min-h-[560px] w-full max-w-[680px] flex-col items-center justify-start md:min-h-[680px]">
          <div className="relative z-40 h-12 w-[min(460px,82vw)] shrink-0">
            {phrases.map((phrase, index) => (
              <p
                key={phrase}
                data-hero-phrase
                className={`absolute inset-0 flex items-center justify-center rounded-xl border border-[#7BFFF8]/15 bg-[#06111b]/55 px-4 text-center text-sm font-semibold tracking-tight text-[#DFFFFC] shadow-[0_12px_34px_rgba(0,0,0,0.3),0_0_24px_rgba(0,242,254,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl [text-shadow:0_0_20px_rgba(0,242,254,0.32)] md:text-lg ${index === 0 ? '' : 'opacity-0'}`}
              >
                {phrase}
              </p>
            ))}
          </div>

          <div className="b9-hero-orbit-stage relative mt-7 h-[430px] w-[430px] max-w-[90vw] md:mt-7 md:h-[550px] md:w-[550px] md:-translate-x-10">
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
                >
                  <span
                    className="b9-stream-pulse"
                    style={{
                      background: node.accent,
                      boxShadow: `0 0 10px ${node.accent}, 0 0 18px ${node.accent}88`,
                      animationDelay: `${index * 0.4}s`,
                    }}
                  />
                </span>
              );
            })}

            <div data-ai-core className="absolute left-1/2 top-1/2 z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-[#00F2FE]/30 bg-[#03121b]/90 shadow-[0_0_65px_rgba(0,242,254,0.24)]">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#00F2FE]/22 via-[#25D366]/10 to-[#FF5722]/18" />
              <div data-core-parallax className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06] will-change-transform">
                <Bot className="h-9 w-9 text-[#7BFFF8]" />
              </div>
            </div>

            {agentNodes.map((node, nodeIndex) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  data-agent-node
                  className="absolute left-1/2 top-1/2 z-10 w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.1] bg-[#07111f]/82 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
                  style={{ boxShadow: `0 18px 50px rgba(0,0,0,0.38), 0 0 28px ${node.accent}22` }}
                >
                  {/* Inner parallax wrapper — composes with GSAP's outer transform */}
                  <div data-node-parallax={String(7 + (nodeIndex % 3) * 4)} className="flex items-center gap-2 will-change-transform">
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

          </div>
        </div>
      </div>
    </section>
  );
}
