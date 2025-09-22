import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MusicReleaseQueryParams } from '@/types/api';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Reuse the status color mapping used by the main FilterPanel (video-like statuses)
const getReleaseStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'pending':
    case 'waiting':
    case 'extracting':
    case 'downloading':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
    case 'error':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
      };
    case 'skip':
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
        count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
      };
    default:
      return {
        normal: 'text-gray-700 dark:text-gray-300',
        active: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
        count: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
      };
  }
};

interface MusicReleaseFilterPanelProps {
  entityType: string;
  filters: MusicReleaseQueryParams;
  statusCounts: Record<string, number>;
  onFiltersChange: (filters: MusicReleaseQueryParams) => void;
  loading?: boolean;
  totalCount?: number;
}

export const MusicReleaseFilterPanel: React.FC<MusicReleaseFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts,
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
    const newFilters = { ...filters } as MusicReleaseQueryParams;
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
  ).length + (Array.isArray(filters.status) ? filters.status.length - (filters.status.length > 0 ? 0 : 0) : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Header with title */}
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtres des {entityType}
          </h2>
        </div>

        {/* Clear button when active filters exist */}
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

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full lg:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recherche
              </label>
              <SearchInput
                value={localSearch}
                onChange={handleSearchChange}
                placeholder={`Rechercher des ${entityType}...`}
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(statusCounts).map(([status, count]) => {
                const isActive = filters.status
                  ? (Array.isArray(filters.status)
                      ? filters.status.includes(status)
                      : filters.status === status)
                  : false;
                const colors = getReleaseStatusColors(status);

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    disabled={loading}
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      isActive ? colors.active : colors.normal
                    )}
                  >
                    <span>{status}</span>
                    {count > 0 && (
                      <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold', isActive ? colors.count : colors.normal)}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total Records Count - mirrors FilterPanel layout */}
          {(totalCount !== undefined || statusCounts) && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Total:</span>
              <span className="ml-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm">
                {totalCount !== undefined
                  ? totalCount.toLocaleString()
                  : Object.values(statusCounts || {}).reduce((sum, c) => sum + c, 0).toLocaleString()
                }
              </span>
              <span className="ml-1">enregistrements</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};