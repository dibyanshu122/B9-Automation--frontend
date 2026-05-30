'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Brain, ChevronDown, ChevronUp, Clock, Eye, Flame, Loader2, Mail, MessageSquare, Phone, Plus, Search, Send, Star, Trash2, Users, StickyNote, Activity, Send as SendIcon } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi, getApiClient } from '@/hooks/useApi';
import { useInvalidate } from '@/hooks/useQueryCache';
import { Lead } from '@/types';

interface InboxItem {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  lead_phone?: string;
  source_domain?: string;
  handover_status: string;
  handover_reason?: string;
  latest_message?: string;
  latest_role?: string;
  lead?: Lead;
  updated_at: string;
}

interface TeamMemberOption {
  id: string;
  user_id?: string;
  display_name?: string;
  email: string;
  role: string;
}

interface LeadLabelOption {
  id: string;
  name: string;
  color?: string;
}

const stages = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

const scoreStyles = {
  hot: 'bg-red-50 text-red-700 ring-red-100',
  warm: 'bg-amber-50 text-amber-700 ring-amber-100',
  cold: 'bg-sky-50 text-sky-700 ring-sky-100',
};

export default function LeadsPage() {
  const { get, post } = useApi();
  const api = getApiClient();
  const { invalidateLeads } = useInvalidate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [handoverQueue, setHandoverQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'qualified' | 'inbox'>('pipeline');
  const [busyAction, setBusyAction] = useState('');
  const [chatHistory, setChatHistory] = useState<any | null>(null);
  const [conversation, setConversation] = useState<any | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadIntelligence, setLeadIntelligence] = useState<any | null>(null);
  const [leadIntelLoading, setLeadIntelLoading] = useState(false);
  const [paymentLinkTarget, setPaymentLinkTarget] = useState<{ phone: string; name: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadDateFrom, setLeadDateFrom] = useState('');
  const [leadDateTo, setLeadDateTo] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState('');
  const [leadMemory, setLeadMemory] = useState<string[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [leadLabels, setLeadLabels] = useState<LeadLabelOption[]>([]);
  const [labelFilter, setLabelFilter] = useState('all');
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#4F46E5');
  const [savingLabel, setSavingLabel] = useState(false);
  // Notes & Timeline state
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'notes' | 'timeline' | 'deals' | 'tags'>('info');
  // Multi-tag state
  const [leadTags, setLeadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [savingTag, setSavingTag] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealForm, setDealForm] = useState({ title: '', value: '', stage: 'open', probability: '50' });
  const [savingDeal, setSavingDeal] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  // Merge/dedup state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [selectedDupGroup, setSelectedDupGroup] = useState<any | null>(null);
  const [primaryLeadId, setPrimaryLeadId] = useState<string>('');

  const openMergeModal = async () => {
    setShowMergeModal(true);
    setDupLoading(true);
    setSelectedDupGroup(null);
    try {
      const r = await get('/api/leads/duplicates');
      setDuplicateGroups(r.data?.groups || []);
    } catch { toast.error('Could not load duplicates'); }
    finally { setDupLoading(false); }
  };

  const mergeDuplicates = async () => {
    if (!selectedDupGroup || !primaryLeadId) return;
    const dupIds = selectedDupGroup.leads.filter((l: any) => l.id !== primaryLeadId).map((l: any) => l.id);
    if (!dupIds.length) return;
    setMerging(true);
    try {
      await post('/api/leads/merge', { primary_lead_id: primaryLeadId, duplicate_lead_ids: dupIds });
      toast.success(`Merged ${dupIds.length} duplicate(s) into primary lead`);
      setDuplicateGroups(prev => prev.filter(g => g !== selectedDupGroup));
      setSelectedDupGroup(null);
      invalidateLeads();
      refresh();
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Merge failed'); }
    finally { setMerging(false); }
  };

  const loadNotes = (leadId: string) => {
    setNotesLoading(true);
    api.get(`/api/leads/${leadId}/notes`)
      .then(r => setNotes(r.data || []))
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  };
  const loadTimeline = (leadId: string) => {
    setTimelineLoading(true);
    api.get(`/api/leads/${leadId}/timeline?limit=40`)
      .then(r => setTimeline(r.data || []))
      .catch(() => {})
      .finally(() => setTimelineLoading(false));
  };
  const addNote = async (leadId: string) => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const r = await api.post(`/api/leads/${leadId}/notes`, { content: noteText.trim() });
      setNotes(prev => [r.data, ...prev]);
      setNoteText('');
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(false); }
  };
  const deleteNote = async (leadId: string, noteId: string) => {
    try {
      await api.delete(`/api/leads/${leadId}/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch { toast.error('Failed to delete note'); }
  };

  const loadLeadTags = (leadId: string) => {
    api.get(`/api/leads/${leadId}/tags`).then(r => setLeadTags(r.data || [])).catch(() => {});
    if (allTags.length === 0) {
      api.get('/api/leads/tags/all').then(r => setAllTags(r.data || [])).catch(() => {});
    }
  };
  const addTag = async (leadId: string, tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || leadTags.includes(t)) return;
    setSavingTag(true);
    try {
      await api.post(`/api/leads/${leadId}/tags`, { tag: t });
      setLeadTags(prev => [...prev, t]);
      if (!allTags.includes(t)) setAllTags(prev => [...prev, t].sort());
      setTagInput('');
    } catch { toast.error('Failed to add tag'); }
    finally { setSavingTag(false); }
  };
  const removeTag = async (leadId: string, tag: string) => {
    try {
      await api.delete(`/api/leads/${leadId}/tags/${tag}`);
      setLeadTags(prev => prev.filter(t => t !== tag));
    } catch { toast.error('Failed to remove tag'); }
  };

  const loadDeals = (leadId: string) => {
    setDealsLoading(true);
    api.get(`/api/leads/${leadId}/deals`)
      .then(r => setDeals(r.data || []))
      .catch(() => {})
      .finally(() => setDealsLoading(false));
  };
  const createDeal = async (leadId: string) => {
    if (!dealForm.title.trim()) return;
    setSavingDeal(true);
    try {
      const r = await api.post(`/api/leads/${leadId}/deals`, { title: dealForm.title, value: parseFloat(dealForm.value) || 0, stage: dealForm.stage, probability: parseInt(dealForm.probability) || 50 });
      setDeals(prev => [r.data, ...prev]);
      setDealForm({ title: '', value: '', stage: 'open', probability: '50' });
      setShowDealForm(false);
      toast.success('Deal created');
    } catch { toast.error('Failed to create deal'); }
    finally { setSavingDeal(false); }
  };
  const updateDealStage = async (leadId: string, dealId: string, stage: string) => {
    try {
      await api.patch(`/api/leads/${leadId}/deals/${dealId}`, { stage });
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));
    } catch { toast.error('Failed to update deal'); }
  };

  const [leadTotal, setLeadTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const LEAD_PAGE_SIZE = 50;

  const refresh = () => {
    setLoading(true);
    setNextCursor(null);
    Promise.allSettled([
      get(`/api/leads?limit=${LEAD_PAGE_SIZE}`),
      get('/api/leads/inbox'),
      get('/api/leads/handover-queue'),
      api.get('/api/leads/labels'),
      api.get('/api/team/members'),
    ])
      .then(([leadResponse, inboxResponse, handoverResponse, labelResponse, memberResponse]) => {
        if (leadResponse.status === 'rejected') throw leadResponse.reason;
        const data = leadResponse.value.data;
        const newLeads = Array.isArray(data) ? data : (data?.leads || data || []);
        setLeads(newLeads);
        setLeadTotal(leadResponse.value.headers?.['x-total-count']
          ? parseInt(leadResponse.value.headers['x-total-count'])
          : (Array.isArray(data) ? data.length : (data?.total || data?.length || 0)));
        // Store cursor for "Load More" (avoids slow OFFSET scan on large tables)
        const cursor = leadResponse.value.headers?.['x-next-cursor'];
        setNextCursor(cursor || null);
        if (inboxResponse.status === 'fulfilled') setInbox(inboxResponse.value.data);
        if (handoverResponse.status === 'fulfilled') setHandoverQueue(handoverResponse.value.data?.items || []);
        if (labelResponse.status === 'fulfilled') setLeadLabels(labelResponse.value.data?.labels || []);
        if (memberResponse.status === 'fulfilled') setTeamMembers(memberResponse.value.data?.members || []);
      })
      .catch((error) => toast.error(error.response?.data?.detail || 'Failed to load CRM data'))
      .finally(() => setLoading(false));
  };

  const loadMoreLeads = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const r = await get(`/api/leads?limit=${LEAD_PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`);
      const data = r.data;
      const newLeads = Array.isArray(data) ? data : (data?.leads || []);
      setLeads(prev => [...prev, ...newLeads]);
      const cursor = r.headers?.['x-next-cursor'];
      setNextCursor(cursor || null);
    } catch { toast.error('Failed to load more leads'); }
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesLabel = labelFilter === 'all' || lead.tag === labelFilter;
      const matchesSearch = !query || [lead.name, lead.phone, lead.email].some((value) => (value || '').toLowerCase().includes(query));
      if (leadDateFrom && lead.created_at) {
        const d = new Date(lead.created_at.endsWith('Z') ? lead.created_at : lead.created_at + 'Z');
        if (d < new Date(leadDateFrom)) return false;
      }
      if (leadDateTo && lead.created_at) {
        const d = new Date(lead.created_at.endsWith('Z') ? lead.created_at : lead.created_at + 'Z');
        if (d > new Date(leadDateTo + 'T23:59:59Z')) return false;
      }
      return matchesStatus && matchesLabel && matchesSearch;
    });
  }, [leads, searchQuery, statusFilter, labelFilter, leadDateFrom, leadDateTo]);

  const groupedByStage = useMemo(() => {
    return stages.reduce<Record<string, Lead[]>>((groups, stage) => {
      groups[stage.key] = filteredLeads.filter((lead) => lead.status === stage.key);
      return groups;
    }, {});
  }, [filteredLeads]);

  const groupedByScore = useMemo(() => ({
    hot: leads.filter((lead) => lead.score_label === 'hot'),
    warm: leads.filter((lead) => lead.score_label === 'warm'),
    cold: leads.filter((lead) => (lead.score_label || 'cold') === 'cold'),
  }), [leads]);

  const updateLeadInList = (updatedLead: Lead) => {
    setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
  };

  const updateStage = async (lead: Lead, status: string) => {
    setBusyAction(`status-${lead.id}`);
    try {
      const response = await api.patch(`/api/leads/${lead.id}`, { status });
      updateLeadInList(response.data);
      toast.success('Lead stage updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update lead');
    } finally {
      setBusyAction('');
    }
  };

  const updateLeadMeta = async (lead: Lead, patch: Partial<Lead>, successMessage: string) => {
    setBusyAction(`meta-${lead.id}`);
    try {
      const response = await api.patch(`/api/leads/${lead.id}`, patch);
      updateLeadInList(response.data);
      if (selectedLead?.id === lead.id) setSelectedLead(response.data);
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update lead');
    } finally {
      setBusyAction('');
    }
  };

  const createLabel = async () => {
    const name = newLabelName.trim();
    if (!name) {
      toast.error('Label name is required');
      return;
    }
    setSavingLabel(true);
    try {
      const response = await api.post('/api/leads/labels', { name, color: newLabelColor });
      const label = response.data?.label;
      if (label) {
        setLeadLabels((current) => current.some((item) => item.id === label.id) ? current : [...current, label]);
        setLabelFilter(label.name);
      }
      setNewLabelName('');
      setNewLabelColor('#4F46E5');
      setLabelModalOpen(false);
      toast.success('Label created');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create label');
    } finally {
      setSavingLabel(false);
    }
  };

  const updateLabel = async (label: LeadLabelOption) => {
    const nextName = window.prompt('Label name', label.name)?.trim();
    if (!nextName) return;
    setSavingLabel(true);
    try {
      const response = await api.patch(`/api/leads/labels/${label.id}`, { name: nextName, color: label.color || '#4F46E5' });
      const updated = response.data?.label;
      if (updated) {
        setLeadLabels((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setLeads((current) => current.map((lead) => (lead.tag === label.name ? { ...lead, tag: updated.name } : lead)));
        if (labelFilter === label.name) setLabelFilter(updated.name);
      }
      toast.success('Label updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update label');
    } finally {
      setSavingLabel(false);
    }
  };

  const deleteLabel = async (label: LeadLabelOption) => {
    if (!confirm(`Delete label "${label.name}"? Leads using it will be unlabelled.`)) return;
    setSavingLabel(true);
    try {
      await api.delete(`/api/leads/labels/${label.id}`);
      setLeadLabels((current) => current.filter((item) => item.id !== label.id));
      setLeads((current) => current.map((lead) => (lead.tag === label.name ? { ...lead, tag: undefined } as Lead : lead)));
      if (labelFilter === label.name) setLabelFilter('all');
      toast.success('Label deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete label');
    } finally {
      setSavingLabel(false);
    }
  };

  const qualifyLead = async (lead: Lead) => {
    setBusyAction(`qualify-${lead.id}`);
    try {
      const response = await api.post(`/api/leads/${lead.id}/qualify`, {});
      updateLeadInList(response.data);
      toast.success('Lead qualified');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to qualify lead');
    } finally {
      setBusyAction('');
    }
  };

  const sendFollowUp = async (lead: Lead) => {
    setBusyAction(`follow-${lead.id}`);
    try {
      await api.post(`/api/leads/${lead.id}/follow-up`, {});
      toast.success('Follow-up draft created');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create follow-up');
    } finally {
      setBusyAction('');
    }
  };

  const createTask = async (lead: Lead) => {
    setBusyAction(`task-${lead.id}`);
    try {
      await api.post(`/api/leads/${lead.id}/task`, {});
      toast.success('Task created');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    } finally {
      setBusyAction('');
    }
  };

  const openChatHistory = async (lead: Lead) => {
    setBusyAction(`history-${lead.id}`);
    try {
      const response = await api.get(`/api/leads/${lead.id}/chat-history`);
      setChatHistory(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load chat history');
    } finally {
      setBusyAction('');
    }
  };

  const openLeadDetail = async (lead: Lead) => {
    setBusyAction(`view-${lead.id}`);
    setMemoryOpen(false);
    setLeadMemory([]);
    setLeadIntelligence(null);
    setNotes([]);
    setTimeline([]);
    setDeals([]);
    setLeadTags([]);
    setTagInput('');
    setNoteText('');
    setShowDealForm(false);
    setDetailTab('info');
    try {
      const response = await api.get(`/api/leads/${lead.id}`);
      setSelectedLead(response.data);
      setLeadIntelLoading(true);
      api.get(`/api/leads/${lead.id}/intelligence`)
        .then((intel) => setLeadIntelligence(intel.data))
        .catch(() => setLeadIntelligence(null))
        .finally(() => setLeadIntelLoading(false));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load lead');
      setLeadIntelLoading(false);
    } finally {
      setBusyAction('');
    }
  };

  const loadLeadMemory = async (leadId: string) => {
    setMemoryLoading(true);
    try {
      const r = await api.get(`/api/leads/${leadId}/memory`);
      setLeadMemory(r.data?.memory || []);
    } catch { setLeadMemory([]); }
    finally { setMemoryLoading(false); }
  };

  const clearLeadMemory = async (leadId: string) => {
    if (!confirm('This will permanently clear the conversation memory for this lead. Are you sure?')) return;
    setClearingMemory(true);
    try {
      await api.delete(`/api/leads/${leadId}/memory`);
      setLeadMemory([]);
      toast.success('Memory cleared');
    } catch { toast.error('Clear failed'); }
    finally { setClearingMemory(false); }
  };

  const openConversation = async (sessionId: string) => {
    setBusyAction(`conversation-${sessionId}`);
    try {
      const response = await api.get(`/api/leads/inbox/${sessionId}`);
      setConversation(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to open conversation');
    } finally {
      setBusyAction('');
    }
  };

  const createPaymentLink = async () => {
    if (!paymentLinkTarget || !paymentAmount) return;
    const phone = paymentLinkTarget.phone?.trim();
    const sendWhatsApp = !!phone;
    if (sendWhatsApp && !/^\+[1-9]\d{7,14}$/.test(phone!)) {
      toast.error('Phone number must be in E.164 format (e.g. +919876543210)');
      return;
    }
    setCreatingLink(true);
    try {
      await api.post('/api/billing/payment-link', {
        amount_inr: parseInt(paymentAmount, 10),
        description: paymentDesc || `Payment for ${paymentLinkTarget.name}`,
        send_whatsapp: sendWhatsApp,
        whatsapp_to: phone,
      });
      toast.success(
        paymentLinkTarget.phone
          ? `Payment link sent to ${paymentLinkTarget.name} via WhatsApp`
          : 'Payment link created'
      );
      setPaymentLinkTarget(null);
      setPaymentAmount('');
      setPaymentDesc('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not create payment link');
    } finally {
      setCreatingLink(false);
    }
  };

  const requestHandover = async (sessionId: string) => {
    setBusyAction(`handover-${sessionId}`);
    try {
      await api.post(`/api/leads/inbox/${sessionId}/handover`, { reason: 'Owner review requested from CRM inbox' });
      toast.success('Handover requested');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to request handover');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Lead CRM</h1>
          <p className="mt-2 text-gray-600">Qualified leads, pipeline stages, conversation context, and handover actions.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-orange-100 bg-white p-2">
          {[
            ['pipeline', 'Pipeline'],
            ['qualified', 'Qualified'],
            ['inbox', 'Inbox'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as any)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                activeTab === key ? 'bg-orange-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {handoverQueue.length > 0 && (
        <Card className="border-red-100 bg-red-50 shadow-sm" hoverable={false}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-red-600">Handover Queue</p>
              <h2 className="mt-1 text-xl font-bold text-gray-950">{handoverQueue.length} conversation{handoverQueue.length > 1 ? 's' : ''} need human review</h2>
              <p className="mt-1 text-sm text-red-700">{handoverQueue[0]?.handover_reason || handoverQueue[0]?.latest_message || 'Review customer conversation and assign an owner.'}</p>
            </div>
            <Button variant="secondary" onClick={() => setActiveTab('inbox')}>
              <AlertTriangle className="h-4 w-4" />
              Open Inbox
            </Button>
          </div>
        </Card>
      )}

      <Card className="border-orange-100 shadow-sm" hoverable={false}>
        <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_180px_auto_auto] md:items-center">
          <label className="relative min-w-0">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input-field h-11 text-sm"
              placeholder="Search by name, phone, or email"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field h-11 text-sm">
            <option value="all">All statuses</option>
            {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
          </select>
          <select value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)} className="input-field h-11 text-sm">
            <option value="all">All labels</option>
            {leadLabels.map((label) => <option key={label.id} value={label.name}>{label.name}</option>)}
          </select>
          <Button variant="secondary" className="h-11 whitespace-nowrap" onClick={() => setLabelModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Label
          </Button>
          {/* Merge Duplicates */}
          <button
            type="button"
            onClick={openMergeModal}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition"
          >
            Merge Duplicates
          </button>
          {/* Export CSV */}
          <a
            href={`${typeof window !== 'undefined' ? '' : ''}/api/leads/export?format=csv${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
            download="leads.csv"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Export CSV
          </a>
        </div>

        {/* Date filter row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-sm text-gray-500">
          <span className="text-xs font-medium text-gray-400">Date range:</span>
          <input type="date" value={leadDateFrom} onChange={e => setLeadDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={leadDateTo} onChange={e => setLeadDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
          {(leadDateFrom || leadDateTo) && (
            <button onClick={() => { setLeadDateFrom(''); setLeadDateTo(''); }}
              className="text-xs text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1">
              ✕ Clear dates
            </button>
          )}
          {(leadDateFrom || leadDateTo) && (
            <span className="text-xs text-gray-400">{filteredLeads.length} of {leads.length} leads</span>
          )}
        </div>

        {/* Bulk action toolbar appears when leads are selected */}
        {selectedLeadIds.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
            <span className="text-sm font-semibold text-primary-700">{selectedLeadIds.size} selected</span>
            <button
              onClick={() => setSelectedLeadIds(new Set())}
              className="text-xs text-primary-500 hover:text-primary-700"
            >
              Clear
            </button>
            <div className="flex gap-2 ml-auto">
              {['contacted', 'qualified', 'won', 'lost'].map((s) => (
                <button
                  key={s}
                  disabled={bulkLoading === s}
                  onClick={async () => {
                    setBulkLoading(s);
                    try {
                      await api.post('/api/leads/bulk-update', { lead_ids: [...selectedLeadIds], status: s });
                      setLeads(prev => prev.map(l => selectedLeadIds.has(l.id) ? { ...l, status: s } : l));
                      setSelectedLeadIds(new Set());
                      toast.success(`${selectedLeadIds.size} leads marked as ${s}`);
                    } catch { toast.error('Bulk update failed'); }
                    finally { setBulkLoading(''); }
                  }}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold capitalize hover:bg-gray-50 transition"
                >
                  {bulkLoading === s ? '...' : `Mark ${s}`}
                </button>
              ))}
              <button
                disabled={bulkLoading === 'delete'}
                onClick={async () => {
                  if (!confirm(`Delete ${selectedLeadIds.size} leads?`)) return;
                  setBulkLoading('delete');
                  try {
                    await api.post('/api/leads/bulk-delete', { lead_ids: [...selectedLeadIds] });
                    setLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
                    setSelectedLeadIds(new Set());
                    toast.success(`${selectedLeadIds.size} leads deleted`);
                  } catch (e: any) {
                    if (e?.response?.status === 403) {
                      toast.error('Only workspace admins can bulk delete leads.');
                    } else {
                      toast.error('Bulk delete failed');
                    }
                  }
                  finally { setBulkLoading(''); }
                }}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                {bulkLoading === 'delete' ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, style: 'bg-orange-50 text-primary-700' },
          { label: 'Hot Leads', value: groupedByScore.hot.length, icon: Flame, style: 'bg-red-50 text-red-700' },
          { label: 'Warm Leads', value: groupedByScore.warm.length, icon: Star, style: 'bg-amber-50 text-amber-700' },
          { label: 'Handover Queue', value: inbox.filter((item) => item.handover_status === 'requested').length, icon: AlertTriangle, style: 'bg-sky-50 text-sky-700' },
        ].map((stat) => {
          const Icon = stat.icon;
          const isHandover = stat.label === 'Handover Queue';
          return (
          <Card
            key={stat.label}
            className={`border-orange-100 shadow-sm ${isHandover && stat.value > 0 ? 'cursor-pointer hover:border-sky-300' : ''}`}
            hoverable={false}
            onClick={isHandover && stat.value > 0 ? () => setActiveTab('inbox') : undefined}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-950">{stat.value}</p>
                {isHandover && stat.value > 0 && <p className="mt-1 text-xs text-sky-600 font-semibold">Click to open inbox →</p>}
              </div>
              <div className={`rounded-lg p-3 ${stat.style}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
          );
        })}
      </section>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-orange-100" hoverable={false}>
              <div className="flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-16 rounded-full bg-gray-200" />
                <div className="h-6 w-20 rounded bg-gray-100" />
              </div>
            </Card>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card className="text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-900">No leads yet</p>
          <p className="mt-1 text-sm text-gray-500">Capture leads by embedding your widget on your website, connecting Facebook Lead Ads, or sharing your WhatsApp number.</p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            <a href="/dashboard/widgets" className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-orange-100">Set up Website Widget →</a>
            <a href="/dashboard/integrations" className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-orange-100">Connect Facebook / WhatsApp →</a>
          </div>
        </Card>
      ) : activeTab === 'pipeline' ? (
        <section className="space-y-4">
          <Card className="border-orange-100 shadow-sm" hoverable={false}>
            <div className="hidden grid-cols-[24px_1.1fr_1fr_1fr_0.8fr_0.8fr_0.9fr_90px] gap-3 border-b border-gray-100 pb-3 text-xs font-bold uppercase text-gray-500 md:grid">
              <input type="checkbox" className="rounded" checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0} onChange={(e) => setSelectedLeadIds(e.target.checked ? new Set(filteredLeads.map(l => l.id)) : new Set())} />
              <span>Name</span><span>Phone</span><span>Email</span><span>Source</span><span>Status</span><span>Created date</span><span>Action</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="grid gap-2 py-3 text-sm md:grid-cols-[24px_1.1fr_1fr_1fr_0.8fr_0.8fr_0.9fr_90px] md:items-center">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedLeadIds.has(lead.id)}
                    onChange={(e) => {
                      const next = new Set(selectedLeadIds);
                      if (e.target.checked) next.add(lead.id);
                      else next.delete(lead.id);
                      setSelectedLeadIds(next);
                    }}
                  />
                  <span className="font-semibold text-gray-950">{lead.name || 'Unnamed lead'}</span>
                  <span className="text-gray-600">{lead.phone || '-'}</span>
                  <span className="text-gray-600">{lead.email || '-'}</span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    {lead.source?.includes('whatsapp') ? '💬' : lead.source?.includes('instagram') ? '📸' : lead.source?.includes('facebook') ? '📘' : lead.source?.includes('website') || lead.source?.includes('widget') ? '🌐' : '📋'}
                    {lead.source?.replace(/_/g, ' ') || '-'}
                  </span>
                  <span className="capitalize text-gray-600">{lead.status}</span>
                  <span className="text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</span>
                  <Button variant="ghost" size="sm" onClick={() => openLeadDetail(lead)} loading={busyAction === `view-${lead.id}`}>
                    <Eye className="h-4 w-4" />View
                  </Button>
                </div>
              ))}
              {filteredLeads.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No leads match this search.</p>}
            </div>
            {/* Pagination — cursor-based load more (no slow OFFSET scan) */}
            {!loadingMore && nextCursor && !searchQuery && statusFilter === 'all' && labelFilter === 'all' && !leadDateFrom && !leadDateTo && (
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                <span>Showing {leads.length} of {leadTotal} leads</span>
                <button onClick={loadMoreLeads} className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition">
                  Load more
                </button>
              </div>
            )}
            {loadingMore && <p className="mt-2 text-center text-xs text-gray-400">Loading more leads…</p>}
          </Card>
          <div className="grid gap-4 xl:grid-cols-3">
          {stages.map((stage) => (
            <Card key={stage.key} className="border-orange-100 shadow-sm" hoverable={false}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-950">{stage.label}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                  {groupedByStage[stage.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groupedByStage[stage.key] || []).map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    labels={leadLabels}
                    members={teamMembers}
                    busyAction={busyAction}
                    onFollowUp={sendFollowUp}
                    onTask={createTask}
                    onHistory={openChatHistory}
                    onQualify={qualifyLead}
                    onStage={updateStage}
                    onTag={(nextTag) => updateLeadMeta(lead, { tag: nextTag || null } as any, nextTag ? 'Lead label updated' : 'Lead label cleared')}
                    onAssign={(memberId) => updateLeadMeta(lead, { assigned_to_user_id: memberId || null } as any, memberId ? 'Lead assigned' : 'Lead unassigned')}
                    onView={openLeadDetail}
                  />
                ))}
                {(!groupedByStage[stage.key] || groupedByStage[stage.key].length === 0) && (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No leads in this stage.</p>
                )}
              </div>
            </Card>
          ))}
          </div>
        </section>
      ) : activeTab === 'qualified' ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {(['hot', 'warm', 'cold'] as const).map((label) => (
            <Card key={label} className="border-orange-100 shadow-sm" hoverable={false}>
              <h2 className="mb-4 flex items-center gap-2 font-bold capitalize text-gray-950">
                <span className={`rounded-full px-2 py-1 text-xs ring-1 ${scoreStyles[label]}`}>{label}</span>
                {groupedByScore[label].length} leads
              </h2>
              <div className="space-y-3">
                {groupedByScore[label].map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    labels={leadLabels}
                    members={teamMembers}
                    busyAction={busyAction}
                    onFollowUp={sendFollowUp}
                    onTask={createTask}
                    onHistory={openChatHistory}
                    onQualify={qualifyLead}
                    onStage={updateStage}
                    onTag={(nextTag) => updateLeadMeta(lead, { tag: nextTag || null } as any, nextTag ? 'Lead label updated' : 'Lead label cleared')}
                    onAssign={(memberId) => updateLeadMeta(lead, { assigned_to_user_id: memberId || null } as any, memberId ? 'Lead assigned' : 'Lead unassigned')}
                    onView={openLeadDetail}
                  />
                ))}
                {groupedByScore[label].length === 0 && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No {label} leads yet.</p>}
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4">
          {inbox.length === 0 ? (
            <Card className="text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-gray-900">No conversations yet</p>
              <p className="mt-1 text-sm text-gray-500">Website chatbot conversations will appear here with full context.</p>
            </Card>
          ) : (
            inbox.map((item) => (
              <Card key={item.id} className="border-orange-100 shadow-sm" hoverable={false}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-gray-950">{item.visitor_name || item.lead?.name || 'Website visitor'}</h2>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{item.handover_status}</span>
                      {item.lead?.score_label && (
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${scoreStyles[item.lead.score_label]}`}>
                          {item.lead.score_label}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.latest_message || 'No message preview'}</p>
                    <p className="mt-2 text-xs text-gray-500">{item.source_domain || 'dashboard'} · {new Date(item.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openConversation(item.id)} loading={busyAction === `conversation-${item.id}`}>
                      <MessageSquare className="h-4 w-4" />
                      Open
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => requestHandover(item.id)} loading={busyAction === `handover-${item.id}`}>
                      <AlertTriangle className="h-4 w-4" />
                      Handover
                    </Button>
                    {item.lead_phone && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPaymentLinkTarget({ phone: item.lead_phone ?? '', name: item.visitor_name || 'Lead' })}
                      >
                        ₹ Pay Link
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </section>
      )}

      {chatHistory && (
        <DetailCard title="Lead chat history" onClose={() => setChatHistory(null)}>
          <ConversationMessages messages={chatHistory.messages || []} fallbackQuestion={chatHistory.visitor_question} fallbackAnswer={chatHistory.bot_answer} />
          <p className="mt-4 text-sm font-semibold text-gray-700">
            Follow-up sent/drafted: {chatHistory.follow_up_sent ? 'Yes' : 'No'}
          </p>
        </DetailCard>
      )}

      {conversation && (
        <DetailCard title="Conversation inbox detail" onClose={() => setConversation(null)}>
          <div className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-950">Handover status: {conversation.session.handover_status}</p>
            {conversation.lead?.score_reason && <p className="mt-1">AI qualification: {conversation.lead.score_reason}</p>}
          </div>
          <ConversationMessages messages={conversation.messages || []} />
          <ReplyBox
            sessionId={conversation.session.id}
            phone={conversation.lead?.phone}
            channel={conversation.session.source_domain?.includes('whatsapp') ? 'whatsapp' : 'chat'}
          />
        </DetailCard>
      )}

      {selectedLead && (
        <DetailCard title="Lead details" onClose={() => setSelectedLead(null)}>
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-4">
            {([
              { key: 'info', label: 'Info', icon: <Eye className="h-3.5 w-3.5" /> },
              { key: 'deals', label: 'Deals', icon: <Star className="h-3.5 w-3.5" /> },
              { key: 'tags', label: 'Tags', icon: <span className="text-xs">🏷️</span> },
              { key: 'notes', label: 'Notes', icon: <StickyNote className="h-3.5 w-3.5" /> },
              { key: 'timeline', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" /> },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setDetailTab(tab.key);
                  if (tab.key === 'notes' && notes.length === 0) loadNotes(selectedLead.id);
                  if (tab.key === 'timeline' && timeline.length === 0) loadTimeline(selectedLead.id);
                  if (tab.key === 'deals' && deals.length === 0) loadDeals(selectedLead.id);
                  if (tab.key === 'tags') loadLeadTags(selectedLead.id);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${detailTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* DEALS TAB */}
          {detailTab === 'deals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pipeline Deals</p>
                <button onClick={() => setShowDealForm(v => !v)} className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">
                  + New Deal
                </button>
              </div>
              {showDealForm && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                  <input value={dealForm.title} onChange={e => setDealForm(p => ({...p, title: e.target.value}))} placeholder="Deal title" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <div className="grid grid-cols-3 gap-2">
                    <input value={dealForm.value} onChange={e => setDealForm(p => ({...p, value: e.target.value}))} placeholder="Value ₹" type="number" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                    <select value={dealForm.stage} onChange={e => setDealForm(p => ({...p, stage: e.target.value}))} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
                      <option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option><option value="on_hold">On Hold</option>
                    </select>
                    <input value={dealForm.probability} onChange={e => setDealForm(p => ({...p, probability: e.target.value}))} placeholder="Prob %" type="number" min="0" max="100" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none" />
                  </div>
                  <button onClick={() => createDeal(selectedLead.id)} disabled={savingDeal || !dealForm.title.trim()} className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition">
                    {savingDeal ? 'Saving...' : 'Create Deal'}
                  </button>
                </div>
              )}
              {dealsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : deals.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No deals yet. Click "+ New Deal" to track this opportunity.</p>
              ) : (
                <div className="space-y-2">
                  {deals.map(deal => {
                    const stageColor = deal.stage === 'won' ? 'bg-emerald-100 text-emerald-700' : deal.stage === 'lost' ? 'bg-red-100 text-red-700' : deal.stage === 'on_hold' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
                    return (
                      <div key={deal.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{deal.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">₹{Number(deal.value || 0).toLocaleString('en-IN')} · {deal.probability}% probability</p>
                          </div>
                          <select value={deal.stage} onChange={e => updateDealStage(selectedLead.id, deal.id, e.target.value)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-0 cursor-pointer ${stageColor}`}>
                            <option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option><option value="on_hold">On Hold</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAGS TAB */}
          {detailTab === 'tags' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Multi-Tags</p>
              {/* Current tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {leadTags.length === 0 ? (
                  <p className="text-xs text-gray-400">No tags yet</p>
                ) : leadTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {tag}
                    <button onClick={() => removeTag(selectedLead.id, tag)} className="ml-0.5 text-indigo-400 hover:text-red-500 transition">×</button>
                  </span>
                ))}
              </div>
              {/* Add tag */}
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(selectedLead.id, tagInput); } }}
                  placeholder="Add tag (press Enter)"
                  list="tag-suggestions"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <datalist id="tag-suggestions">
                  {allTags.filter(t => !leadTags.includes(t)).map(t => <option key={t} value={t} />)}
                </datalist>
                <button
                  onClick={() => addTag(selectedLead.id, tagInput)}
                  disabled={savingTag || !tagInput.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition"
                >+ Add</button>
              </div>
              {/* Suggested tags */}
              {allTags.filter(t => !leadTags.includes(t)).length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {allTags.filter(t => !leadTags.includes(t)).slice(0, 10).map(t => (
                      <button key={t} onClick={() => addTag(selectedLead.id, t)}
                        className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition">
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {detailTab === 'notes' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note for your team..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={() => addNote(selectedLead.id)}
                  disabled={savingNote || !noteText.trim()}
                  className="self-end rounded-lg bg-indigo-600 px-3 py-2 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition"
                >
                  {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
              {notesLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : notes.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No notes yet. Add the first one above.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notes.map(note => (
                    <div key={note.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
                        <button onClick={() => deleteNote(selectedLead.id, note.id)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {detailTab === 'timeline' && (
            <div>
              {timelineLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : timeline.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No activity yet for this lead.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {timeline.map((event, i) => {
                    const typeIcon: Record<string, string> = { whatsapp: '💬', log: '📋', task: '✅', note: '📝', outbound: '📤' };
                    const typeColor: Record<string, string> = { whatsapp: 'bg-green-50 border-green-200', log: 'bg-gray-50 border-gray-200', task: 'bg-blue-50 border-blue-200', note: 'bg-yellow-50 border-yellow-200', outbound: 'bg-purple-50 border-purple-200' };
                    return (
                      <div key={i} className={`rounded-lg border px-3 py-2 text-xs ${typeColor[event.type] || 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-gray-800">
                            {typeIcon[event.type]} {event.type === 'whatsapp' ? (event.direction === 'inbound' ? 'Customer message' : 'Sent message') : event.type === 'task' ? event.title || 'Task' : event.action || event.type}
                          </span>
                          <span className="shrink-0 text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        {event.content && <p className="mt-0.5 line-clamp-2 text-gray-600">{event.content}</p>}
                        {event.status && <span className="mt-1 inline-block rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{event.status}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* INFO TAB */}
          {detailTab === 'info' && (
            <>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <DetailRow label="Name" value={selectedLead.name || '-'} />
            <DetailRow label="Phone" value={selectedLead.phone || '-'} />
            <DetailRow label="Email" value={selectedLead.email || '-'} />
            <DetailRow label="Source" value={selectedLead.source?.replace(/_/g, ' ') || '-'} />
            <DetailRow label="Status" value={selectedLead.status} />
            <DetailRow label="Label" value={selectedLead.tag || '-'} />
            <DetailRow label="Owner" value={teamMembers.find((member) => member.user_id === selectedLead.assigned_to_user_id)?.display_name || teamMembers.find((member) => member.user_id === selectedLead.assigned_to_user_id)?.email || 'Unassigned'} />
            <DetailRow label="Created date" value={new Date(selectedLead.created_at).toLocaleString()} />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-1 font-semibold text-gray-950">Message</p>
            <p>{selectedLead.message || selectedLead.requirement || 'No message captured'}</p>
          </div>
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-950">
                <Brain className="h-4 w-4 text-blue-600" />
                AI Lead Intelligence
              </p>
              {leadIntelLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </div>
            {leadIntelligence ? (
              <div className="space-y-3">
                <div className="grid gap-2 text-xs md:grid-cols-3">
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-gray-500">Score</p>
                    <p className="mt-1 text-sm font-black text-gray-900">{leadIntelligence.summary?.score_label || 'cold'} · {leadIntelligence.summary?.score ?? 0}/10</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-gray-500">Handover</p>
                    <p className="mt-1 text-sm font-black text-gray-900">{leadIntelligence.summary?.handover_requested ? 'Requested' : 'Not requested'}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-gray-500">Pending Tasks</p>
                    <p className="mt-1 text-sm font-black text-gray-900">{leadIntelligence.summary?.pending_tasks || 0}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Next best action</p>
                  <p className="mt-1 text-sm font-bold text-gray-950">{leadIntelligence.next_action?.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{leadIntelligence.next_action?.reason}</p>
                </div>
                {leadIntelligence.summary?.ai_summary && (
                  <p className="rounded-lg bg-white p-3 text-xs text-gray-700">{leadIntelligence.summary.ai_summary}</p>
                )}
                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {(leadIntelligence.timeline || []).slice(0, 8).map((event: any, idx: number) => (
                    <div key={`${event.type}-${idx}`} className="rounded-lg bg-white px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-800">{event.title || event.type}</span>
                        <span className="text-gray-400">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</span>
                      </div>
                      {event.body && <p className="mt-1 line-clamp-2 text-gray-500">{event.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-blue-700">{leadIntelLoading ? 'Loading intelligence...' : 'No intelligence timeline available yet.'}</p>
            )}
          </div>
          {/* WhatsApp Flow Form Submissions */}
          {(() => {
            const subs: Array<{ submitted_at: string; fields: Record<string, string> }> =
              (selectedLead.metadata?.flow_submissions) || [];
            if (subs.length === 0) return null;
            return (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    WhatsApp Form Submissions ({subs.length})
                  </p>
                  <button
                    onClick={() => {
                      const rows = subs.flatMap(s =>
                        Object.entries(s.fields).map(([k, v]) => `"${new Date(s.submitted_at).toLocaleString()}","${k}","${v}"`)
                      );
                      const csv = ['Submitted At,Field,Value', ...rows].join('\n');
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                      a.download = `form_data_${selectedLead.id}.csv`;
                      a.click();
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium">
                    ↓ Download CSV
                  </button>
                </div>
                <div className="space-y-3">
                  {subs.map((sub, i) => (
                    <div key={i} className="rounded-lg border border-green-100 bg-green-50 p-3">
                      <p className="text-[10px] text-gray-500 mb-2 font-medium">
                        Submitted: {new Date(sub.submitted_at).toLocaleString('en-IN')}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(sub.fields).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <p className="text-xs text-gray-800 font-medium mt-0.5">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* 🧠 Persistent Lead Memory */}
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => {
                const next = !memoryOpen;
                setMemoryOpen(next);
                if (next && leadMemory.length === 0) loadLeadMemory(selectedLead.id);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                AI Conversation Memory
                {leadMemory.length > 0 && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-bold">
                    {leadMemory.length} entries
                  </span>
                )}
              </span>
              {memoryOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {memoryOpen && (
              <div className="px-4 py-3 bg-white">
                {memoryLoading ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-400">Loading memory...</span>
                  </div>
                ) : leadMemory.length === 0 ? (
                  <div className="py-4 text-center">
                    <Brain className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No memory yet — AI will remember key details as it chats with this lead.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                      {leadMemory.map((entry, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-gray-700 leading-relaxed">{entry}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => clearLeadMemory(selectedLead.id)}
                      disabled={clearingMemory}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition font-medium">
                      {clearingMemory
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                      Clear Memory
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <select value={selectedLead.status} onChange={(event) => updateStage(selectedLead, event.target.value).then(() => setSelectedLead({ ...selectedLead, status: event.target.value }))} className="input-field mt-4 max-w-xs">
            {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
          </select>
          </> )} {/* end info tab */}
        </DetailCard>
      )}

      {labelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Create Lead Label</h3>
            <p className="mt-1 text-sm text-gray-500">Labels help your team filter and route leads faster.</p>
            <div className="mt-4 space-y-3">
              {leadLabels.length > 0 && (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                  {leadLabels.map((label) => (
                    <div key={label.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color || '#4F46E5' }} />
                      <span className="flex-1 font-semibold text-gray-800">{label.name}</span>
                      <button className="text-xs font-semibold text-indigo-600" onClick={() => updateLabel(label)} disabled={savingLabel}>Edit</button>
                      <button className="text-xs font-semibold text-red-600" onClick={() => deleteLabel(label)} disabled={savingLabel}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="block text-xs font-semibold text-gray-700">
                Label name
                <input
                  value={newLabelName}
                  onChange={(event) => setNewLabelName(event.target.value)}
                  className="input-field mt-1"
                  placeholder="e.g. high_budget"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Label color
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(event) => setNewLabelColor(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white p-1"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="primary" className="flex-1" onClick={createLabel} loading={savingLabel}>
                Create Label
              </Button>
              <Button variant="secondary" onClick={() => setLabelModalOpen(false)} disabled={savingLabel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {paymentLinkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Create Payment Link</h3>
            <p className="mt-1 text-sm text-gray-500">
              For <strong>{paymentLinkTarget.name}</strong>
              {paymentLinkTarget.phone ? ` · ${paymentLinkTarget.phone}` : ''}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Amount (₹)
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field mt-1"
                  placeholder="e.g. 5000"
                  min="1"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Description
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  className="input-field mt-1"
                  placeholder="e.g. Admission fee, Booking amount"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={createPaymentLink}
                loading={creatingLink}
                disabled={!paymentAmount}
              >
                {paymentLinkTarget.phone ? 'Create & Send via WhatsApp' : 'Create Link'}
              </Button>
              <Button variant="secondary" onClick={() => setPaymentLinkTarget(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Duplicates Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Merge Duplicate Leads</h3>
                <p className="text-xs text-gray-500 mt-0.5">Leads with identical phone numbers</p>
              </div>
              <button onClick={() => setShowMergeModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">✕</button>
            </div>
            <div className="p-5">
              {dupLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Scanning for duplicates...</span>
                </div>
              ) : duplicateGroups.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No duplicate leads found. Your CRM is clean!
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group, gi) => (
                    <div key={gi} className={`rounded-xl border p-3 cursor-pointer transition ${selectedDupGroup === group ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                      onClick={() => { setSelectedDupGroup(group); setPrimaryLeadId(group.leads[0]?.id || ''); }}>
                      <p className="text-xs font-bold text-gray-700 mb-2">Phone: {group.phone} · {group.count} duplicates</p>
                      <div className="space-y-1">
                        {group.leads.map((lead: any) => (
                          <label key={lead.id} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name={`primary-${gi}`}
                              checked={primaryLeadId === lead.id && selectedDupGroup === group}
                              onChange={() => { setSelectedDupGroup(group); setPrimaryLeadId(lead.id); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <span className={`font-semibold ${primaryLeadId === lead.id && selectedDupGroup === group ? 'text-orange-700' : 'text-gray-700'}`}>
                              {lead.name || 'Unnamed'} — {new Date(lead.created_at).toLocaleDateString()}
                              {primaryLeadId === lead.id && selectedDupGroup === group && <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 rounded px-1">Keep (primary)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              <button
                onClick={mergeDuplicates}
                disabled={!selectedDupGroup || !primaryLeadId || merging}
                className="flex-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40 transition"
              >
                {merging ? 'Merging...' : 'Merge into Primary'}
              </button>
              <button onClick={() => setShowMergeModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  labels,
  members,
  busyAction,
  onFollowUp,
  onTask,
  onHistory,
  onQualify,
  onStage,
  onTag,
  onAssign,
  onView,
}: {
  lead: Lead;
  labels: LeadLabelOption[];
  members: TeamMemberOption[];
  busyAction: string;
  onFollowUp: (lead: Lead) => void;
  onTask: (lead: Lead) => void;
  onHistory: (lead: Lead) => void;
  onQualify: (lead: Lead) => void;
  onStage: (lead: Lead, status: string) => void;
  onTag: (tag: string) => void;
  onAssign: (memberId: string) => void;
  onView: (lead: Lead) => void;
}) {
  const label = (lead.score_label || 'cold') as 'hot' | 'warm' | 'cold';
  const masked = Boolean(lead.metadata?.masked_for_role);
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-950">{lead.name || lead.phone || 'Unnamed lead'}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{lead.requirement || lead.ai_summary || 'No requirement captured'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${scoreStyles[label]}`}>
          {label} · {lead.lead_score}/10
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
        {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>}
        {lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
        {masked && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">Masked by role</span>}
        {lead.tag && <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{lead.tag}</span>}
        {lead.budget && <span>Budget: {lead.budget}</span>}
        {lead.timeline && <span>Timeline: {lead.timeline}</span>}
        {lead.source === 'whatsapp_flow' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-semibold text-[10px]">
            📋 Form Submitted
          </span>
        )}
      </div>
      {lead.score_reason && <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{lead.score_reason}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={lead.status}
          onChange={(e) => onStage(lead, e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          disabled={busyAction === `status-${lead.id}`}
        >
          {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
        </select>
        <select
          value={lead.tag || ''}
          onChange={(e) => onTag(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          disabled={busyAction === `meta-${lead.id}`}
          title="Lead label"
        >
          <option value="">No label</option>
          {labels.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        <select
          value={lead.assigned_to_user_id || ''}
          onChange={(e) => onAssign(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          disabled={busyAction === `meta-${lead.id}`}
          title="Assign owner"
        >
          <option value="">Unassigned</option>
          {members.filter((member) => member.user_id).map((member) => (
            <option key={member.id} value={member.user_id}>
              {member.display_name || member.email} ({member.role})
            </option>
          ))}
        </select>
        <Button variant="primary" size="sm" onClick={() => onFollowUp(lead)} loading={busyAction === `follow-${lead.id}`}>
          <Send className="h-4 w-4" />
          Follow-up
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onQualify(lead)} loading={busyAction === `qualify-${lead.id}`}>
          <Star className="h-4 w-4" />
          Qualify
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onTask(lead)} loading={busyAction === `task-${lead.id}`}>
          <Plus className="h-4 w-4" />
          Task
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onHistory(lead)} loading={busyAction === `history-${lead.id}`}>
          <MessageSquare className="h-4 w-4" />
          History
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onView(lead)} loading={busyAction === `view-${lead.id}`}>
          <Eye className="h-4 w-4" />
          View
        </Button>
      </div>
      {lead.next_follow_up_at && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          Next follow-up: {new Date(lead.next_follow_up_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-900">{value}</p>
    </div>
  );
}

function DetailCard({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Card className="border-orange-100 shadow-sm" hoverable={false}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">Full context is kept here so owners do not ask customers to repeat themselves.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      {children}
    </Card>
  );
}

function ReplyBox({ sessionId, phone, channel }: { sessionId: string; phone?: string; channel: string }) {
  const { post } = useApi();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await post('/api/automation/outbound-messages', {
        session_id: sessionId,
        recipient_phone: phone,
        message: text.trim(),
        channel,
        status: 'draft',
      });
      toast.success('Message saved as draft. Send from WhatsApp Messages page.');
      setText('');
    } catch {
      toast.error('Could not save reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Reply (saves as draft)</p>
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Type a reply message..."
          className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <Button variant="primary" size="sm" onClick={send} loading={sending} className="self-end">
          <Send className="h-4 w-4" />
          Send Draft
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">Draft saved to Messages → review & send from there</p>
    </div>
  );
}

function ConversationMessages({
  messages,
  fallbackQuestion,
  fallbackAnswer,
}: {
  messages: Array<{ id: string; role: string; content: string; created_at: string }>;
  fallbackQuestion?: string;
  fallbackAnswer?: string;
}) {
  if (!messages.length && (fallbackQuestion || fallbackAnswer)) {
    messages = [
      ...(fallbackQuestion ? [{ id: 'q', role: 'user', content: fallbackQuestion, created_at: '' }] : []),
      ...(fallbackAnswer ? [{ id: 'a', role: 'assistant', content: fallbackAnswer, created_at: '' }] : []),
    ];
  }
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 text-sm ${
            message.role === 'user' ? 'bg-orange-50 text-gray-800' : 'bg-gray-50 text-gray-700'
          }`}
        >
          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">{message.role}</p>
          <p className="whitespace-pre-line">{message.content}</p>
        </div>
      ))}
      {messages.length === 0 && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No messages found for this conversation.</p>}
    </div>
  );
}
