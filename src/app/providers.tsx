'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // 60s before refetch
      gcTime: 5 * 60_000,     // 5 min in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false,  // don't refetch on tab switch
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}