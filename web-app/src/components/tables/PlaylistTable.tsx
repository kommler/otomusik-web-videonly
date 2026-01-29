import React from 'react';
import { QueueListIcon, GlobeAltIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { PlaylistSchema } from '../../types/api';
import { Tooltip } from '../ui';
import {
  createTableComponent,
  ColumnDef,
} from './BaseTable';

// ============================================================================
// Custom Columns
// ============================================================================

const createPlaylistNameColumn = (): ColumnDef<PlaylistSchema> => ({
  key: 'name',
  title: 'Playlist',
  sortable: true,
  width: '250px',
  render: (name: unknown, playlist: PlaylistSchema) => {
    const nameStr = name as string | null;
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <QueueListIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            <Tooltip content={nameStr || 'Nom non défini'}>
              {nameStr || 'Nom non défini'}
            </Tooltip>
          </div>
          {playlist.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              <Tooltip content={playlist.description}>
                {playlist.description.length > 100
                  ? `${playlist.description.substring(0, 100)}...`
                  : playlist.description}
              </Tooltip>
            </div>
          )}
          {playlist.url && (
            <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
              <a
                href={playlist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content={playlist.url}>
                  <div className="flex items-center space-x-1">
                    <GlobeAltIcon className="h-3 w-3" />
                    <span>{new URL(playlist.url).hostname}</span>
                  </div>
                </Tooltip>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  },
});

const createProgressColumn = (): ColumnDef<PlaylistSchema> => ({
  key: 'current_index',
  title: 'Progress',
  sortable: true,
  width: '90px',
  render: (currentIndex: unknown, playlist: PlaylistSchema) => {
    const current = currentIndex as number | null;
    return (
      <div className="flex items-center space-x-1">
        <ChartBarIcon className="h-4 w-4 text-gray-400" />
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 dark:text-white">
            {current ?? 0}
          </span>
          {playlist.total_index && playlist.total_index !== current && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              / {playlist.total_index}
            </span>
          )}
        </div>
      </div>
    );
  },
});

// ============================================================================
// Table Component using Factory
// ============================================================================

const BasePlaylistTable = createTableComponent<PlaylistSchema>({
  columns: [
    createPlaylistNameColumn(),
    createProgressColumn(),
  ],
  includeId: true,
  includeStatus: true,
  includeUrl: false, // URL is shown in name column
  includeCreatedAt: true,
  includeUpdatedAt: true,
  includeDownloadedAt: true,
  emptyMessage: 'No playlists found. Try adjusting your search or filters.',
});

// ============================================================================
// Wrapper for backward compatibility
// ============================================================================

interface PlaylistTableProps {
  playlists: PlaylistSchema[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onView?: (playlist: PlaylistSchema) => void;
  onEdit?: (playlist: PlaylistSchema) => void;
  onDelete?: (playlist: PlaylistSchema) => void;
  onRowClick?: (playlist: PlaylistSchema) => void;
  onStatusDoubleClick?: (playlist: PlaylistSchema) => void;
}

export const PlaylistTable: React.FC<PlaylistTableProps> = ({
  playlists,
  ...props
}) => (
  <div className="w-full">
    <BasePlaylistTable data={playlists} {...props} />
  </div>
);

export default PlaylistTable;