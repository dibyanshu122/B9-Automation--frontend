'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
  Download,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';

type RunStatus = 'completed' | 'failed' | 'waiting' | 'running' | 'cancelled';

interface AutomationRun {
  id: string;
  workflow_id: string | null;
  workspace_id: string | null;
  user_message: string | null;
  intent: string | null;
  status: RunStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  final_response: string | null;
  metadata: Record<string, unknown> | null;
}

interface AutomationTask {
  id: string;
  run_id: string;
  tool_slug: string;
  order_index: number;
  status: string;
  input_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { label: 'Failed', color: 'text-red-600 bg-red-50', icon: <XCircle className="w-3.5 h-3.5" /> },
  waiting: { label: 'Waiting', color: 'text-yellow-600 bg-yellow-50', icon: <Clock className="w-3.5 h-3.5" /> },
  running: { label: 'Running', color: 'text-blue-600 bg-blue-50', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-100', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: RunStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TaskRow({ task }: { task: AutomationTask }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-l-2 border-gray-200 pl-3 py-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left hover:text-gray-900 text-sm text-gray-600"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{task.tool_slug}</span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${task.status === 'completed' ? 'text-green-600 bg-green-50' : task.status === 'failed' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
          {task.status}
        </span>
        <span className="text-xs text-gray-400 ml-2">{formatDuration(task.started_at, task.completed_at)}</span>
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 text-xs">
          {task.error_message && (
            <div className="bg-red-50 border border-red-100 rounded p-2 text-red-700">{task.error_message}</div>
          )}
          {task.input_json && (
            <div>
              <span className="text-gray-400 uppercase tracking-wide text-[10px]">Input</span>
              <pre className="bg-gray-50 rounded p-2 overflow-x-auto text-gray-700 mt-0.5">{JSON.stringify(task.input_json, null, 2)}</pre>
            </div>
          )}
          {task.output_json && (
            <div>
              <span className="text-gray-400 uppercase tracking-wide text-[10px]">Output</span>
              <pre className="bg-gray-50 rounded p-2 overflow-x-auto text-gray-700 mt-0.5">{JSON.stringify(task.output_json, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunRow({ run, onRetry }: { run: AutomationRun; onRetry: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const { get } = useApi();

  const loadTasks = useCallback(async () => {
    if (tasks.length > 0) return;
    setLoadingTasks(true);
    try {
      const res = await get(`/api/automation/runs/${run.id}/tasks`);
      setTasks(res.data || []);
    } catch {
      // silently fail — tasks are optional detail
    } finally {
      setLoadingTasks(false);
    }
  }, [run.id, tasks.length, get]);

  const toggle = () => {
    setExpanded(!expanded);
    if (!expanded) loadTasks();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" /> : <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={run.status} />
            {run.intent && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{run.intent}</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{formatTime(run.started_at)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1 truncate">{run.user_message || run.id}</p>
          {run.error_message && (
            <p className="text-xs text-red-600 mt-0.5 truncate flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {run.error_message}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 text-xs text-gray-400 ml-2">
          <div>{formatDuration(run.started_at, run.completed_at)}</div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          {run.final_response && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Response</span>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{run.final_response}</p>
            </div>
          )}

          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Steps</span>
            <div className="mt-2 space-y-1">
              {loadingTasks && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading steps…
                </div>
              )}
              {!loadingTasks && tasks.length === 0 && (
                <p className="text-sm text-gray-400">No step detail available</p>
              )}
              {tasks.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          </div>

          {run.status === 'failed' && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={e => { e.stopPropagation(); onRetry(run.id); }}
                className="flex items-center gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Run
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'running', label: 'Running' },
];

export default function LogsPage() {
  const { get, post } = useApi();
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const LIMIT = 25;

  const loadRuns = useCallback(async (p: number, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(p * LIMIT) });
      if (status) params.set('status', status);
      const res = await get(`/api/automation/runs?${params}`);
      const totalCount = parseInt(res.headers?.['x-total-count'] || '0', 10);
      setTotal(totalCount);
      setHasMore(res.headers?.['x-has-more'] === 'true');
      setRuns(res.data || []);
    } catch {
      toast.error('Failed to load automation logs');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    loadRuns(page, statusFilter);
  }, [page, statusFilter, loadRuns]);

  const handleRetry = async (runId: string) => {
    try {
      await post(`/api/automation/runs/${runId}/retry`, {});
      toast.success('Run queued for retry');
      loadRuns(page, statusFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Retry failed');
    }
  };

  const filtered = runs.filter(r => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const textMatch = r.user_message?.toLowerCase().includes(q) || r.intent?.toLowerCase().includes(q) || r.error_message?.toLowerCase().includes(q);
      if (!textMatch) return false;
    }
    if (dateFrom && r.started_at) {
      if (new Date(r.started_at) < new Date(dateFrom)) return false;
    }
    if (dateTo && r.started_at) {
      if (new Date(r.started_at) > new Date(dateTo + 'T23:59:59Z')) return false;
    }
    return true;
  });

  const exportLogs = () => {
    const header = ['Run ID', 'Status', 'Trigger', 'Message', 'Intent', 'Started', 'Duration (ms)', 'Error'];
    const rows = filtered.map(r => [r.id, r.status, r.trigger_type || '', (r.user_message || '').replace(/"/g, '""'), r.intent || '', r.started_at || '', r.duration_ms || '', (r.error_message || '').replace(/"/g, '""')]);
    const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'automation_logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Logs</h1>
          <p className="text-sm text-gray-500 mt-1">View and debug automation run history</p>
        </div>
        <button onClick={exportLogs}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by message, intent, or error…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadRuns(page, statusFilter)}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400">Date range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-400 hover:text-red-600 font-medium">✕ Clear</button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} runs {filtered.length !== runs.length ? `(of ${runs.length})` : ''}</span>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No runs found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || statusFilter ? 'Try clearing your filters' : 'Automation runs will appear here once triggered'}
          </p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{total} total run{total !== 1 ? 's' : ''}</span>
            <span>Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)}</span>
          </div>

          <div className="space-y-2">
            {filtered.map(run => (
              <RunRow key={run.id} run={run} onRetry={handleRetry} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
