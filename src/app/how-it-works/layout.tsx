import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'How It Works — B9 Automation for Indian Businesses',
  'Step-by-step guide to automating WhatsApp, Instagram DM, and Facebook leads with B9 Automation. Connect in minutes, reply 24/7 with AI.',
  '/how-it-works'
);

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
