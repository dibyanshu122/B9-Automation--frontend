'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { Workspace } from '@/types';
import { Briefcase, Plus, ArrowRight, Users, Bot, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
  });
  const { get, post, delete: deleteRequest } = useApi();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await get('/api/workspaces/');
      setWorkspaces(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);

    try {
      const response = await post('/api/workspaces/', newWorkspace);
      setWorkspaces((items) => [
        ...items,
        { ...response.data, assistants_count: 0 },
      ]);
      setNewWorkspace({ name: '', description: '' });
      setShowCreateModal(false);
      toast.success('Workspace created');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    setConfirmDeleteId(null);

    setDeletingId(workspace.id);
    try {
      await deleteRequest(`/api/workspaces/${workspace.id}`);
      setWorkspaces((items) => items.filter((item) => item.id !== workspace.id));
      toast.success('Workspace deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete workspace');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-600 mt-2">
            Organize assistants, documents, widgets, and team knowledge in one place.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateModal(true)}
          className="sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New Workspace
        </Button>
      </div>

      {loading ? (
        <Card className="py-12 text-center">
          <p className="text-gray-600">Loading workspaces...</p>
        </Card>
      ) : workspaces.length === 0 ? (
        <Card className="py-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-600 mb-6">Create your first workspace to start building your knowledge SaaS.</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            Create Workspace
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900">{workspace.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {workspace.description || 'Workspace for assistants, documents, and chat widgets.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Bot className="w-4 h-4" />
                    Assistants
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {workspace.assistants_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Users className="w-4 h-4" />
                    Access
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {workspace.is_public ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/assistants">
                  <Button variant="secondary">
                    Manage Assistants
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                {confirmDeleteId === workspace.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-semibold">Delete workspace?</span>
                    <Button variant="danger" size="sm" loading={deletingId === workspace.id} onClick={() => handleDeleteWorkspace(workspace)}>Yes</Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>No</Button>
                  </div>
                ) : (
                  <Button variant="danger" loading={deletingId === workspace.id} onClick={() => setConfirmDeleteId(workspace.id)}>
                    <Trash2 className="w-4 h-4" />Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md" hoverable={false}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Create Workspace</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  value={newWorkspace.name}
                  onChange={(event) =>
                    setNewWorkspace({ ...newWorkspace, name: event.target.value })
                  }
                  className="input-field"
                  placeholder="Customer Support"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(event) =>
                    setNewWorkspace({ ...newWorkspace, description: event.target.value })
                  }
                  className="input-field resize-none"
                  placeholder="Knowledge base for support, docs, and product questions"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={creating}
                >
                  Create
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
