import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MusicReleaseQueryParams } from '@/types/api';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';

interface MusicReleaseFilterPanelProps {
  entityType: string;
  filters: MusicReleaseQueryParams;
  statusCounts: Record<string, number>;
  sortOptions: Array<{ value: string; label: string }>;
  onFiltersChange: (filters: MusicReleaseQueryParams) => void;
  loading?: boolean;
  totalCount?: number;
}

export const MusicReleaseFilterPanel: React.FC<MusicReleaseFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts,
  sortOptions,
  onFiltersChange,
  loading = false,
  totalCount = 0,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.title__ilike || '');

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        title__ilike: value || undefined,
        uploader__ilike: value || undefined,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const handleStatusFilter = useCallback((status: string) => {
    const newFilters = { ...filters };
    if (filters.status === status) {
      // Remove filter if same status clicked
      delete newFilters.status;
    } else {
      newFilters.status = status;
    }
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: string) => {
    const newSortOrder = (filters.sort_by === sortBy && filters.sort_order === 'asc') ? 'desc' : 'asc';
    onFiltersChange({
      ...filters,
      sort_by: sortBy,
      sort_order: newSortOrder,
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setLocalSearch('');
    onFiltersChange({
      limit: 25,
      sort_by: 'inserted_at',
      sort_order: 'desc',
    });
  }, [onFiltersChange]);

  const activeFiltersCount = Object.keys(filters).filter(key =>
    filters[key as keyof MusicReleaseQueryParams] !== undefined &&
    key !== 'limit' &&
    key !== 'sort_by' &&
    key !== 'sort_order'
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Header with title and total count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtres des {entityType}
            </h2>
            {totalCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                {totalCount} résultat{totalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Effacer ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recherche
          </label>
          <SearchInput
            value={localSearch}
            onChange={handleSearchChange}
            placeholder={`Rechercher des ${entityType}...`}
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Statut
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                disabled={loading}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.status === status
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trier par
          </label>
          <select
            value={`${filters.sort_by || 'inserted_at'}_${filters.sort_order || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              handleSortChange(sortBy);
            }}
            disabled={loading}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {sortOptions.map((option) => (
              <React.Fragment key={option.value}>
                <option value={`${option.value}_asc`}>
                  {option.label} ↑
                </option>
                <option value={`${option.value}_desc`}>
                  {option.label} ↓
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Résumé des filtres actifs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtres actifs
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeFiltersCount === 0 ? (
              <span className="text-gray-400">Aucun filtre actif</span>
            ) : (
              <div className="space-y-1">
                {filters.title__ilike && (
                  <div>Recherche: "{filters.title__ilike}"</div>
                )}
                {filters.status && (
                  <div>Statut: {filters.status}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};