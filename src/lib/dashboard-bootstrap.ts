import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

type DashboardBootstrap = {
  stats?: Record<string, any>;
  onboarding?: Record<string, any>;
  readiness?: Record<string, any>;
  team?: Record<string, any>;
};

let cached: { token: string; expiresAt: number; data: DashboardBootstrap } | null = null;
let pending: Promise<DashboardBootstrap> | null = null;

export async function getDashboardBootstrap(force = false): Promise<DashboardBootstrap> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Authentication required');
  if (!force && cached?.token === token && cached.expiresAt > Date.now()) return cached.data;
  if (!force && pending) return pending;

  pending = fetch(`${API_BASE_URL}/api/automation/dashboard-bootstrap`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Dashboard bootstrap failed: ${response.status}`);
    const data = await response.json();
    cached = { token, data, expiresAt: Date.now() + 120_000 }; // 2 min cache — reduces repeat loads
    return data;
  }).finally(() => {
    pending = null;
  });
  return pending;
}
