'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/** Marketing site theme toggle — dark is the default brand identity,
 *  "Aurora Light" is the opt-in. Dashboard theme is separate. */
export function MarketingThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.classList.contains('mk-light'));
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('mk-light', next);
    try { localStorage.setItem('marketing-theme', next ? 'light' : 'dark'); } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={light ? 'Switch to dark' : 'Switch to light'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
        light
          ? 'border-slate-300 bg-white text-amber-500 hover:border-violet-300'
          : 'border-white/15 bg-white/[0.06] text-[#7BFFF8] hover:bg-white/[0.12]'
      }`}
    >
      {light ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
