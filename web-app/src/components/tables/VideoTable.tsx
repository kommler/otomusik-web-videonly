import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PlayIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { VideoSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ColumnDef } from './BaseTable';

// ============================================================================
// Component Props
// ============================================================================

interface VideoTableProps {
  videos: VideoSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (video: VideoSchema) => void;
  onEdit?: (video: VideoSchema) => void;
  onDelete?: (video: VideoSchema) => void;
  onRowClick?: (video: VideoSchema) => void;
  onStatusChange?: (video: VideoSchema, newStatus: string) => void;
  onStatusDoubleClick?: (video: VideoSchema) => void;
}

// ============================================================================
// Local StatusBadge (with error handling and tooltips)
// ============================================================================

interface StatusBadgeProps {
  status?: string | null;
  errors?: unknown;
  video?: VideoSchema;
  onStatusChange?: (video: VideoSchema, newStatus: string) => void;
  onStatusDoubleClick?: (video: VideoSchema) => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  errors,
  video,
  onStatusChange,
  onStatusDoubleClick,
}) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'downloaded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'extracting':
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

  const formatErrorMessage = (err: unknown): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null) {
      if ('message' in err) return String((err as { message: unknown }).message);
      return JSON.stringify(err, null, 2);
    }
    return String(err);
  };

  const handleDoubleClick = () => {
    if (video && onStatusDoubleClick) {
      onStatusDoubleClick(video);
    }
  };

  const isClickable = onStatusDoubleClick && ['skip', 'error', 'downloading', 'downloaded', 'failed'].includes(status.toLowerCase());

  const badge = (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status),
        isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity hover:shadow-md' : ''
      )}
      onDoubleClick={handleDoubleClick}
      title={isClickable ? 'Double-cliquez pour passer en PENDING et réinitialiser la date de téléchargement' : undefined}
    >
      {status}
    </span>
  );

  if (status.toLowerCase() === 'failed' && errors) {
    const errorMessage = formatErrorMessage(errors);
    return (
      <Tooltip
        content={
          <div className="max-w-sm">
            {onStatusDoubleClick && (
              <div className="text-blue-300 mb-2 font-medium">
                💡 Double-cliquez pour repasser en PENDING et reset downloaded_at
              </div>
            )}
            <div className="font-semibold mb-1 text-white">Error Details:</div>
            <div className="text-sm whitespace-pre-wrap text-gray-200">{errorMessage}</div>
          </div>
        }
        position="top"
        contentClassName="bg-red-900 dark:bg-red-800 border border-red-700"
      >
        {badge}
      </Tooltip>
    );
  }

  if (isClickable && status && ['skip', 'error', 'downloading', 'downloaded'].includes(status.toLowerCase())) {
    return (
      <Tooltip
        content={
          <div className="max-w-sm">
            <div className="text-blue-300 mb-2 font-medium">
              💡 Double-cliquez pour repasser en PENDING et reset downloaded_at
            </div>
            <div className="font-semibold mb-1 text-white">Status:</div>
            <div className="text-sm text-gray-200">Statut actuel: {status}</div>
          </div>
        }
        position="top"
        contentClassName="bg-blue-900 dark:bg-blue-800 border border-blue-700"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

// ============================================================================
// Utility Functions
// ============================================================================

const formatDuration = (seconds?: number | null): string => {
  if (!seconds) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// ============================================================================
// Table Component
// ============================================================================

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  loading,
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
  const columns: ColumnDef<VideoSchema>[] = useMemo(
    () => [
      {
        key: 'id',
        title: 'ID',
        sortable: true,
        width: '80px',
        render: (id: unknown) => (
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {(id as number) || '-'}
          </span>
        ),
      },
      {
        key: 'title',
        title: 'Title',
        sortable: true,
        width: '300px',
        render: (title: unknown, video: VideoSchema) => {
          const titleStr = title as string | null;
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <PlayIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {titleStr || video.video_name || 'Untitled'}
                </p>
                {video.url && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {new URL(video.url).hostname}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'channel_name',
        title: 'Channel',
        sortable: true,
        width: '200px',
        render: (channelName: unknown, video: VideoSchema) => {
          const name = channelName as string | null;
          return (
            <div>
              <p className="text-sm text-gray-900 dark:text-white">
                {name || video.uploader || '-'}
              </p>
              {video.uploader && name !== video.uploader && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{video.uploader}</p>
              )}
            </div>
          );
        },
      },
      {
        key: 'duration_seconds',
        title: 'Duration',
        sortable: true,
        width: '100px',
        render: (duration: unknown) => (
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {formatDuration(duration as number)}
            </span>
          </div>
        ),
      },
      {
        key: 'view_count',
        title: 'Views',
        sortable: true,
        width: '100px',
        render: (viewCount: unknown) => {
          const count = viewCount as number | null;
          return (
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                {count ? count.toLocaleString() : '-'}
              </span>
            </div>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        width: '120px',
        render: (status: unknown, video: VideoSchema) => (
          <StatusBadge
            status={status as string}
            errors={video.errors}
            video={video}
            onStatusChange={onStatusChange}
            onStatusDoubleClick={onStatusDoubleClick}
          />
        ),
      },
      {
        key: 'file_size',
        title: 'Size',
        sortable: true,
        width: '100px',
        render: (fileSize: unknown) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {formatFileSize(fileSize as number)}
          </span>
        ),
      },
      {
        key: 'published_at',
        title: 'Published',
        sortable: true,
        width: '120px',
        render: (publishedAt: unknown) => {
          const dateStr = publishedAt as string | null;
          return (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {dateStr ? formatDistanceToNow(new Date(dateStr), { addSuffix: true }) : '-'}
            </span>
          );
        },
      },
      {
        key: 'updated_at',
        title: 'Updated',
        sortable: true,
        width: '120px',
        render: (updatedAt: unknown) => {
          const dateStr = updatedAt as string | null;
          return (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {dateStr ? formatDistanceToNow(new Date(dateStr), { addSuffix: true }) : '-'}
            </span>
          );
        },
      },
    ],
    [onStatusChange, onStatusDoubleClick]
  );

  return (
    <DataTable
      data={videos}
      columns={columns}
      loading={loading}
      onSort={onSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onRowClick={onRowClick}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={!!(onView || onEdit || onDelete)}
      emptyMessage="No videos found. Try adjusting your search or filters."
    />
  );
};