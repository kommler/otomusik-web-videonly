'use client';

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './button';

// ============================================================================
// Types
// ============================================================================

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  minWidth?: number;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  height?: number;
  rowHeight?: number;
  overscan?: number;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T, index: number) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  showActions?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Table virtualisée pour les grandes listes
 * Utilise le scroll natif avec rendu conditionnel des lignes
 */
export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  height = 600,
  rowHeight = 48,
  overscan = 5,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  emptyMessage = 'No data available',
  className,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(data.length - 1, start + visibleCount + overscan * 2);
    
    return {
      startIndex: start,
      endIndex: end,
      totalHeight: data.length * rowHeight,
    };
  }, [scrollTop, containerHeight, rowHeight, data.length, overscan]);

  // Add actions column if needed
  const allColumns = useMemo(() => {
    const cols = [...columns];
    if (showActions && (onView || onEdit || onDelete)) {
      cols.push({
        key: 'actions',
        title: 'Actions',
        width: '120px',
        minWidth: 120,
        sortable: false,
        render: (_, row: T) => (
          <div className="flex items-center space-x-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(row);
                }}
                className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                title="View"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                className="h-7 w-7 hover:bg-yellow-50 hover:text-yellow-600"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row);
                }}
                className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      } as Column<T>);
    }
    return cols;
  }, [columns, showActions, onView, onEdit, onDelete]);

  const handleSort = useCallback((key: string) => {
    if (!onSort) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  }, [onSort, sortKey, sortDirection]);

  const renderSortIcon = useCallback((columnKey: string, sortable?: boolean) => {
    if (!sortable) return null;
    if (sortKey !== columnKey) {
      return <FunnelIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-500" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-500" />;
  }, [sortKey, sortDirection]);

  const getValue = useCallback((row: T, key: keyof T | string): unknown => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: Record<string, unknown>, prop) => 
        (obj as Record<string, unknown>)?.[prop] as Record<string, unknown>, row as Record<string, unknown>);
    }
    return row[key as keyof T];
  }, []);

  // Visible rows
  const visibleRows = useMemo(() => {
    return data.slice(startIndex, endIndex + 1).map((row, i) => ({
      row,
      index: startIndex + i,
    }));
  }, [data, startIndex, endIndex]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700",
        "flex items-center justify-center py-12",
        className
      )}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {allColumns.map((column) => (
          <div
            key={String(column.key)}
            className={cn(
              "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
              column.sortable && "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            style={{ 
              width: column.width || 'auto',
              minWidth: column.minWidth || 100,
              flex: column.width ? 'none' : 1,
            }}
            onClick={() => column.sortable && handleSort(String(column.key))}
          >
            <div className="flex items-center space-x-1">
              <span>{column.title}</span>
              {renderSortIcon(String(column.key), column.sortable)}
            </div>
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div
        ref={containerRef}
        className="overflow-auto bg-white dark:bg-gray-900"
        style={{ height: Math.min(height, totalHeight + 20) }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map(({ row, index }) => (
            <div
              key={index}
              className={cn(
                "flex items-center border-b border-gray-200 dark:border-gray-700 absolute w-full",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                onRowClick && "cursor-pointer"
              )}
              style={{
                height: rowHeight,
                top: index * rowHeight,
              }}
              onClick={() => onRowClick?.(row, index)}
            >
              {allColumns.map((column) => (
                <div
                  key={String(column.key)}
                  className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 truncate"
                  style={{ 
                    width: column.width || 'auto',
                    minWidth: column.minWidth || 100,
                    flex: column.width ? 'none' : 1,
                  }}
                >
                  {column.render
                    ? column.render(getValue(row, column.key), row, index)
                    : String(getValue(row, column.key) ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
        {data.length} élément{data.length > 1 ? 's' : ''} • Affichage {startIndex + 1}-{Math.min(endIndex + 1, data.length)}
      </div>
    </div>
  );
}

export default VirtualizedTable;
