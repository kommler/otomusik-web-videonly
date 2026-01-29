import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  QueueListIcon, 
  ChartBarIcon,
  CalendarIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';
import { PlaylistSchema } from '../../types/api';
import { DataTable, Tooltip, StatusBadge } from '../ui';

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
  loading,
  onSort,
  sortKey,
  sortDirection,
  onView,
  onEdit,
  onDelete,
  onRowClick,
  onStatusDoubleClick,
}) => {
  const columns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '60px',
      render: (id: number | null) => (
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
          {id || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      title: 'Playlist',
      sortable: true,
      width: '250px',
      render: (name: string | null, playlist: PlaylistSchema) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <QueueListIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              <Tooltip content={name || 'Nom non défini'}>
                {name || 'Nom non défini'}
              </Tooltip>
            </div>
            {playlist.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                <Tooltip content={playlist.description}>
                  {playlist.description.length > 100 
                    ? `${playlist.description.substring(0, 100)}...` 
                    : playlist.description
                  }
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
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '100px',
      render: (status: string | null, playlist: PlaylistSchema) => (
        <StatusBadge 
          status={status || 'UNKNOWN'} 
          onDoubleClick={() => onStatusDoubleClick?.(playlist)}
        />
      ),
    },
    {
      key: 'current_index',
      title: 'Progress',
      sortable: true,
      width: '90px',
      render: (currentIndex: number | null, playlist: PlaylistSchema) => (
        <div className="flex items-center space-x-1">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 dark:text-white">
              {currentIndex ?? 0}
            </span>
            {playlist.total_index && playlist.total_index !== currentIndex && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                / {playlist.total_index}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'inserted_at',
      title: 'Created',
      sortable: true,
      width: '100px',
      render: (insertedAt: string | null) => (
        <div className="flex items-center space-x-1">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {insertedAt 
              ? formatDistanceToNow(new Date(insertedAt), { addSuffix: true })
              : 'N/A'
            }
          </span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      title: 'Updated',
      sortable: true,
      width: '100px',
      render: (updatedAt: string | null) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {updatedAt 
            ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
            : 'N/A'
          }
        </span>
      ),
    },
    {
      key: 'downloaded_at',
      title: 'Downloaded',
      sortable: true,
      width: '100px',
      render: (downloadedAt: string | null) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {downloadedAt 
            ? formatDistanceToNow(new Date(downloadedAt), { addSuffix: true })
            : '-'
          }
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <DataTable
        data={playlists}
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
        emptyMessage="No playlists found. Try adjusting your search or filters."
      />
    </div>
  );
};

export default PlaylistTable;