'use client';

import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, Upload, Users, ArrowRight, ArrowLeft, Shuffle, Eye, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

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

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const p = parseCSV(text);
      if (p.headers.length === 0) { toast.error('CSV file is empty or invalid'); return; }
      setParsed(p);
      setMapping(guessMapping(p.headers));
    };
    reader.readAsText(f);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      const res = await post(`/api/leads/import/csv?source=${encodeURIComponent(source)}`, formData);
      setResult(res.data);
      setStep(3);
      toast.success(`Import complete: ${res.data.created} contacts added`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setStep(0); setFile(null); setParsed(null); setMapping({}); setResult(null); setSource('import');
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csv = 'phone,name,email,message,tag,source\n+919876543210,Rahul Sharma,rahul@example.com,Interested in demo,hot,webinar\n+918765432109,Priya Singh,,Follow up needed,warm,trade-show';
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">Bulk-import leads from a CSV file with field mapping and duplicate detection.</p>
        </div>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* STEP 0 — Upload */}
      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card hoverable={false} className="border-gray-200">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Upload CSV File</h2>
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition ${
                dragOver ? 'border-primary-400 bg-primary-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className={`h-10 w-10 ${file ? 'text-emerald-500' : dragOver ? 'text-primary-500' : 'text-gray-300'}`} />
              {file ? (
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB · {parsed ? `${parsed.rows.length} rows, ${parsed.headers.length} columns` : 'parsing…'} · Click to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold text-gray-600">Click or drag & drop CSV</p>
                  <p className="text-xs text-gray-400">Max 5MB · Up to 1,000 contacts</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
            </div>

            <div className="mt-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Source label</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="import / trade-show / webinar"
                  className="input-field"
                />
              </div>
              <Button
                disabled={!parsed || !hasPhoneCol}
                onClick={() => setStep(1)}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {file && !hasPhoneCol && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                No phone column detected — please map it in the next step.
              </p>
            )}
          </Card>

          <Card hoverable={false} className="border-gray-200">
            <h2 className="mb-4 text-lg font-bold text-gray-900">CSV Format</h2>
            <div className="rounded-xl bg-gray-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto mb-4">
              <p>phone,name,email,message,tag</p>
              <p>+919876543210,Rahul Sharma,r@ex.com,Demo req,hot</p>
              <p>+918765432109,Priya Singh,,,warm</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><strong>phone</strong> — required, with country code (+91...)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" /><strong>name</strong>, <strong>email</strong>, <strong>message</strong>, <strong>tag</strong> — optional</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />Field mapping auto-detected from column names</li>
            </ul>
            <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
              Contacts with existing phone numbers are automatically skipped (no duplicates).
            </p>
          </Card>
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
              <p className="text-sm text-gray-500 mt-0.5">First 5 rows shown. Duplicates (same phone) will be skipped automatically.</p>
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
              <p className="mt-1 text-sm text-gray-600">
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
    </div>
  );
}
