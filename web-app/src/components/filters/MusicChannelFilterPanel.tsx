'use client';

import React from 'react';
import { MusicChannelQueryParams } from '../../types/api';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

interface MusicChannelFilterPanelProps {
  entityType: string;
  filters: MusicChannelQueryParams;
  statusCounts?: Record<string, number>;
  sortOptions?: SortOption[];
  onFiltersChange: (filters: MusicChannelQueryParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
}

// Options de tri par défaut pour les music channels
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Nom' },
  { value: 'status', label: 'Status' },
  { value: 'inserted_at', label: 'Date création' },
  { value: 'updated_at', label: 'Date modification' },
];

/**
 * Panel de filtres pour les chaînes musicales
 * Utilise BaseFilterPanel avec les options de tri spécifiques
 */
export const MusicChannelFilterPanel: React.FC<MusicChannelFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts = {},
  sortOptions = DEFAULT_SORT_OPTIONS,
  onFiltersChange,
  onRefresh,
  loading = false,
  totalCount,
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

export default MusicChannelFilterPanel;