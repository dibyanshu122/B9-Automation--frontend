import { create } from 'zustand';

interface QuotaState {
  quota: any | null;
  setQuota: (quota: any) => void;
  getQuotaPercentage: (type: string) => number;
}

export const useQuotaStore = create<QuotaState>((set, get) => ({
  quota: null,
  setQuota: (quota) => set({ quota }),
  getQuotaPercentage: (type: string) => {
    const state = get();
    if (!state.quota) return 0;
    
    const used = state.quota[`${type}_used`] || 0;
    const limit = state.quota[`${type}_limit`] || 1;
    return Math.round((used / limit) * 100);
  },
}));