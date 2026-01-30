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
  onRefresh?: () => void;
}

export function VideoFilterPanel({ className, onRefresh }: VideoFilterPanelProps) {
  const { filters, statusCounts, totalCount, loading, setFilters, fetchVideos, fetchStatusCounts } = useVideoStore();

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as VideoQueryParams);
  };

  // Utilise le callback passé ou fait un refresh via le store
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchVideos(filters);
      fetchStatusCounts(filters);
    }
  };

  return (
    <BaseFilterPanel
      entityType="Vidéos"
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={VIDEO_SORT_OPTIONS}
      onFiltersChange={handleFiltersChange}
      onRefresh={handleRefresh}
      loading={loading}
      totalCount={totalCount}
      className={className}
    />
  );
}

export default VideoFilterPanel;
