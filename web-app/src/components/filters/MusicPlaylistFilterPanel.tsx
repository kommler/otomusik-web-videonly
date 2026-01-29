'use client';

import React from 'react';
import { PlaylistQueryParams } from '@/types/api';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

interface MusicPlaylistFilterPanelProps {
  entityType: string;
  filters: PlaylistQueryParams;
  statusCounts: Record<string, number>;
  onFiltersChange: (filters: PlaylistQueryParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
}

// Options de tri pour les playlists musicales
const SORT_OPTIONS: SortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Nom' },
  { value: 'status', label: 'Status' },
  { value: 'inserted_at', label: 'Date création' },
  { value: 'updated_at', label: 'Date modification' },
  { value: 'downloaded_at', label: 'Date téléchargement' },
  { value: 'videos_count', label: 'Nombre de vidéos' },
];

/**
 * Panel de filtres pour les playlists musicales
 * Utilise BaseFilterPanel avec les options de tri spécifiques
 */
export const MusicPlaylistFilterPanel: React.FC<MusicPlaylistFilterPanelProps> = ({
  entityType,
  filters,
  statusCounts,
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
      sortOptions={SORT_OPTIONS}
      onFiltersChange={onFiltersChange as (filters: Record<string, unknown>) => void}
      onRefresh={onRefresh}
      loading={loading}
      totalCount={totalCount}
    />
  );
};

export default MusicPlaylistFilterPanel;

