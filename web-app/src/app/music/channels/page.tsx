'use client';

import React, { useCallback } from 'react';
import { LazyMusicChannelTable } from '@/components/tables';
import { LazyMusicChannelFilterPanel } from '@/components/filters';
import { BaseChannelPage, FormFieldConfig, BaseChannelPageLabels } from '@/components/pages';
import { useMusicChannelStore } from '@/stores';
import { MusicChannel, MusicChannelQueryParams } from '@/types/api';
import { useInitialLoad } from '@/lib/hooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const musicChannelFormFields: FormFieldConfig[] = [
  { name: 'channel_name', label: 'Nom du Canal', type: 'text', required: true },
  { name: 'url', label: 'URL', type: 'url', required: true, placeholder: 'https://www.youtube.com/@channel' },
  { name: 'uploader', label: 'Uploader', type: 'text', placeholder: "Nom de l'uploader" },
  { name: 'refresh_interval_days', label: 'Intervalle de Rafraîchissement (jours)', type: 'number', min: 1, placeholder: '7' },
  { name: 'scrap_options', label: 'Options de Scraping', type: 'text', placeholder: 'Options JSON pour le scraping' },
];

const musicChannelSortOptions = [
  { value: 'channel_name', label: 'Nom du canal' },
  { value: 'uploader', label: 'Uploader' },
  { value: 'count_playlist', label: 'Nombre de playlists' },
  { value: 'status', label: 'Statut' },
  { value: 'inserted_at', label: 'Date de création' },
  { value: 'updated_at', label: 'Dernière modification' },
  { value: 'scraped_at', label: 'Dernière extraction' },
];

const labels: BaseChannelPageLabels = {
  pageTitle: 'Gestion des Canaux Musicaux',
  pageSubtitle: (count: number) => count > 0 
    ? `${count} canal${count > 1 ? 'aux' : ''} musical${count > 1 ? 'aux' : ''} trouvé${count > 1 ? 's' : ''}` 
    : 'Aucun canal musical trouvé',
  editModalTitle: 'Modifier le Canal Musical',
  cancelButton: 'Annuler',
  createSubmitButton: 'Créer',
  editSubmitButton: 'Modifier le Canal',
  loadingError: 'Erreur lors du chargement des canaux musicaux',
  retryButton: 'Réessayer',
  deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer le canal musical "${name}" ?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  channel_name: '',
  url: '',
  uploader: '',
  refresh_interval_days: null as number | null,
  scrap_options: '',
});

const channelToFormData = (channel: MusicChannel): Record<string, unknown> => ({
  channel_name: channel.channel_name || '',
  url: channel.url || '',
  uploader: channel.uploader || '',
  refresh_interval_days: channel.refresh_interval_days ?? null,
  scrap_options: channel.scrap_options || '',
});

const formDataToChannel = (
  formData: Record<string, unknown>, 
  existingChannel?: MusicChannel
): Partial<MusicChannel> => ({
  ...(existingChannel || {}),
  channel_name: formData.channel_name as string,
  url: formData.url as string,
  uploader: (formData.uploader as string) || undefined,
  refresh_interval_days: formData.refresh_interval_days as number | null,
  scrap_options: (formData.scrap_options as string) || undefined,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function MusicChannelsPage() {
  const {
    channels,
    totalChannels,
    statusCountsRecord,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    setFilters,
    setCurrentPage,
    fetchChannels,
    updateChannel,
    deleteChannel,
  } = useMusicChannelStore();

  // Initial load
  useInitialLoad([() => fetchChannels()]);

  // Handler for filter changes (fetch immediately)
  const handleFiltersChange = useCallback((newFilters: MusicChannelQueryParams) => {
    setFilters(newFilters);
    fetchChannels(newFilters);
  }, [setFilters, fetchChannels]);

  // Handler for refresh
  const handleRefresh = useCallback(() => {
    fetchChannels(filters);
  }, [fetchChannels, filters]);

  // Double-click on status: DOWNLOADED ↔ WAITING
  const handleStatusDoubleClick = useCallback(async (channel: MusicChannel) => {
    if (!channel.id) return;
    
    const currentStatus = channel.status?.toUpperCase();
    
    if (currentStatus === 'DOWNLOADED') {
      // DOWNLOADED → WAITING : no confirmation
      await updateChannel(channel.id, { ...channel, status: 'WAITING' });
      fetchChannels(filters);
    } else if (currentStatus === 'WAITING') {
      // WAITING → DOWNLOADED : with confirmation
      if (confirm(`Repasser le canal "${channel.channel_name}" en DOWNLOADED ?`)) {
        await updateChannel(channel.id, { ...channel, status: 'DOWNLOADED' });
        fetchChannels(filters);
      }
    }
    // Other statuses: do nothing
  }, [fetchChannels, filters, updateChannel]);

  // Wrap update to return the updated channel
  const handleUpdateChannel = useCallback(async (id: number, data: Partial<MusicChannel>) => {
    await updateChannel(id, data as MusicChannel);
    // Return the updated channel (we'll refetch anyway)
    return data as MusicChannel;
  }, [updateChannel]);

  // Wrap delete
  const handleDeleteChannel = useCallback(async (id: number) => {
    await deleteChannel(id);
    fetchChannels(filters);
    return true;
  }, [deleteChannel, fetchChannels, filters]);

  return (
    <BaseChannelPage<MusicChannel, MusicChannelQueryParams>
      labels={labels}
      formFields={musicChannelFormFields}
      showCreateButton={false}
      
      // Data
      channels={channels}
      loading={loading}
      error={error}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalChannels}
      
      // Actions
      setCurrentPage={setCurrentPage}
      setFilters={setFilters}
      fetchChannels={fetchChannels}
      updateChannel={handleUpdateChannel}
      deleteChannel={handleDeleteChannel}
      
      // Helpers
      getChannelId={(c) => c.id ?? undefined}
      getChannelName={(c) => c.channel_name || c.uploader || 'Unknown'}
      channelToFormData={channelToFormData}
      formDataToChannel={formDataToChannel}
      getInitialFormData={getInitialFormData}
      
      // Special handler
      onStatusDoubleClick={handleStatusDoubleClick}
      
      // Render props
      renderFilterPanel={() => (
        <LazyMusicChannelFilterPanel
          entityType="canaux musicaux"
          filters={filters}
          statusCounts={statusCountsRecord}
          sortOptions={musicChannelSortOptions}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          loading={loading}
          totalCount={totalChannels}
        />
      )}
      renderTable={(props) => (
        <LazyMusicChannelTable
          channels={props.channels}
          loading={props.loading}
          onSort={props.onSort}
          sortKey={props.sortKey}
          sortDirection={props.sortDirection}
          onRowClick={() => {}}
          onView={() => {}}
          onEdit={props.onEdit}
          onStatusDoubleClick={props.onStatusDoubleClick}
          onDelete={props.onDelete}
        />
      )}
    />
  );
}
