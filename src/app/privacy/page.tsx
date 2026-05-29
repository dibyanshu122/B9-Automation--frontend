import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import Link from 'next/link';

const sections = [
  {
    title: 'Information We Collect',
    body: `We collect two categories of information:

(a) Account & Business Data — name, email address, business name, phone number, and payment information when you register or upgrade your plan.

(b) Customer Conversation Data — when you connect WhatsApp Business, Facebook, or Instagram, messages sent to your business number are processed through our platform to run your automations. This includes message text, phone numbers, timestamps, and any information your customers share with your AI assistant. This data belongs to you and your customers — we act as a data processor on your behalf.

We also collect platform usage data (automation runs, leads captured, feature usage) to operate and improve the service.`,
  },
  {
    title: 'How We Use Your Information',
    body: `Your information is used to:
• Operate the B9 Automation platform and run your configured automations
• Process payments via Razorpay
• Send service emails (account creation, billing receipts, security alerts)
• Provide customer support
• Analyse aggregate, anonymised usage trends to improve the product

We do NOT: sell your personal data, use your uploaded documents or business content to train AI models, use Meta platform data for advertising or ad targeting, or share customer conversation data with any third party except as required to operate the service (Meta Cloud API, AI providers).`,
  },
  {
    title: 'Meta Platform Data (WhatsApp, Facebook, Instagram)',
    body: `B9 Automation uses the Meta Cloud API to send and receive WhatsApp messages, Facebook Lead Ads data, and Instagram DMs on behalf of your business. By using these features, you agree that:

• We store OAuth tokens and connection identifiers required to operate the integration — these are encrypted at rest using PBKDF2-HMAC-256.
• Incoming customer messages are stored for automation processing and conversation history. We retain this data for up to 2 years or until you delete it.
• We comply with Meta's Platform Terms, WhatsApp Business Policy, and Developer Policies. We do not use Meta platform data to build advertising products, make eligibility decisions about users, or sell/transfer to any third-party data broker.
• If you disconnect a Meta integration, we stop processing new messages immediately. Existing conversation history is retained until you delete it or close your account.

Data Deletion Callback: Meta requires us to provide a deletion endpoint. If you revoke app permissions via Meta, you can request data deletion at: b9automation.com/deletion`,
  },
  {
    title: 'Data Storage & Security',
    body: `All data is encrypted in transit (TLS 1.2+) and at rest. We use Supabase (PostgreSQL on AWS ap-northeast-2) for data storage and Supabase Storage for uploaded documents. Payment information is processed entirely by Razorpay — we never store card numbers or payment credentials on our servers. We apply role-based access controls, tenant-level data isolation, and audit logging to all sensitive operations.`,
  },
  {
    title: 'Data Retention & Deletion',
    body: `• Account data: retained while your account is active.
• Conversation history and lead data: retained for up to 2 years or until you delete them from the dashboard.
• Deleted account: all associated data is permanently deleted within 30 days of account closure.
• Data deletion request: you can request deletion of all your data at any time by visiting b9automation.com/deletion or emailing support@b9automation.com. We will process requests within 30 days and confirm via email.`,
  },
  {
    title: 'Third-Party Services',
    body: `B9 Automation integrates with the following third-party services to operate:

• Meta (WhatsApp Cloud API, Facebook Graph API, Instagram API) — message sending/receiving
• Google (Gmail, Google Sheets, Google OAuth) — email and spreadsheet integrations
• Razorpay — payment processing (governed by Razorpay's Privacy Policy)
• Groq / Google Gemini — AI response generation (message content sent to AI provider for processing; not stored or used for training)
• Supabase / AWS — database and file storage

We share only the minimum data necessary for each integration to function. We do not sell data to any third party.`,
  },
  {
    title: 'Cookies',
    body: `We use strictly necessary cookies for session management and authentication (JWT tokens). We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies. You can disable cookies in your browser settings, but this will prevent you from logging in to the dashboard.`,
  },
  {
    title: 'Your Rights (GDPR & Indian IT Act)',
    body: `You have the right to:
• Access your personal data held by us
• Correct inaccurate data
• Request deletion of your data (see b9automation.com/deletion)
• Export your data in a portable format (CSV export available from Leads page)
• Opt out of non-essential communications (unsubscribe link in all emails)
• Restrict or object to processing in certain circumstances

To exercise these rights, email privacy@b9automation.com or use Settings → Data & Privacy in your dashboard. We will respond within 5 business days.`,
  },
  {
    title: "Children's Privacy",
    body: `B9 Automation is a business platform and is not directed at children under 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided personal information, we will delete it immediately.`,
  },
  {
    title: 'Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by displaying a prominent notice in the dashboard. The date at the top of this page reflects the most recent update. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: 'Contact',
    body: `For privacy-related questions, data requests, or to report a concern:

Email: privacy@b9automation.com
Data Deletion: b9automation.com/deletion
Response time: within 5 business days

B9 Automation — Registered in India.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%"><defs><pattern id="dots-priv" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots-priv)" /></svg>
      </div>

      <MarketingNav variant="dark" />

      <section className="relative border-b border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-4">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
            Privacy Policy
          </h1>
          <p className="mt-3 text-zinc-500 text-sm">Last updated: May 2026</p>
          <p className="mt-5 text-zinc-400 leading-relaxed">
            B9 Automation (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy and the privacy of your customers. This policy explains what data we collect, how we use it, and your rights — including our obligations under the Meta Platform Terms for WhatsApp Business API, Facebook Graph API, and Instagram API.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/deletion" className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
              Request Data Deletion →
            </Link>
            <Link href="/terms" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
              Terms of Service →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {sections.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl p-6">
              <h2 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 mb-3">
                <span className="mr-2 text-zinc-600 text-sm not-italic bg-none [-webkit-text-fill-color:theme(colors.zinc.600)]">{i + 1}.</span>{s.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
