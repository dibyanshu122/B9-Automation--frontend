import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  'Visual Automation Builder — No-Code Workflow Designer',
  'Build powerful business automation workflows visually. Drag-and-drop nodes for WhatsApp replies, lead scoring, follow-ups, and integrations. No code needed.',
  '/features/visual-automation-builder'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
