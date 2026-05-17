import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | B9 Automation',
  description: 'B9 Automation Terms of Service. Read our terms for using the WhatsApp, Instagram, and Facebook automation platform.',
};

const LAST_UPDATED = 'May 16, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h3]:text-slate-100 [&_h3]:font-semibold [&_strong]:text-white">

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using B9 Automation (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including businesses registered in India and internationally.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>B9 Automation is a SaaS platform that enables businesses to automate customer conversations on WhatsApp, Instagram, and Facebook using artificial intelligence. The Service includes:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>WhatsApp Business API automation and chatbots</li>
              <li>Instagram DM automation</li>
              <li>Facebook Lead Ads integration and automation</li>
              <li>AI-powered response generation using uploaded business documents</li>
              <li>Lead management, analytics, and reporting tools</li>
              <li>Visual workflow (automation) builder</li>
            </ul>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>You must be at least 18 years old and have legal authority to bind your business to these terms. The Service is intended for business use only, not personal use.</p>
          </section>

          <section>
            <h2>4. Account Registration</h2>
            <p>You agree to provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials. B9 Automation is not liable for any loss resulting from unauthorized access due to your failure to secure your account.</p>
          </section>

          <section>
            <h2>5. Meta Platform Compliance</h2>
            <p>By using WhatsApp, Instagram, and Facebook features, you agree to comply with:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Meta's Terms of Service</strong> and Platform Policies</li>
              <li><strong>WhatsApp Business Policy</strong> — including messaging opt-in requirements</li>
              <li><strong>Instagram Platform Policy</strong></li>
              <li><strong>Facebook Developer Policy</strong></li>
            </ul>
            <p className="mt-3">You are solely responsible for obtaining user consent before sending WhatsApp messages, and for complying with India&rsquo;s Telecom Commercial Communications Customer Preference Regulations (TCCCP).</p>
          </section>

          <section>
            <h2>6. Prohibited Uses</h2>
            <p>You may not use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Send spam, unsolicited messages, or bulk messages without user opt-in</li>
              <li>Violate any applicable law or regulation (including India&rsquo;s IT Act, 2000)</li>
              <li>Harass, threaten, or defraud users</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
              <li>Resell or white-label the Service without written permission</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2>7. Payment and Billing</h2>
            <p>Subscription fees are charged in Indian Rupees (INR) via Razorpay. All plans are prepaid. Refunds are processed within 7 business days for eligible cancellations made within 24 hours of payment. Annual plans are non-refundable after the first month.</p>
          </section>

          <section>
            <h2>8. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-primary-400 underline">Privacy Policy</Link>. We process data in compliance with India&rsquo;s Digital Personal Data Protection Act (DPDPA), 2023. Your customer data is never used to train our AI models.</p>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>B9 Automation retains all rights to the Service, including all software, design, and content. You retain ownership of your data (documents, leads, conversations) uploaded to the platform. You grant B9 Automation a limited license to process your data solely to provide the Service.</p>
          </section>

          <section>
            <h2>10. Service Availability</h2>
            <p>We target 99.5% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced 24 hours in advance. We are not liable for downtime caused by third-party providers (Meta, Google, Razorpay) or infrastructure providers.</p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, B9 Automation shall not be liable for indirect, incidental, special, or consequential damages, including loss of profits or revenue. Our maximum liability for any claim shall not exceed the amount you paid in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease and your data will be retained for 30 days before deletion. B9 Automation may suspend your account immediately for violations of these terms.</p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India. For disputes under ₹5 lakhs, we encourage resolution through the Consumer Disputes Redressal mechanism.</p>
          </section>

          <section>
            <h2>14. Changes to Terms</h2>
            <p>We may update these terms periodically. We will notify you via email or an in-app notification at least 15 days before significant changes take effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2>15. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@b9automation.com" className="text-primary-400 underline">legal@b9automation.com</a></p>
          </section>
        </div>
      </div>
      <MarketingFooter variant="dark" />
    </div>
  );
}
