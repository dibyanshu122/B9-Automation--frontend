import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';

const sections = [
  {
    title: 'Information We Collect',
    body: `We collect information you provide directly: name, email address, business details, and payment information when you register or upgrade your plan. We also collect usage data such as automation runs, leads captured, and feature usage to improve the platform. We do not collect information from your customers beyond what is necessary to deliver the automation service.`,
  },
  {
    title: 'How We Use Your Information',
    body: `Your information is used to: operate and improve B9 Automation, process payments, send service-related emails (account creation, billing), provide customer support, and analyse aggregate usage trends. We never sell your personal data to third parties. We do not use your uploaded documents or business knowledge to train AI models.`,
  },
  {
    title: 'Data Storage & Security',
    body: `All data is encrypted in transit (TLS 1.2+) and at rest. We use Supabase (PostgreSQL) hosted on AWS for data storage. Payment information is processed by Razorpay and is never stored on our servers. We apply role-based access controls and audit logging to all sensitive operations.`,
  },
  {
    title: 'WhatsApp, Facebook & Instagram Data',
    body: `When you connect your Meta accounts (WhatsApp Business, Facebook, Instagram), we store only the OAuth tokens and connection identifiers required to send and receive messages on your behalf. Incoming messages from your customers are stored temporarily for automation processing and conversation history. We do not share this data with any third party other than Meta as required to operate the service.`,
  },
  {
    title: 'Data Retention',
    body: `Your account data is retained for as long as your account is active. Conversation history and lead data are retained for up to 2 years or until you delete them. If you delete your account, all associated data is permanently deleted within 30 days. You can request data export or deletion at any time from Settings → Data & Privacy.`,
  },
  {
    title: 'Third-Party Services',
    body: `B9 Automation integrates with: Google (Sheets, Gmail, OAuth), Meta (WhatsApp, Facebook, Instagram), Razorpay (payments), Groq / Google Gemini (AI processing). Each integration is governed by the respective provider's privacy policy. We only share the minimum data necessary for each integration to function.`,
  },
  {
    title: 'Cookies',
    body: `We use strictly necessary cookies for session management and authentication. We do not use advertising cookies or third-party tracking cookies. You can disable cookies in your browser settings, but this may affect your ability to log in.`,
  },
  {
    title: 'Your Rights',
    body: `You have the right to: access your personal data, correct inaccurate data, request deletion of your data, export your data in a portable format, and opt out of non-essential communications. To exercise these rights, email us or use Settings → Data & Privacy in your dashboard.`,
  },
  {
    title: 'Contact',
    body: `For privacy-related questions or to exercise your rights, contact us at: privacy@b9automation.com. We will respond within 5 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav variant="dark" />

      <section className="border-b border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Legal</p>
          <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
          <p className="mt-4 text-slate-400">Last updated: May 2026</p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            B9 Automation ("we", "us", "our") is committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our platform.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-lg font-bold text-white mb-3">
                <span className="mr-2 text-slate-600">{i + 1}.</span>{s.title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
