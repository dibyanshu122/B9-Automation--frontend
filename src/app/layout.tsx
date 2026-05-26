import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://b9automation.com'),
  title: {
    default: 'B9 Automation — WhatsApp, Instagram & Facebook Business AI',
    template: '%s | B9 Automation',
  },
  description:
    'Automate WhatsApp replies, Instagram DM, and Facebook lead follow-ups with AI. B9 Automation helps Indian businesses reply 24/7, capture leads, and close more sales.',
  keywords: [
    'WhatsApp automation India',
    'Instagram DM automation',
    'Facebook lead ads automation',
    'AI chatbot for business',
    'WhatsApp bot',
    'lead management India',
    'B9 Automation',
    'Meta Business automation',
    'WhatsApp Business API',
    'sales automation India',
  ],
  authors: [{ name: 'B9 Automation Team' }],
  creator: 'B9 Automation',
  openGraph: {
    type: 'website',
    siteName: 'B9 Automation',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'B9 Automation' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@B9Automation',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'B9 Automation',
  },
  formatDetection: {
    telephone: false,
    email: true,
    address: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />

        {/* Theme color */}
        <meta name="theme-color" content="#f97316" />
        <meta name="color-scheme" content="light" />

        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://b9-automation-backend.onrender.com" />
      </head>
      <body className={`${inter.className} font-sans`} suppressHydrationWarning>
        <Providers>{children}</Providers>
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
                    businessName: 'My Knowledge Base',
                    config: {
                      title: 'Chat with us',
                      primary_color: '#3b82f6',
                      theme_color: '#3b82f6',
                      welcome_message: 'Hi! How can we help?',
                      position: 'bottom-right',
                      enable_3d_robot: true,
                      spline_scene_url: 'https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode',
                      suggested_buttons: ['Pricing', 'Services', 'Book Demo', 'Talk to Team'],
                      lead_capture_after_messages: 3,
                      sales_agent_mode: true,
                      watermark_enabled: false
                    }
                  });
                };
                document.head.appendChild(s);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
