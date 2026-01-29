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
}

export function ChannelFilterPanel({ className }: ChannelFilterPanelProps) {
  const { filters, statusCounts, totalCount, loading, setFilters } = useChannelStore();

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters as ChannelQueryParams);
  };

  return (
    <BaseFilterPanel
      entityType="Chaînes"
      filters={filters as Record<string, unknown>}
      statusCounts={statusCounts}
      sortOptions={CHANNEL_SORT_OPTIONS}
      onFiltersChange={handleFiltersChange}
      loading={loading}
      totalCount={totalCount}
      className={className}
    />
  );
}

export default ChannelFilterPanel;
