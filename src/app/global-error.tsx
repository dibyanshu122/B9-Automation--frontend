'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#020617', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>!</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>B9 Automation - Critical Error</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            The application encountered a fatal error. Please refresh the page.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
              Error: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
