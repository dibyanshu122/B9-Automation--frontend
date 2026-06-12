'use client';

import React from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  id?: string;
}

export const Card = ({
  children,
  className,
  onClick,
  hoverable = true,
  id,
}: CardProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      whileHover={!reduceMotion && hoverable ? { y: -3 } : undefined}
      className={clsx(
        'relative rounded-xl border border-slate-200 bg-white/70 p-6 backdrop-blur-[12px]',
        'shadow-[0_10px_15px_-3px_rgba(15,23,42,0.03),0_4px_6px_-4px_rgba(15,23,42,0.03)]',
        'dark:border-[#374151] dark:bg-[#111827]/95',
        hoverable && 'hover:border-slate-300 hover:shadow-[0_14px_20px_-3px_rgba(15,23,42,0.06)] dark:hover:border-slate-600 dark:hover:shadow-slate-900/60',
        'transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
