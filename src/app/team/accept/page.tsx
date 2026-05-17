'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/button';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TeamAcceptPage() {
  const params = useSearchParams();
  const router = useRouter();
  const memberId = params.get('member_id') || '';
  const token = params.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!memberId || !token) {
      setStatus('error');
      setMessage('Invalid invite link. Please ask your workspace owner to re-invite you.');
      return;
    }
    axios
      .get(`${API}/api/team/members/accept`, { params: { member_id: memberId, token } })
      .then(res => {
        setStatus('success');
        setWorkspaceName(res.data.workspace_name || 'B9 Automation');
        setEmail(res.data.email || '');
        setMessage(`You've joined ${res.data.workspace_name || 'the workspace'} as ${res.data.role}.`);
      })
      .catch(err => {
        setStatus('error');
        setMessage(
          err.response?.data?.detail ||
          'This invite link is invalid or has expired. Ask the workspace owner to send a new invite.'
        );
      });
  }, [memberId, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
            <p className="text-gray-600 font-medium">Verifying your invite…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Welcome to {workspaceName}!</h1>
            <p className="text-gray-600">{message}</p>
            {email && (
              <p className="text-sm text-gray-400">
                Log in or sign up using <strong>{email}</strong> to access the workspace.
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Log In
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/signup')}
              >
                Create Account
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Invite Invalid</h1>
            <p className="text-gray-600">{message}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
