'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, Upload, Users, ArrowRight, ArrowLeft, Shuffle, Eye, AlertCircle, X, Check, FileSpreadsheet, Link2, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

// ── Import history stored in localStorage ────────────────────────────────────
interface ImportRecord {
  id: string;
  name: string;
  source: string;
  created: number;
  skipped: number;
  date: string;
  type: 'csv' | 'excel' | 'sheets';
}

function getHistory(): ImportRecord[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('b9_import_history') || '[]'); } catch { return []; }
}
function saveHistory(records: ImportRecord[]) {
  try { localStorage.setItem('b9_import_history', JSON.stringify(records.slice(0, 20))); } catch {}
}

const LEAD_FIELDS = [
  { key: 'phone',   label: 'Phone *', required: true,  hint: '+91XXXXXXXXXX' },
  { key: 'name',    label: 'Name',    required: false, hint: 'Full name' },
  { key: 'email',   label: 'Email',   required: false, hint: 'email@example.com' },
  { key: 'message', label: 'Note',    required: false, hint: 'Any note or message' },
  { key: 'tag',     label: 'Tag',     required: false, hint: 'hot / warm / cold' },
  { key: 'source',  label: 'Source',  required: false, hint: 'webinar / trade-show' },
  { key: 'skip',    label: '— Skip column —', required: false, hint: '' },
] as const;

type LeadFieldKey = typeof LEAD_FIELDS[number]['key'];

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

function parseCSV(text: string): ParsedCSV {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function guessMapping(headers: string[]): Record<number, LeadFieldKey> {
  const map: Record<number, LeadFieldKey> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  headers.forEach((h, i) => {
    const n = norm(h);
    if (['phone', 'mobile', 'whatsapp', 'tel', 'contact', 'number'].some(k => n.includes(k))) map[i] = 'phone';
    else if (['name', 'fullname', 'firstname', 'customer', 'contact'].some(k => n.includes(k))) map[i] = 'name';
    else if (['email', 'mail', 'emailaddress'].some(k => n.includes(k))) map[i] = 'email';
    else if (['message', 'note', 'notes', 'remarks', 'comment'].some(k => n.includes(k))) map[i] = 'message';
    else if (['tag', 'label', 'score', 'type', 'category'].some(k => n.includes(k))) map[i] = 'tag';
    else if (['source', 'channel', 'origin', 'utm'].some(k => n.includes(k))) map[i] = 'source';
    else map[i] = 'skip';
  });
  return map;
}

const STEPS = ['Upload', 'Map Fields', 'Preview', 'Done'] as const;

export default function ImportsPage() {
  const { post } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<Record<number, LeadFieldKey>>({});
  const [source, setSource] = useState('import');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped_duplicates: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'sheets'>('file');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [countryCode, setCountryCode] = useState('91');

  useEffect(() => {
    setHistory(getHistory());
    if (new URLSearchParams(window.location.search).get('source') === 'sheets') {
      setImportTab('sheets');
    }
  }, []);

  const handleFile = useCallback((f: File) => {
    const name = f.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!isCSV && !isExcel) { toast.error('Please upload a CSV (.csv) or Excel (.xlsx) file'); return; }
    setFile(f);

    if (isExcel) {
      // Parse Excel using xlsx library
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
          if (rows.length < 2) { toast.error('Excel file is empty'); return; }
          const headers = rows[0].map(String);
          const dataRows = rows.slice(1).map(r => headers.map((_, i) => String(r[i] || '')));
          const p: ParsedCSV = { headers, rows: dataRows };
          setParsed(p);
          setMapping(guessMapping(headers));
        } catch { toast.error('Failed to read Excel file. Try saving as CSV first.'); }
      };
      reader.readAsArrayBuffer(f);
    } else {
      // Parse CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const p = parseCSV(text);
        if (p.headers.length === 0) { toast.error('CSV file is empty or invalid'); return; }
        setParsed(p);
        setMapping(guessMapping(p.headers));
      };
      reader.readAsText(f);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const phoneColIndex = Object.entries(mapping).find(([, v]) => v === 'phone')?.[0];
  const hasPhoneCol = phoneColIndex !== undefined;

  const previewRows = (parsed?.rows || []).slice(0, 5);
  const mappedFields = Object.entries(mapping).filter(([, v]) => v !== 'skip');

  const doImport = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // If Excel, convert to CSV blob before sending
      let uploadFile = file;
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      if (isExcel && parsed) {
        const csvContent = [parsed.headers, ...parsed.rows].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        uploadFile = new File([csvContent], file.name.replace(/\.xlsx?$/, '.csv'), { type: 'text/csv' });
      }
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('mapping', JSON.stringify(mapping));
      const res = await post(`/api/leads/import/csv?source=${encodeURIComponent(source)}&country_code=${encodeURIComponent(countryCode)}`, formData);
      setResult(res.data);
      setStep(3);
      // Save to history
      const record: ImportRecord = {
        id: Date.now().toString(),
        name: file.name,
        source,
        created: res.data.created || 0,
        skipped: res.data.skipped_duplicates || 0,
        date: new Date().toLocaleString('en-IN'),
        type: isExcel ? 'excel' : 'csv',
      };
      const newHistory = [record, ...getHistory()];
      saveHistory(newHistory);
      setHistory(newHistory);
      toast.success(`Import complete: ${res.data.created} contacts added`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const importFromSheets = async () => {
    if (!sheetsUrl.trim()) return;
    setSheetsLoading(true);
    try {
      // Convert Google Sheets URL to CSV export URL
      let csvUrl = sheetsUrl.trim();
      const match = csvUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const sheetId = match[1];
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
      // Fetch via backend proxy to avoid CORS
      const res = await post('/api/leads/import/google-sheets', { url: csvUrl, source });
      if (res.data?.rows) {
        // Got back parsed data — set as parsed CSV for mapping step
        setParsed(res.data);
        setMapping(guessMapping(res.data.headers));
        setFile(new File([], 'google-sheets.csv'));
        setImportTab('file');
        setStep(1);
        toast.success(`Loaded ${res.data.rows.length} rows from Google Sheets`);
      } else {
        toast.error(res.data?.detail || 'Could not load Google Sheets data');
      }
    } catch {
      // If proxy not available, show instructions
      toast.error('Make sure the Google Sheet is shared publicly (Anyone with link can view)');
    } finally {
      setSheetsLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setFile(null); setParsed(null); setMapping({}); setResult(null); setSource('import'); setCountryCode('91');
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csv = `phone,name,email,message,tag,source\n9876543210,Rahul Sharma,rahul@example.com,Interested in demo,hot,webinar\n+919876543211,Priya Singh,,Follow up needed,warm,trade-show\n+971501234567,Ahmed Al Farsi,,UAE client,hot,expo`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'b9-contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Contacts</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">Upload CSV, Excel or Google Sheets — with field mapping and duplicate detection.</p>
        </div>
        <Button variant="secondary" onClick={downloadTemplate} className="shrink-0">
          <Download className="h-4 w-4" /> Template
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
            }`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold mr-1 ${i === step ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-6 mr-1 ${i < step ? 'bg-emerald-300' : 'bg-gray-200 dark:bg-slate-600'}`} />}
          </div>
        ))}
      </div>

      {/* STEP 0 — Upload */}
      {step === 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* LEFT — upload panel */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6 shadow-sm">

            {/* Source type tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-700/60 rounded-xl p-1">
              {([['file', FileSpreadsheet, 'CSV / Excel'], ['sheets', Link2, 'Google Sheets']] as const).map(([tab, Icon, label]) => (
                <button key={tab} type="button" onClick={() => setImportTab(tab as 'file' | 'sheets')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${importTab === tab ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>

            {importTab === 'sheets' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Google Sheets URL</label>
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="input-field" />
                  <p className="mt-1.5 text-xs text-gray-400">Sheet must be shared as <strong className="text-gray-600">Anyone with link → Viewer</strong></p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Source label</label>
                  <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. google-sheets" className="input-field" />
                </div>
                <Button variant="primary" onClick={importFromSheets} loading={sheetsLoading} disabled={!sheetsUrl.trim()} className="w-full justify-center">
                  <Link2 className="h-4 w-4" /> Load from Google Sheets
                </Button>
              </div>
            ) : (
              <>
                {/* Drop zone */}
                <div
                  className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[200px] ${
                    dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' :
                    file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' :
                    'border-gray-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-500'
                  }`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${file ? 'bg-emerald-100 dark:bg-emerald-900/40' : dragOver ? 'bg-indigo-100' : 'bg-gray-100 dark:bg-slate-700'}`}>
                    <Upload className={`h-6 w-6 ${file ? 'text-emerald-600' : dragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </div>
                  {file ? (
                    <div className="text-center px-4">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · {parsed ? `${parsed.rows.length} rows, ${parsed.headers.length} columns` : 'Parsing…'}
                      </p>
                      <p className="text-xs text-indigo-500 mt-1 font-medium">Click to change file</p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <p className="font-semibold text-gray-700 dark:text-slate-300">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">CSV (.csv) · Excel (.xlsx, .xls) · Max 5MB</p>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleInputChange} />
                </div>

                {/* Country code + Source + Next */}
                <div className="mt-5 grid grid-cols-[auto_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Country</label>
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="input-field pr-8 min-w-[140px]"
                    >
                      <option value="91">🇮🇳 India (+91)</option>
                      <option value="971">🇦🇪 UAE (+971)</option>
                      <option value="966">🇸🇦 Saudi Arabia (+966)</option>
                      <option value="1">🇺🇸 USA/Canada (+1)</option>
                      <option value="44">🇬🇧 UK (+44)</option>
                      <option value="65">🇸🇬 Singapore (+65)</option>
                      <option value="60">🇲🇾 Malaysia (+60)</option>
                      <option value="61">🇦🇺 Australia (+61)</option>
                      <option value="49">🇩🇪 Germany (+49)</option>
                      <option value="92">🇵🇰 Pakistan (+92)</option>
                      <option value="880">🇧🇩 Bangladesh (+880)</option>
                      <option value="94">🇱🇰 Sri Lanka (+94)</option>
                      <option value="977">🇳🇵 Nepal (+977)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Source label</label>
                    <input type="text" value={source} onChange={e => setSource(e.target.value)}
                      placeholder="import / trade-show / webinar"
                      className="input-field" />
                  </div>
                  <Button variant="primary" disabled={!parsed || !hasPhoneCol} onClick={() => setStep(1)}
                    className="h-[42px] px-6 gap-2">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Numbers without country code will get <strong className="text-gray-600">+{countryCode}</strong> added automatically.
                </p>

                {file && !hasPhoneCol && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">No phone column detected — you can map it manually in the next step.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT — format guide */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Supported Formats</p>
              <div className="space-y-2">
                {[
                  { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', name: 'CSV (.csv)', desc: 'Comma-separated values' },
                  { icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', name: 'Excel (.xlsx, .xls)', desc: 'First sheet is used' },
                  { icon: Link2, color: 'text-primary-500 bg-sky-50 dark:bg-orange-900/30', name: 'Google Sheets', desc: 'Share publicly first' },
                ].map(({ icon: Icon, color, name, desc }) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Required Column</p>
              <div className="rounded-xl bg-gray-950 px-4 py-3 font-mono text-xs text-emerald-400 overflow-x-auto mb-3">
                <p className="text-gray-600"># phone is mandatory</p>
                <p className="text-white">phone,name,email,tag</p>
                <p>9876543210,Rahul,r@ex.com,hot</p>
                <p className="text-gray-500">+919876543210,Priya,,warm</p>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><strong className="text-gray-700 dark:text-slate-300">phone</strong> — required (10-digit or with country code)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />Select your country — missing codes added automatically</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gray-300 shrink-0" /><strong className="text-gray-600 dark:text-slate-400">name, email, tag, source</strong> — optional</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />Headers auto-detected from column names</li>
              </ul>
            </div>
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
              Contacts with existing phone numbers are automatically skipped (no duplicates).
            </p>
          </div>
        </div>
      )}

      {/* STEP 1 — Map Fields */}
      {step === 1 && parsed && (
        <Card hoverable={false} className="border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Shuffle className="h-5 w-5 text-primary-500" /> Map CSV Columns to Lead Fields</h2>
              <p className="text-sm text-gray-500 mt-0.5">Auto-detected from your column names. Adjust if needed.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400 w-8">#</th>
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">CSV Column Header</th>
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">Sample Value</th>
                  <th className="py-2 text-left text-xs font-bold uppercase text-gray-400">Maps To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsed.headers.map((header, i) => {
                  const sample = parsed.rows.slice(0, 3).map(r => r[i]).filter(Boolean).join(' / ') || '—';
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-700 font-semibold">{header}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500 max-w-[160px] truncate">{sample}</td>
                      <td className="py-2.5">
                        <select
                          value={mapping[i] || 'skip'}
                          onChange={e => setMapping(prev => ({ ...prev, [i]: e.target.value as LeadFieldKey }))}
                          className={`rounded-lg border text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                            mapping[i] === 'phone' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                            mapping[i] === 'skip' ? 'border-gray-200 bg-gray-50 text-gray-400' :
                            'border-blue-200 bg-blue-50 text-blue-700'
                          }`}
                        >
                          {LEAD_FIELDS.map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!Object.values(mapping).includes('phone') && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Please map at least one column to <strong>Phone</strong> — it is required for import.
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button
              disabled={!Object.values(mapping).includes('phone')}
              onClick={() => setStep(2)}
            >
              Preview <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2 — Preview */}
      {step === 2 && parsed && (
        <Card hoverable={false} className="border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Eye className="h-5 w-5 text-primary-500" /> Preview Import</h2>
              <p className="text-sm text-gray-500 mt-0.5">First 5 rows shown. Duplicates skipped. Numbers without country code → <strong>+{countryCode}</strong> added.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{parsed.rows.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total rows</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{mappedFields.length}</p>
              <p className="text-xs text-blue-600 mt-0.5">Fields mapped</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{parsed.rows.filter(r => {
                const pi = Object.entries(mapping).find(([, v]) => v === 'phone')?.[0];
                return pi && r[Number(pi)]?.trim();
              }).length}</p>
              <p className="text-xs text-emerald-600 mt-0.5">With phone</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{source}</p>
              <p className="text-xs text-amber-600 mt-0.5">Source label</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {mappedFields.map(([idx, field]) => {
                    const fieldDef = LEAD_FIELDS.find(f => f.key === field);
                    return (
                      <th key={idx} className="px-3 py-2.5 text-left text-xs font-bold text-gray-600">
                        {fieldDef?.label || field}
                        <span className="ml-1 font-normal text-gray-400">← {parsed.headers[Number(idx)]}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50">
                    {mappedFields.map(([idx]) => (
                      <td key={idx} className="px-3 py-2 text-xs text-gray-700 max-w-[160px] truncate">
                        {row[Number(idx)] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.rows.length > 5 && (
            <p className="mt-2 text-xs text-gray-400 text-center">… and {parsed.rows.length - 5} more rows</p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={doImport} loading={uploading}>
              <Upload className="h-4 w-4" />
              Import {parsed.rows.length} contacts
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3 — Done */}
      {step === 3 && result && (
        <Card hoverable={false} className={`border-2 ${result.created > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'}`}>
          <div className="flex flex-col items-center py-8 gap-4">
            <div className={`rounded-full p-4 ${result.created > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              <Users className={`h-10 w-10 ${result.created > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">Import Complete</p>
              <p className="mt-0.5 text-xs text-gray-500">
                <span className="font-bold text-emerald-700">{result.created} contacts added</span>
                {result.skipped_duplicates > 0 && <span className="ml-2 text-gray-500">· {result.skipped_duplicates} duplicates skipped</span>}
              </p>
            </div>
            {result.errors.length > 0 && (
              <div className="w-full rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 max-h-40 overflow-y-auto">
                <p className="font-bold mb-1">Row errors ({result.errors.length}):</p>
                {result.errors.map((e, i) => <p key={i} className="flex items-start gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{e}</p>)}
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <a href="/dashboard/leads" className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition">
                View Leads →
              </a>
              <Button variant="secondary" onClick={reset}>
                <X className="h-4 w-4" /> Import another file
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Import History ────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" /> Import History
            </h2>
            <button type="button" onClick={() => { saveHistory([]); setHistory([]); }}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Clear history
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-start gap-3 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.type === 'excel' ? 'bg-blue-50 text-blue-600' : r.type === 'sheets' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {r.type === 'sheets' ? <Link2 className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate" title={r.name}>{r.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.date}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-bold text-emerald-600">+{r.created} added</span>
                    {r.skipped > 0 && <span className="text-xs text-gray-400">{r.skipped} skipped</span>}
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 rounded px-1.5 py-0.5">{r.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
