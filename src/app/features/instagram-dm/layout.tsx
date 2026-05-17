import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Instagram DM Automation — Auto-Reply to Story Mentions & DMs',
  'Automatically reply to Instagram DMs and story mentions with AI. Capture leads, answer FAQs, and qualify prospects directly from Instagram.',
  '/features/instagram-dm'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
