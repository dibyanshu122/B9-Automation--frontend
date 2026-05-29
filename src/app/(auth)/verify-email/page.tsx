'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { get, post } = useApi();

  useEffect(() => {
    const token = searchParams?.get('token');
    const emailFromQuery = searchParams?.get('email');
    if (emailFromQuery) {
      setResendEmail(emailFromQuery.trim().toLowerCase());
    }
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing or incomplete.');
      return;
    }

    get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => {
        setStatus('success');
        setMessage(response.data?.message || 'Email verified successfully.');
        setTimeout(() => router.push('/login'), 1800);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Verification link is invalid or expired.');
      });
  }, [get, router, searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resendEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Email is required');
      return;
    }
    setResending(true);
    try {
      await post('/api/auth/resend-verification', { email: cleanEmail });
      setResendEmail(cleanEmail);
      toast.success('New verification link sent. Check your inbox.');
    } catch {
      toast.error('Could not resend. Try signing up again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 text-center shadow-xl">
        <div className="mb-6 flex justify-center"><Logo variant="light" /></div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {status === 'loading' ? 'Verifying email...' : status === 'success' ? 'Email verified' : 'Verification failed'}
        </h1>
        <p className="text-gray-600">{message}</p>

        {status === 'success' && (
          <p className="mt-3 text-sm text-gray-400">Redirecting to login...</p>
        )}

        {status === 'error' && (
          <div className="mt-5 space-y-4">
            {/* Resend verification */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-left">
              <p className="mb-2 text-sm font-semibold text-amber-800">Send a new verification link</p>
              <form onSubmit={handleResend} className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Button type="submit" variant="primary" size="sm" loading={resending}>
                  Resend
                </Button>
              </form>
            </div>
            <Link href="/signup" className="block text-sm font-medium text-primary-500 hover:text-primary-600">
              Create a new account instead
            </Link>
          </div>
        )}

        <Button type="button" variant="secondary" className="mt-5 w-full" onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white text-gray-700">Opening verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
