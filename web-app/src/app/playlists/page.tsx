'use client';

import React, { useCallback } from 'react';
import { LazyPlaylistTable } from '@/components/tables';
import { LazyPlaylistFilterPanel } from '@/components/filters';
import { BasePlaylistPage, FormFieldConfig, BasePlaylistPageLabels } from '@/components/pages';
import { usePlaylistStore, useUIStore } from '@/stores';
import { PlaylistSchema, PlaylistQueryParams } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';
import { apiCache } from '@/lib/api/cache';

// ============================================================================
// CONFIGURATION
// ============================================================================

const playlistFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description...' },
  { name: 'url', label: 'URL', type: 'url', placeholder: 'https://www.youtube.com/playlist?list=...' },
  { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. music, tech, education...' },
  { name: 'resolution', label: 'Resolution', type: 'select', options: [
    { value: '', label: 'Select resolution' },
    { value: '720', label: '720p' },
    { value: '1080', label: '1080p' },
    { value: '1440', label: '1440p' },
    { value: '2160', label: '4K' },
  ]},
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: '', label: 'Select status' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'DOWNLOADING', label: 'Downloading' },
    { value: 'DOWNLOADED', label: 'Downloaded' },
    { value: 'CURRENT', label: 'Current' },
    { value: 'ANALYZED', label: 'Analyzed' },
    { value: 'FAILED', label: 'Failed' },
  ]},
];

const sortOptions = [
  { value: 'name', label: 'Nom' },
  { value: 'status', label: 'Statut' },
  { value: 'current_index', label: 'Progression' },
  { value: 'inserted_at', label: 'Date de création' },
  { value: 'updated_at', label: 'Dernière modification' },
  { value: 'downloaded_at', label: 'Date de téléchargement' },
];

const labels: BasePlaylistPageLabels = {
  pageTitle: 'Gestion des Playlists',
  pageSubtitle: (count: number) => count > 0 
    ? `${count} playlist${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`
    : 'Aucune playlist trouvée',
  createButton: 'Nouvelle Playlist',
  createModalTitle: 'Créer une Nouvelle Playlist',
  editModalTitle: 'Edit Playlist',
  cancelButton: 'Cancel',
  createSubmitButton: 'Create Playlist',
  editSubmitButton: 'Update Playlist',
  loadingError: 'Échec du chargement des playlists',
  retryButton: 'Réessayer',
  deleteConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer la playlist "${name}" ?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  name: '',
  description: '',
  url: '',
  topic: '',
  resolution: '',
  status: '',
});

const playlistToFormData = (playlist: PlaylistSchema): Record<string, unknown> => ({
  name: playlist.name || '',
  description: playlist.description || '',
  url: playlist.url || '',
  topic: playlist.topic || '',
  resolution: playlist.resolution || '',
  status: playlist.status || '',
});

const formDataToPlaylist = (
  formData: Record<string, unknown>, 
  existingPlaylist?: PlaylistSchema
): Partial<PlaylistSchema> => ({
  ...(existingPlaylist || {}),
  name: formData.name as string,
  description: (formData.description as string) || null,
  url: (formData.url as string) || null,
  topic: (formData.topic as string) || null,
  resolution: (formData.resolution as string) || null,
  status: (formData.status as string) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PlaylistsPage() {
  const {
    playlists,
    allPlaylists,
    selectedPlaylist,
    totalCount,
    statusCounts,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    setFilters,
    setCurrentPage,
    setSelectedPlaylist,
    fetchPlaylists,
    fetchStatusCounts,
    createPlaylist,
    updatePlaylist,
    patchPlaylist,
    deletePlaylist,
    clearError,
  } = usePlaylistStore();

  const { addNotification } = useUIStore();

  // Initial load
  useInitialLoad([
    () => fetchPlaylists(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch when filters change
  useFilteredLoad(filters, [
    () => fetchPlaylists(),
    () => fetchStatusCounts(),
  ], { skipInitial: true });

  // Handler for filter changes
  const handleFiltersChange = useCallback((newFilters: PlaylistQueryParams) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    apiCache.invalidate('/api/video/playlists');
    fetchPlaylists();
    fetchStatusCounts();
  }, [fetchPlaylists, fetchStatusCounts]);

  // Bulk status change
  const handleBulkStatusChange = useCallback(async (fromStatus: string, toStatus: string) => {
    const targets = allPlaylists.filter(p => p.status === fromStatus && p.id != null);
    await Promise.all(targets.map(p => patchPlaylist(p.id!, { status: toStatus })));
    fetchPlaylists();
    fetchStatusCounts();
    addNotification({
      type: 'success',
      title: 'Statuts mis à jour',
      message: `${targets.length} playlist${targets.length > 1 ? 's' : ''} passée${targets.length > 1 ? 's' : ''} de ${fromStatus} à ${toStatus}.`,
    });
  }, [allPlaylists, patchPlaylist, fetchPlaylists, fetchStatusCounts, addNotification]);

  // View handler
  const handleView = useCallback((playlist: PlaylistSchema) => {
    setSelectedPlaylist(playlist);
    const viewMessage = `👁️ VIEW CLICKED!\n\nPlaylist: ${playlist.name || 'Unnamed'}\nID: ${playlist.id}\nDescription: ${playlist.description || 'No description'}\n\n(View modal not implemented yet)`;
    alert(viewMessage);
  }, [setSelectedPlaylist]);

  // Status double-click to set WAITING
  const handleStatusDoubleClick = useCallback(async (playlist: PlaylistSchema) => {
    if (!playlist.id) return;

    const updatedPlaylistData: PlaylistSchema = {
      ...playlist,
      status: 'WAITING'
    };

    const result = await updatePlaylist(playlist.id, updatedPlaylistData);
    
    if (result) {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Playlist "${playlist.name || playlist.id}" status changed to WAITING`,
      });
      fetchPlaylists();
      fetchStatusCounts();
    }
  }, [updatePlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  // Wrap CRUD operations with notifications
  const handleCreatePlaylist = useCallback(async (data: Partial<PlaylistSchema>) => {
    const newPlaylist = await createPlaylist(data as PlaylistSchema);
    if (newPlaylist) {
      addNotification({
        type: 'success',
        title: 'Playlist Created',
        message: `Playlist "${newPlaylist.name}" has been created successfully.`,
      });
      fetchPlaylists();
      fetchStatusCounts();
    }
    return newPlaylist;
  }, [createPlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  const handleUpdatePlaylist = useCallback(async (id: number, data: Partial<PlaylistSchema>) => {
    const updated = await updatePlaylist(id, data as PlaylistSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Playlist Updated',
        message: `Playlist "${updated.name}" has been updated successfully.`,
      });
      fetchPlaylists();
      fetchStatusCounts();
    }
    return updated;
  }, [updatePlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  const handleDeletePlaylist = useCallback(async (id: number) => {
    const success = await deletePlaylist(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Playlist Deleted',
        message: 'Playlist has been deleted successfully.',
      });
      fetchPlaylists();
      fetchStatusCounts();
    }
    return success;
  }, [deletePlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  return (
    <BasePlaylistPage<PlaylistSchema, PlaylistQueryParams>
      labels={labels}
      formFields={playlistFormFields}
      showCreateButton={true}
      
      // Data
      playlists={playlists}
      loading={loading}
      error={error}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      
      // Actions
      setCurrentPage={setCurrentPage}
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
      onRowClick={setSelectedPlaylist}
      onView={handleView}
      
      // Debug
      showDebugInfo={true}
      debugData={{
        'Total playlists': totalCount,
        'Current page': `${currentPage} / ${Math.ceil(totalCount / pageSize)}`,
        'Filters': filters,
        'Status counts': statusCounts,
        'Selected playlist': selectedPlaylist?.name || selectedPlaylist?.id || 'None',
      }}
      
      // Render props
      renderFilterPanel={() => (
        <LazyPlaylistFilterPanel
          entityType="playlists"
          filters={filters}
          statusCounts={statusCounts}
          sortOptions={sortOptions}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          onBulkStatusChange={handleBulkStatusChange}
          loading={loading}
          totalCount={totalCount}
        />
      )}
      renderTable={(props) => (
        <LazyPlaylistTable
          playlists={props.playlists}
          loading={props.loading}
          onView={props.onView}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onRowClick={props.onRowClick}
          onStatusDoubleClick={props.onStatusDoubleClick}
        />
      )}
    />
  );
}
