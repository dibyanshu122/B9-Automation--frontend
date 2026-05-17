'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              We encountered an unexpected error. Please try refreshing the page or
              contact our support team if the problem persists.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              size="lg"
            >
              Refresh Page
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}