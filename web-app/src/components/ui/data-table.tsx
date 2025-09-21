import React, { useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { VideoSchema } from '@/types/api';
import { Button } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
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

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
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
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = 
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <FunnelIcon className="h-4 w-4 text-gray-400" />;
    }
    
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-blue-500" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-blue-500" />
    );
  };

  const getValue = (row: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      // Handle nested properties like 'user.name'
      return key.split('.').reduce((obj, prop) => obj?.[prop], row);
    }
    return row[key as keyof T];
  };

  // Add actions column if needed
  const allColumns = useMemo(() => {
    const cols = [...columns];
    if (showActions && (onView || onEdit || onDelete)) {
      cols.push({
        key: 'actions',
        title: 'Actions',
        width: '120px',
        sortable: false,
        render: (_, row: T) => (
          <div className="flex items-center space-x-2">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  console.log('DataTable: View button clicked', row);
                  e.stopPropagation();
                  onView(row);
                }}
                className="h-8 w-8"
              >
                <EyeIcon className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  console.log('DataTable: Edit button clicked', row);
                  e.stopPropagation();
                  onEdit(row);
                }}
                className="h-8 w-8"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  console.log('DataTable: Delete button clicked', row);
                  e.stopPropagation();
                  onDelete(row);
                }}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        ),
      } as Column<T>);
    }
    return cols;
  }, [columns, showActions, onView, onEdit, onDelete]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <div className="bg-gray-50 px-6 py-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={cn("shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", className)}>
        <div className={cn(
          "overflow-x-auto",
          className?.includes('overflow-hidden') && "overflow-hidden"
        )}>
          <table className={cn(
            "min-w-full divide-y divide-gray-300 dark:divide-gray-700",
            className?.includes('overflow-hidden') && "w-full table-fixed"
          )}>
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {allColumns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={cn(
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400",
                  column.sortable && "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {column.sortable && renderSortIcon(String(column.key))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={allColumns.length}
                className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {allColumns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render
                      ? column.render(getValue(row, column.key), row, index)
                      : getValue(row, column.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}