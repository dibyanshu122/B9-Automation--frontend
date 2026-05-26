'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const HIDE_PATHS = ['/dashboard', '/login', '/signup', '/onboarding', '/admin', '/auth'];

function isMarketing(pathname: string) {
  return !HIDE_PATHS.some(p => pathname.startsWith(p));
}

export function MarketingWidget() {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.getElementById('brainai-widget-root');
    if (el) el.style.display = isMarketing(pathname) ? '' : 'none';
  }, [pathname]);

  return (
    <Script
      id="b9-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var s = document.createElement('script');
            s.src = 'https://b9-automation-frontend.vercel.app/widget.js';
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
            };
            document.head.appendChild(s);
          })();
        `,
      }}
    />
  );
}
