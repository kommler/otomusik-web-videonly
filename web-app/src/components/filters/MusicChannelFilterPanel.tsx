import React, { useState, useCallback, useMemo } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { MusicChannelQueryParams } from '../../types/api';
import { 
  Button, 
  Input, 
  SearchInput,
  Modal,
} from '../ui';
import { cn } from '../../lib/utils';

// Status color mappings pour music channels
const getMusicChannelStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'scraping':
    case 'downloading':
      return {
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
        count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
      };
    case 'pending':
      return {
        normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
    case 'error':
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

interface MusicChannelFilterPanelProps {
  entityType: string;
  filters: MusicChannelQueryParams;
  statusCounts?: Record<string, number>;
  sortOptions: { value: string; label: string; }[];
  onFiltersChange: (filters: MusicChannelQueryParams) => void;
  loading?: boolean;
  totalCount?: number;
}

export const MusicChannelFilterPanel: React.FC<MusicChannelFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts = {},
  sortOptions,
  onFiltersChange,
  loading = false,
  totalCount
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Génère dynamiquement les options de statut depuis statusCounts
  const statusOptions = useMemo(() => {
    return Object.keys(statusCounts)
      .filter(status => statusCounts[status] > 0) // Ne montre que les statuts avec des données
      .map(status => ({
        value: status,
        label: `${status} (${statusCounts[status]})`
      }))
      .sort((a, b) => statusCounts[b.value] - statusCounts[a.value]); // Trie par nombre décroissant
  }, [statusCounts]);

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value || undefined, limit: filters.limit });
  }, [filters, onFiltersChange]);

  const handleStatusChange = useCallback((status: string) => {
    const newStatus = status === '' ? undefined : [status];
    onFiltersChange({ ...filters, status: newStatus, limit: filters.limit });
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: string, order: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sort_by: sortBy, sort_order: order, limit: filters.limit });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: MusicChannelQueryParams = {
      limit: filters.limit,
      sort_by: 'updated_at',
      sort_order: 'desc',
    };
    onFiltersChange(clearedFilters);
  }, [filters.limit, onFiltersChange]);

  // Compte les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status && filters.status.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header compact */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtres {entityType}
            </h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                size="sm"
                className="text-xs"
                disabled={loading}
              >
                <XMarkIcon className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <AdjustmentsHorizontalIcon className="h-3 w-3 mr-1" />
              Plus
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres rapides inline */}
      <div className="p-4 space-y-4">
        {/* Recherche */}
        <div>
          <SearchInput
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder={`Rechercher des ${entityType}...`}
          />
        </div>

        {/* Filtres de statut inline */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('')}
            disabled={loading}
            className={cn(
              "inline-flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors",
              (!filters.status || filters.status.length === 0)
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Tous
            {(totalCount !== undefined || Object.keys(statusCounts).length > 0) && (
              <span className="ml-1 text-xs opacity-75">
                (
                  {totalCount !== undefined 
                    ? totalCount.toLocaleString()
                    : Object.values(statusCounts).reduce((sum, count) => sum + count, 0).toLocaleString()
                  }
                )
              </span>
            )}
          </button>

          {statusOptions.map((status) => {
            const colors = getMusicChannelStatusColors(status.value);
            const isActive = filters.status && filters.status.includes(status.value);
            const count = statusCounts[status.value] || 0;

            return (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                disabled={loading}
                className={cn(
                  "inline-flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors",
                  isActive ? colors.active : colors.normal,
                  "hover:opacity-80"
                )}
              >
                {status.value}
                <span className="ml-1 text-xs opacity-75">
                  ({count.toLocaleString()})
                </span>
              </button>
            );
          })}
        </div>

        {/* Tri rapide */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tri:</span>
          <select
            value={`${filters.sort_by || 'updated_at'}-${filters.sort_order || 'desc'}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-') as [string, 'asc' | 'desc'];
              handleSortChange(sortBy, order);
            }}
            disabled={loading}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map(option => (
              <React.Fragment key={option.value}>
                <option value={`${option.value}-desc`}>{option.label} ↓</option>
                <option value={`${option.value}-asc`}>{option.label} ↑</option>
              </React.Fragment>
            ))}
          </select>
        </div>
      </div>

      {/* Modal de filtres avancés */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Filtres avancés - ${entityType}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Filtres avancés seront implémentés ici...
          </p>
        </div>
      </Modal>
    </div>
  );
};