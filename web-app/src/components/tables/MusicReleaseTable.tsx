import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PlayIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { ReleaseSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/utils';

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

// Status badge component
const StatusBadge: React.FC<{
  status?: string | null;
  errors?: any;
  release?: ReleaseSchema;
  onStatusChange?: (release: ReleaseSchema, newStatus: string) => void;
  onStatusDoubleClick?: (release: ReleaseSchema) => void;
}> = ({ status, errors, release, onStatusChange, onStatusDoubleClick }) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloaded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'waiting':
      case 'downloading':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'skip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatErrorMessage = (errors: any): string => {
    if (!errors) return '';

    if (typeof errors === 'string') return errors;
    if (Array.isArray(errors)) return errors.join(', ');

    try {
      return JSON.stringify(errors, null, 2);
    } catch {
      return 'Error details available';
    }
  };

  const hasErrors = errors && Object.keys(errors).length > 0;
  const errorMessage = formatErrorMessage(errors);
  const isFailed = status?.toLowerCase() === 'failed';
  const isDownloaded = status?.toLowerCase() === 'downloaded';
  const isClickable = (isFailed || isDownloaded) && release && onStatusDoubleClick;

  const handleDoubleClick = () => {
    if (isClickable) {
      onStatusDoubleClick(release);
    }
  };

  const getTooltipMessage = () => {
    if (!onStatusDoubleClick) return undefined;
    if (isFailed) return 'Double-cliquez pour passer le statut en PENDING';
    if (isDownloaded) return 'Double-cliquez pour passer le statut en WAITING';
    return undefined;
  };

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200",
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

// Priority badge component
const PriorityBadge: React.FC<{ priority?: number | null }> = ({ priority }) => {
  if (priority === null || priority === undefined) return <span className="text-gray-400">-</span>;

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (priority >= 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      getPriorityColor(priority)
    )}>
      {priority}
    </span>
  );
};

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
  const columns = [
    {
      key: 'title',
      title: 'Titre',
      sortable: true,
      // DataTable calls render(value, row, index) — we want the full row
      render: (_value: any, release?: ReleaseSchema | null) => (
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
      render: (_value: any, release?: ReleaseSchema | null) => (
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
      render: (_value: any, release?: ReleaseSchema | null) => (
        <PriorityBadge priority={release?.priority ?? null} />
      ),
    },
    {
      key: 'playlist_name',
      title: 'Playlist',
      sortable: true,
      render: (_value: any, release?: ReleaseSchema | null) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {release?.playlist_name || '-'}
        </div>
      ),
    },
    {
      key: 'channel_name',
      title: 'Canal',
      sortable: true,
      render: (_value: any, release?: ReleaseSchema | null) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {release?.channel_name || '-'}
        </div>
      ),
    },
    {
      key: 'current_index',
      title: 'Progression',
      sortable: true,
      render: (_value: any, release?: ReleaseSchema | null) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {release && release.current_index !== null && release.total_index !== null
            ? `${release.current_index}/${release.total_index}`
            : release && release.current_index !== null
            ? `${release.current_index}`
            : '-'
          }
        </div>
      ),
    },
    {
      key: 'inserted_at',
      title: 'Créé',
      sortable: true,
      render: (_value: any, release?: ReleaseSchema | null) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {release?.inserted_at ? (
            <Tooltip content={new Date(release.inserted_at).toLocaleString()}>
              <span>{formatDistanceToNow(new Date(release.inserted_at), { addSuffix: true })}</span>
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
      render: (_value: any, release?: ReleaseSchema | null) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {release?.downloaded_at ? (
            <Tooltip content={new Date(release.downloaded_at).toLocaleString()}>
              <span>{formatDistanceToNow(new Date(release.downloaded_at), { addSuffix: true })}</span>
            </Tooltip>
          ) : (
            '-'
          )}
        </div>
      ),
    },
  ];


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