'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Bot, Brain, MessageCircle, Plus, Trash2, X, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { Assistant } from '@/types';

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [newAssistant, setNewAssistant] = useState({
    name: '',
    description: '',
    language: 'hinglish',
  });
  const { get, post, patch, delete: deleteReq } = useApi();

  const fetchAssistants = async () => {
    try {
      const response = await get('/api/assistants');
      setAssistants(response.data);
    } catch {
      toast.error('Failed to fetch assistants');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await get('/api/users/me');
      if (response.data?.name) {
        setUserName(response.data.name);
      } else if (response.data?.email) {
        setUserName(response.data.email.split('@')[0]);
      } else {
        setUserName('User');
      }
    } catch {
      setUserName('User');
    }
  };

  useEffect(() => {
    Promise.all([
      fetchAssistants(),
      fetchUserProfile(),
      get('/api/automation/business-profile').catch(() => ({ data: null })),
    ]).then(([, , bpRes]: any) => {
      if (bpRes?.data?.business_name) setBusinessName(bpRes.data.business_name);
    });
  }, []);

  const handleCreateAssistant = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await post('/api/assistants', newAssistant);
      setAssistants([...assistants, response.data]);
      setNewAssistant({ name: '', description: '', language: 'hinglish' });
      setShowCreateModal(false);
      toast.success('Assistant created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create assistant');
    }
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    if (!confirm('Delete this assistant?')) return;

    try {
      await deleteReq(`/api/assistants/${assistantId}`);
      setAssistants(assistants.filter((assistant) => assistant.id !== assistantId));
      toast.success('Assistant deleted');
    } catch {
      toast.error('Failed to delete assistant');
    }
  };

  const updateChatProvider = async (assistantId: string, chatProvider: 'groq' | 'gemini') => {
    try {
      const payload = chatProvider === 'groq'
        ? { chatProvider: 'groq', chatModel: 'llama-3.1-8b-instant' }
        : { chatProvider: 'gemini', chatModel: 'gemini-1.5-flash' };
      await patch(`/api/assistants/${assistantId}/settings`, payload);
      setAssistants((items) => items.map((assistant) => (
        assistant.id === assistantId
          ? { ...assistant, chat_provider: chatProvider, chat_model: payload.chatModel }
          : assistant
      )));
      toast.success('Chat model updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update chat model');
    }
  };

  return (
    <div className="space-y-8">
      {/* Workshop Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-8 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-cyan-500/5" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Your AI Workspace</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
            {businessName || userName || 'Your Business'}
          </h2>
          <p className="text-slate-400 max-w-2xl text-base leading-relaxed">
            Create, manage, and deploy AI assistants trained on your business knowledge. Each assistant answers customer questions 24/7.
          </p>
        </div>
      </div>

      {/* Workspace Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900">{businessName || userName || 'Your Business'}</h3>
            <p className="text-gray-600 text-sm mt-1">AI Assistant Workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-2">
              <Bot className="w-4 h-4" />
              Total Assistants
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {assistants.length}
            </p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5">
            <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
              <Users className="w-4 h-4" />
              Access Type
            </div>
            <p className="text-3xl font-bold text-green-900">Private</p>
          </div>
        </div>
      </div>

      {/* Create New Assistant Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Create New Assistant</h1>
          <p className="mt-2 text-gray-600">Add a new AI assistant to your workshop</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Assistant
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      ) : assistants.length === 0 ? (
        <Card className="py-12 text-center">
          <Brain className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h3 className="mb-2 text-xl font-bold text-gray-900">No assistants yet</h3>
          <p className="mb-6 text-gray-600">Create your first AI assistant to get started</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Assistant
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{assistant.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{assistant.description}</p>
                </div>
                <div className="relative h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-orange-100 to-green-100 shadow-inner">
                  <div className="absolute inset-1 rounded-lg bg-white shadow-sm" />
                  <div className="absolute inset-x-2 top-2 flex h-7 items-center justify-center rounded-md bg-primary-500 text-white shadow-lg shadow-orange-200">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="mb-4 flex gap-4 border-y border-gray-200 py-4">
                <div>
                  <p className="text-xs text-gray-600">Queries</p>
                  <p className="text-lg font-bold text-gray-900">{assistant.total_queries}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Language</p>
                  <p className="text-lg font-bold text-gray-900">{assistant.language}</p>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Website Chat Model</p>
                <select
                  value={assistant.chat_provider || 'groq'}
                  onChange={(event) => updateChatProvider(assistant.id, event.target.value as 'groq' | 'gemini')}
                  className="input-field mt-2"
                >
                  <option value="groq">Groq - Fast Chat</option>
                  <option value="gemini">Gemini Flash - Reliable</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {(assistant.chat_provider || 'groq') === 'groq'
                    ? 'Fast replies for live website chat. Falls back to Gemini if Groq rate limit happens.'
                    : 'Reliable model with larger context for knowledge answers.'}
                </p>
              </div>

              <div className="mt-auto flex gap-2">
                <Link href={`/dashboard/chat?assistant=${assistant.id}`} className="flex-1">
                  <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => handleDeleteAssistant(assistant.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create Assistant</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssistant} className="grid gap-5 md:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newAssistant.name}
                    onChange={(event) => setNewAssistant({ ...newAssistant, name: event.target.value })}
                    placeholder="e.g., Sales Assistant"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newAssistant.description}
                    onChange={(event) => setNewAssistant({ ...newAssistant, description: event.target.value })}
                    placeholder="What does this assistant do?"
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={newAssistant.language}
                    onChange={(event) => setNewAssistant({ ...newAssistant, language: event.target.value })}
                    className="input-field"
                  >
                    <option value="hinglish">Hinglish</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                <div className="mx-auto flex h-36 w-36 items-center justify-center" style={{ perspective: '700px' }}>
                  <div
                    className="relative h-28 w-28 animate-pulse rounded-2xl bg-gradient-to-br from-primary-500 to-green-500 shadow-2xl shadow-orange-200"
                    style={{ transform: 'rotateX(12deg) rotateY(-18deg)' }}
                  >
                    <div className="absolute inset-3 rounded-xl bg-white/95" />
                    <div className="absolute left-6 top-8 h-4 w-4 rounded-full bg-gray-950" />
                    <div className="absolute right-6 top-8 h-4 w-4 rounded-full bg-gray-950" />
                    <div className="absolute bottom-7 left-8 h-2 w-12 rounded-full bg-primary-500" />
                    <div className="absolute -top-4 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-primary-500" />
                    <div className="absolute -top-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-green-500" />
                  </div>
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-gray-900">
                  {newAssistant.name || 'Assistant Preview'}
                </p>
                <p className="mt-1 text-center text-xs text-gray-500">{newAssistant.language}</p>
              </div>

              <div className="flex gap-2 pt-4 md:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
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
