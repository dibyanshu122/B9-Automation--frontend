'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { post } = useApi();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = searchParams?.get('token');
    if (!token) {
      toast.error('Reset link is missing or has expired. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await post('/api/auth/reset-password', { token, password });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not reset password');
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
          <Image src="/b9-automation-logo.jpg" alt="B9 Automation logo" width={240} height={160} className="h-32 w-auto object-contain" priority />
        </div>
        <h1 className="mb-2 text-center text-3xl font-bold text-white">Create new password</h1>
        <p className="mb-8 text-center text-slate-300">Set a new password for your B9 Automation account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">New Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter new password" className="input-field border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:ring-cyan-400" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="input-field border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:ring-cyan-400" required />
          </div>
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Reset Password
          </Button>
        </form>
        <Link href="/login" className="mt-6 block text-center font-medium text-primary-500 hover:text-primary-600">
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">Opening reset link...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
