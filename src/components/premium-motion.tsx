'use client';

/**
 * Premium micro-interaction primitives — the motion language of the site.
 * MagneticButton : pulls toward the cursor like Linear/Stripe CTAs
 * TiltCard       : 3D perspective tilt + moving light glare on hover
 * CountUp        : numbers count up when they scroll into view
 * All effects disable themselves on touch devices and reduced-motion.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';

function useFinePointer() {
  const [fine, setFine] = useState(false); // false on SSR — no window
  useEffect(() => {
    // Only runs on client — no hydration mismatch
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    setFine(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return fine;
}

/* ── MagneticButton ──────────────────────────────────────────────────────── */

export function MagneticButton({
  children,
  strength = 0.35,
  className = '',
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 16, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 180, damping: 16, mass: 0.5 });

  const onMove = (e: React.MouseEvent) => {
    if (!fine || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={fine ? { x: sx, y: sy } : undefined}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── TiltCard ────────────────────────────────────────────────────────────── */

export function TiltCard({
  children,
  maxTilt = 7,
  glare = true,
  className = '',
}: {
  children: React.ReactNode;
  maxTilt?: number;
  glare?: boolean;
  className?: string;
}) {
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5); // cursor position within card, 0..1
  const py = useMotionValue(0.5);
  const spx = useSpring(px, { stiffness: 260, damping: 24 });
  const spy = useSpring(py, { stiffness: 260, damping: 24 });
  const rotateX = useTransform(spy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(spx, [0, 1], [-maxTilt, maxTilt]);
  const glareX = useTransform(spx, [0, 1], ['0%', '100%']);
  const glareY = useTransform(spy, [0, 1], ['0%', '100%']);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(380px circle at ${gx} ${gy}, rgba(255,255,255,0.055), transparent 65%)`
  );
  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    if (!fine || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const onLeave = () => { px.set(0.5); py.set(0.5); setHovered(false); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={fine ? { rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 } : undefined}
      className={`relative ${className}`}
    >
      {children}
      {glare && fine && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0, background: glareBackground }}
        />
      )}
    </motion.div>
  );
}

/* ── CountUp ─────────────────────────────────────────────────────────────── */

export function CountUp({
  to,
  duration = 1.6,
  suffix = '',
  prefix = '',
  className = '',
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}{value.toLocaleString('en-IN')}{suffix}
    </span>
  );
}
