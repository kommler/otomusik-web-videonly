'use client';

import React, { useCallback } from 'react';
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
  const { filters, statusCounts, totalCount, loading, setFilters, fetchVideos, fetchStatusCounts, allVideos, patchVideo } = useVideoStore();

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

  // Bulk status change: patch all items matching fromStatus
  const handleBulkStatusChange = useCallback(async (fromStatus: string, toStatus: string) => {
    const targets = allVideos.filter(v => v.status === fromStatus && v.id != null);
    await Promise.all(targets.map(v => patchVideo(v.id!, { status: toStatus })));
    fetchVideos(filters);
    fetchStatusCounts(filters);
  }, [allVideos, patchVideo, fetchVideos, fetchStatusCounts, filters]);

  return (
    <BaseFilterPanel
      entityType="Vidéos"
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={VIDEO_SORT_OPTIONS}
      onFiltersChange={handleFiltersChange}
      onRefresh={handleRefresh}
      onBulkStatusChange={handleBulkStatusChange}
      loading={loading}
      totalCount={totalCount}
      className={className}
    />
  );
}

export default VideoFilterPanel;
