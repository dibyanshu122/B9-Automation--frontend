'use client';

import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <button
      onClick={toggleDarkMode}
      role="switch"
      aria-checked={darkMode}
      aria-label="Toggle dark mode"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative h-7 w-[52px] shrink-0 rounded-full border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
        darkMode
          ? 'border-indigo-400/30 bg-slate-800'
          : 'border-white/15 bg-white/10 hover:bg-white/15'
      }`}
    >
      {/* Tiny stars — only visible in dark mode */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-2.5 top-2 h-[3px] w-[3px] rounded-full bg-indigo-300 transition-opacity duration-300 ${darkMode ? 'opacity-80' : 'opacity-0'}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute left-5 top-4 h-[2px] w-[2px] rounded-full bg-indigo-200 transition-opacity duration-300 ${darkMode ? 'opacity-60' : 'opacity-0'}`}
      />

      {/* Thumb */}
      <span
        className={`absolute left-0 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          darkMode
            ? 'translate-x-[27px] bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-900/50'
            : 'translate-x-[3px] bg-gradient-to-br from-amber-300 to-amber-500 shadow-amber-900/30'
        }`}
      >
        {darkMode ? (
          <Moon className="h-3 w-3 text-white" strokeWidth={2.5} />
        ) : (
          <Sun className="h-3 w-3 text-white" strokeWidth={2.5} />
        )}
      </span>
    </button>
  );
};
