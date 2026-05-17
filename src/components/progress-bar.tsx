import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: 'primary' | 'green' | 'red' | 'blue';
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar = ({
  value,
  max = 100,
  showLabel = true,
  color = 'primary',
  animated = true,
  size = 'md',
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={clsx(
            colors[color],
            'transition-all duration-300 ease-out',
            animated && 'origin-left'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-600">{Math.round(percentage)}% Complete</p>
          <p className="text-xs text-gray-500">{value} of {max}</p>
        </div>
      )}
    </div>
  );
};