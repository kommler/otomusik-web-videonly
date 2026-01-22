import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PlaylistQueryParams } from '@/types/api';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Status color mapping for music playlists
const getMusicPlaylistStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'downloading':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
        count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
      };
    case 'current':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100',
        count: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100'
      };
    case 'analyzed':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
      };
    default:
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
        count: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
      };
  }
};

interface MusicPlaylistFilterPanelProps {
  entityType: string;
  filters: PlaylistQueryParams;
  statusCounts: Record<string, number>;
  onFiltersChange: (filters: PlaylistQueryParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
}

export const MusicPlaylistFilterPanel: React.FC<MusicPlaylistFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts,
  onFiltersChange,
  onRefresh,
  loading = false,
  totalCount = 0,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: value || undefined,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const handleStatusFilter = useCallback((status: string) => {
    const newFilters = { ...filters } as PlaylistQueryParams;
    const current = Array.isArray(filters.status) ? [...filters.status] : (filters.status ? [filters.status] : []);

    const index = current.indexOf(status);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(status);
    }

    if (current.length > 0) {
      newFilters.status = current;
    } else {
      delete newFilters.status;
    }

    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    onFiltersChange({
      limit: filters.limit,
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  }, [filters.limit, onFiltersChange]);

  const activeStatusFilters = Array.isArray(filters.status) ? filters.status : (filters.status ? [filters.status] : []);
  const hasActiveFilters = activeStatusFilters.length > 0 || (filters.search && filters.search.trim() !== '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filtres {entityType}
          </h3>
          {totalCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({totalCount} résultat{totalCount > 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={loading}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={localSearch}
          onChange={handleSearchChange}
          placeholder={`Rechercher dans les ${entityType.toLowerCase()}...`}
          className="w-full"
        />
      </div>

      {/* Status Filters */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const isActive = activeStatusFilters.includes(status);
              const colors = getMusicPlaylistStatusColors(status);
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  disabled={loading || count === 0}
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    'border border-gray-300 dark:border-gray-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isActive ? colors.active : colors.normal,
                    !isActive && 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="capitalize">{status}</span>
                  <span className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                    isActive ? colors.count : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trier par
            </label>
            <select
              value={filters.sort_by || 'updated_at'}
              onChange={(e) => onFiltersChange({ ...filters, sort_by: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="id">ID</option>
              <option value="name">Nom</option>
              <option value="status">Status</option>
              <option value="inserted_at">Date création</option>
              <option value="updated_at">Date modification</option>
              <option value="downloaded_at">Date téléchargement</option>
              <option value="videos_count">Nombre de vidéos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordre
            </label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => onFiltersChange({ ...filters, sort_order: e.target.value as 'asc' | 'desc' })}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
