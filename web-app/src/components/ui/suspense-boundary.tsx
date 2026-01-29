'use client';

import React, { Suspense, ReactNode, ComponentType } from 'react';
import { TableSkeleton, FilterSkeleton, PageSkeleton } from './skeletons';

// ============================================================================
// Suspense Boundary Components
// ============================================================================

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper for table content with Suspense
 */
export function TableSuspense({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <TableSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Wrapper for filter panel with Suspense
 */
export function FilterSuspense({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <FilterSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Wrapper for full page content with Suspense
 */
export function PageSuspense({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      
      return this.props.fallback ?? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Combined Suspense + Error Boundary
// ============================================================================

interface AsyncBoundaryProps extends SuspenseWrapperProps {
  errorFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

/**
 * Combined Suspense + Error Boundary for async components
 */
export function AsyncBoundary({ 
  children, 
  fallback, 
  errorFallback 
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback ?? <PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// HOC for wrapping components with Suspense
// ============================================================================

interface WithSuspenseOptions<P> {
  fallback?: ReactNode | ComponentType<Partial<P>>;
  displayName?: string;
}

/**
 * HOC to wrap a component with Suspense boundary
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  options: WithSuspenseOptions<P> = {}
) {
  const { fallback, displayName } = options;
  
  function WrappedComponent(props: P) {
    const fallbackElement = typeof fallback === 'function' 
      ? React.createElement(fallback, props as Partial<P>)
      : fallback ?? <PageSkeleton />;

    return (
      <Suspense fallback={fallbackElement}>
        <Component {...props} />
      </Suspense>
    );
  }

  WrappedComponent.displayName = displayName ?? `withSuspense(${Component.displayName ?? Component.name})`;
  
  return WrappedComponent;
}
