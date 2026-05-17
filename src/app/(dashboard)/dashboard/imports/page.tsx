'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, Upload, Users } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

export default function ImportsPage() {
  const { post } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('import');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped_duplicates: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await post(`/api/leads/import/csv?source=${encodeURIComponent(source)}`, formData);
      setResult(res.data);
      toast.success(`Import complete: ${res.data.created} contacts added`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'phone,name,email,message,tag\n+919876543210,Rahul Sharma,rahul@example.com,Interested in demo,hot\n+918765432109,Priya Singh,,Follow up needed,warm';
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">Upload a CSV to bulk-import leads into your pipeline. Duplicates (same phone) are skipped.</p>
        </div>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <Card hoverable={false} className="border-gray-200">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Upload CSV File</h2>

          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition ${file ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'}`}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className={`h-10 w-10 ${file ? 'text-primary-500' : 'text-gray-300'}`} />
            {file ? (
              <div className="text-center">
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-semibold text-gray-600">Click to select CSV</p>
                <p className="text-xs text-gray-400">or drag and drop · Max 5MB · 1,000 contacts</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
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
            <Button onClick={handleImport} loading={uploading} disabled={!file}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </Card>

        {/* Instructions card */}
        <Card hoverable={false} className="border-gray-200">
          <h2 className="mb-4 text-lg font-bold text-gray-900">CSV Format</h2>
          <div className="rounded-xl bg-gray-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto mb-4">
            <p>phone,name,email,message,tag</p>
            <p>+919876543210,Rahul Sharma,r@ex.com,Demo req,hot</p>
            <p>+918765432109,Priya Singh,,,warm</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><strong>phone</strong> — required, with country code (+91...)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" /><strong>name</strong> — optional</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" /><strong>email</strong> — optional</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" /><strong>message</strong> — optional note</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" /><strong>tag</strong> — optional label (hot/warm/cold)</li>
          </ul>
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
            Contacts with existing phone numbers are skipped (no duplicates).
          </p>
        </Card>
      </div>

      {/* Result */}
      {result && (
        <Card hoverable={false} className={`border-2 ${result.created > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">Import Complete</p>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-emerald-700">{result.created} contacts added</span>
                {result.skipped_duplicates > 0 && <span className="ml-2 text-gray-500">· {result.skipped_duplicates} duplicates skipped</span>}
              </p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <p className="font-bold mb-1">Row errors ({result.errors.length}):</p>
              {result.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
