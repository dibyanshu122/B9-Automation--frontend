'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Copy, Download, Loader2, Plus, QrCode, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/button';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

interface WaQrCode {
  code: string;
  prefilled_message: string;
  deep_link_url?: string;
  qr_image_url?: string;
  source_tag?: string;
}

export default function QrCodesPage() {
  const { get, post, delete: del } = useApi();
  const [qrCodes, setQrCodes] = useState<WaQrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState('Hello! I\'d like to know more about your services.');
  const [sourceTag, setSourceTag] = useState('Store Poster');
  const [pageError, setPageError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setPageError('');
    setNotConnected(false);
    get('/api/automation/whatsapp/qr-codes')
      .then(r => {
        setQrCodes(r.data?.qr_codes || []);
        if (r.data?.error) {
          setPageError(r.data.error);
          if ((r.data.error || '').toLowerCase().includes('not connected')) setNotConnected(true);
        }
      })
      .catch((e: any) => {
        if (e?.response?.status === 400) setNotConnected(true);
        setPageError(e.response?.data?.detail || 'Could not load QR codes. Retry or check WhatsApp connection health.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const create = async () => {
    if (!message.trim()) { toast.error('Message required'); return; }
    setCreating(true);
    try {
      await post('/api/automation/whatsapp/qr-codes', { prefilled_message: message.trim(), source_tag: sourceTag.trim() });
      toast.success('QR code created!');
      setShowCreate(false);
      setMessage('Hello! I\'d like to know more about your services.');
      setSourceTag('Store Poster');
      load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed to create QR code'); }
    finally { setCreating(false); }
  };

  const deleteQr = async (code: string) => {
    if (!confirm('Delete this QR code?')) return;
    setDeleting(code);
    try {
      await del(`/api/automation/whatsapp/qr-codes/${code}`);
      toast.success('QR code deleted');
      setQrCodes(prev => prev.filter(q => q.code !== code));
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp QR Codes</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate QR codes customers can scan to start a WhatsApp chat with a pre-filled message.
          </p>
        </div>
        {!notConnected && (
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create QR Code
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How QR Codes work</p>
        <ul className="list-disc pl-4 text-xs space-y-0.5 opacity-90">
          <li>Customer scans QR code with phone camera</li>
          <li>WhatsApp opens with a pre-filled message ready to send</li>
          <li>Great for shop displays, business cards, posters, and websites</li>
          <li>Meta allows up to 3 QR codes per phone number</li>
          <li>Source tag helps you identify where the lead came from</li>
        </ul>
      </div>

      {pageError && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">QR code status needs attention</p>
          <p className="mt-1">{pageError}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
            <a href="/dashboard/integrations" className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">
              Open Integrations
            </a>
          </div>
        </div>
      )}

      {notConnected && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <p className="font-semibold text-gray-700">WhatsApp not connected</p>
          <a href="/dashboard/integrations" className="text-sm font-semibold text-orange-600 hover:underline">Go to Integrations</a>
        </div>
      )}

      {!notConnected && loading && (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      )}

      {!notConnected && !loading && qrCodes.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
          <QrCode className="w-10 h-10 text-gray-300" />
          <p className="font-semibold text-gray-500">No QR codes yet</p>
          <p className="text-sm text-gray-400">Create a QR code to let customers easily start a WhatsApp chat</p>
          <Button onClick={() => setShowCreate(true)} className="mt-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First QR Code
          </Button>
        </div>
      )}

      {!notConnected && !loading && qrCodes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map(qr => (
            <div key={qr.code} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition space-y-3">
              {/* QR Image */}
              {qr.qr_image_url ? (
                <div className="flex justify-center">
                  {/* Meta returns QR SVG/data URLs; keep native img for exact rendering. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.qr_image_url} alt="QR Code" className="w-40 h-40 rounded-lg border border-gray-100" />
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border border-gray-100">
                  <QrCode className="w-16 h-16 text-gray-300" />
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Pre-filled Message</p>
                <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{qr.prefilled_message}</p>
                {qr.source_tag && (
                  <p className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    Source: {qr.source_tag}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {qr.deep_link_url && (
                  <button onClick={() => copyLink(qr.deep_link_url!)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                )}
                {/* Download Business Card PDF */}
                <button
                  onClick={async () => {
                    const base = process.env.NEXT_PUBLIC_API_URL || '';
                    const token = useAuthStore.getState().token;
                    const url = `${base}/api/automation/whatsapp/qr-codes/${qr.code}/business-card?tagline=Scan+to+chat+on+WhatsApp`;
                    const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                    if (!r.ok) { toast.error('PDF generation failed'); return; }
                    const blob = await r.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `business-card-${qr.code}.pdf`;
                    a.click();
                    toast.success('Business card downloaded!');
                  }}
                  className="flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition"
                  title="Download as business card PDF">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteQr(qr.code)} disabled={deleting === qr.code}
                  className="flex items-center justify-center gap-1 text-xs font-semibold text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition disabled:opacity-50">
                  {deleting === qr.code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Create QR Code</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pre-filled Message *</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    placeholder="Message that appears in WhatsApp when customer scans the QR code"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                  <p className="text-xs text-gray-400 mt-1">Customer can edit this message before sending.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source Tag</label>
                  <input
                    value={sourceTag}
                    onChange={e => setSourceTag(e.target.value)}
                    maxLength={80}
                    placeholder="Store Poster, Website Banner, Event Stall"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">This is appended to the WhatsApp message so leads can be attributed later.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={create} disabled={creating || !message.trim()} className="flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <QrCode className="w-4 h-4" /> Generate
                </Button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
