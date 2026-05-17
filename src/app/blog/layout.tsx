import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Blog — WhatsApp Automation & AI Tips for Indian Businesses',
  'Guides, tutorials and insights on WhatsApp automation, AI chatbots, lead management, and growing your Indian business with B9 Automation.',
  '/blog'
);

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
