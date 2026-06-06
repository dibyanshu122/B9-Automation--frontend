'use client';

import React from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = ({
  children,
  className,
  onClick,
  hoverable = true,
}: CardProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      whileHover={!reduceMotion && hoverable ? { y: -3 } : undefined}
      className={clsx(
        'relative rounded-xl border border-gray-200/80 bg-white/90 p-6 backdrop-blur-sm',
        'dark:border-slate-700 dark:bg-slate-800/90',
        hoverable && 'hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60 dark:hover:border-slate-600 dark:hover:shadow-slate-900/60',
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
