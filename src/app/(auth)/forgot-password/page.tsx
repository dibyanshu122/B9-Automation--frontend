'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { post } = useApi();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await post('/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent if the account exists');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not send reset link');
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
        <h1 className="mb-2 text-center text-3xl font-bold text-white">Reset password</h1>
        <p className="mb-8 text-center text-slate-300">
          Enter your email and we will send a secure reset link.
        </p>
        {sent ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-xl">
            <p className="text-slate-300">Check your email for the password reset link.</p>
            <Link href="/login" className="mt-5 inline-block font-medium text-primary-500 hover:text-primary-600">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="input-field border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:ring-cyan-400" required />
            </div>
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
