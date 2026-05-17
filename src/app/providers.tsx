'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  );
}