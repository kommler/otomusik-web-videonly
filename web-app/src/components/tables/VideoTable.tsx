import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PlayIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { VideoSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

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
}

// Status badge component
const StatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return <span className="text-gray-400">-</span>;
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'downloaded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'extracting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
      getStatusColor(status)
    )}>
      {status}
    </span>
  );
};

// Duration formatter
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

// File size formatter
const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '-';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

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
}) => {
  const columns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
      render: (id: number | null) => (
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
          {id || '-'}
        </span>
      ),
    },
    {
      key: 'title',
      title: 'Title',
      sortable: true,
      width: '300px',
      render: (title: string | null, video: VideoSchema) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <PlayIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {title || video.video_name || 'Untitled'}
            </p>
            {video.url && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(video.url).hostname}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'channel_name',
      title: 'Channel',
      sortable: true,
      width: '200px',
      render: (channelName: string | null, video: VideoSchema) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-white">
            {channelName || video.uploader || '-'}
          </p>
          {video.uploader && channelName !== video.uploader && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {video.uploader}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'duration_seconds',
      title: 'Duration',
      sortable: true,
      width: '100px',
      render: (duration: number | null) => (
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {formatDuration(duration)}
          </span>
        </div>
      ),
    },
    {
      key: 'view_count',
      title: 'Views',
      sortable: true,
      width: '100px',
      render: (viewCount: number | null) => (
        <div className="flex items-center space-x-1">
          <EyeIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {viewCount ? viewCount.toLocaleString() : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '120px',
      render: (status: string | null) => <StatusBadge status={status} />,
    },
    {
      key: 'file_size',
      title: 'Size',
      sortable: true,
      width: '100px',
      render: (fileSize: number | null) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {formatFileSize(fileSize)}
        </span>
      ),
    },
    {
      key: 'published_at',
      title: 'Published',
      sortable: true,
      width: '120px',
      render: (publishedAt: string | null) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {publishedAt 
            ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
            : '-'
          }
        </span>
      ),
    },
    {
      key: 'updated_at',
      title: 'Updated',
      sortable: true,
      width: '120px',
      render: (updatedAt: string | null) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {updatedAt 
            ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
            : '-'
          }
        </span>
      ),
    },
  ];

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