'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const HIDE_PATHS = ['/dashboard', '/login', '/signup', '/onboarding', '/admin', '/auth'];

function isMarketing(pathname: string) {
  return !HIDE_PATHS.some(p => pathname.startsWith(p));
}

function hideWidget() {
  const el = document.getElementById('brainai-widget-root');
  if (el) el.style.display = 'none';
}

export function MarketingWidget() {
  const pathname = usePathname();
  const marketing = isMarketing(pathname ?? '');

  useEffect(() => {
    if (marketing) {
      const el = document.getElementById('brainai-widget-root');
      if (el) el.style.display = '';
      return;
    }
    hideWidget();
    const observer = new MutationObserver(() => { hideWidget(); });
    observer.observe(document.body, { childList: true, subtree: false });
    return () => observer.disconnect();
  }, [pathname, marketing]);

  if (!marketing) return null;

  return (
    <Script
      id="b9-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var s = document.createElement('script');
            s.src = 'https://b9-automation-frontend.vercel.app/widget.js?v=1.1.0';
            s.async = true;
            s.onload = function() {
              B9Automation.init({
                assistantId: '7086ce82-e8f9-45fa-bdf0-85185f84af22',
                apiUrl: 'https://b9-automation-backend.onrender.com',
                businessName: 'B9 Automation',
                config: {
                  title: 'B9 Automation',
                  primary_color: '#3b82f6',
                  theme_color: '#3b82f6',
                  welcome_message: 'Hi! Ask me anything about B9 Automation.',
                  position: 'bottom-right',
                  enable_3d_robot: true,
                  spline_scene_url: 'https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode',
                  suggested_buttons: ['Pricing', 'Features', 'Book Demo', 'Talk to Team'],
                  lead_capture_after_messages: 3,
                  sales_agent_mode: true,
                  watermark_enabled: false,
                  language: 'en'
                }
              });

              /* ── Run after widget has rendered ── */
              setTimeout(function() {
                var root = document.getElementById('brainai-widget-root');
                if (!root || !root.shadowRoot) return;

                var sr = root.shadowRoot;

                /* 1. Move widget 28px from right edge (slightly away from edge) */
                root.style.right = '28px';
                root.style.bottom = '20px';

                /* 2. Inject shadow-DOM CSS overrides */
                var style = document.createElement('style');
                style.textContent =
                  /* Robot — slightly smaller */
                  '.brainai-robot{width:90px!important;height:90px!important}' +
                  '.brainai-robot spline-viewer{width:90px!important;height:90px!important}' +

                  /* Bubble — dark premium glass */
                  '.brainai-bubble{' +
                    'max-width:200px!important;' +
                    'background:rgba(8,10,20,0.88)!important;' +
                    'color:#e2e8f0!important;' +
                    'border:1px solid rgba(0,242,254,0.22)!important;' +
                    'border-radius:16px 16px 4px 16px!important;' +
                    'box-shadow:0 8px 28px rgba(0,0,0,0.55),0 0 18px rgba(0,242,254,0.08)!important;' +
                    'backdrop-filter:blur(14px)!important;' +
                    '-webkit-backdrop-filter:blur(14px)!important;' +
                    'font-size:13px!important;' +
                    'font-weight:500!important;' +
                    'padding:10px 14px!important;' +
                    'line-height:1.45!important;' +
                    'text-align:center!important;' +
                  '}' +
                  /* Bubble tail arrow — match border color */
                  '.brainai-bubble::after{border-top-color:rgba(0,242,254,0.22)!important}' +
                  /* Intro bubble — keep gradient but smaller */
                  '.brainai-bubble.intro{max-width:200px!important;font-size:14px!important;padding:12px 16px!important}';

                sr.appendChild(style);

                /* 3. Bubble pulse: show 5s → hide → wait 20s → repeat (only when panel closed) */
                var bubble = sr.querySelector('.brainai-bubble');
                var panel  = sr.querySelector('.brainai-panel');
                if (!bubble) return;

                /* Start AFTER intro animation ends (~4.5s) */
                var pulseTimer = null;

                function showBubble() {
                  /* Don't show if chat is open */
                  if (panel && panel.classList.contains('open')) {
                    pulseTimer = setTimeout(showBubble, 5000);
                    return;
                  }
                  bubble.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                  bubble.style.opacity = '1';
                  bubble.style.transform = 'translateY(0) scale(1)';
                  bubble.style.pointerEvents = 'auto';

                  /* Hide after 5 seconds */
                  pulseTimer = setTimeout(function() {
                    bubble.style.opacity = '0';
                    bubble.style.transform = 'translateY(5px) scale(0.96)';
                    bubble.style.pointerEvents = 'none';
                    /* Show again after 20 seconds */
                    pulseTimer = setTimeout(showBubble, 20000);
                  }, 5000);
                }

                /* Hide bubble initially, start pulse cycle */
                bubble.style.opacity = '0';
                bubble.style.transform = 'translateY(5px) scale(0.96)';
                bubble.style.pointerEvents = 'none';
                bubble.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

                /* Wait for intro animation to finish (3.5s) then start */
                setTimeout(showBubble, 4500);

              }, 600);
            };
            document.head.appendChild(s);
          })();
        `,
      }}
    />
  );
}
