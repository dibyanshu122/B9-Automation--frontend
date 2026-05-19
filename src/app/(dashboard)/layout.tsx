'use client';

import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, hasHydrated, logout } = useAuthStore();
  const { sidebarPinned } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const { get } = useApi();

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const x = event.clientX;
    const y = event.clientY;

    if (pointerFrameRef.current) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      shellRef.current?.style.setProperty('--mouse-x', `${x}px`);
      shellRef.current?.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || !token) {
      logout();
      router.push('/login');
    }
  }, [hasHydrated, user, token, logout, router]);

  useEffect(() => {
    if (!hasHydrated || !user || !token) return;
    // Only check onboarding ONCE when the user first loads the dashboard, not on every route change
    get('/api/automation/onboarding/status')
      .then((response) => {
        if (!response.data?.is_complete) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [hasHydrated, user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Only the main element scrolls now — body is locked
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  if (!hasHydrated || !user || !token) {
    return (
      <div className="b9-command-shell flex min-h-screen items-center justify-center text-slate-200">
        <div className="b9-glass b9-scanline rounded-lg px-6 py-4 text-sm font-medium">
          Opening B9 Automation...
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="b9-command-shell h-screen" onPointerMove={handlePointerMove}>
      <Navbar />
      <div className="relative z-10 flex h-[calc(100vh-64px)] min-w-0 mt-16">
        <Sidebar />
        {/* Single scroll container — body never scrolls, only this main element does */}
        <main
          ref={mainRef}
          className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${sidebarPinned ? 'md:ml-72' : 'md:ml-16'}`}
          style={{ scrollbarGutter: 'stable' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.992 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.996 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.7 }}
              className="min-w-0 max-w-full px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10"
            >
              <ErrorBoundary>{children}</ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
