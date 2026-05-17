'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  const { get } = useApi();

  useEffect(() => {
    const token = searchParams?.get('token');
    const userId = searchParams?.get('user_id');
    const email = searchParams?.get('email');
    const name = searchParams?.get('name');
    const plan = searchParams?.get('plan') || 'FREE';
    const subscriptionStatus = searchParams?.get('subscription_status') || 'TRIAL';

    if (!token || !userId || !email || !name) {
      toast.error('Google login failed');
      router.replace('/login?error=google_auth_failed');
      return;
    }

    setUser({
      id: userId,
      email,
      name,
      plan,
      subscription_status: subscriptionStatus,
    });
    setToken(token);
    toast.success('Logged in with Google');
    get('/api/automation/onboarding/status')
      .then((response) => router.replace(response.data?.is_complete ? '/dashboard' : '/onboarding'))
      .catch(() => router.replace('/onboarding'));
  }, [get, router, searchParams, setToken, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4 text-center">
      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-xl">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <h1 className="text-xl font-bold text-gray-900">Signing you in...</h1>
        <p className="mt-2 text-gray-600">Connecting your Google account to B9 Automation.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white text-gray-700">Completing Google login...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
