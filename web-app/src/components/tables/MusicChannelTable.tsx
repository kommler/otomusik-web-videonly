import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  TvIcon, 
  MusicalNoteIcon, 
  QueueListIcon, 
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { MusicChannelSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

interface MusicChannelTableProps {
  channels: MusicChannelSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (channel: MusicChannelSchema) => void;
  onEdit?: (channel: MusicChannelSchema) => void;
  onDelete?: (channel: MusicChannelSchema) => void;
  onRowClick?: (channel: MusicChannelSchema) => void;
}

// Status badge component
const StatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return <span className="text-gray-400">-</span>;
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloaded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'scraping':
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

// Number formatter
const formatNumber = (num?: number | null): string => {
  if (!num) return '-';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export const MusicChannelTable: React.FC<MusicChannelTableProps> = ({
  channels,
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
      key: 'channel_name',
      title: 'Channel',
      sortable: true,
      width: '250px',
      render: (name: string | null, channel: MusicChannelSchema) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <MusicalNoteIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {name || channel.uploader || 'Unknown Music Channel'}
            </p>
            {channel.url && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(channel.url).hostname}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'uploader',
      title: 'Uploader',
      sortable: true,
      width: '180px',
      render: (uploader: string | null) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {uploader || '-'}
        </span>
      ),
    },
    {
      key: 'count_playlist',
      title: 'Playlists',
      sortable: true,
      width: '100px',
      render: (count: number | null) => (
        <div className="flex items-center space-x-1">
          <QueueListIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {formatNumber(count)}
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
      key: 'refresh_interval_days',
      title: 'Refresh Interval',
      sortable: true,
      width: '120px',
      render: (refreshInterval: number | null) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {refreshInterval ? `${refreshInterval} days` : '-'}
        </span>
      ),
    },
    {
      key: 'scraped_at',
      title: 'Last Scraped',
      sortable: true,
      width: '140px',
      render: (scrapedAt: string | null) => (
        <div className="flex items-center space-x-1">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {scrapedAt 
              ? formatDistanceToNow(new Date(scrapedAt), { addSuffix: true })
              : 'Never'
            }
          </span>
        </div>
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
      data={channels}
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
      emptyMessage="No music channels found. Try adjusting your search or filters."
    />
  );
};

export default MusicChannelTable;