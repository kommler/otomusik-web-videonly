'use client';

import React, { useCallback, useEffect } from 'react';
import { LazyMusicPlaylistTable } from '@/components/tables';
import { LazyMusicPlaylistFilterPanel } from '@/components/filters';
import { BasePlaylistPage, FormFieldConfig, BasePlaylistPageLabels } from '@/components/pages';
import { useMusicPlaylistStore, useUIStore } from '@/stores';
import { PlaylistSchema, PlaylistQueryParams } from '@/types/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

const playlistFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'url', label: 'URL', type: 'url', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'status', label: 'Statut', type: 'select', gridSpan: 2, options: [
    { value: '', label: 'Sélectionner un statut' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'DOWNLOADING', label: 'Downloading' },
    { value: 'DOWNLOADED', label: 'Downloaded' },
    { value: 'CURRENT', label: 'Current' },
    { value: 'ANALYZED', label: 'Analyzed' },
    { value: 'FAILED', label: 'Failed' },
  ]},
  { name: 'topic', label: 'Topic', type: 'select', gridSpan: 2, options: [
    { value: 'music', label: 'Music' },
    { value: 'video', label: 'Video' },
  ]},
  { name: 'resolution', label: 'Resolution', type: 'select', options: [
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
  ]},
];

const labels: BasePlaylistPageLabels = {
  pageTitle: 'Gestion des Playlists Musicales',
  pageSubtitle: (count: number) => count > 0 
    ? `${count} playlist${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`
    : 'Aucune playlist trouvée',
  createButton: 'Nouvelle Playlist',
  createModalTitle: 'Créer une Nouvelle Playlist Musicale',
  editModalTitle: 'Modifier la Playlist Musicale',
  cancelButton: 'Annuler',
  createSubmitButton: 'Créer la Playlist',
  editSubmitButton: 'Mettre à Jour',
  loadingError: 'Erreur lors du chargement des playlists',
  retryButton: 'Réessayer',
  deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  name: '',
  url: '',
  description: '',
  status: '',
  topic: 'music',
  resolution: 'audio',
});

const playlistToFormData = (playlist: PlaylistSchema): Record<string, unknown> => ({
  name: playlist.name || '',
  url: playlist.url || '',
  description: playlist.description || '',
  status: playlist.status || '',
  topic: playlist.topic || 'music',
  resolution: playlist.resolution || 'audio',
});

const formDataToPlaylist = (
  formData: Record<string, unknown>, 
  existingPlaylist?: PlaylistSchema
): Partial<PlaylistSchema> => ({
  ...(existingPlaylist || {}),
  name: (formData.name as string) || null,
  url: (formData.url as string) || null,
  description: (formData.description as string) || null,
  status: (formData.status as string) || null,
  topic: (formData.topic as string) || null,
  resolution: (formData.resolution as string) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function MusicPlaylistsPage() {
  const {
    playlists,
    loading,
    filters,
    currentPage,
    pageSize,
    totalCount,
    statusCounts,
    fetchPlaylists,
    setFilters,
    setCurrentPage,
    setPageSize,
    fetchStatusCounts,
    updatePlaylist,
    deletePlaylist,
    createPlaylist,
    patchPlaylist,
  } = useMusicPlaylistStore();

  const { addNotification } = useUIStore();

  // Initial load and filter changes
  useEffect(() => {
    fetchPlaylists();
    fetchStatusCounts();
  }, [fetchPlaylists, fetchStatusCounts]);

  useEffect(() => {
    fetchPlaylists(filters);
    fetchStatusCounts(filters);
  }, [filters, fetchPlaylists, fetchStatusCounts]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchPlaylists(filters);
    fetchStatusCounts(filters);
  }, [fetchPlaylists, fetchStatusCounts, filters]);

  // Status double-click to set WAITING
  const handleStatusDoubleClick = useCallback(async (playlist: PlaylistSchema) => {
    if (!playlist.id) return;
    
    const fromStatus = playlist.status;
    const newStatus = 'WAITING';
    
    if (fromStatus === newStatus) return;

    const updatedPlaylist = await patchPlaylist(playlist.id, { status: newStatus });

    if (updatedPlaylist) {
      addNotification({
        type: 'success',
        title: `Status Changed to ${newStatus}`,
        message: `Playlist "${playlist.name}" status changed from ${fromStatus} to ${newStatus}`,
      });
      fetchPlaylists();
      fetchStatusCounts();
    }
  }, [patchPlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  // Wrap CRUD operations with notifications
  const handleCreatePlaylist = useCallback(async (data: Partial<PlaylistSchema>) => {
    const newPlaylist = await createPlaylist(data as PlaylistSchema);
    if (newPlaylist) {
      addNotification({
        type: 'success',
        title: 'Playlist Created',
        message: `Playlist "${newPlaylist.name}" has been created successfully.`,
      });
    }
    return newPlaylist;
  }, [createPlaylist, addNotification]);

  const handleUpdatePlaylist = useCallback(async (id: number, data: Partial<PlaylistSchema>) => {
    const updated = await updatePlaylist(id, data as PlaylistSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Playlist Updated',
        message: `Playlist "${updated.name}" has been updated successfully.`,
      });
    }
    return updated;
  }, [updatePlaylist, addNotification]);

  const handleDeletePlaylist = useCallback(async (id: number) => {
    const playlist = playlists.find(p => p.id === id);
    const displayName = playlist?.name || playlist?.channel_name || `Playlist #${id}`;
    
    const success = await deletePlaylist(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Playlist supprimée',
        message: `La playlist "${displayName}" a été supprimée avec succès.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Échec de la suppression',
        message: 'Échec de la suppression de la playlist. Veuillez réessayer.',
      });
    }
    return success;
  }, [deletePlaylist, addNotification, playlists]);

  return (
    <BasePlaylistPage<PlaylistSchema, PlaylistQueryParams>
      labels={labels}
      formFields={playlistFormFields}
      showCreateButton={true}
      
      // Data
      playlists={playlists}
      loading={loading}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      
      // Actions
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      setFilters={setFilters}
      fetchPlaylists={fetchPlaylists}
      createPlaylist={handleCreatePlaylist}
      updatePlaylist={handleUpdatePlaylist}
      deletePlaylist={handleDeletePlaylist}
      
      // Helpers
      getPlaylistId={(p) => p.id ?? undefined}
      getPlaylistName={(p) => p.name || p.channel_name || `Playlist #${p.id}`}
      playlistToFormData={playlistToFormData}
      formDataToPlaylist={formDataToPlaylist}
      getInitialFormData={getInitialFormData}
      
      // Callbacks
      onStatusDoubleClick={handleStatusDoubleClick}
      
      // Render props
      renderFilterPanel={() => (
        <LazyMusicPlaylistFilterPanel
          entityType="playlists musicales"
          filters={filters}
          statusCounts={statusCounts}
          onFiltersChange={setFilters}
          loading={loading}
          totalCount={totalCount}
          onRefresh={handleRefresh}
        />
      )}
      renderTable={(props) => (
        <LazyMusicPlaylistTable
          playlists={props.playlists}
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
