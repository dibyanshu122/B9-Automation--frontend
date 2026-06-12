import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { MarketingWidget } from '@/components/marketing-widget';
import { PWAInstaller } from '@/components/pwa-installer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
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
    icon: '/brand-logo.svg',
    apple: '/brand-logo.svg',
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
        <link rel="icon" href="/brand-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand-logo.svg" />

        {/* Theme color */}
        <meta name="theme-color" content="#060608" />
        <meta name="color-scheme" content="dark" />

        {/* Prevent dark mode flash — read persisted preference before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('ui-store-v2')||'{}');if(s.state&&s.state.darkMode===true){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />

        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://b9-automation-backend.onrender.com" />
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('marketing-theme')==='light')document.documentElement.classList.add('mk-light')}catch(e){}` }} />
        <Providers>{children}</Providers>
        <MarketingWidget />
        <PWAInstaller />
      </body>
    </html>
  );
}
