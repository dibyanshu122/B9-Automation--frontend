import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'b9-magnetic font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 hover:shadow-cyan-500/30 disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none',
    secondary: 'border border-gray-200 bg-gray-100 text-gray-900 shadow-sm hover:-translate-y-0.5 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-950 disabled:text-gray-400',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 hover:bg-red-600 disabled:bg-red-900 disabled:text-red-200',
    outline: 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};
