'use client';

import dynamic from 'next/dynamic';

// The builder is ~300kB of canvas code — stream it after the shell paints
// so navigation to /automations feels instant.
const AutomationsClient = dynamic(() => import('./automations-client'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm font-medium text-gray-500">Loading automation builder…</p>
      </div>
    </div>
  ),
});

export default function AutomationsPage() {
  return <AutomationsClient />;
}
