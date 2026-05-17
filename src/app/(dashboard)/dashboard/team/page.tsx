'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Crown, Mail, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

const ROLES = ['admin', 'member', 'viewer'] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-violet-50 text-violet-700',
  member: 'bg-blue-50 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function TeamPage() {
  const { get, post, patch, delete: del } = useApi();
  const [data, setData] = useState<{ workspace_name: string; owner_email: string; members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [resendingId, setResendingId] = useState('');

  const load = () => {
    setLoading(true);
    get('/api/team/members')
      .then(r => setData(r.data))
      .catch(() => toast.error('Could not load team'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await post('/api/team/members/invite', { email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not send invite');
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (memberId: string, role: Role) => {
    try {
      await patch(`/api/team/members/${memberId}/role`, { role });
      toast.success('Role updated');
      load();
    } catch {
      toast.error('Could not update role');
    }
  };

  const resendInvite = async (memberId: string, email: string) => {
    setResendingId(memberId);
    try {
      await post(`/api/team/members/${memberId}/resend-invite`, {});
      toast.success(`Invite resent to ${email}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not resend invite');
    } finally {
      setResendingId('');
    }
  };

  const remove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    setRemovingId(memberId);
    try {
      await del(`/api/team/members/${memberId}`);
      toast.success('Member removed');
      load();
    } catch {
      toast.error('Could not remove member');
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">Invite teammates and assign roles to control access.</p>
      </div>

      {/* Invite form */}
      <Card hoverable={false} className="border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Invite a Team Member</h2>
        </div>
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="input-field">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <Button type="submit" loading={inviting} className="shrink-0">
            <Mail className="h-4 w-4" /> Send Invite
          </Button>
        </form>
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
          <strong>Roles:</strong> Admin — full access except billing. Member — can view/edit leads & automations. Viewer — read-only.
        </div>
      </Card>

      {/* Members list */}
      <Card hoverable={false} className="border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Members</h2>
          {data && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{data.members.length + 1}</span>}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Owner row */}
            {data && (
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {(data.owner_email?.[0] || 'O').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{data.owner_email}</p>
                    <p className="text-xs text-gray-500">You</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                </div>
              </div>
            )}
            {/* Invited members */}
            {data?.members.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {(m.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.email}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.status === 'joined' ? 'text-green-600' : 'text-amber-600'}`}>
                      {m.status === 'joined'
                        ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                        : <><Clock className="w-3 h-3" /> Invite pending</>
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.status !== 'joined' && (
                    <button
                      type="button"
                      title="Resend invite"
                      disabled={resendingId === m.id}
                      onClick={() => resendInvite(m.id, m.email)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition disabled:opacity-40"
                    >
                      <RefreshCw className={`h-4 w-4 ${resendingId === m.id ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <select
                    value={m.role}
                    onChange={e => updateRole(m.id, e.target.value as Role)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold border-0 cursor-pointer ${ROLE_COLORS[m.role as Role] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={removingId === m.id}
                    onClick={() => remove(m.id, m.email)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {data?.members.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No team members invited yet. Invite someone above.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
