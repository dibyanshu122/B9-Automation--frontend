'use client';

import { useEffect, useRef } from 'react';

interface SplineViewerProps {
  scene: string;
  className?: string;
}

// Module-level flag — shared across ALL SplineViewer instances on the page.
// Prevents double-loading the script (which causes a "custom element already defined" error
// that silently kills every spline-viewer on the page).
let _scriptInjected = false;

function ensureSplineScript() {
  if (_scriptInjected) return;
  if (typeof window === 'undefined') return;
  // Also skip if the element is already registered (e.g. hot-reload)
  if (window.customElements?.get('spline-viewer')) {
    _scriptInjected = true;
    return;
  }
  _scriptInjected = true;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js';
  document.head.appendChild(script);
}

const HIDE_STYLE = `
  #logo, a, [data-spline-logo], .spline-logo, .logo, .spline-hint, .hint,
  [part="logo"], [part="button"], [part="hint"], button, .button {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

export function SplineViewer({ scene, className = '' }: SplineViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);

  // Load script once (global guard)
  useEffect(() => {
    ensureSplineScript();
  }, []);

  // Inject watermark-hiding styles into the shadow DOM
  useEffect(() => {
    const viewerEl = viewerRef.current;
    if (!viewerEl) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let styleEl: HTMLStyleElement | null = null;

    const applyHide = () => {
      const root = (viewerEl as any).shadowRoot as ShadowRoot | null;
      if (!root) return false;

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.textContent = HIDE_STYLE;
        root.appendChild(styleEl);
      }

      root.querySelectorAll<HTMLElement>(
        '#logo, a, [data-spline-logo], .spline-logo, .logo, .spline-hint, .hint, [part="logo"], [part="button"], [part="hint"], button, .button'
      ).forEach((node) => {
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
      });

      return true;
    };

    // Try immediately, then poll until shadow DOM is ready (max 6s)
    if (!applyHide()) {
      intervalId = setInterval(() => {
        if (applyHide() && intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);

      const timeout = setTimeout(() => {
        if (intervalId !== null) clearInterval(intervalId);
      }, 6000);

      return () => {
        if (intervalId !== null) clearInterval(intervalId);
        clearTimeout(timeout);
      };
    }
  }, [scene]);

  const SplineTag = 'spline-viewer' as any;

  return (
    <div className={className}>
      <SplineTag
        ref={viewerRef}
        url={scene}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
