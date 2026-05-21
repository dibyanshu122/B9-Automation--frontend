'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { Assistant } from '@/types';
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileQuestion,
  FileText,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Target,
  Users,
  Volume2,
  VolumeX,
  Workflow,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type ChatMode = 'document' | 'automation';

const CHAT_MODELS = [
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
];

const automationActions = {
  coaching: [
    { icon: Users, label: "Follow up today's admission leads", prompt: "Draft WhatsApp follow-up messages for today's new admission leads." },
    { icon: CalendarClock, label: 'Create demo class tasks', prompt: 'Create demo class call tasks for hot student leads.' },
    { icon: FileQuestion, label: 'Generate course FAQs', prompt: 'Generate student and parent FAQs from the uploaded coaching documents.' },
    { icon: Send, label: 'Fee inquiry replies', prompt: 'Draft friendly reply messages for fee inquiry leads.' },
  ],
  real_estate: [
    { icon: Users, label: "Follow up today's property leads", prompt: "Classify today's real estate leads as hot/warm/cold and draft WhatsApp follow-up messages." },
    { icon: CalendarClock, label: 'Create site visit tasks', prompt: 'Create site visit booking tasks for hot property leads.' },
    { icon: FileText, label: 'Draft brochure replies', prompt: 'Draft WhatsApp replies for leads requesting brochures and price lists.' },
    { icon: Target, label: 'Find hot buyers', prompt: 'Identify hot property leads based on budget and urgency.' },
  ],
  gym: [
    { icon: Users, label: 'Follow up trial leads', prompt: 'Draft WhatsApp follow-up messages for gym trial class leads.' },
    { icon: CalendarClock, label: 'Create trial class tasks', prompt: 'Create trial class booking tasks for hot gym leads.' },
    { icon: Send, label: 'Membership offer drafts', prompt: 'Draft membership offer follow-up messages for fee inquiry leads.' },
    { icon: Target, label: 'Score fitness leads', prompt: 'Classify gym leads as hot, warm, or cold.' },
  ],
  salon: [
    { icon: Users, label: 'Follow up appointment leads', prompt: 'Draft polite WhatsApp follow-up messages for salon appointment leads.' },
    { icon: CalendarClock, label: 'Create appointment tasks', prompt: 'Create appointment tasks for interested salon leads.' },
    { icon: Send, label: 'Service price replies', prompt: 'Draft friendly reply messages for salon service price inquiries.' },
    { icon: FileQuestion, label: 'Generate service FAQs', prompt: 'Generate service pricing and appointment FAQs from salon documents.' },
  ],
  it_agency: [
    { icon: Users, label: 'Follow up demo leads', prompt: 'Draft email and WhatsApp follow-up messages for software demo leads.' },
    { icon: FileText, label: 'Create proposal drafts', prompt: 'Create proposal drafts for recent qualified leads.' },
    { icon: CalendarClock, label: 'Create demo tasks', prompt: 'Create demo scheduling tasks for hot B2B leads.' },
    { icon: Target, label: 'Qualify project leads', prompt: 'Qualify project leads based on budget and requirements.' },
  ],
  custom: [
    { icon: Users, label: "Follow up today's leads", prompt: "Draft WhatsApp follow-up messages for today's new leads." },
    { icon: Target, label: 'Find hot leads', prompt: 'Classify recent leads as hot, warm, or cold and list the hot leads.' },
    { icon: FileText, label: 'Create proposal drafts', prompt: 'Create simple proposal drafts for qualified leads.' },
    { icon: FileQuestion, label: 'Generate FAQs', prompt: 'Generate customer FAQs from the uploaded documents.' },
  ],
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistantsLoading, setAssistantsLoading] = useState(true);
  const [assistantId, setAssistantId] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('document');
  const [industryKey, setIndustryKey] = useState<keyof typeof automationActions>('custom');
  const [automationTimeline, setAutomationTimeline] = useState<any[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [latestDoc, setLatestDoc] = useState<{ title: string; source_type: string } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const assistantsScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const { get, post, put } = useApi();
  const selectedAssistant = assistants.find((assistant) => assistant.id === assistantId);
  const quickActions = automationActions[industryKey] || automationActions.custom;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const resetScroll = () => {
      chatScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      assistantsScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const response = await get('/api/assistants');
        const assistantList = response.data as Assistant[];
        setAssistants(assistantList);

        const assistantFromUrl = searchParams?.get('assistant');
        const fallbackAssistant = assistantList[0]?.id || '';
        setAssistantId(assistantFromUrl || fallbackAssistant);
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load assistants');
      } finally {
        setAssistantsLoading(false);
      }
    };

    fetchAssistants();
  }, [get, searchParams]);

  useEffect(() => {
    get('/api/automation/onboarding/status')
      .then((response) => {
        const key = response.data?.industry_pack?.key;
        if (key && automationActions[key as keyof typeof automationActions]) {
          setIndustryKey(key as keyof typeof automationActions);
        }
      })
      .catch(() => {});
  }, [get]);

  useEffect(() => {
    if (messages.length === 0) {
      chatScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Show headline banner when a doc was uploaded in the last 10 minutes
  useEffect(() => {
    if (!assistantId) return;
    setLatestDoc(null);
    get(`/api/documents/${assistantId}`)
      .then((res) => {
        const docs: any[] = res.data || [];
        if (docs.length > 0) {
          const latest = docs[0];
          const tenMinsAgo = Date.now() - 10 * 60 * 1000;
          if (new Date(latest.created_at).getTime() > tenMinsAgo) {
            setLatestDoc({ title: latest.title, source_type: latest.source_type });
          }
        }
      })
      .catch(() => {});
  }, [assistantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const handleModelChange = async (model: string) => {
    if (!assistantId) return;

    setAssistants((items) =>
      items.map((assistant) =>
        assistant.id === assistantId ? { ...assistant, allowed_model: model } : assistant
      )
    );

    try {
      await put(`/api/assistants/${assistantId}`, {
        allowed_model: model,
      });
      toast.success('Model updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update model');
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Pick best available voice: Hindi > en-IN > any English
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === 'hi-IN') ||
      voices.find((v) => v.lang.startsWith('hi')) ||
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      toast.error('Voice input requires HTTPS. Please use the secure version of this app.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'hi-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputValue((value) => `${value}${value ? ' ' : ''}${transcript}`);
      }
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone blocked. Click the 🔒 icon in your browser address bar → Allow microphone → refresh page.');
      } else {
        toast.error('Could not capture voice. Try again or check microphone permissions.');
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleSendMessage = async (e: React.FormEvent | null, overrideText?: string) => {
    if (e) e.preventDefault();
    const messageText = overrideText || inputValue;
    if (overrideText) setInputValue(overrideText);

    if (!messageText.trim() || !assistantId) {
      toast.error('Please select an assistant and type a message');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);
    setAutomationTimeline(
      chatMode === 'automation'
        ? [
            { label: 'Thinking...', status: 'running' },
            { label: 'Planning tasks...', status: 'pending' },
            { label: 'Executing tools...', status: 'pending' },
          ]
        : []
    );

    try {
      const response =
        chatMode === 'automation'
          ? await post('/api/automation/chat', {
              message: messageText,
              assistant_id: assistantId,
            })
          : await post(`/api/chat/${assistantId}/message`, {
              message: messageText,
              assistant_id: assistantId,
            });

      if (chatMode === 'automation') {
        setAutomationTimeline(response.data.timeline || []);
      }

      // Check if backend returned a quota limit response
      if (response.data.limit_reached) {
        const limitMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ **AI credit limit reached.** You've used all your AI credits for this month.\n\n→ [Buy a top-up](/dashboard/billing) (₹299 for 500 credits)\n→ [Add your free Groq key](/dashboard/settings) for unlimited credits at zero cost`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'No response received.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speak(response.data.response || '');
    } catch (error: any) {
      const detail = error.response?.data?.detail || '';
      if (detail.toLowerCase().includes('quota') || detail.toLowerCase().includes('limit')) {
        toast.error('AI reply limit reached. Buy a top-up in Billing.', { duration: 5000 });
      } else {
        toast.error(detail || 'Failed to send message');
      }
      setAutomationTimeline([]);
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-[calc(100dvh-96px)] min-h-0 min-w-0 grid-cols-1 gap-4 overflow-hidden sm:h-[calc(100dvh-112px)] lg:h-[calc(100dvh-128px)] xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* Sidebar */}
      <div className="b9-glass flex min-h-0 flex-col overflow-hidden rounded-lg p-4">
        <div className="mb-4">
          <h3 className="font-bold text-slate-100">Assistants</h3>
          <p className="mt-1 text-xs text-slate-500">Choose the bot that should answer or run automations.</p>
        </div>
        <div ref={assistantsScrollRef} className="flex max-h-56 gap-2 overflow-x-auto pb-2 xl:block xl:min-h-0 xl:max-h-none xl:flex-1 xl:space-y-2 xl:overflow-y-auto xl:overflow-x-hidden xl:pb-0 xl:pr-1">
          {assistantsLoading ? (
            <p className="text-sm text-gray-500">Loading assistants...</p>
          ) : assistants.length === 0 ? (
            <p className="text-sm text-gray-500">Create an assistant first.</p>
          ) : (
            assistants.map((assistant) => (
              <button
                key={assistant.id}
                type="button"
                onClick={() => {
                  setAssistantId(assistant.id);
                  setMessages([]);
                }}
                className={`w-full shrink-0 rounded-lg px-4 py-3 text-left transition-colors xl:shrink ${
                  assistantId === assistant.id
                    ? 'bg-primary-500/15 text-orange-100 ring-1 ring-primary-300/30'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex min-w-44 items-center gap-3 xl:min-w-0">
                  <Bot className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{assistant.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      {assistant.language}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white hidden xl:inline"
                        style={{ background: 'linear-gradient(135deg, #1e293b, #1e1b4b)' }}>
                        DeepSeek
                      </span>
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        {selectedAssistant && (
          <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              AI Model
            </label>
            <select
              value={selectedAssistant.allowed_model || 'llama-3.1-8b-instant'}
              onChange={(e) => handleModelChange(e.target.value)}
              className="input-field text-sm"
            >
              {CHAT_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="b9-glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg">
        <div className="border-b border-white/10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-lg border border-white/10 bg-white/10 p-1">
              <button
                type="button"
                onClick={() => {
                  setChatMode('document');
                  setAutomationTimeline([]);
                }}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  chatMode === 'document' ? 'bg-white/15 text-orange-100 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Document Chat
              </button>
              <button
                type="button"
                onClick={() => setChatMode('automation')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  chatMode === 'automation' ? 'bg-white/15 text-orange-100 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Automation Mode
              </button>
            </div>
            {chatMode === 'automation' && (
              <div className="rounded-xl border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-sm text-slate-300">
                <p className="font-bold text-orange-100">Automation Mode runs business tasks.</p>
                <p className="mt-1">Use it for leads, follow-ups, proposals, FAQs, tasks, and owner alerts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Document ready banner */}
        {latestDoc && (
          <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <span className="mt-0.5 shrink-0 text-emerald-400">📄</span>
            <div className="flex-1">
              <span className="font-bold">{latestDoc.title}</span>{' '}
              <span className="text-emerald-300">is ready — ask me anything about it!</span>
            </div>
            <button type="button" onClick={() => setLatestDoc(null)} className="shrink-0 text-emerald-400 hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={chatScrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 b9-chat-area">
          {messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center py-4">
              <div className="w-full max-w-4xl text-center">
                {chatMode === 'automation' ? (
                  <Workflow className="mx-auto mb-4 h-16 w-16 text-slate-500" />
                ) : (
                  <MessageCircle className="mx-auto mb-4 h-16 w-16 text-slate-500" />
                )}
                <h3 className="mb-2 text-xl font-bold text-slate-100">
                  {chatMode === 'automation' ? 'Ask B9 Automation to do business work' : 'Start a conversation'}
                </h3>
                <p className="text-slate-400">
                  {chatMode === 'automation'
                    ? 'Select a business action below or type your own command.'
                    : 'Ask questions from uploaded PDFs, URLs, YouTube content, and knowledge base.'}
                </p>

                {chatMode === 'automation' && (
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleSendMessage(null, action.prompt)}
                          className="b9-tilt-card rounded-2xl p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-orange-400/10 p-2 text-orange-200">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{action.label}</p>
                              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{action.prompt}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {chatMode === 'document' && (
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    {[
                      { icon: MessageCircle, label: 'Ask from documents', prompt: 'Ask about fees, pricing, policy, or service details.' },
                      { icon: FileText, label: 'Find source-backed answer', prompt: 'AI will answer from the uploaded knowledge base.' },
                      { icon: Zap, label: 'Switch for actions', prompt: 'Use Automation Mode to perform business actions.' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="b9-tilt-card rounded-2xl p-4">
                          <Icon className="h-5 w-5 text-primary-600" />
                          <p className="mt-3 font-bold text-slate-100">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.prompt}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/10 text-slate-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-sm
                      [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-100 [&_h1]:mt-3 [&_h1]:mb-1
                      [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-100 [&_h2]:mt-2 [&_h2]:mb-1
                      [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mt-1.5
                      [&_strong]:text-white [&_strong]:font-bold
                      [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ul]:my-1
                      [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-0.5 [&_ol]:my-1
                      [&_li]:text-slate-200
                      [&_p]:leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0
                      [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_code]:text-orange-300">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-white/10 px-4 py-2">
                <div className="flex gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-orange-300"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-sky-300" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-orange-300" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          {chatMode === 'automation' && automationTimeline.length > 0 && (
            <div className="rounded-lg border border-orange-300/20 bg-orange-400/10 p-4">
              <p className="mb-3 text-sm font-bold text-orange-100">Automation run</p>
              <div className="space-y-2">
                {automationTimeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-2 text-sm text-slate-300">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-primary-600" />
                    )}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="grid grid-cols-[auto_1fr_auto_auto] gap-2 max-sm:grid-cols-[auto_1fr_auto]">
            <Button
              type="button"
              variant={listening ? 'danger' : 'secondary'}
              disabled={loading || !assistantId}
              onClick={toggleListening}
              aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="input-field flex-1"
              disabled={loading || !assistantId}
            />
            <Button
              type="button"
              variant={voiceEnabled ? 'primary' : 'secondary'}
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) window.speechSynthesis?.cancel();
              }}
              aria-label={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
              className="max-sm:hidden"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !assistantId}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
