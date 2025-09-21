import React from 'react';
import { PlaylistSchema } from '../../types/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/tooltip';

interface PlaylistTableProps {
  playlists: PlaylistSchema[];
  onView?: (playlist: PlaylistSchema) => void;
  onEdit?: (playlist: PlaylistSchema) => void;
  onDelete?: (playlist: PlaylistSchema) => void;
  loading?: boolean;
  creating?: boolean;
  updating?: boolean;
  deleting?: boolean;
  selectedId?: number | null;
}

// Fonction utilitaire pour obtenir la couleur du badge basée sur le statut
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-red-100 text-red-800 border-red-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ERROR: 'bg-red-100 text-red-800 border-red-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROCESSING: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Composant Badge pour afficher le statut
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};

export const PlaylistTable: React.FC<PlaylistTableProps> = ({
  playlists,
  onView,
  onEdit,
  onDelete,
  loading = false,
  creating = false,
  updating = false,
  deleting = false,
  selectedId,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 text-lg">Aucune playlist trouvée</p>
        <p className="text-gray-400 text-sm mt-2">
          Essayez d'ajuster vos filtres ou créez une nouvelle playlist
        </p>
      </Card>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Playlist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progression
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {playlists.map((playlist) => (
              <tr
                key={playlist.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedId === playlist.id ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      <Tooltip content={playlist.name || 'Nom non défini'}>
                        {playlist.name || 'Nom non défini'}
                      </Tooltip>
                    </div>
                    {playlist.description && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        <Tooltip content={playlist.description}>
                          {playlist.description}
                        </Tooltip>
                      </div>
                    )}
                    {playlist.url && (
                      <div className="text-xs text-blue-600 max-w-xs truncate">
                        <a 
                          href={playlist.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <Tooltip content={playlist.url}>
                            {new URL(playlist.url).hostname}
                          </Tooltip>
                        </a>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={playlist.status || 'UNKNOWN'} />
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{playlist.current_index ?? 0}</span>
                    {playlist.total_index && playlist.total_index !== playlist.current_index && (
                      <span className="text-xs text-gray-500">
                        / {playlist.total_index} total
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col space-y-1">
                    <div>
                      <span className="text-xs">Créé:</span>{' '}
                      <span title={playlist.inserted_at ? new Date(playlist.inserted_at).toLocaleString() : 'Non défini'}>
                        {playlist.inserted_at ? new Date(playlist.inserted_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs">MAJ:</span>{' '}
                      <span title={playlist.updated_at ? new Date(playlist.updated_at).toLocaleString() : 'Non défini'}>
                        {playlist.updated_at ? new Date(playlist.updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {playlist.downloaded_at && (
                      <div>
                        <span className="text-xs">Téléchargé:</span>{' '}
                        <span title={new Date(playlist.downloaded_at).toLocaleString()}>
                          {new Date(playlist.downloaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(playlist)}
                        disabled={loading || creating || updating || deleting}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(playlist)}
                        disabled={loading || creating || updating || deleting}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Éditer
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(playlist)}
                        disabled={loading || creating || updating || deleting}
                        className="text-red-600 hover:text-red-900"
                      >
                        {deleting && selectedId === playlist.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-1"></div>
                            Suppression...
                          </>
                        ) : (
                          'Supprimer'
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlaylistTable;