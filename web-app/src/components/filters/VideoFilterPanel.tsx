'use client';

import React from 'react';
import { VideoQueryParams } from '@/types/api';
import { useVideoStore } from '@/stores';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

const VIDEO_SORT_OPTIONS: SortOption[] = [
  { value: 'updated_at', label: 'Date de mise à jour' },
  { value: 'title', label: 'Titre' },
  { value: 'channel_name', label: 'Chaîne' },
  { value: 'duration_seconds', label: 'Durée' },
  { value: 'view_count', label: 'Vues' },
  { value: 'published_at', label: 'Date de publication' },
];

interface VideoFilterPanelProps {
  className?: string;
}

export function VideoFilterPanel({ className }: VideoFilterPanelProps) {
  const { filters, statusCounts, totalCount, loading, setFilters } = useVideoStore();

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as VideoQueryParams);
  };

  return (
    <BaseFilterPanel
      entityType="Vidéos"
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={VIDEO_SORT_OPTIONS}
      onFiltersChange={handleFiltersChange}
      loading={loading}
      totalCount={totalCount}
      className={className}
    />
  );
}

export default VideoFilterPanel;
