'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Base Skeleton
// ============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
}

// ============================================================================
// Table Skeleton
// ============================================================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showPagination?: boolean;
}

export function TableSkeleton({
  rows = 10,
  columns = 6,
  showHeader = true,
  showPagination = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Table Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Table Header Row */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn('h-4', i === 0 ? 'w-40' : 'w-24')}
              />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 last:border-b-0"
          >
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    'h-4',
                    colIndex === 0 ? 'w-48' : colIndex === 1 ? 'w-32' : 'w-20'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Panel Skeleton
// ============================================================================

interface FilterSkeletonProps {
  filters?: number;
}

export function FilterSkeleton({ filters = 4 }: FilterSkeletonProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: filters }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Stats Cards Skeleton
// ============================================================================

interface StatsSkeletonProps {
  cards?: number;
}

export function StatsSkeleton({ cards = 4 }: StatsSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Page Skeleton (Full page loading state)
// ============================================================================

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton cards={4} />
      <FilterSkeleton filters={4} />
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}

// ============================================================================
// Card Skeleton
// ============================================================================

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// ============================================================================
// List Skeleton
// ============================================================================

interface ListSkeletonProps {
  items?: number;
}

export function ListSkeleton({ items = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
