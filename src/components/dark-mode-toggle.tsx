'use client';

import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from './button';

export const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </Button>
  );
};