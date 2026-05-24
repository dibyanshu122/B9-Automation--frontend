'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Crown, Mail, RefreshCw, Settings, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

const ROLES = ['admin', 'senior_agent', 'agent', 'viewer'] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  senior_agent: 'Senior Agent',
  agent: 'Agent',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-violet-50 text-violet-700',
  senior_agent: 'bg-indigo-50 text-indigo-700',
  agent: 'bg-blue-50 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const PERMISSION_TOGGLES = [
  { key: 'inbox.reply', label: 'Reply to chats' },
  { key: 'leads.write_assigned', label: 'Update assigned leads' },
  { key: 'leads.export', label: 'Export leads' },
  { key: 'campaigns.draft', label: 'Draft campaigns' },
  { key: 'templates.draft', label: 'Draft templates' },
  { key: 'flows.draft', label: 'Draft WhatsApp Flows' },
] as const;

export default function TeamPage() {
  const { get, post, patch, delete: del } = useApi();
  const [data, setData] = useState<{ workspace_name: string; owner_email: string; members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('agent');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [resendingId, setResendingId] = useState('');
  const [editingMember, setEditingMember] = useState<any | null>(null);

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
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not update role');
    }
  };

  const savePermissions = async () => {
    if (!editingMember) return;
    try {
      await patch(`/api/team/members/${editingMember.id}/permissions`, {
        role: editingMember.role,
        permissions: editingMember.custom_permissions || [],
        assigned_only: !!editingMember.assigned_only,
        phone_masking_enabled: !!editingMember.phone_masking_enabled,
        status: editingMember.status || 'active',
      });
      toast.success('Permissions updated');
      setEditingMember(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not update permissions');
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
        <p className="mt-1 text-sm text-gray-500">Invite admins, senior agents, agents, and viewers with controlled access.</p>
      </div>

      <Card hoverable={false} className="border-gray-200">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Invite a Team Member</h2>
        </div>
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="agent@company.com" required className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="input-field">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <Button type="submit" loading={inviting} className="shrink-0">
            <Mail className="h-4 w-4" /> Send Invite
          </Button>
        </form>
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
          <strong>Roles:</strong> Admin controls workspace. Senior Agent manages queues and agents. Agent works assigned chats/leads. Viewer is read-only.
        </div>
      </Card>

      <Card hoverable={false} className="border-gray-200">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Members</h2>
          {data && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{data.members.length + 1}</span>}
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data && (
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{(data.owner_email?.[0] || 'O').toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{data.owner_email}</p>
                    <p className="text-xs text-gray-500">Workspace owner</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              </div>
            )}

            {data?.members.map(m => {
              const role = (m.role || 'agent') as Role;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{(m.email?.[0] || '?').toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.display_name || m.email}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.status === 'active' || m.status === 'joined' ? 'text-green-600' : 'text-amber-600'}`}>
                        {m.status === 'active' || m.status === 'joined' ? <><CheckCircle2 className="h-3 w-3" /> Active</> : <><Clock className="h-3 w-3" /> Invite pending</>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.status !== 'active' && m.status !== 'joined' && (
                      <button type="button" title="Resend invite" disabled={resendingId === m.id} onClick={() => resendInvite(m.id, m.email)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-500 disabled:opacity-40">
                        <RefreshCw className={`h-4 w-4 ${resendingId === m.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <select value={role} onChange={e => updateRole(m.id, e.target.value as Role)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <button type="button" title="Permissions" onClick={() => setEditingMember({ ...m, role })} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={removingId === m.id} onClick={() => remove(m.id, m.email)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {data?.members.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No team members invited yet. Invite someone above.</p>}
          </div>
        )}
      </Card>

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Member Permissions</h3>
                <p className="mt-1 text-sm text-gray-500">{editingMember.email}</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100">Close</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Role
                <select value={editingMember.role} onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })} className="input-field mt-1">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Status
                <select value={editingMember.status || 'active'} onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })} className="input-field mt-1">
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                Assigned leads only
                <input type="checkbox" checked={!!editingMember.assigned_only} onChange={(e) => setEditingMember({ ...editingMember, assigned_only: e.target.checked })} />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                Mask phone numbers
                <input type="checkbox" checked={!!editingMember.phone_masking_enabled} onChange={(e) => setEditingMember({ ...editingMember, phone_masking_enabled: e.target.checked })} />
              </label>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-800">Extra permissions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISSION_TOGGLES.map((perm) => {
                  const checked = (editingMember.custom_permissions || []).includes(perm.key);
                  return (
                    <label key={perm.key} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = new Set(editingMember.custom_permissions || []);
                          if (e.target.checked) current.add(perm.key);
                          else current.delete(perm.key);
                          setEditingMember({ ...editingMember, custom_permissions: Array.from(current) });
                        }}
                      />
                      {perm.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button variant="primary" onClick={savePermissions}>Save Permissions</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
