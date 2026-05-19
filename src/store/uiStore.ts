import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarPinned: boolean;
  darkMode: boolean;
  showMobileMenu: boolean;
  activeTab: string;
  notifications: number;
  openGroups: string[];

  setSidebarOpen: (open: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void;
  toggleSidebarPinned: () => void;
  setDarkMode: (dark: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setNotifications: (count: number) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  toggleGroup: (id: string) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarPinned: false,
      darkMode: false,
      showMobileMenu: false,
      activeTab: 'dashboard',
      notifications: 0,
      openGroups: [],

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarPinned: (pinned) => set({ sidebarPinned: pinned }),
      toggleSidebarPinned: () => set((state) => ({ sidebarPinned: !state.sidebarPinned })),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setShowMobileMenu: (show) => set({ showMobileMenu: show }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setNotifications: (count) => set({ notifications: count }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleGroup: (id) => set((state) => ({
        openGroups: state.openGroups.includes(id)
          ? state.openGroups.filter((g) => g !== id)
          : [...state.openGroups, id],
      })),

      reset: () => set({
        sidebarOpen: true,
        sidebarPinned: false,
        darkMode: false,
        showMobileMenu: false,
        activeTab: 'dashboard',
        notifications: 0,
        openGroups: [],
      }),
    }),
    { name: 'ui-store' }
  )
);
