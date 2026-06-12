'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Bot, Brain, Edit2, MessageCircle, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { Assistant } from '@/types';

const BLANK_FORM = {
  name: '',
  description: '',
  language: 'english',
  role: 'sales',
  tone: 'friendly',
  lead_capture_enabled: true,
  handover_policy: 'low_confidence_or_complaint',
  restricted_topics: 'Legal, medical, financial guarantees, unsafe claims, and anything not present in business knowledge.',
  compliance_mode: true,
};

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assistant | null>(null);
  const [newAssistant, setNewAssistant] = useState({ ...BLANK_FORM });
  const { get, post, put, patch, delete: deleteReq } = useApi();

  const fetchAssistants = useCallback(async () => {
    try {
      const response = await get('/api/assistants');
      setAssistants(response.data);
    } catch {
      toast.error('Failed to fetch assistants');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  const handleCreateAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await post('/api/assistants', {
        ...newAssistant,
        lead_capture_enabled: newAssistant.lead_capture_enabled,
        system_prompt: buildAssistantSystemPrompt(newAssistant),
      });
      setAssistants([...assistants, response.data]);
      setNewAssistant({ ...BLANK_FORM });
      setShowCreateModal(false);
      toast.success('Assistant created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create assistant');
    }
  };

  const handleEditAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAssistant) return;
    try {
      const response = await put(`/api/assistants/${editingAssistant.id}`, {
        name: newAssistant.name,
        description: newAssistant.description,
        language: newAssistant.language,
        lead_capture_enabled: newAssistant.lead_capture_enabled,
        system_prompt: buildAssistantSystemPrompt(newAssistant),
      });
      setAssistants(assistants.map(a => a.id === editingAssistant.id ? { ...a, ...response.data } : a));
      setEditingAssistant(null);
      setNewAssistant({ ...BLANK_FORM });
      toast.success('Assistant updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update assistant');
    }
  };

  const handleDeleteAssistant = async () => {
    if (!deleteTarget) return;
    try {
      // Check if any widgets use this assistant before deleting
      const widgetsRes = await get(`/api/automation/assistants/${deleteTarget.id}/widgets`).catch(() => ({ data: [] }));
      const widgetCount = Array.isArray(widgetsRes?.data) ? widgetsRes.data.length : 0;
      if (widgetCount > 0) {
        const proceed = confirm(`⚠️ ${widgetCount} widget${widgetCount > 1 ? 's' : ''} use "${deleteTarget.name}".\n\nDeleting this assistant will break those widgets.\n\nProceed anyway?`);
        if (!proceed) return;
      }
      await deleteReq(`/api/assistants/${deleteTarget.id}`);
      setAssistants(assistants.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
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
    <div className="space-y-6">

      {/* Create New Assistant Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Assistant</h1>
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
          <p className="text-gray-600">Use the Create Assistant button above to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{assistant.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{assistant.description}</p>
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
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Chat Speed</p>
                <select
                  value={assistant.chat_provider || 'groq'}
                  onChange={(event) => updateChatProvider(assistant.id, event.target.value as 'groq' | 'gemini')}
                  className="input-field mt-2"
                >
                  <option value="groq">Fast replies (recommended)</option>
                  <option value="gemini">Better knowledge answers</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {(assistant.chat_provider || 'groq') === 'groq'
                    ? 'Best for live chat - instant responses to customers.'
                    : 'Best for detailed document-based answers.'}
                </p>
              </div>

              <div className="mt-auto flex gap-2">
                <Link href={`/dashboard/chat?assistant=${assistant.id}`} className="flex-1">
                  <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Button>
                </Link>
                <Button variant="ghost" title="Edit assistant" onClick={() => {
                  setEditingAssistant(assistant);
      setNewAssistant({
        ...BLANK_FORM,
        name: assistant.name,
        description: assistant.description || '',
        language: assistant.language || 'english',
        lead_capture_enabled: (assistant as any).lead_capture_enabled ?? true,
        role: (assistant as any).role || BLANK_FORM.role,
        tone: (assistant as any).tone || BLANK_FORM.tone,
        handover_policy: (assistant as any).handover_policy || BLANK_FORM.handover_policy,
        restricted_topics: (assistant as any).restricted_topics || BLANK_FORM.restricted_topics,
        compliance_mode: (assistant as any).compliance_mode ?? BLANK_FORM.compliance_mode,
      });
                }}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" title="Delete assistant" onClick={() => setDeleteTarget(assistant)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* -- Create / Edit Modal -- */}
      {(showCreateModal || editingAssistant) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingAssistant ? 'Edit Assistant' : 'Create AI Assistant'}</h2>
              <button onClick={() => { setShowCreateModal(false); setEditingAssistant(null); setNewAssistant({ ...BLANK_FORM }); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={editingAssistant ? handleEditAssistant : handleCreateAssistant} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Assistant Name *</label>
                <input type="text" value={newAssistant.name}
                  onChange={e => setNewAssistant({ ...newAssistant, name: e.target.value })}
                  placeholder="e.g., Sales Bot, Support Agent" className="input-field" required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select value={newAssistant.role} onChange={e => setNewAssistant({ ...newAssistant, role: e.target.value })} className="input-field">
                  <option value="sales">Sales - convert leads, send catalog, payment</option>
                  <option value="support">Support - answer queries, resolve complaints</option>
                  <option value="receptionist">Receptionist - greet, qualify, route</option>
                  <option value="admission">Admission Counselor - education enquiries</option>
                  <option value="general">General Purpose</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tone</label>
                  <select value={newAssistant.tone} onChange={e => setNewAssistant({ ...newAssistant, tone: e.target.value })} className="input-field">
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
                <select value={newAssistant.language} onChange={e => setNewAssistant({ ...newAssistant, language: e.target.value })} className="input-field">
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Handover Policy</label>
                  <select value={newAssistant.handover_policy} onChange={e => setNewAssistant({ ...newAssistant, handover_policy: e.target.value })} className="input-field">
                    <option value="low_confidence_or_complaint">Low confidence or complaint</option>
                    <option value="complaint_only">Complaint only</option>
                    <option value="always_after_lead_capture">After lead capture</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compliance Mode</p>
                    <p className="text-xs text-gray-500">Safer replies and human escalation</p>
                  </div>
                  <button type="button" onClick={() => setNewAssistant({ ...newAssistant, compliance_mode: !newAssistant.compliance_mode })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${newAssistant.compliance_mode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${newAssistant.compliance_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Restricted Topics</label>
                <textarea value={newAssistant.restricted_topics}
                  onChange={e => setNewAssistant({ ...newAssistant, restricted_topics: e.target.value })}
                  placeholder="Topics where AI should avoid answering and hand over to a human"
                  className="input-field resize-none" rows={2} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={newAssistant.description}
                  onChange={e => setNewAssistant({ ...newAssistant, description: e.target.value })}
                  placeholder="What will this assistant handle? e.g., Handles WhatsApp enquiries for coaching center admissions"
                  className="input-field resize-none" rows={2} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Lead Capture</p>
                  <p className="text-xs text-gray-500">Automatically save customers as leads in CRM</p>
                </div>
                <button type="button" onClick={() => setNewAssistant({ ...newAssistant, lead_capture_enabled: !newAssistant.lead_capture_enabled })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${newAssistant.lead_capture_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                  <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${newAssistant.lead_capture_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" className="flex-1"
                  onClick={() => { setShowCreateModal(false); setEditingAssistant(null); setNewAssistant({ ...BLANK_FORM }); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  {editingAssistant ? 'Save Changes' : 'Create Assistant'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* -- Destructive Delete Confirmation Modal -- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900">Delete Assistant?</h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{deleteTarget.name}</strong> will be permanently deleted along with its:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              <li>- All uploaded documents and knowledge</li>
              <li>- All chat history and sessions</li>
              <li>- Any connected widgets</li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-gray-800">This cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteAssistant}>
                Yes, Delete Permanently
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function buildAssistantSystemPrompt(form: typeof BLANK_FORM) {
  return [
    `Assistant role: ${form.role}.`,
    `Tone: ${form.tone}.`,
    `Language: ${form.language}.`,
    form.compliance_mode
      ? 'Compliance mode: follow Meta/WhatsApp rules, respect opt-out, avoid unsupported claims, and escalate when policy or confidence is unclear.'
      : 'Compliance mode: standard safe responses.',
    `Handover policy: ${form.handover_policy}.`,
    `Restricted topics: ${form.restricted_topics}.`,
    'Use uploaded business knowledge first. If the answer is not known, ask a clarifying question or hand over to a human.',
  ].join('\n');
}
