import React from 'react';
import { motion } from 'framer-motion';

export const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="b9-command-shell flex min-h-screen items-center justify-center">
      <div className="b9-glass b9-scanline flex flex-col items-center gap-6 rounded-2xl px-8 py-7">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-orange-200/20 border-t-primary-500 shadow-[0_0_28px_rgba(249,115,22,0.45)]"
        />
        <p className="b9-glitch font-medium text-slate-200" data-text={message}>{message}</p>
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} rounded-full border-white/20 border-t-primary-500 shadow-[0_0_18px_rgba(249,115,22,0.35)]`}
    />
  );
};

export const LoadingSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="b9-neon-skeleton h-12 rounded-lg"
        />
      ))}
    </div>
  );
};
