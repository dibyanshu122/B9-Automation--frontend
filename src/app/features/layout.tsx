import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Features — WhatsApp, Instagram & Facebook Automation',
  'Explore all B9 Automation features: WhatsApp bot, Instagram DM automation, Facebook Lead Ads, AI chatbot, visual workflow builder, and more.',
  '/features'
);

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
