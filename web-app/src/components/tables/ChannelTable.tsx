import React from 'react';
import { TvIcon, UsersIcon, PlayIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { ChannelSchema } from '@/types/api';
import { StatusBadge } from '../ui';
import { formatNumber, formatRelativeDate } from '@/lib/utils';
import {
  createTableComponent,
  createNumberColumn,
  ColumnDef,
} from './BaseTable';

// ============================================================================
// Custom Columns
// ============================================================================

const createChannelNameColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'name',
  title: 'Channel',
  sortable: true,
  width: '250px',
  render: (name: unknown, channel: ChannelSchema) => {
    const nameStr = name as string | null;
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <TvIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {nameStr || channel.uploader || 'Unknown Channel'}
          </p>
          {channel.channel_url && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {new URL(channel.channel_url).hostname}
            </p>
          )}
        </div>
      </div>
    );
  },
});

const createTopicColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'topic',
  title: 'Topic',
  sortable: true,
  width: '150px',
  render: (topic: unknown) => (
    <span className="text-sm text-gray-900 dark:text-white">
      {(topic as string) || '-'}
    </span>
  ),
});

const createResolutionColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'resolution',
  title: 'Resolution',
  sortable: true,
  width: '120px',
  render: (resolution: unknown) => (
    <span className="text-sm text-gray-900 dark:text-white">
      {(resolution as string) || '-'}
    </span>
  ),
});

const createVideoCountColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'video_count',
  title: 'Videos',
  sortable: true,
  width: '100px',
  render: (videoCount: unknown, channel: ChannelSchema) => (
    <div className="flex items-center space-x-1">
      <PlayIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">
        {formatNumber((videoCount as number) || channel.count_videos)}
      </span>
    </div>
  ),
});

const createSubscriberColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'subscriber_count',
  title: 'Subscribers',
  sortable: true,
  width: '120px',
  render: (subscriberCount: unknown) => (
    <div className="flex items-center space-x-1">
      <UsersIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">
        {formatNumber(subscriberCount as number)}
      </span>
    </div>
  ),
});

const createViewCountColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'view_count',
  title: 'Total Views',
  sortable: true,
  width: '120px',
  render: (viewCount: unknown) => (
    <div className="flex items-center space-x-1">
      <EyeIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">
        {formatNumber(viewCount as number)}
      </span>
    </div>
  ),
});

const createChannelStatusColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'status',
  title: 'Status',
  sortable: true,
  width: '120px',
  render: (status: unknown) => (
    <StatusBadge status={(status as string) || 'UNKNOWN'} />
  ),
});

const createRefreshIntervalColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'refresh_interval_days',
  title: 'Refresh Interval',
  sortable: true,
  width: '120px',
  render: (refreshInterval: unknown) => {
    const interval = refreshInterval as number | null;
    return (
      <span className="text-sm text-gray-900 dark:text-white">
        {interval ? `${interval} days` : '-'}
      </span>
    );
  },
});

const createRefreshedAtColumn = (): ColumnDef<ChannelSchema> => ({
  key: 'refreshed_at',
  title: 'Last Refresh',
  sortable: true,
  width: '140px',
  render: (refreshedAt: unknown) => {
    const dateStr = refreshedAt as string | null;
    const formatted = formatRelativeDate(dateStr);
    return (
      <div className="flex items-center space-x-1">
        <CalendarIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatted === '-' ? 'Never' : formatted}
        </span>
      </div>
    );
  },
});

// ============================================================================
// Table Component using Factory
// ============================================================================

const BaseChannelTable = createTableComponent<ChannelSchema>({
  columns: [
    createChannelNameColumn(),
    createTopicColumn(),
    createResolutionColumn(),
    createVideoCountColumn(),
    createSubscriberColumn(),
    createViewCountColumn(),
    createChannelStatusColumn(),
    createRefreshIntervalColumn(),
    createRefreshedAtColumn(),
  ],
  includeId: true,
  includeStatus: false, // Using custom status column
  includeUrl: false,
  includeCreatedAt: false,
  includeUpdatedAt: true,
  includeDownloadedAt: false,
  emptyMessage: 'No channels found. Try adjusting your search or filters.',
});

// ============================================================================
// Wrapper for backward compatibility
// ============================================================================

interface ChannelTableProps {
  channels: ChannelSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (channel: ChannelSchema) => void;
  onEdit?: (channel: ChannelSchema) => void;
  onDelete?: (channel: ChannelSchema) => void;
  onRowClick?: (channel: ChannelSchema) => void;
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  channels,
  ...props
}) => (
  <BaseChannelTable data={channels} {...props} />
);