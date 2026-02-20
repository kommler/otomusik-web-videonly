import React, { useMemo } from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';
import { ReleaseSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui';
import { cn, formatErrorMessage, formatRelativeDate } from '@/lib/utils';
import { getStatusColor } from '@/lib/status-utils';
import { ColumnDef } from './BaseTable';

// ============================================================================
// Local StatusBadge (with error handling specific to releases)
// ============================================================================

interface StatusBadgeProps {
  status?: string | null;
  errors?: unknown;
  release?: ReleaseSchema;
  onStatusChange?: (release: ReleaseSchema, newStatus: string) => void;
  onStatusDoubleClick?: (release: ReleaseSchema) => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  errors,
  release,
  onStatusDoubleClick,
}) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const hasErrors = Boolean(errors && typeof errors === 'object' && Object.keys(errors as object).length > 0);
  const errorMessage = formatErrorMessage(errors);
  const isFailed = status?.toLowerCase() === 'failed';
  const isDownloaded = status?.toLowerCase() === 'downloaded';
  const isWaiting = status?.toLowerCase() === 'waiting';
  const isClickable = (isFailed || isDownloaded || isWaiting) && release && onStatusDoubleClick;

  const handleDoubleClick = () => {
    if (isClickable && release) onStatusDoubleClick(release);
  };

  const getTooltipMessage = () => {
    if (!onStatusDoubleClick) return undefined;
    if (isFailed) return 'Double-cliquez pour passer le statut en PENDING';
    if (isDownloaded) return 'Double-cliquez pour passer le statut en WAITING';
    if (isWaiting) return 'Double-cliquez pour passer le statut en DOWNLOADED';
    return undefined;
  };

  return (
    <div className="flex items-center space-x-2">
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200',
          getStatusColor(status),
          isClickable ? 'cursor-pointer hover:shadow-md hover:scale-105 select-none' : ''
        )}
        onDoubleClick={handleDoubleClick}
        title={getTooltipMessage()}
      >
        {status}
      </span>
      {hasErrors && (
        <Tooltip
          content={errorMessage}
          position="top"
          className="flex items-center justify-center p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
        </Tooltip>
      )}
    </div>
  );
};

// ============================================================================
// Priority Badge
// ============================================================================

const PriorityBadge: React.FC<{ priority?: number | null }> = ({ priority }) => {
  if (priority === null || priority === undefined)
    return <span className="text-gray-400">-</span>;

  const getPriorityColor = (p: number) => {
    if (p >= 8) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (p >= 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    if (p >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getPriorityColor(priority)
      )}
    >
      {priority}
    </span>
  );
};

// ============================================================================
// Component Props
// ============================================================================

interface MusicReleaseTableProps {
  releases: ReleaseSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (release: ReleaseSchema) => void;
  onEdit?: (release: ReleaseSchema) => void;
  onDelete?: (release: ReleaseSchema) => void;
  onRowClick?: (release: ReleaseSchema) => void;
  onStatusChange?: (release: ReleaseSchema, newStatus: string) => void;
  onStatusDoubleClick?: (release: ReleaseSchema) => void;
}

// ============================================================================
// Table Component
// ============================================================================

export const MusicReleaseTable: React.FC<MusicReleaseTableProps> = ({
  releases,
  loading = false,
  onSort,
  sortKey,
  sortDirection,
  onView,
  onEdit,
  onDelete,
  onRowClick,
  onStatusChange,
  onStatusDoubleClick,
}) => {
  const columns: ColumnDef<ReleaseSchema>[] = useMemo(
    () => [
      {
        key: 'title',
        title: 'Titre',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <PlayIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {release?.title || 'Sans titre'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {release?.uploader || 'Artiste inconnu'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        title: 'Statut',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <StatusBadge
            status={release?.status}
            errors={release?.errors}
            release={release ?? undefined}
            onStatusChange={onStatusChange}
            onStatusDoubleClick={onStatusDoubleClick}
          />
        ),
      },
      {
        key: 'priority',
        title: 'Priorité',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <PriorityBadge priority={release?.priority ?? null} />
        ),
      },
      {
        key: 'playlist_name',
        title: 'Playlist',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="text-sm text-gray-900 dark:text-white">
            {release?.playlist_name || '-'}
          </div>
        ),
      },
      {
        key: 'channel_name',
        title: 'Canal',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="text-sm text-gray-900 dark:text-white">
            {release?.channel_name || '-'}
          </div>
        ),
      },
      {
        key: 'current_index',
        title: 'Progression',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="text-sm text-gray-900 dark:text-white">
            {release && release.current_index !== null && release.total_index !== null
              ? `${release.current_index}/${release.total_index}`
              : release && release.current_index !== null
              ? `${release.current_index}`
              : '-'}
          </div>
        ),
      },
      {
        key: 'inserted_at',
        title: 'Créé',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {release?.inserted_at ? (
              <Tooltip content={new Date(release.inserted_at).toLocaleString()}>
                <span>
                  {formatRelativeDate(release.inserted_at)}
                </span>
              </Tooltip>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        key: 'downloaded_at',
        title: 'Téléchargé',
        sortable: true,
        render: (_value: unknown, release: ReleaseSchema) => (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {release?.downloaded_at ? (
              <Tooltip content={new Date(release.downloaded_at).toLocaleString()}>
                <span>
                  {formatRelativeDate(release.downloaded_at)}
                </span>
              </Tooltip>
            ) : (
              '-'
            )}
          </div>
        ),
      },
    ],
    [onStatusChange, onStatusDoubleClick]
  );

  return (
    <DataTable
      data={releases}
      columns={columns}
      loading={loading}
      onSort={onSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onRowClick={onRowClick}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={Boolean(onView || onEdit || onDelete)}
      emptyMessage="Aucune release musicale trouvée"
    />
  );
};