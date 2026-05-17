'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          zIndex: 9999,
        }}
        toastOptions={{
          className: 'rounded-lg border border-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl',
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#f8fafc',
          },
          success: {
            duration: 4000,
            style: {
              borderLeft: '4px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#020617',
            },
          },
          error: {
            duration: 4000,
            style: {
              borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#020617',
            },
          },
          loading: {
            iconTheme: {
              primary: '#f97316',
              secondary: '#020617',
            },
            style: {
              borderLeft: '4px solid #f97316',
            },
          },
        }}
      />
    </>
  );
};
