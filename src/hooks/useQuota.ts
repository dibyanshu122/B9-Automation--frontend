import { useEffect, useState } from 'react';
import { useApi } from './useApi';
import { useQuotaStore } from '@/store/quotaStore';
import toast from 'react-hot-toast';

let quotaRequest: Promise<any> | null = null;
let quotaErrorShown = false;

export interface QuotaData {
  plan: string;
  queries_used: number;
  queries_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  uploads_used: number;
  uploads_limit: number;
  assistants_created: number;
  assistants_limit: number;
  automation_executions_used?: number;
  automation_executions_limit?: number;
  leads_today?: number;
  leads_limit?: number;
  usage?: any;
  days_remaining: number;
}

export const useQuota = () => {
  const [loading, setLoading] = useState(true);
  const { quota, setQuota, getQuotaPercentage } = useQuotaStore();
  const { get } = useApi();

  useEffect(() => {
    fetchQuota();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuota = async () => {
    try {
      quotaRequest = quotaRequest || get('/api/quota/status');
      const response = await quotaRequest;
      setQuota(response.data);
      quotaErrorShown = false;
    } catch (error) {
      console.error('Failed to fetch quota', error);
      // Show toast only once per session to avoid spam on every page navigation
      if (!quotaErrorShown) {
        quotaErrorShown = true;
        toast.error('Could not load plan usage. Will retry automatically.', { duration: 3000 });
      }
    } finally {
      quotaRequest = null;
      setLoading(false);
    }
  };

  const checkLimit = (type: 'queries' | 'storage' | 'uploads' | 'assistants'): boolean => {
    if (!quota) return false;
    const used = quota[`${type}_used`];
    const limit = quota[`${type}_limit`];
    return used >= limit;
  };

  const getRemainingQuota = (type: string): number => {
    if (!quota) return 0;
    const limit = quota[`${type}_limit`] || 0;
    const used = quota[`${type}_used`] || 0;
    return Math.max(0, limit - used);
  };

  const isExpired = quota ? (quota.days_remaining !== null && quota.days_remaining !== undefined && quota.days_remaining <= 0 && quota.plan !== 'FREE') : false;

  return {
    quota: quota as QuotaData,
    loading,
    isExpired,
    getQuotaPercentage,
    checkLimit,
    getRemainingQuota,
    refetch: fetchQuota,
  };
};
