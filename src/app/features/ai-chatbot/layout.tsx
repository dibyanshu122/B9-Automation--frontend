import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'AI Chatbot for Business — Train on Your Documents & FAQs',
  'Build an AI chatbot trained on your business documents, product catalog, pricing, and FAQs. Embed on your website and answer customers 24/7.',
  '/features/ai-chatbot'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
