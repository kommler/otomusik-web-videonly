import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  QueueListIcon, 
  ChartBarIcon,
  CalendarIcon,
  GlobeAltIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { PlaylistSchema } from '../../types/api';
import { DataTable } from '../ui/data-table';
import { Tooltip } from '../ui/tooltip';
import { cn } from '../../lib/utils';

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

// Status color mapping for music playlists
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    WAITING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    DOWNLOADED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    DOWNLOADING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    CURRENT: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400',
    ANALYZED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

// Status badge component
const StatusBadge: React.FC<{ 
  status: string; 
  onDoubleClick?: () => void; 
}> = ({ status, onDoubleClick }) => {
  if (!status) return <span className="text-gray-400">-</span>;
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer select-none transition-all duration-200 hover:shadow-md",
        getStatusColor(status)
      )}
      onDoubleClick={onDoubleClick}
      title="Double-cliquez pour passer le statut en WAITING"
    >
      {status}
    </span>
  );
};

export const MusicPlaylistTable: React.FC<MusicPlaylistTableProps> = ({
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
            <MusicalNoteIcon className="h-5 w-5 text-blue-500" />
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
            {playlist.channel_name && (
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                <Tooltip content={`Channel: ${playlist.channel_name}`}>
                  From {playlist.channel_name}
                </Tooltip>
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
      key: 'videos_count',
      title: 'Videos',
      sortable: true,
      width: '90px',
      render: (videosCount: number | null, playlist: PlaylistSchema) => (
        <div className="flex items-center space-x-1">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {videosCount ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: 'playlist_count',
      title: 'Items',
      sortable: true,
      width: '80px',
      render: (playlistCount: number | null) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {playlistCount ?? '-'}
        </span>
      ),
    },
    {
      key: 'url',
      title: 'URL',
      sortable: false,
      width: '80px',
      render: (url: string | null) => (
        url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <GlobeAltIcon className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'inserted_at',
      title: 'Created',
      sortable: true,
      width: '120px',
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
      width: '120px',
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
      width: '120px',
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
    <DataTable
      columns={columns}
      data={playlists}
      loading={loading}
      onSort={onSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onRowClick={onRowClick}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={!!(onView || onEdit || onDelete)}
      emptyMessage="Aucune playlist musicale trouvée"
    />
  );
};
