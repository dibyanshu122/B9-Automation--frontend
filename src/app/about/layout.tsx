import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'About B9 Automation — AI for Indian Businesses',
  'Meet the team building India\'s most powerful WhatsApp, Instagram, and Facebook automation platform. Our mission: help every Indian SME grow with AI.',
  '/about'
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
