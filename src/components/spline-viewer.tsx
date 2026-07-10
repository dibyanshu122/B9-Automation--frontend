'use client';

import { useEffect, useRef, useState } from 'react';

interface SplineViewerProps {
  scene: string;
  className?: string;
  style?: React.CSSProperties;
}

const SPLINE_SCRIPT = 'https://unpkg.com/@splinetool/viewer@1.12.95/build/spline-viewer.js';

const HIDE_STYLE = `
  #logo, a, [data-spline-logo], .spline-logo, .logo, .spline-hint, .hint,
  [part="logo"], [part="button"], [part="hint"], button, .button {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

export function SplineViewer({ scene, className = '', style }: SplineViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load the Spline viewer script once — guarded against double-registration
  // which happens in React StrictMode double-invoke or HMR.
  useEffect(() => {
    if (typeof customElements === 'undefined') return;
    // Already registered — script ran before. Nothing to do.
    if (customElements.get('spline-viewer')) return;
    // Script already in DOM (HMR re-mount) — wait for it to register.
    if (document.querySelector(`script[src="${SPLINE_SCRIPT}"]`)) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = SPLINE_SCRIPT;
    script.onerror = () => console.warn('[SplineViewer] Failed to load script');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    setIsMounted(true);
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

  // Render a placeholder div on server (SSR) so HTML is stable,
  // then swap to spline-viewer on client after mount.
  // suppressHydrationWarning prevents React from erroring on the tag swap.
  return (
    <div className={className} style={style} suppressHydrationWarning>
      {isMounted && (
        <SplineTag
          ref={viewerRef}
          url={scene}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}
    </div>
  );
}
