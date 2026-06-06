'use client';

import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import { CommandPalette } from '@/components/command-palette';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { QuickActionFAB } from '@/components/quick-action-fab';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getDashboardBootstrap } from '@/lib/dashboard-bootstrap';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, hasHydrated, logout } = useAuthStore();
  const { sidebarPinned, darkMode } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);

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

  // Warmup ping — wakes up Render backend immediately so campaigns/analytics don't stall
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl) {
      fetch(`${apiUrl}/health`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
    }
  }, []); // runs once on dashboard mount

  useEffect(() => {
    if (!hasHydrated || !user || !token) return;
    // Only check onboarding ONCE when the user first loads the dashboard, not on every route change
    const skipped = typeof window !== 'undefined' && localStorage.getItem('onboarding_skipped') === 'true';
    if (skipped) return;
    getDashboardBootstrap()
      .then((response) => {
        if (!response.onboarding?.is_complete) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [hasHydrated, user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Only the main element scrolls now; body is locked.
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Apply / remove Tailwind 'dark' class on <html> when user toggles theme
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  if (!hasHydrated || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 shadow-sm">
          <svg className="h-4 w-4 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Opening B9 Automation...
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className={`b9-command-shell h-screen ${darkMode ? 'dark' : ''}`} onPointerMove={handlePointerMove}>
      <CommandPalette />
      <Navbar />
      <div className="relative z-10 flex h-[calc(100vh-64px)] min-w-0 mt-16">
        <Sidebar />
        {/* Single scroll container; body never scrolls. */}
        <main
          ref={mainRef}
          className={`min-w-0 flex-1 overflow-hidden transition-[margin] duration-300 ease-in-out bg-white dark:bg-gray-950 dark:text-gray-100 ${sidebarPinned ? 'md:ml-72' : 'md:ml-16'}`}
          style={{ scrollbarGutter: 'stable' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.992 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.996 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.7 }}
              className={`min-w-0 w-full h-full ${
                pathname === '/dashboard/messages'
                  ? 'overflow-hidden'          // messages: no padding, full height
                  : 'px-4 pb-8 pt-6 sm:px-5 sm:pt-7 lg:px-6 lg:pt-8 overflow-y-auto'
              }`}
            >
              <ErrorBoundary>{children}</ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Floating Action Button — quick create from anywhere */}
      <QuickActionFAB />
    </div>
  );
}
