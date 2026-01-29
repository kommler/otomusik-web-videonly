'use client';

import React from 'react';
import { MusicReleaseQueryParams } from '@/types/api';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

interface MusicReleaseFilterPanelProps {
  entityType: string;
  filters: MusicReleaseQueryParams;
  statusCounts: Record<string, number>;
  sortOptions?: SortOption[];
  onFiltersChange: (filters: MusicReleaseQueryParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
}

// Options de tri par défaut pour les releases
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Nom' },
  { value: 'status', label: 'Status' },
  { value: 'inserted_at', label: 'Date création' },
  { value: 'updated_at', label: 'Date modification' },
  { value: 'release_date', label: 'Date de sortie' },
];

/**
 * Panel de filtres pour les releases musicales
 * Utilise BaseFilterPanel avec les options de tri spécifiques
 */
export const MusicReleaseFilterPanel: React.FC<MusicReleaseFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts,
  sortOptions = DEFAULT_SORT_OPTIONS,
  onFiltersChange,
  onRefresh,
  loading = false,
  totalCount = 0,
}) => {
  return (
    <BaseFilterPanel
      entityType={entityType}
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={sortOptions}
      onFiltersChange={onFiltersChange as (filters: Record<string, unknown>) => void}
      onRefresh={onRefresh}
      loading={loading}
      totalCount={totalCount}
    />
  );
};

export default MusicReleaseFilterPanel;