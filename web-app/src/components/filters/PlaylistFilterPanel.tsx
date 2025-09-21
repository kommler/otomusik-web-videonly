import React, { useState, useCallback, useMemo } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { PlaylistQueryParams } from '../../types/api';
import { 
  Button, 
  Input, 
  SearchInput,
  Modal,
} from '../ui';
import { cn } from '../../lib/utils';

// Status color mappings pour playlists
const getPlaylistStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'downloading':
    case 'current':
      return {
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
        count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
      };
    case 'analyzed':
      return {
        normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
      return {
        normal: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
      };
    default:
      return {
        normal: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        active: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        count: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
      };
  }
};

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface PlaylistFilterPanelProps {
  entityType: string;
  filters: PlaylistQueryParams;
  statusCounts?: Record<string, number>;
  sortOptions: SortOption[];
  onFiltersChange: (filters: PlaylistQueryParams) => void;
  loading?: boolean;
  totalCount?: number;
  className?: string;
}

export const PlaylistFilterPanel: React.FC<PlaylistFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts = {},
  sortOptions,
  onFiltersChange,
  loading = false,
  totalCount = 0,
  className,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<PlaylistQueryParams>(filters);

  // Génère dynamiquement les options de statut depuis statusCounts
  const statusOptions = useMemo(() => {
    return Object.keys(statusCounts)
      .filter(status => statusCounts[status] > 0) // Ne montre que les statuts avec des données
      .map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        color: getPlaylistStatusColors(status).normal
      }))
      .sort((a, b) => statusCounts[b.value] - statusCounts[a.value]); // Trie par nombre décroissant
  }, [statusCounts]);

  // Comptage des filtres actifs
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'limit' || key === 'sort_by' || key === 'sort_order') return count;
    if (Array.isArray(value) && value.length > 0) return count + 1;
    if (typeof value === 'string' && value.trim() !== '') return count + 1;
    return count;
  }, 0);

  // Gestion du changement de recherche
  const handleSearchChange = useCallback((search: string) => {
    onFiltersChange({ ...filters, search: search.trim() || undefined });
  }, [filters, onFiltersChange]);

  // Gestion du changement de statut
  const handleStatusChange = useCallback((status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ 
      ...filters, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      limit: filters.limit,
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  }, [filters.limit, onFiltersChange]);

  // Apply advanced filters
  const handleApplyAdvanced = useCallback(() => {
    onFiltersChange(tempFilters);
    setIsAdvancedOpen(false);
  }, [tempFilters, onFiltersChange]);

  // Reset advanced filters to current
  const handleResetAdvanced = useCallback(() => {
    setTempFilters(filters);
  }, [filters]);

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4", className)}>
      {/* Header with title and clear button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filtres {entityType}
          </h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({totalCount} résultat{totalCount > 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdvancedOpen(true)}
            disabled={loading}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            Avancé
          </Button>
          {activeFiltersCount > 0 && (
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
      </div>

      {/* Quick filters */}
      <div className="space-y-4">
        {/* Search */}
        <div>
          <SearchInput
            placeholder="Rechercher des playlists..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>

        {/* Status filters */}
        {statusOptions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              {statusOptions.map((status) => {
                const isSelected = (filters.status || []).includes(status.value);
                const colors = getPlaylistStatusColors(status.value);
                const count = statusCounts[status.value] || 0;
                
                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    disabled={loading}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 hover:opacity-80',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isSelected
                        ? colors.active  // Fond coloré complet quand sélectionné
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'  // Fond neutre quand non sélectionné
                    )}
                  >
                    <span>{status.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        'ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                        isSelected 
                          ? colors.count  // Fond coloré pour le compteur quand sélectionné
                          : colors.normal  // Fond coloré selon le statut quand non sélectionné
                      )}>
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Total Records Count */}
            {(totalCount !== undefined || Object.keys(statusCounts).length > 0) && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Total:</span>
                <span className="ml-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm">
                  {totalCount !== undefined 
                    ? totalCount.toLocaleString()
                    : Object.values(statusCounts).reduce((sum, count) => sum + count, 0).toLocaleString()
                  }
                </span>
                <span className="ml-1">playlists</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        title="Filtres avancés"
        size="lg"
      >
        <div className="space-y-4">
          {/* Sort options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trier par
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={tempFilters.sort_by || 'updated_at'}
                onChange={(e) => setTempFilters({ ...tempFilters, sort_by: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={tempFilters.sort_order || 'desc'}
                onChange={(e) => setTempFilters({ ...tempFilters, sort_order: e.target.value as 'asc' | 'desc' })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
          </div>

          {/* Additional filters can be added here */}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="ghost"
            onClick={handleResetAdvanced}
            disabled={loading}
          >
            Réinitialiser
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsAdvancedOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleApplyAdvanced}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Appliquer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PlaylistFilterPanel;