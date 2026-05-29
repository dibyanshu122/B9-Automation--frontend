import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | B9 Automation',
  description: 'B9 Automation Cookie Policy. Learn what cookies we use, why we use them, and how to control them.',
};

const LAST_UPDATED = 'May 16, 2026';

export default function CookiesPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%"><defs><pattern id="dots-cookies" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots-cookies)" /></svg>
      </div>

      <MarketingNav variant="dark" />

      <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-4">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
            Cookie Policy
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 [&_h2]:text-transparent [&_h2]:bg-clip-text [&_h2]:bg-gradient-to-b [&_h2]:from-white [&_h2]:via-white [&_h2]:to-zinc-400 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h3]:text-zinc-100 [&_h3]:font-semibold [&_strong]:text-white">

          <section>
            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience. B9 Automation uses cookies and similar technologies (local storage, session storage) to operate the platform.</p>
          </section>

          <section>
            <h2>2. Cookies We Use</h2>

            <h3 className="text-zinc-100 font-semibold mt-4">Essential Cookies (Always Active)</h3>
            <p>These cookies are necessary for the platform to function and cannot be disabled:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Cookie</th>
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-zinc-300 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="py-2 pr-4 font-mono text-xs text-zinc-400">b9_auth_token</td><td className="py-2 pr-4">Authentication token to keep you logged in</td><td className="py-2">30 days</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-zinc-400">b9_session</td><td className="py-2 pr-4">Session identifier for security</td><td className="py-2">Session</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-zinc-400">b9_csrf</td><td className="py-2 pr-4">Cross-site request forgery protection</td><td className="py-2">Session</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-zinc-100 font-semibold mt-6">Functional Cookies</h3>
            <p>These improve your experience by remembering your settings:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Cookie</th>
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-zinc-300 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="py-2 pr-4 font-mono text-xs text-zinc-400">b9_industry</td><td className="py-2 pr-4">Remembers your selected industry pack</td><td className="py-2">1 year</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-zinc-400">b9_ui_prefs</td><td className="py-2 pr-4">Sidebar, theme, and layout preferences</td><td className="py-2">6 months</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-zinc-100 font-semibold mt-6">Analytics Cookies (Optional)</h3>
            <p>We may use analytics to understand how the platform is used. This data is anonymized and not sold:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Provider</th>
                    <th className="text-left py-2 pr-4 text-zinc-300 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-zinc-300 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="py-2 pr-4">Vercel Analytics</td><td className="py-2 pr-4">Page performance and usage metrics</td><td className="py-2">30 days</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>3. Local Storage</h2>
            <p>In addition to cookies, we use browser Local Storage to save:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              <li><strong>Draft automations</strong> — so you don&rsquo;t lose unsaved workflows</li>
              <li><strong>Authentication state</strong> — to keep you logged in across page refreshes</li>
              <li><strong>UI preferences</strong> — like sidebar state and notification read status</li>
            </ul>
            <p className="mt-3">Local storage data stays on your device and is never transmitted to third parties.</p>
          </section>

          <section>
            <h2>4. Third-Party Cookies</h2>
            <p>When you connect your Meta (Facebook/Instagram/WhatsApp) accounts, Meta may set their own cookies. These are governed by <a href="https://www.facebook.com/policies/cookies/" target="_blank" rel="noopener noreferrer" className="text-[#00F2FE] underline">Meta&rsquo;s Cookie Policy</a>. We have no control over these cookies.</p>
          </section>

          <section>
            <h2>5. How to Control Cookies</h2>
            <p>You can control cookies through your browser settings:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              <li><strong>Chrome:</strong> Settings → Privacy &amp; Security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
            </ul>
            <p className="mt-3">Note: Disabling essential cookies will prevent you from logging in and using the dashboard.</p>
          </section>

          <section>
            <h2>6. Changes to This Policy</h2>
            <p>We may update this Cookie Policy when we add new features. We will notify you via email or in-app notification before significant changes take effect.</p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              For questions about cookies or data privacy, contact{' '}
              <a href="mailto:privacy@b9automation.com" className="text-[#00F2FE] underline">privacy@b9automation.com</a>
              {' '}or read our full{' '}
              <Link href="/privacy" className="text-[#00F2FE] underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
      <MarketingFooter variant="dark" />
    </div>
  );
}
