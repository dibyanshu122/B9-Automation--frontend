import React from 'react';
import Link from 'next/link';
import { Button } from './button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  compact?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) => {
  const ActionBtn = action ? (
    action.href ? (
      <Link href={action.href}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition">
        {action.label}
      </Link>
    ) : (
      <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
    )
  ) : null;

  const SecBtn = secondaryAction ? (
    secondaryAction.href ? (
      <Link href={secondaryAction.href}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
        {secondaryAction.label}
      </Link>
    ) : (
      <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
    )
  ) : null;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shadow-sm text-gray-400 dark:text-slate-500">
        {icon}
      </div>
      <h3 className={`font-bold text-gray-900 dark:text-slate-100 ${compact ? 'text-base mb-1' : 'text-lg mb-2'}`}>{title}</h3>
      <p className={`text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed ${compact ? 'text-xs mb-4' : 'text-sm mb-6'}`}>{description}</p>
      {(ActionBtn || SecBtn) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ActionBtn}
          {SecBtn}
        </div>
      )}
    </div>
  );
};