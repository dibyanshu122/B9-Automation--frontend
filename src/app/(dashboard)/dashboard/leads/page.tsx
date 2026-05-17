'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock, Eye, Flame, Mail, MessageSquare, Phone, Plus, Search, Send, Star, Users } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi, getApiClient } from '@/hooks/useApi';
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
  const { get } = useApi();
  const api = getApiClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'qualified' | 'inbox'>('pipeline');
  const [busyAction, setBusyAction] = useState('');
  const [chatHistory, setChatHistory] = useState<any | null>(null);
  const [conversation, setConversation] = useState<any | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentLinkTarget, setPaymentLinkTarget] = useState<{ phone: string; name: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState('');

  const refresh = () => {
    setLoading(true);
    Promise.all([get('/api/leads'), get('/api/leads/inbox')])
      .then(([leadResponse, inboxResponse]) => {
        setLeads(leadResponse.data);
        setInbox(inboxResponse.data);
      })
      .catch((error) => toast.error(error.response?.data?.detail || 'Failed to load CRM data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSearch = !query || [lead.name, lead.phone, lead.email].some((value) => (value || '').toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [leads, searchQuery, statusFilter]);

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
    try {
      const response = await api.get(`/api/leads/${lead.id}`);
      setSelectedLead(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load lead');
    } finally {
      setBusyAction('');
    }
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

      <Card className="border-orange-100 shadow-sm" hoverable={false}>
        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input-field pl-9"
              placeholder="Search by name, phone, or email"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field min-w-[160px]">
            <option value="all">All statuses</option>
            {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
          </select>
          {/* Export CSV */}
          <a
            href={`${typeof window !== 'undefined' ? '' : ''}/api/leads/export?format=csv${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
            download="leads.csv"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          >
            ↓ Export CSV
          </a>
        </div>

        {/* Bulk action toolbar — appears when leads are selected */}
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
                  } catch { toast.error('Bulk delete failed'); }
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
                  <input type="checkbox" className="rounded" checked={selectedLeadIds.has(lead.id)} onChange={(e) => { const next = new Set(selectedLeadIds); e.target.checked ? next.add(lead.id) : next.delete(lead.id); setSelectedLeadIds(next); }} />
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
                    busyAction={busyAction}
                    onFollowUp={sendFollowUp}
                    onTask={createTask}
                    onHistory={openChatHistory}
                    onQualify={qualifyLead}
                    onStage={updateStage}
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
                    busyAction={busyAction}
                    onFollowUp={sendFollowUp}
                    onTask={createTask}
                    onHistory={openChatHistory}
                    onQualify={qualifyLead}
                    onStage={updateStage}
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
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <DetailRow label="Name" value={selectedLead.name || '-'} />
            <DetailRow label="Phone" value={selectedLead.phone || '-'} />
            <DetailRow label="Email" value={selectedLead.email || '-'} />
            <DetailRow label="Source" value={selectedLead.source?.replace(/_/g, ' ') || '-'} />
            <DetailRow label="Status" value={selectedLead.status} />
            <DetailRow label="Created date" value={new Date(selectedLead.created_at).toLocaleString()} />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-1 font-semibold text-gray-950">Message</p>
            <p>{selectedLead.message || selectedLead.requirement || 'No message captured'}</p>
          </div>
          <select value={selectedLead.status} onChange={(event) => updateStage(selectedLead, event.target.value).then(() => setSelectedLead({ ...selectedLead, status: event.target.value }))} className="input-field mt-4 max-w-xs">
            {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
          </select>
        </DetailCard>
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
    </div>
  );
}

function LeadCard({
  lead,
  busyAction,
  onFollowUp,
  onTask,
  onHistory,
  onQualify,
  onStage,
  onView,
}: {
  lead: Lead;
  busyAction: string;
  onFollowUp: (lead: Lead) => void;
  onTask: (lead: Lead) => void;
  onHistory: (lead: Lead) => void;
  onQualify: (lead: Lead) => void;
  onStage: (lead: Lead, status: string) => void;
  onView: (lead: Lead) => void;
}) {
  const label = (lead.score_label || 'cold') as 'hot' | 'warm' | 'cold';
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
        {lead.budget && <span>Budget: {lead.budget}</span>}
        {lead.timeline && <span>Timeline: {lead.timeline}</span>}
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
