'use client';

import React from 'react';
import { ChannelQueryParams } from '@/types/api';
import { useChannelStore } from '@/stores';
import { BaseFilterPanel, SortOption } from './BaseFilterPanel';

const CHANNEL_SORT_OPTIONS: SortOption[] = [
  { value: 'updated_at', label: 'Date de mise à jour' },
  { value: 'name', label: 'Nom' },
  { value: 'topic', label: 'Sujet' },
  { value: 'video_count', label: 'Nombre de vidéos' },
  { value: 'subscriber_count', label: 'Abonnés' },
];

interface ChannelFilterPanelProps {
  className?: string;
  onRefresh?: () => void;
}

export function ChannelFilterPanel({ className, onRefresh }: ChannelFilterPanelProps) {
  const { filters, statusCounts, totalCount, loading, setFilters, fetchChannels, fetchStatusCounts } = useChannelStore();

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as ChannelQueryParams);
  };

  // Utilise le callback passé ou fait un refresh via le store
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchChannels(filters);
      fetchStatusCounts(filters);
    }
  };

  return (
    <BaseFilterPanel
      entityType="Chaînes"
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={CHANNEL_SORT_OPTIONS}
      onFiltersChange={handleFiltersChange}
      onRefresh={handleRefresh}
      loading={loading}
      totalCount={totalCount}
      className={className}
    />
  );
}

export default ChannelFilterPanel;
