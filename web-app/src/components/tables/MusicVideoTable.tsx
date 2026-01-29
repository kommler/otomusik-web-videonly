import React, { useMemo } from 'react';
import { PlayIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { MusicVideoSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui';
import { cn, formatDuration, formatFileSize, formatErrorMessage, formatRelativeDate } from '@/lib/utils';
import { getStatusColor } from '@/lib/status-utils';
import { ColumnDef } from './BaseTable';

// ============================================================================
// Local StatusBadge (with error handling specific to music videos)
// ============================================================================

interface StatusBadgeProps {
  status?: string | null;
  errors?: unknown;
  video?: MusicVideoSchema;
  onStatusChange?: (video: MusicVideoSchema, newStatus: string) => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, errors, video, onStatusChange }) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const handleDoubleClick = () => {
    if ((status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'skip') && video && onStatusChange) {
      onStatusChange(video, 'PENDING');
    }
  };

  const isClickable = (status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'skip') && onStatusChange;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status),
        isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      )}
      onDoubleClick={handleDoubleClick}
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
            <div className="text-blue-300 mb-2 font-medium">
              💡 Double-cliquez pour repasser en PENDING
            </div>
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

  if (status.toLowerCase() === 'skip') {
    return (
      <Tooltip
        content={
          <div className="max-w-sm">
            <div className="text-blue-300 mb-2 font-medium">
              💡 Double-cliquez pour repasser en PENDING
            </div>
            <div className="font-semibold mb-1 text-white">Status:</div>
            <div className="text-sm text-gray-200">Cette vidéo a été volontairement ignorée</div>
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
// Component Props
// ============================================================================

interface MusicVideoTableProps {
  videos: MusicVideoSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (video: MusicVideoSchema) => void;
  onEdit?: (video: MusicVideoSchema) => void;
  onDelete?: (video: MusicVideoSchema) => void;
  onRowClick?: (video: MusicVideoSchema) => void;
  onStatusChange?: (video: MusicVideoSchema, newStatus: string) => void;
}

// ============================================================================
// Table Component
// ============================================================================

export const MusicVideoTable: React.FC<MusicVideoTableProps> = ({
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
}) => {
  const columns: ColumnDef<MusicVideoSchema>[] = useMemo(
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
        render: (title: unknown, video: MusicVideoSchema) => {
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
        render: (channelName: unknown, video: MusicVideoSchema) => {
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
        render: (status: unknown, video: MusicVideoSchema) => (
          <StatusBadge
            status={status as string}
            errors={video.errors}
            video={video}
            onStatusChange={onStatusChange}
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
              {formatRelativeDate(dateStr)}
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
              {formatRelativeDate(dateStr)}
            </span>
          );
        },
      },
    ],
    [onStatusChange]
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
      emptyMessage="No music videos found. Try adjusting your search or filters."
    />
  );
};