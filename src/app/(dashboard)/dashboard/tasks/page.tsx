'use client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useApi } from '@/hooks/useApi';
import { CalendarDays, CheckCircle2, CheckSquare, Clock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface BusinessTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_at?: string;
  created_at: string;
}

const blankTask = {
  title: '',
  description: '',
  priority: 'medium',
  due_at: '',
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function TasksPage() {
  const { get, post, put, delete: deleteReq } = useApi();
  const [tasks, setTasks] = useState<BusinessTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [form, setForm] = useState(blankTask);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await get('/api/tasks');
      setTasks(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const response = await post('/api/tasks', {
        ...form,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      });
      setTasks([response.data, ...tasks]);
      setForm(blankTask);
      toast.success('Task created');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (task: BusinessTask, status: string) => {
    try {
      const response = await put(`/api/tasks/${task.id}`, { status });
      setTasks((items) => items.map((item) => (item.id === task.id ? response.data : item)));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteReq(`/api/tasks/${taskId}`);
      setTasks((items) => items.filter((item) => item.id !== taskId));
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-5 w-5 text-amber-600" />;
    return <CheckSquare className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-950">Tasks</h1>
        <p className="mt-2 text-gray-600">Business follow-ups, calls, demos, and automation-created tasks.</p>
      </div>

      <Card className="border-orange-100 shadow-sm" hoverable={false}>
        <form onSubmit={createTask} className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_180px_auto]">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
            placeholder="Call Rahul for demo class"
            required
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field"
            placeholder="Notes"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="relative flex items-center">
            <input
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              className="input-field pr-9"
              id="task-due-date"
            />
            <label htmlFor="task-due-date" className="absolute right-2.5 cursor-pointer text-gray-400 hover:text-indigo-500 transition-colors">
              <CalendarDays className="h-4 w-4" />
            </label>
          </div>
          <Button type="submit" variant="primary" disabled={creating} className="justify-center">
            <Plus className="h-4 w-4" />
            {creating ? 'Adding...' : 'Add'}
          </Button>
        </form>
      </Card>

      {tasks.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          <button
            type="button"
            onClick={() => setSortByPriority((p) => !p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${sortByPriority ? 'bg-orange-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {sortByPriority ? '⬆ Sorted by priority' : 'Sort by priority'}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card>Loading tasks...</Card>
        ) : tasks.length === 0 ? (
          <Card className="text-center">
            <CheckSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-900">No tasks yet</p>
            <p className="mt-1 text-sm text-gray-500">Create a manual task or ask Automation Mode to create one.</p>
          </Card>
        ) : (
          [...tasks]
            .sort(sortByPriority
              ? (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
              : () => 0
            )
            .map((task) => (
            <Card key={task.id} className="border-orange-100 shadow-sm" hoverable={false}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusIcon(task.status)}
                    <h2 className="font-bold text-gray-950">{task.title}</h2>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{task.status === 'in_progress' ? 'Doing' : task.status}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.priority === 'high' ? 'bg-red-50 text-red-600' : task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>{task.priority}</span>
                  </div>
                  {task.description && <p className="mt-2 text-sm text-gray-600">{task.description}</p>}
                  <p className="mt-2 text-xs text-gray-500">
                    {task.due_at ? `Due ${new Date(task.due_at).toLocaleString()}` : `Created ${new Date(task.created_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={task.status === 'pending' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatus(task, 'pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={task.status === 'in_progress' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatus(task, 'in_progress')}
                  >
                    Doing
                  </Button>
                  <Button
                    variant={task.status === 'completed' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatus(task, 'completed')}
                  >
                    Done
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
