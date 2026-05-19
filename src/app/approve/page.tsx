'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ApproveContent() {
  const params = useSearchParams();
  const run_id = params?.get('run_id') || '';
  const token = params?.get('token') || '';
  const action = params?.get('action') || 'approve';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!run_id || !token) {
      setStatus('error');
      setMessage('Invalid approval link — missing run_id or token.');
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${base}/api/automation/runs/${run_id}/approve?token=${encodeURIComponent(token)}&action=${action}`)
      .then(r => r.json())
      .then(data => {
        setStatus('success');
        setMessage(data.message || (action === 'approve' ? 'Workflow approved and resumed.' : 'Workflow rejected and stopped.'));
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again or contact support.');
      });
  }, []); // eslint-disable-line

  const isApprove = action === 'approve';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Processing your {action}…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${isApprove ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {isApprove ? '✅' : '🚫'}
            </div>
            <h1 className={`text-xl font-bold mb-2 ${isApprove ? 'text-emerald-700' : 'text-red-700'}`}>
              {isApprove ? 'Approved!' : 'Rejected'}
            </h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <a href="/dashboard" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition">
              Go to Dashboard →
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h1 className="text-xl font-bold mb-2 text-amber-700">Error</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <a href="/dashboard" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition">
              Go to Dashboard →
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ApprovePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-slate-900" />
      </div>
    }>
      <ApproveContent />
    </Suspense>
  );
}
