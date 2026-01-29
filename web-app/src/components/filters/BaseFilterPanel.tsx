'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, SearchInput } from '../ui';
import { getStatusFilterColors } from '../../lib/status-utils';
import { cn } from '../../lib/utils';

/**
 * Option de tri pour les selects
 */
export interface SortOption {
  value: string;
  label: string;
}

/**
 * Props de base pour tous les filter panels
 */
export interface BaseFilterPanelProps<Q extends Record<string, unknown>> {
  /** Type d'entité affiché (pour les labels) */
  entityType: string;
  /** Filtres actuels */
  filters: Q;
  /** Comptages par statut */
  statusCounts: Record<string, number>;
  /** Options de tri disponibles */
  sortOptions?: SortOption[];
  /** Callback quand les filtres changent */
  onFiltersChange: (filters: Q) => void;
  /** Callback pour rafraîchir les données */
  onRefresh?: () => void;
  /** État de chargement */
  loading?: boolean;
  /** Nombre total d'éléments */
  totalCount?: number;
  /** Classes CSS additionnelles */
  className?: string;
  /** Contenu additionnel (slots) */
  children?: React.ReactNode;
}

/**
 * Composant de base pour les panneaux de filtres
 * Fournit la structure commune : recherche, filtres de statut, tri
 */
export function BaseFilterPanel<Q extends Record<string, unknown>>({
  entityType,
  filters,
  statusCounts,
  sortOptions,
  onFiltersChange,
  loading = false,
  totalCount = 0,
  className,
  children,
}: BaseFilterPanelProps<Q>) {
  const [localSearch, setLocalSearch] = useState(
    (filters as { search?: string }).search || ''
  );

  // Gestion de la recherche avec debounce intégré
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: value || undefined,
      } as Q);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  // Gestion du toggle de statut
  const handleStatusFilter = useCallback((status: string) => {
    const currentFilters = filters as { status?: string[] };
    const current = Array.isArray(currentFilters.status) 
      ? [...currentFilters.status] 
      : (currentFilters.status ? [currentFilters.status] : []);

    const index = current.indexOf(status);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(status);
    }

    onFiltersChange({
      ...filters,
      status: current.length > 0 ? current : undefined,
    } as Q);
  }, [filters, onFiltersChange]);

  // Effacer tous les filtres
  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    const clearedFilters = {
      limit: (filters as { limit?: number }).limit,
      sort_by: 'updated_at',
      sort_order: 'desc',
    } as unknown as Q;
    onFiltersChange(clearedFilters);
  }, [filters, onFiltersChange]);

  // Déterminer les statuts actifs
  const activeStatusFilters = useMemo(() => {
    const status = (filters as { status?: string | string[] }).status;
    return Array.isArray(status) ? status : (status ? [status] : []);
  }, [filters]);

  // Y a-t-il des filtres actifs ?
  const hasActiveFilters = useMemo(() => {
    const search = (filters as { search?: string }).search;
    return activeStatusFilters.length > 0 || (search && search.trim() !== '');
  }, [activeStatusFilters, filters]);

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4",
      className
    )}>
      {/* Header */}
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

      {/* Recherche */}
      <div className="mb-4">
        <SearchInput
          value={localSearch}
          onChange={handleSearchChange}
          placeholder={`Rechercher dans les ${entityType.toLowerCase()}...`}
          className="w-full"
        />
      </div>

      {/* Filtres de statut */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const isActive = activeStatusFilters.includes(status);
                const colors = getStatusFilterColors(status);
                
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
      )}

      {/* Slot pour contenu personnalisé */}
      {children}

      {/* Contrôles de tri */}
      {sortOptions && sortOptions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trier par
              </label>
              <select
                value={(filters as { sort_by?: string }).sort_by || 'updated_at'}
                onChange={(e) => onFiltersChange({ ...filters, sort_by: e.target.value } as Q)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordre
              </label>
              <select
                value={(filters as { sort_order?: string }).sort_order || 'desc'}
                onChange={(e) => onFiltersChange({ ...filters, sort_order: e.target.value as 'asc' | 'desc' } as Q)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BaseFilterPanel;
