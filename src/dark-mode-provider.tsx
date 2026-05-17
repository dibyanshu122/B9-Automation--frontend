'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
  const { darkMode, setDarkMode } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check system preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('dark-mode');

    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else if (isDark) {
      setDarkMode(true);
    }
  }, [setDarkMode]);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('dark-mode', 'true');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('dark-mode', 'false');
    }
  }, [darkMode, mounted]);

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
};