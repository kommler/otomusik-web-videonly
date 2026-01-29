'use client';

import React from 'react';
import { MusicVideoQueryParams } from '@/types/api';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

interface MusicVideoFilterPanelProps {
  className?: string;
  filters: MusicVideoQueryParams;
  onFiltersChange: (filters: MusicVideoQueryParams) => void;
  onClearFilters?: () => void;
  activeFiltersCount?: number;
  statusCounts?: Record<string, number>;
  totalFilteredCount?: number;
  onRefresh?: () => void;
  loading?: boolean;
}

// Options de tri par défaut pour les music videos
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Titre' },
  { value: 'channel_name', label: 'Chaîne' },
  { value: 'status', label: 'Status' },
  { value: 'duration_seconds', label: 'Durée' },
  { value: 'view_count', label: 'Vues' },
  { value: 'published_at', label: 'Date de publication' },
  { value: 'updated_at', label: 'Date modification' },
];

/**
 * Panel de filtres pour les vidéos musicales
 * Utilise BaseFilterPanel avec les options de tri spécifiques
 */
export const MusicVideoFilterPanel: React.FC<MusicVideoFilterPanelProps> = (props) => {
  return (
    <BaseFilterPanel
      entityType="Music Videos"
      filters={props.filters as Record<string, unknown>}
      statusCounts={props.statusCounts || {}}
      sortOptions={DEFAULT_SORT_OPTIONS}
      onFiltersChange={props.onFiltersChange as (filters: Record<string, unknown>) => void}
      onRefresh={props.onRefresh}
      loading={props.loading}
      totalCount={props.totalFilteredCount}
      className={props.className}
    />
  );
};

export default MusicVideoFilterPanel;