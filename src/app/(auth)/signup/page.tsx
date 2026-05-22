'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();
  const { post } = useApi();

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/start`;
  };

  const passwordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: '', color: '', width: '0%' };
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
    if (pw.length < 8) return { label: 'Weak', color: 'bg-amber-500', width: '40%' };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
    if (score === 3) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    if (score === 2) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Fair', color: 'bg-amber-400', width: '55%' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await post('/api/auth/signup', {
        name,
        email,
        password,
      });
      setVerificationSent(true);
      toast.success('Verification link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="flex justify-center mb-8">
          <Logo variant="dark" />
        </div>

        {verificationSent ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-xl">
            <h1 className="mb-2 text-2xl font-bold text-white">Check your email</h1>
            <p className="text-slate-300">
              We sent a verification link to <span className="font-semibold text-white">{email}</span>.
              Click that link, then login to B9 Automation.
            </p>
            <Button type="button" variant="primary" className="mt-6 w-full" onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Start Free Trial
            </h1>
            <p className="text-slate-300 text-center mb-8">
              Create your account. Business setup comes after login.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="input-field border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:ring-cyan-400"
              required
            />
          </div>

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
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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
            {/* Password strength bar */}
            {password && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className={`mt-1 text-[11px] font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`input-field border-white/10 bg-slate-900/80 pr-11 text-white placeholder:text-slate-500 focus:ring-cyan-400 ${confirmPassword && confirmPassword !== password ? 'border-red-500/60' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-[11px] font-semibold text-red-400">Passwords do not match</p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-400">✓ Passwords match</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Create Account
          </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={handleGoogleSignup}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900">G</span>
              Continue with Google
            </Button>

            <p className="text-center text-slate-300 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
