'use client';

import React from 'react';
import { PlaylistQueryParams } from '../../types/api';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

interface PlaylistFilterPanelProps {
  entityType: string;
  filters: PlaylistQueryParams;
  statusCounts?: Record<string, number>;
  sortOptions?: SortOption[];
  onFiltersChange: (filters: PlaylistQueryParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
  className?: string;
}

// Options de tri par défaut pour les playlists
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Nom' },
  { value: 'status', label: 'Status' },
  { value: 'inserted_at', label: 'Date création' },
  { value: 'updated_at', label: 'Date modification' },
  { value: 'downloaded_at', label: 'Date téléchargement' },
  { value: 'videos_count', label: 'Nombre de vidéos' },
];

/**
 * Panel de filtres pour les playlists vidéo
 * Utilise BaseFilterPanel avec les options de tri spécifiques
 */
export const PlaylistFilterPanel: React.FC<PlaylistFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts = {},
  sortOptions = DEFAULT_SORT_OPTIONS,
  onFiltersChange,
  onRefresh,
  loading = false,
  totalCount = 0,
  className,
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
      className={className}
    />
  );
};

export default PlaylistFilterPanel;