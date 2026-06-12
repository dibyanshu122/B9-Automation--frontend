'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { getApiClient, useApi } from '@/hooks/useApi';
import { Assistant, Document } from '@/types';
import { CheckCircle2, FileText, Loader2, MessageCircle, Upload, Trash2, Eye, Bot, ScanLine, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

function getDocumentStatus(doc: Document) {
  const rawStatus = String((doc as any).status || '').toLowerCase();
  if (rawStatus === 'failed' || rawStatus === 'error') {
    return { label: 'Failed', className: 'bg-red-100 text-red-700', ready: false };
  }
  if (doc.is_indexed) {
    return { label: 'Ready', className: 'bg-emerald-100 text-emerald-700', ready: true };
  }
  return { label: 'Indexing', className: 'bg-amber-100 text-amber-700', ready: false };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadMode, setUploadMode] = useState<'pdf' | 'flow_pdf' | 'url' | 'youtube' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [lastUploadedAssistantId, setLastUploadedAssistantId] = useState<string | null>(null);
  const [urlCrawl, setUrlCrawl] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    url: '',
    assistant_id: '',
  });
  const { get, post, delete: deleteReq } = useApi();

  const fetchDocuments = useCallback(async (assistantId: string) => {
    if (!assistantId) {
      setDocuments([]);
      return;
    }

    setDocumentsLoading(true);
    try {
      const response = await get(`/api/documents/${assistantId}`);
      setDocuments(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const response = await get('/api/assistants');
        const assistantList = response.data as Assistant[];
        setAssistants(assistantList);

        if (assistantList[0]) {
          setUploadData((data) => ({ ...data, assistant_id: assistantList[0].id }));
          fetchDocuments(assistantList[0].id);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load assistants');
      }
    };

    fetchAssistants();
  }, [fetchDocuments, get]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(uploadMode === 'pdf' || uploadMode === 'flow_pdf' ? 5 : 20);
    setUploadStage('Preparing upload');

    try {
      let response;
      
      if ((uploadMode === 'pdf' || uploadMode === 'flow_pdf') && uploadData.file) {
        // Client-side file size check (backend also enforces 50MB)
        const MAX_MB = 50;
        if (uploadData.file.size > MAX_MB * 1024 * 1024) {
          toast.error(`File too large — maximum ${MAX_MB}MB allowed`);
          setLoading(false);
          return;
        }
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(uploadData.file.type)) {
          toast.error('Only PDF, Word (.docx), or text files are supported');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', uploadData.file);
        formData.append('purpose', uploadMode === 'flow_pdf' ? 'conversation_flow' : 'knowledge');
        setUploadStage(uploadMode === 'flow_pdf' ? 'Uploading flow PDF' : 'Uploading PDF');
        response = await getApiClient().post(
          `/api/documents/${uploadData.assistant_id}/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (!progressEvent.total) return;
              // Upload = 0→85%, processing = 85→100% (set after response)
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 85);
              setUploadProgress(Math.max(5, Math.min(percent, 85)));
            },
          }
        );
        setUploadStage('Processing document');
        setUploadProgress(90);
      } else if (uploadMode === 'url') {
        setUploadStage(urlCrawl ? 'Crawling website pages...' : 'Reading website');
        setUploadProgress(45);
        response = await post(
          `/api/documents/${uploadData.assistant_id}/url`,
          { url: uploadData.url, crawl_subpages: urlCrawl, max_pages: 8 }
        );
        if (response?.data?.pages_scraped > 1) {
          setUploadStage(`Scraped ${response.data.pages_scraped} pages`);
        }
      } else if (uploadMode === 'youtube') {
        // Validate YouTube URL before sending
        const isYT = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/.test(uploadData.url);
        if (!isYT) {
          toast.error('Please enter a valid YouTube URL (e.g. https://youtube.com/watch?v=...)');
          setLoading(false);
          return;
        }
        setUploadStage('Reading YouTube transcript');
        setUploadProgress(45);
        response = await post(
          `/api/documents/${uploadData.assistant_id}/youtube`,
          { url: uploadData.url }
        );
      }

      if (response) {
        setUploadProgress(100);
        setUploadStage('Uploaded');
        setDocuments([...documents, response.data]);
        setLastUploadedAssistantId(uploadData.assistant_id);
        toast.success('Document uploaded. Indexing status is shown below.');
        setUploadMode(null);
        setUploadData((data) => ({ ...data, file: null, url: '' }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage('');
      }, 700);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReq(`/api/documents/${deleteTarget.id}`);
      setDocuments(documents.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-2">Upload and manage your documents</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={uploadData.assistant_id}
            onChange={(e) => {
              const assistantId = e.target.value;
              setUploadData({ ...uploadData, assistant_id: assistantId });
              fetchDocuments(assistantId);
            }}
            className="input-field min-w-56"
          >
            <option value="">Choose assistant</option>
            {assistants.map((assistant) => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name}
              </option>
            ))}
          </select>
          <Button
            variant={uploadMode === 'pdf' ? 'primary' : 'secondary'}
            disabled={!uploadData.assistant_id}
            onClick={() => setUploadMode(uploadMode === 'pdf' ? null : 'pdf')}
            title="Upload business knowledge - FAQs, pricing, services, policies"
          >
            Knowledge PDF
          </Button>
          <Button
            variant={uploadMode === 'flow_pdf' ? 'primary' : 'secondary'}
            disabled={!uploadData.assistant_id}
            onClick={() => setUploadMode(uploadMode === 'flow_pdf' ? null : 'flow_pdf')}
            title="Upload a chatbot conversation script for automation flows"
          >
            Flow Script PDF
          </Button>
          <Button
            variant={uploadMode === 'url' ? 'primary' : 'secondary'}
            disabled={!uploadData.assistant_id}
            onClick={() => setUploadMode(uploadMode === 'url' ? null : 'url')}
          >
            URL
          </Button>
          <Button
            variant={uploadMode === 'youtube' ? 'primary' : 'secondary'}
            disabled={!uploadData.assistant_id}
            onClick={() => setUploadMode(uploadMode === 'youtube' ? null : 'youtube')}
          >
            YouTube
          </Button>
        </div>
      </div>

      {/* Upload Form */}
      {uploadMode && (
        <Card className="border-gray-200 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {uploadMode === 'flow_pdf' ? 'Upload Flow Script PDF' : uploadMode === 'pdf' ? 'Upload Knowledge PDF' : uploadMode === 'youtube' ? 'Add YouTube Video' : 'Add Website URL'}
              </h3>
              <p className="text-sm text-gray-500">
                {uploadMode === 'flow_pdf'
                  ? 'Use this for chatbot conversation scripts - steps, questions, and reply rules. Not for general knowledge.'
                  : uploadMode === 'pdf'
                  ? 'Upload FAQs, pricing, policies, services - anything the AI should know to answer customers.'
                  : 'B9 will scan and add this content to your assistant knowledge.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Assistant
              </label>
              <select
                value={uploadData.assistant_id}
                onChange={(e) => {
                  const assistantId = e.target.value;
                  setUploadData({ ...uploadData, assistant_id: assistantId });
                  fetchDocuments(assistantId);
                }}
                className="input-field"
                required
              >
                <option value="">-- Choose an assistant --</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </div>

            {(uploadMode === 'pdf' || uploadMode === 'flow_pdf') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {uploadMode === 'flow_pdf' ? 'Select Chatbot Flow PDF' : 'Select PDF or Word File'}
                </label>
                <input
                  type="file"
                  accept={uploadMode === 'flow_pdf' ? '.pdf' : '.pdf,.doc,.docx'}
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  className="input-field"
                  required
                />
                {uploadMode !== 'flow_pdf' && (
                  <p className="mt-1 text-xs text-gray-500">Supported: PDF (.pdf) and Word (.doc, .docx)</p>
                )}
              </div>
            )}

            {(uploadMode === 'url' || uploadMode === 'youtube') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {uploadMode === 'youtube' ? 'YouTube URL' : 'Website URL'}
                  </label>
                  <input
                    type="url"
                    value={uploadData.url}
                    onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                    placeholder={uploadMode === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://yourwebsite.com'}
                    className="input-field"
                    required
                  />
                </div>
                {uploadMode === 'url' && (
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 dark:border-orange-300/20 dark:bg-slate-900/60 px-4 py-2.5">
                    <div
                      onClick={() => setUrlCrawl(v => !v)}
                      className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${urlCrawl ? 'bg-sky-500' : 'bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${urlCrawl ? 'translate-x-4' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Crawl entire website</p>
                      <p className="text-xs text-slate-500">Scrape multiple pages (up to 8 pages). Takes ~30 seconds.</p>
                    </div>
                  </label>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={loading} className="flex-1">
                Upload
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setUploadMode(null)}
              >
                Cancel
              </Button>
            </div>

            {loading && (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-5 text-slate-900 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.04)] backdrop-blur-[12px] dark:border-orange-300/20 dark:bg-slate-950/85 dark:text-white dark:shadow-orange-500/10">
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(249,115,22,0.12),transparent)] animate-[b9Scan_1.8s_ease-in-out_infinite]" />
                <div className="relative grid gap-5 lg:grid-cols-[220px_1fr]">
                  <div className="relative mx-auto flex h-44 w-36 items-center justify-center rounded-2xl border border-white/10 bg-white/8 shadow-inner shadow-black/30">
                    <FileText className="h-16 w-16 text-slate-300" />
                    <div
                      className="absolute left-3 right-3 h-1 rounded-full bg-gradient-to-r from-transparent via-orange-300 to-transparent shadow-[0_0_22px_rgba(251,146,60,0.9)] transition-all duration-300"
                      style={{ top: `${Math.max(18, Math.min(82, uploadProgress))}%` }}
                    />
                    <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/35 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-orange-100">
                      AI Scan
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        {uploadProgress >= 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
                        )}
                        {uploadStage || 'Uploading'}
                      </div>
                      <span className="text-sm font-bold text-orange-200">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-sky-300 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                      {['Upload', 'Scan', 'Index'].map((step, index) => {
                        const done = uploadProgress >= (index + 1) * 33;
                        return (
                          <div key={step} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            {step}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <ScanLine className="h-4 w-4 text-orange-300" />
                      {uploadMode === 'flow_pdf'
                        ? 'Extracting conversation flow, rules, and steps for automation AI.'
                        : 'Extracting text, preparing chunks, and making it searchable for chat.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Test in Chat banner - shown after successful upload */}
      {lastUploadedAssistantId && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Document uploaded! Your assistant can now answer questions from it.</span>
          </div>
          <Link href={`/dashboard/chat?assistant=${lastUploadedAssistantId}`}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shrink-0">
            <MessageCircle className="h-3.5 w-3.5" /> Test in Chat
          </Link>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {documentsLoading ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">Loading documents...</p>
          </Card>
        ) : assistants.length === 0 ? (
          <Card className="text-center py-12">
            <Bot className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">Create an assistant first</h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600">
              Documents need an AI assistant so B9 knows where to store and use the knowledge.
            </p>
            <a href="/dashboard/assistants" className="inline-flex">
              <Button variant="primary">
                <Sparkles className="h-4 w-4" />
                Create Assistant
              </Button>
            </a>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents</h3>
            <p className="mb-6 text-gray-600">Upload a PDF, website URL, or YouTube link to train this assistant.</p>
            <Button variant="primary" onClick={() => setUploadMode('pdf')} disabled={!uploadData.assistant_id}>
              <Upload className="h-4 w-4" />
              Upload First Document
            </Button>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 truncate">{doc.title}</h3>
                    {(() => {
                      const status = getDocumentStatus(doc);
                      return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span>;
                    })()}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {(doc.purpose || doc.source_purpose) === 'conversation_flow'
                      ? 'Flow Script'
                      : doc.source_type === 'WEBSITE'
                        ? `Website${(doc.source_metadata?.pages_scraped || doc.pages) > 1 ? ` - ${doc.source_metadata?.pages_scraped || doc.pages} pages` : ' - 1 page'}`
                        : doc.source_type}
                    {doc.source_type !== 'WEBSITE' && (doc.pages || 0) > 0 && ` - ${doc.pages} pages`}
                  </p>
                  {doc.source_type === 'WEBSITE' && doc.source_url && (
                    <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-xs block">
                      {doc.source_url}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewDocument(doc);
                  }}
                  title="View document details"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => { event.stopPropagation(); setDeleteTarget(doc); }}
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {previewDocument && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-xl" hoverable={false}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 text-orange-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{previewDocument.title}</h2>
                  <p className="text-sm text-gray-500">Document details and training status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-gray-500 hover:bg-white/10 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source</p>
                <p className="mt-1 font-bold text-gray-900">
                  {(previewDocument.purpose || previewDocument.source_purpose) === 'conversation_flow' ? 'Chatbot Flow PDF' : previewDocument.source_type}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pages</p>
                <p className="mt-1 font-bold text-gray-900">{previewDocument.pages || 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                {(() => {
                  const status = getDocumentStatus(previewDocument);
                  return <p className={`mt-1 font-bold ${status.ready ? 'text-emerald-700' : status.label === 'Failed' ? 'text-red-700' : 'text-amber-600'}`}>{status.label}</p>;
                })()}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-orange-300/20 bg-sky-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                {previewDocument.is_indexed
                  ? <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ready for chat</>
                  : <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> Indexing document. Please wait a moment.</>
                }
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {previewDocument.is_indexed
                  ? 'B9 can now use this document to answer customer questions with your selected assistant.'
                  : 'The document is being read and indexed. Refresh this page in a moment to check the status.'
                }
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900">Delete Document?</h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{deleteTarget.title}</strong> will be permanently removed. The AI will no longer have access to this knowledge.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
