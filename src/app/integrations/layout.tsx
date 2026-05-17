import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Integrations — Connect WhatsApp, Gmail, Sheets & More',
  'B9 Automation connects with WhatsApp Business API, Gmail, Google Sheets, Facebook Lead Ads, Instagram DM, Razorpay, and 100+ tools. No code needed.',
  '/integrations'
);

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
