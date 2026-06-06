'use client';

import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <button
      onClick={toggleDarkMode}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex h-7 w-14 items-center rounded-full border border-white/10 bg-white/10 p-0.5 transition-all duration-300 hover:bg-white/20 focus:outline-none"
      aria-label="Toggle dark mode"
    >
      {/* Track fill */}
      <span
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          darkMode ? 'bg-indigo-600/70' : 'bg-amber-400/70'
        }`}
      />
      {/* Thumb */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
          darkMode ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {darkMode ? (
          <Moon className="h-3.5 w-3.5 text-indigo-600" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};