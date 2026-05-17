'use client';

import Link from 'next/link';
import { Button } from '@/components/button';
import { MarketingCta, MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { supportedFormats } from '@/lib/marketing';
import { ArrowRight, CheckCircle2, FileSearch, MessageSquare, Quote, UploadCloud } from 'lucide-react';

export default function DocumentChatPage() {
  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <MarketingNav />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Document Chat</p>
            <h1 className="mt-3 text-5xl font-bold leading-tight text-gray-950">Ask your documents anything. Get cited answers.</h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Upload files, URLs, and videos. B9 Automation retrieves the most relevant source content and answers in natural language with references users can trust.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/signup">
                <Button>
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary">View Pricing</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100">
            <div className="rounded-lg bg-[#fffaf5] p-5">
              <p className="text-sm font-bold text-gray-950">Question</p>
              <div className="mt-3 rounded-lg bg-white p-4 text-sm text-gray-700">What does our onboarding policy say about refunds?</div>
              <p className="mt-5 text-sm font-bold text-gray-950">B9 Automation Answer</p>
              <div className="mt-3 rounded-lg bg-orange-50 p-4 text-sm leading-6 text-gray-700">
                Refund requests are accepted within 7 days if the workspace has not exceeded plan usage limits.
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-primary-700">[1] Policy.pdf p.2</span>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-primary-700">[2] Terms URL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            [UploadCloud, 'Upload documents', 'Add PDFs, docs, presentations, text files, URLs, and YouTube links.'],
            [MessageSquare, 'Ask naturally', 'Users ask normal questions without search syntax or manual filtering.'],
            [FileSearch, 'Verify answers', 'Answers can include document, page, URL, or timestamp references.'],
          ].map(([Icon, title, text]) => {
            const TypedIcon = Icon as typeof UploadCloud;
            return (
              <div key={title as string} className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
                <TypedIcon className="h-9 w-9 text-primary-500" />
                <h2 className="mt-5 text-xl font-bold text-gray-950">{title as string}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-950">Works with the files teams already use</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {supportedFormats.map((format) => {
              const Icon = format.icon;
              return (
                <div key={format.label} className="rounded-lg border border-orange-100 bg-[#fffaf5] p-5 text-center">
                  <Icon className="mx-auto h-7 w-7 text-primary-500" />
                  <p className="mt-3 text-sm font-bold text-gray-800">{format.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-950">Use document chat for</h2>
            <div className="mt-6 space-y-3">
              {['Customer support FAQs', 'Internal policy lookup', 'Legal and contract review', 'Course and research material', 'Sales enablement documents'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-orange-100 bg-white p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-orange-100 bg-white p-8">
            <Quote className="h-10 w-10 text-primary-500" />
            <p className="mt-4 text-xl font-semibold leading-9 text-gray-950">
              Source-cited answers make AI useful for teams that cannot afford random guesses.
            </p>
            <p className="mt-4 text-sm text-gray-500">B9 Automation document chat is designed around grounded retrieval.</p>
          </div>
        </div>
      </section>

      <MarketingCta />
      <MarketingFooter />
    </div>
  );
}
