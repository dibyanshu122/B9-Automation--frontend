'use client';

import { motion } from 'framer-motion';

export const CardSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.72, 1, 0.72] }}
    transition={{ duration: 1.6, repeat: Infinity }}
    className="b9-neon-skeleton h-48 rounded-lg"
  />
);

export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        className={`b9-neon-skeleton h-4 rounded ${
          i === lines - 1 ? 'w-2/3' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        className="b9-neon-skeleton h-12 rounded"
      />
    ))}
  </div>
);

export const GridSkeleton = ({ cols = 3, items = 6 }: { cols?: number; items?: number }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
    {Array.from({ length: items }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        className="b9-neon-skeleton h-64 rounded-lg"
      />
    ))}
  </div>
);

export const AvatarSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="b9-neon-skeleton h-10 w-10 rounded-full"
  />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <CardSkeleton />
    <CardSkeleton />
  </div>
);
