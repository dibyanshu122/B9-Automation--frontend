import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  token: string | null;
  hasHydrated: boolean;
  setUser: (user: any) => void;
  setToken: (token: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
}

const setAuthCookie = (token: string | null) => {
  if (typeof document === 'undefined') return;

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  if (!token) {
    document.cookie = `auth-token=; Max-Age=0; path=/; SameSite=Lax${secureFlag}`;
    return;
  }

  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `auth-token=${encodeURIComponent(token)}; Max-Age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        setAuthCookie(token);
        set({ token });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => {
        setAuthCookie(null);
        set({ user: null, token: null });
        // Clear in-memory chat so next user can't see previous session's messages
        import('../store/chatStore').then(({ useChatStore }) => useChatStore.getState().clearChat()).catch(() => {});
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        setAuthCookie(state?.token || null);
        state?.setHasHydrated(true);
      },
    }
  )
);
