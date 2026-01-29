import React, { useMemo, useCallback, ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, GlobeAltIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { DataTable, Tooltip, StatusBadge } from '../ui';

// ============================================================================
// Types
// ============================================================================

export interface BaseEntity {
  id?: number | null;
  status?: string | null;
  inserted_at?: string | null;
  updated_at?: string | null;
  downloaded_at?: string | null;
  url?: string | null;
}

export interface ColumnDef<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

export interface BaseTableProps<T extends BaseEntity> {
  data: T[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  onStatusDoubleClick?: (item: T) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

// ============================================================================
// Common Column Factories
// ============================================================================

/**
 * Creates a standard ID column
 */
export function createIdColumn<T extends BaseEntity>(): ColumnDef<T> {
  return {
    key: 'id',
    title: 'ID',
    sortable: true,
    width: '60px',
    render: (id: unknown) => (
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
        {(id as number) || '-'}
      </span>
    ),
  };
}

/**
 * Creates a status column with StatusBadge
 */
export function createStatusColumn<T extends BaseEntity>(
  onStatusDoubleClick?: (item: T) => void
): ColumnDef<T> {
  return {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: '100px',
    render: (status: unknown, item: T) => (
      <StatusBadge
        status={(status as string) || 'UNKNOWN'}
        onDoubleClick={() => onStatusDoubleClick?.(item)}
      />
    ),
  };
}

/**
 * Creates a date column with relative time display
 */
export function createDateColumn<T extends BaseEntity>(
  key: keyof T,
  title: string,
  options?: { showIcon?: boolean; width?: string }
): ColumnDef<T> {
  const { showIcon = true, width = '120px' } = options || {};
  
  return {
    key: key as string,
    title,
    sortable: true,
    width,
    render: (value: unknown) => {
      const dateStr = value as string | null;
      const content = (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {dateStr
            ? formatDistanceToNow(new Date(dateStr), { addSuffix: true })
            : '-'}
        </span>
      );

      if (showIcon && dateStr) {
        return (
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            {content}
          </div>
        );
      }
      return content;
    },
  };
}

/**
 * Creates a URL column with external link
 */
export function createUrlColumn<T extends BaseEntity>(
  key: keyof T = 'url' as keyof T,
  title = 'URL'
): ColumnDef<T> {
  return {
    key: key as string,
    title,
    sortable: false,
    width: '80px',
    render: (url: unknown) => {
      const urlStr = url as string | null;
      return urlStr ? (
        <a
          href={urlStr}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <GlobeAltIcon className="h-4 w-4" />
        </a>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  };
}

/**
 * Creates a count column with icon
 */
export function createCountColumn<T extends BaseEntity>(
  key: keyof T,
  title: string,
  options?: { icon?: ReactNode; width?: string }
): ColumnDef<T> {
  const { icon, width = '90px' } = options || {};
  const IconComponent = icon || <ChartBarIcon className="h-4 w-4 text-gray-400" />;

  return {
    key: key as string,
    title,
    sortable: true,
    width,
    render: (value: unknown) => (
      <div className="flex items-center space-x-1">
        {IconComponent}
        <span className="text-sm text-gray-900 dark:text-white">
          {(value as number) ?? 0}
        </span>
      </div>
    ),
  };
}

/**
 * Creates a text column with optional tooltip
 */
export function createTextColumn<T extends BaseEntity>(
  key: keyof T,
  title: string,
  options?: { width?: string; truncate?: boolean; maxLength?: number }
): ColumnDef<T> {
  const { width = '150px', truncate = true, maxLength = 50 } = options || {};

  return {
    key: key as string,
    title,
    sortable: true,
    width,
    render: (value: unknown) => {
      const text = (value as string) || '-';
      const shouldTruncate = truncate && text.length > maxLength;
      
      const content = (
        <span className="text-sm text-gray-900 dark:text-white">
          {shouldTruncate ? `${text.substring(0, maxLength)}...` : text}
        </span>
      );

      if (shouldTruncate) {
        return <Tooltip content={text}>{content}</Tooltip>;
      }
      return content;
    },
  };
}

/**
 * Creates a number column with optional formatting
 */
export function createNumberColumn<T extends BaseEntity>(
  key: keyof T,
  title: string,
  options?: { width?: string; formatter?: (n: number) => string }
): ColumnDef<T> {
  const { width = '80px', formatter } = options || {};

  const defaultFormatter = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return {
    key: key as string,
    title,
    sortable: true,
    width,
    render: (value: unknown) => {
      const num = value as number | null;
      return (
        <span className="text-sm text-gray-900 dark:text-white">
          {num != null ? (formatter || defaultFormatter)(num) : '-'}
        </span>
      );
    },
  };
}

// ============================================================================
// BaseTable Component
// ============================================================================

export interface CreateTableOptions<T extends BaseEntity> {
  /** Custom columns to add between standard ones */
  columns: ColumnDef<T>[];
  /** Include standard ID column at start */
  includeId?: boolean;
  /** Include standard status column */
  includeStatus?: boolean;
  /** Include inserted_at column */
  includeCreatedAt?: boolean;
  /** Include updated_at column */
  includeUpdatedAt?: boolean;
  /** Include downloaded_at column */
  includeDownloadedAt?: boolean;
  /** Include URL column */
  includeUrl?: boolean;
  /** Default empty message */
  emptyMessage?: string;
}

/**
 * Factory to create a typed table component
 */
export function createTableComponent<T extends BaseEntity>(
  options: CreateTableOptions<T>
) {
  const {
    columns: customColumns,
    includeId = true,
    includeStatus = true,
    includeCreatedAt = true,
    includeUpdatedAt = true,
    includeDownloadedAt = false,
    includeUrl = false,
    emptyMessage: defaultEmptyMessage = 'No data found',
  } = options;

  const TableComponent: React.FC<BaseTableProps<T>> = React.memo(({
    data,
    loading,
    onSort,
    sortKey,
    sortDirection,
    onView,
    onEdit,
    onDelete,
    onRowClick,
    onStatusDoubleClick,
    emptyMessage = defaultEmptyMessage,
    showActions,
  }) => {
    // Build columns dynamically
    const columns = useMemo(() => {
      const cols: ColumnDef<T>[] = [];

      if (includeId) {
        cols.push(createIdColumn<T>());
      }

      // Add custom columns
      cols.push(...customColumns);

      if (includeStatus) {
        cols.push(createStatusColumn<T>(onStatusDoubleClick));
      }

      if (includeUrl) {
        cols.push(createUrlColumn<T>());
      }

      if (includeCreatedAt) {
        cols.push(createDateColumn<T>('inserted_at' as keyof T, 'Created', { showIcon: true }));
      }

      if (includeUpdatedAt) {
        cols.push(createDateColumn<T>('updated_at' as keyof T, 'Updated', { showIcon: false }));
      }

      if (includeDownloadedAt) {
        cols.push(createDateColumn<T>('downloaded_at' as keyof T, 'Downloaded', { showIcon: false }));
      }

      return cols;
    }, [onStatusDoubleClick]);

    const handleRowClick = useCallback(
      (item: T) => onRowClick?.(item),
      [onRowClick]
    );

    return (
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onSort={onSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onRowClick={handleRowClick}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={showActions ?? !!(onView || onEdit || onDelete)}
        emptyMessage={emptyMessage}
      />
    );
  });

  TableComponent.displayName = 'BaseTableComponent';
  
  return TableComponent;
}

// ============================================================================
// Exports
// ============================================================================

export default createTableComponent;
