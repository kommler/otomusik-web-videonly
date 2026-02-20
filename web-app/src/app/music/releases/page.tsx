'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { LazyMusicReleaseTable } from '@/components/tables';
import { LazyMusicReleaseFilterPanel } from '@/components/filters';
import { BasePlaylistPage, PlaylistFormFieldConfig, BasePlaylistPageLabels, PlaylistChannelOption } from '@/components/pages';
import { useMusicReleaseStore, useMusicChannelStore, useUIStore } from '@/stores';
import { ReleaseSchema, MusicReleaseQueryParams } from '@/types/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

const releaseFormFields: PlaylistFormFieldConfig[] = [
  { name: 'title', label: 'Titre', type: 'text', required: true },
  { name: 'uploader', label: 'Artiste', type: 'text' },
  { name: 'url', label: 'URL', type: 'url', required: true },
  { name: 'playlist_name', label: 'Nom de la playlist', type: 'text', gridSpan: 2 },
  { name: 'channel_name', label: 'Canal musical', type: 'channel-select', gridSpan: 2 },
  { name: 'status', label: 'Statut', type: 'select', gridSpan: 2, options: [
    { value: '', label: 'Sélectionner un statut' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DOWNLOADING', label: 'Downloading' },
    { value: 'DOWNLOADED', label: 'Downloaded' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'ERROR', label: 'Error' },
    { value: 'EXTRACTING', label: 'Extracting' },
    { value: 'SKIP', label: 'Skip' },
  ]},
  { name: 'priority', label: 'Priorité', type: 'number', min: 1, gridSpan: 2 },
];

const labels: BasePlaylistPageLabels = {
  pageTitle: 'Gestion des Releases Musicales',
  pageSubtitle: (count: number) => count > 0 
    ? `${count} release${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`
    : 'Aucune release trouvée',
  createButton: 'Ajouter une Release',
  createModalTitle: 'Créer une Nouvelle Release',
  editModalTitle: 'Modifier la Release',
  cancelButton: 'Annuler',
  createSubmitButton: 'Créer la Release',
  editSubmitButton: 'Mettre à Jour',
  loadingError: 'Échec du chargement des releases',
  retryButton: 'Réessayer',
  deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  title: '',
  uploader: '',
  url: '',
  playlist_name: '',
  channel_name: '',
  status: '',
  priority: 5,
});

const releaseToFormData = (release: ReleaseSchema): Record<string, unknown> => ({
  title: release.title || '',
  uploader: release.uploader || '',
  url: release.url || '',
  playlist_name: release.playlist_name || '',
  channel_name: release.channel_name || '',
  status: release.status || '',
  priority: release.priority || 5,
});

const formDataToRelease = (
  formData: Record<string, unknown>, 
  existingRelease?: ReleaseSchema
): Partial<ReleaseSchema> => ({
  ...(existingRelease || {}),
  title: (formData.title as string) || null,
  uploader: (formData.uploader as string) || null,
  url: (formData.url as string) || null,
  playlist_name: (formData.playlist_name as string) || null,
  channel_name: (formData.channel_name as string) || null,
  status: (formData.status as string) || null,
  priority: (formData.priority as number) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function MusicReleasesPage() {
  const {
    releases,
    loading,
    filters,
    currentPage,
    pageSize,
    totalCount,
    statusCounts,
    fetchReleases,
    setFilters,
    setCurrentPage,
    setPageSize,
    fetchStatusCounts,
    updateRelease,
    deleteRelease,
    createRelease,
  } = useMusicReleaseStore();

  const { channels, fetchChannels } = useMusicChannelStore();
  const { addNotification } = useUIStore();

  // Convert channels to options format
  const channelOptions: PlaylistChannelOption[] = useMemo(() => 
    channels.map(ch => ({
      id: ch.id,
      name: ch.channel_name || '',
    })),
    [channels]
  );

  // Initial load
  useEffect(() => {
    fetchReleases();
    fetchChannels();
    fetchStatusCounts();
  }, [fetchReleases, fetchChannels, fetchStatusCounts]);

  // Filter changes
  useEffect(() => {
    fetchReleases(filters);
    fetchStatusCounts(filters);
  }, [filters, fetchReleases, fetchStatusCounts]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchReleases(filters);
    fetchStatusCounts(filters);
  }, [fetchReleases, fetchStatusCounts, filters]);

  // Status double-click handler (FAILED -> PENDING, DOWNLOADED -> WAITING, WAITING -> DOWNLOADED)
  const handleStatusDoubleClick = useCallback(async (release: ReleaseSchema) => {
    if (!release.id) return;
    
    let newStatus: string | null = null;
    let fromStatus: string | null = null;
    
    if (release.status === 'FAILED') {
      newStatus = 'PENDING';
      fromStatus = 'FAILED';
    } else if (release.status === 'DOWNLOADED') {
      newStatus = 'WAITING';
      fromStatus = 'DOWNLOADED';
    } else if (release.status === 'WAITING') {
      newStatus = 'DOWNLOADED';
      fromStatus = 'WAITING';
    } else {
      return;
    }

    const releaseData: ReleaseSchema = {
      ...release,
      status: newStatus,
    };

    const updatedRelease = await updateRelease(release.id, releaseData);

    if (updatedRelease) {
      addNotification({
        type: 'success',
        title: `Status Changed to ${newStatus}`,
        message: `Release "${release.title}" status changed from ${fromStatus} to ${newStatus}`,
      });
      fetchReleases();
      fetchStatusCounts();
    }
  }, [updateRelease, addNotification, fetchReleases, fetchStatusCounts]);

  // Wrap CRUD operations with notifications
  const handleCreateRelease = useCallback(async (data: Partial<ReleaseSchema>) => {
    const newRelease = await createRelease(data as ReleaseSchema);
    if (newRelease) {
      addNotification({
        type: 'success',
        title: 'Release Created',
        message: `Release "${newRelease.title}" has been created successfully.`,
      });
    }
    return newRelease;
  }, [createRelease, addNotification]);

  const handleUpdateRelease = useCallback(async (id: number, data: Partial<ReleaseSchema>) => {
    const updated = await updateRelease(id, data as ReleaseSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Release Updated',
        message: `Release "${updated.title}" has been updated successfully.`,
      });
    }
    return updated;
  }, [updateRelease, addNotification]);

  const handleDeleteRelease = useCallback(async (id: number) => {
    const release = releases.find(r => r.id === id);
    const displayName = release?.title || `Release #${id}`;
    
    const success = await deleteRelease(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Release supprimée',
        message: `La release "${displayName}" a été supprimée avec succès.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Échec de la suppression',
        message: 'Échec de la suppression de la release. Veuillez réessayer.',
      });
    }
    return success;
  }, [deleteRelease, addNotification, releases]);

  return (
    <BasePlaylistPage<ReleaseSchema, MusicReleaseQueryParams>
      labels={labels}
      formFields={releaseFormFields}
      channelOptions={channelOptions}
      showCreateButton={true}
      
      // Data
      playlists={releases}
      loading={loading}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      
      // Actions
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      setFilters={setFilters}
      fetchPlaylists={fetchReleases}
      createPlaylist={handleCreateRelease}
      updatePlaylist={handleUpdateRelease}
      deletePlaylist={handleDeleteRelease}
      
      // Helpers
      getPlaylistId={(r) => r.id ?? undefined}
      getPlaylistName={(r) => r.title || `Release #${r.id}`}
      playlistToFormData={releaseToFormData}
      formDataToPlaylist={formDataToRelease}
      getInitialFormData={getInitialFormData}
      
      // Callbacks
      onStatusDoubleClick={handleStatusDoubleClick}
      
      // Render props
      renderFilterPanel={() => (
        <LazyMusicReleaseFilterPanel
          entityType="releases musicales"
          filters={filters}
          statusCounts={statusCounts}
          onFiltersChange={setFilters}
          loading={loading}
          totalCount={totalCount}
          onRefresh={handleRefresh}
        />
      )}
      renderTable={(props) => (
        <LazyMusicReleaseTable
          releases={props.playlists}
          loading={props.loading}
          onSort={props.onSort}
          sortKey={props.sortKey}
          sortDirection={props.sortDirection}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onStatusDoubleClick={props.onStatusDoubleClick}
        />
      )}
    />
  );
}
