'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { get, post } = useApi();
  const { hasHydrated, setUser, setToken, token } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated || !token) return;

    const redirectTo = new URLSearchParams(window.location.search).get('redirect');
    const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;

    get('/api/automation/onboarding/status')
      .then((status) => {
        router.replace(safeRedirect || (status?.data?.is_complete ? '/dashboard' : '/onboarding'));
      })
      .catch(() => {
        router.replace(safeRedirect || '/dashboard');
      });
  }, [get, hasHydrated, router, token]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/start`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await post('/api/auth/login', { email, password });
      const { token, user_id, email: userEmail, name, plan, subscription_status } = response.data;

      setUser({
        id: user_id,
        email: userEmail,
        name,
        plan,
        subscription_status,
      });
      setToken(token);
      toast.success('Logged in successfully!');
      const status = await get('/api/automation/onboarding/status').catch(() => null);
      const redirectTo = new URLSearchParams(window.location.search).get('redirect');
      const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;
      router.push(safeRedirect || (status?.data?.is_complete ? '/dashboard' : '/onboarding'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="mb-8 flex justify-center">
          <Logo variant="dark" />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field border-white/10 bg-slate-900/80 pr-11 text-white placeholder:text-slate-500 focus:ring-cyan-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button type="button" variant="secondary" className="w-full" onClick={handleGoogleLogin}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900">G</span>
          Continue with Google
        </Button>

        <p className="text-center text-slate-300 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
