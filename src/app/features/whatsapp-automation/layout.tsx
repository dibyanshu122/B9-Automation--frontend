import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'WhatsApp Automation — Auto-Reply, Lead Capture & Broadcasts',
  'Automate WhatsApp Business replies 24/7 with AI. Capture leads, send follow-ups, create broadcast campaigns, and close more sales on WhatsApp.',
  '/features/whatsapp-automation'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
