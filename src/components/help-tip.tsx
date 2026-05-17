'use client';

import { HelpCircle } from 'lucide-react';

interface HelpTipProps {
  text: string;
}

export function HelpTip({ text }: HelpTipProps) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="h-4 w-4 text-gray-400 transition-colors group-hover:text-primary-600" />
      <span className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium leading-5 text-gray-700 shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  );
}
