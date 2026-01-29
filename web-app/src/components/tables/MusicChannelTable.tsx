import React, { useMemo } from 'react';
import { MusicalNoteIcon, QueueListIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { MusicChannelSchema } from '@/types/api';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '../ui';
import { ColumnDef } from './BaseTable';
import { formatNumber, formatRelativeDate } from '@/lib/utils';

// ============================================================================
// Column Factories
// ============================================================================

const createIdColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'id',
  title: 'ID',
  sortable: true,
  width: '80px',
  render: (id: unknown) => (
    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
      {(id as number) || '-'}
    </span>
  ),
});

const createChannelNameColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'channel_name',
  title: 'Channel',
  sortable: true,
  width: '250px',
  render: (name: unknown, channel: MusicChannelSchema) => {
    const nameStr = name as string | null;
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <MusicalNoteIcon className="h-5 w-5 text-purple-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {nameStr || channel.uploader || 'Unknown Music Channel'}
          </p>
          {channel.url && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {new URL(channel.url).hostname}
            </p>
          )}
        </div>
      </div>
    );
  },
});

const createUploaderColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'uploader',
  title: 'Uploader',
  sortable: true,
  width: '180px',
  render: (uploader: unknown) => (
    <span className="text-sm text-gray-900 dark:text-white">
      {(uploader as string) || '-'}
    </span>
  ),
});

const createPlaylistCountColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'count_playlist',
  title: 'Playlists',
  sortable: true,
  width: '100px',
  render: (count: unknown) => (
    <div className="flex items-center space-x-1">
      <QueueListIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">
        {formatNumber(count as number)}
      </span>
    </div>
  ),
});

const createStatusColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'status',
  title: 'Status',
  sortable: true,
  width: '120px',
  render: (status: unknown) => (
    <StatusBadge status={(status as string) || 'UNKNOWN'} />
  ),
});

const createRefreshIntervalColumn = (): ColumnDef<MusicChannelSchema> => ({
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

const createScrapedAtColumn = (): ColumnDef<MusicChannelSchema> => ({
  key: 'scraped_at',
  title: 'Last Scraped',
  sortable: true,
  width: '140px',
  render: (scrapedAt: unknown) => {
    const dateStr = scrapedAt as string | null;
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

const createUpdatedAtColumn = (): ColumnDef<MusicChannelSchema> => ({
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
});

// ============================================================================
// Component Props
// ============================================================================

interface MusicChannelTableProps {
  channels: MusicChannelSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (channel: MusicChannelSchema) => void;
  onEdit?: (channel: MusicChannelSchema) => void;
  onDelete?: (channel: MusicChannelSchema) => void;
  onSetWaiting?: (channel: MusicChannelSchema) => void;
  onRowClick?: (channel: MusicChannelSchema) => void;
}

// ============================================================================
// Table Component
// ============================================================================

export const MusicChannelTable: React.FC<MusicChannelTableProps> = ({
  channels,
  loading,
  onSort,
  sortKey,
  sortDirection,
  onView,
  onEdit,
  onDelete,
  onSetWaiting,
  onRowClick,
}) => {
  const columns = useMemo(() => [
    createIdColumn(),
    createChannelNameColumn(),
    createUploaderColumn(),
    createPlaylistCountColumn(),
    createStatusColumn(),
    createRefreshIntervalColumn(),
    createScrapedAtColumn(),
    createUpdatedAtColumn(),
  ], []);

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
      onCustomAction={onSetWaiting}
      customActionIcon={<ClockIcon className="h-4 w-4 cursor-pointer text-blue-600" />}
      customActionTitle="Set to WAITING"
      customActionClassName="hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
      showActions={!!(onView || onEdit || onDelete || onSetWaiting)}
      emptyMessage="No music channels found. Try adjusting your search or filters."
    />
  );
};

export default MusicChannelTable;