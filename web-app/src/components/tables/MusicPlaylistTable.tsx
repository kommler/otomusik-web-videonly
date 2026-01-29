import React from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { PlaylistSchema } from '../../types/api';
import { Tooltip } from '../ui';
import {
  createTableComponent,
  createCountColumn,
  ColumnDef,
} from './BaseTable';

// ============================================================================
// Custom Column for Playlist Name
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
          <MusicalNoteIcon className="h-5 w-5 text-blue-500" />
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
          {playlist.channel_name && (
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
              <Tooltip content={`Channel: ${playlist.channel_name}`}>
                From {playlist.channel_name}
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    );
  },
});

const createPlaylistItemsColumn = (): ColumnDef<PlaylistSchema> => ({
  key: 'playlist_count',
  title: 'Items',
  sortable: true,
  width: '80px',
  render: (value: unknown) => (
    <span className="text-sm text-gray-900 dark:text-white">
      {(value as number) ?? '-'}
    </span>
  ),
});

// ============================================================================
// Table Component using Factory
// ============================================================================

const BaseMusicPlaylistTable = createTableComponent<PlaylistSchema>({
  columns: [
    createPlaylistNameColumn(),
    createCountColumn<PlaylistSchema>('videos_count' as keyof PlaylistSchema, 'Videos'),
    createPlaylistItemsColumn(),
  ],
  includeId: true,
  includeStatus: true,
  includeUrl: true,
  includeCreatedAt: true,
  includeUpdatedAt: true,
  includeDownloadedAt: true,
  emptyMessage: 'Aucune playlist musicale trouvée',
});

// ============================================================================
// Wrapper to maintain backward compatibility
// ============================================================================

interface MusicPlaylistTableProps {
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

export const MusicPlaylistTable: React.FC<MusicPlaylistTableProps> = ({
  playlists,
  ...props
}) => (
  <BaseMusicPlaylistTable data={playlists} {...props} />
);
