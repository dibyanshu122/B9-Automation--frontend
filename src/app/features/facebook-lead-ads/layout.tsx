import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Facebook Lead Ads Automation — Auto-Capture & Follow Up',
  'Automatically capture Facebook Lead Ad submissions, qualify leads with AI, and trigger WhatsApp or email follow-ups instantly with B9 Automation.',
  '/features/facebook-lead-ads'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
