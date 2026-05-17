import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Pricing — Simple Plans for Every Business',
  'B9 Automation pricing plans. Start free. Automate WhatsApp, Instagram, and Facebook lead responses. No credit card required. PRO plan from ₹1,999/month.',
  '/pricing'
);

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
