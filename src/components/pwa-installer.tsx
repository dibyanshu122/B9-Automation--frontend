'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {}); // silent fail — not critical
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner only if not already installed and not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 shadow-2xl sm:left-4 sm:translate-x-0">
      <div className="flex items-center gap-3">
        <img src="/brand-logo.svg" alt="B9" className="h-10 w-10 rounded-xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Add to Home Screen</p>
          <p className="text-xs text-zinc-400 leading-snug">Get B9 Automation on your phone — faster access, offline support</p>
        </div>
        <button onClick={dismiss} className="ml-1 flex-shrink-0 text-zinc-500 hover:text-zinc-300 text-lg leading-none">✕</button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={install}
          className="flex-1 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 py-2 text-xs font-bold text-[#00F2FE] hover:bg-[#00F2FE]/20 transition"
        >
          Install App
        </button>
        <button
          onClick={dismiss}
          className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 transition"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
