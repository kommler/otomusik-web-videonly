'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '../ui/loading';

/**
 * HOC pour créer un composant avec lazy loading
 * Utilisation:
 * const LazyComponent = withLazyLoading(() => import('./HeavyComponent'));
 */
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner size="md" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Wrapper Suspense pour composants déjà lazy
 */
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner size="md" />}>
      {children}
    </Suspense>
  );
}

/**
 * Fallback minimal pour les modales
 */
export function ModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

/**
 * Fallback pour les panneaux de filtres
 */
export function FilterPanelFallback() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-full mb-4"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      </div>
    </div>
  );
}

/**
 * Fallback pour les tables
 */
export function TableFallback({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default withLazyLoading;
