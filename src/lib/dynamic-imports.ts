import dynamic from 'next/dynamic';
import { createElement } from 'react';

const LoadingBlock = () =>
  createElement('div', {
    className: 'h-64 bg-gray-100 rounded animate-pulse',
  });

/**
 * Lazy load components for better performance
 */
export const DynamicChart = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    loading: LoadingBlock,
    ssr: false,
  }
);

export const DynamicModal = dynamic(
  () => import('@/components/modal').then((mod) => mod.Modal),
  {
    loading: () => null,
  }
);
