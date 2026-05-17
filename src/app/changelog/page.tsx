'use client';

import { MarketingFooter, MarketingNav } from '@/components/marketing-shell';
import { changelog } from '@/lib/marketing';
import { CheckCircle2, GitBranch } from 'lucide-react';

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <MarketingNav />
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Changelog</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-bold text-gray-950">What’s new in B9 Automation</h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-600">
            Product updates for the public website, dashboard, assistant builder, document ingestion, chat, and billing.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {changelog.map((entry) => (
            <article key={entry.version} className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-primary-700">
                  <GitBranch className="h-4 w-4" />
                  {entry.version}
                </span>
                <span className="text-sm text-gray-500">{entry.date}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-950">{entry.title}</h2>
              <div className="mt-4 space-y-2">
                {entry.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
