import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

let apiClient: AxiosInstance | null = null;

// Deduplicate noisy toasts — same message shown at most once per cooldown window
const _shownToasts: Map<string, number> = new Map();
function _dedupeToast(msg: string, durationMs = 5000, cooldownMs = 10000) {
  const now = Date.now();
  const last = _shownToasts.get(msg) ?? 0;
  if (now - last < cooldownMs) return;
  _shownToasts.set(msg, now);
  toast.error(msg, { duration: durationMs });
}

// Suppress unhandled-rejection crashes in dev caused by network/timeout errors
// that bubbled from fire-and-forget calls. These are always shown via toast.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason;
    const isNetworkOrTimeout =
      err?.code === 'ECONNABORTED' ||
      err?.code === 'ERR_NETWORK' ||
      err?.message === 'Network Error' ||
      err?.message?.includes('timeout');
    if (isNetworkOrTimeout) {
      event.preventDefault(); // stop Next.js dev overlay from appearing
    }
  });
}

export const getApiClient = (): AxiosInstance => {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: 90000, // 90s — Railway cold-starts can take 60-70s on first request
    headers: { 'Content-Type': 'application/json' },
  });

  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      if (status === 401) {
        const currentToken = useAuthStore.getState().token;
        if (currentToken) {
          // Only logout if the JWT is actually expired — not on every 401
          // (backend cold-starts, endpoint-specific 401s should not log users out)
          let tokenExpired = false;
          try {
            const payload = JSON.parse(atob(currentToken.split('.')[1]));
            tokenExpired = payload.exp && payload.exp * 1000 < Date.now();
          } catch { tokenExpired = false; }

          if (tokenExpired) {
            useAuthStore.getState().logout();
            _dedupeToast('Session expired. Please login again.', 5000, 30000);
            if (typeof window !== 'undefined') {
              setTimeout(() => { window.location.href = '/login'; }, 1000);
            }
          }
          // Non-expired token + 401 = endpoint permission issue, not session expiry — don't logout
        }
      } else if (status === 402) {
        const detail = error.response?.data?.detail;
        const msg = typeof detail === 'string' ? detail : detail?.message || 'Plan limit reached. Please upgrade.';
        _dedupeToast(msg, 6000, 10000);
      } else if (status === 403) {
        _dedupeToast('You do not have permission to perform this action.', 4000, 10000);
      } else if (status === 429) {
        _dedupeToast('Too many requests. Please wait a moment and try again.', 4000, 10000);
      } else if (!status) {
        // Timeout (ECONNABORTED) or no network — show once per 15s max
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const msg = isTimeout
          ? 'Server is taking too long to respond. Please wait…'
          : 'Server unreachable. Check your connection.';
        _dedupeToast(msg, 4000, 15000);
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Extended get/post with optional timeout override for heavy operations
interface ApiOptions {
  timeout?: number; // ms — override per-request
}

export const useApi = () => {
  return useMemo(
    () => ({
      get: (url: string, options?: ApiOptions) => {
        const cfg: AxiosRequestConfig = options?.timeout ? { timeout: options.timeout } : {};
        return getApiClient().get(url, cfg);
      },
      post: (url: string, data: any, options?: ApiOptions) => {
        const cfg: AxiosRequestConfig = {
          ...(data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
          ...(options?.timeout ? { timeout: options.timeout } : {}),
        };
        return getApiClient().post(url, data, cfg);
      },
      put: (url: string, data: any, options?: ApiOptions) =>
        getApiClient().put(url, data, options?.timeout ? { timeout: options.timeout } : {}),
      patch: (url: string, data: any, options?: ApiOptions) =>
        getApiClient().patch(url, data, options?.timeout ? { timeout: options.timeout } : {}),
      delete: (url: string) => getApiClient().delete(url),
    }),
    []
  );
};
