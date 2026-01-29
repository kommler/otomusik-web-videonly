'use client';

import React, { useCallback, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PlaylistFilterPanel } from '../../components/filters/PlaylistFilterPanel';
import { PlaylistTable } from '../../components/tables/PlaylistTable';
import { Button } from '../../components/ui/button';
import { Pagination } from '../../components/ui/pagination';
import { Modal } from '../../components/ui/modal';
import { FormInput, FormTextarea, FormSelect } from '../../components/ui/form';
import { usePlaylistStore } from '../../stores';
import { PlaylistSchema, PlaylistQueryParams } from '../../types/api';
import { useUIStore } from '../../stores/uiStore';
import { useInitialLoad, useFilteredLoad } from '../../lib/hooks';

// Configuration des filtres spécifiques aux playlists
const playlistFilterConfig = {
  sortOptions: [
    { value: 'name', label: 'Nom' },
    { value: 'status', label: 'Statut' },
    { value: 'current_index', label: 'Progression' },
    { value: 'inserted_at', label: 'Date de création' },
    { value: 'updated_at', label: 'Dernière modification' },
    { value: 'downloaded_at', label: 'Date de téléchargement' },
  ],
};

// Status options for playlist editing
const playlistStatusOptions = [
  { value: 'WAITING', label: 'Waiting' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'CURRENT', label: 'Current' },
  { value: 'ANALYZED', label: 'Analyzed' },
  { value: 'FAILED', label: 'Failed' },
];

// Resolution options
const resolutionOptions = [
  { value: '720', label: '720p' },
  { value: '1080', label: '1080p' },
  { value: '1440', label: '1440p' },
  { value: '2160', label: '4K' },
];

const PlaylistsPage: React.FC = () => {
  const {
    // Data
    playlists,
    selectedPlaylist,
    totalCount,
    statusCounts,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    error,
    
    // Filters and pagination
    filters,
    currentPage,
    pageSize,
    
    // Actions
    setFilters,
    setCurrentPage,
    setSelectedPlaylist,
    fetchPlaylists,
    fetchStatusCounts,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    clearError,
    clearSelection,
  } = usePlaylistStore();

  const { addNotification } = useUIStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistSchema | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    topic: '',
    resolution: '',
    status: '',
  });

  // Chargement initial une seule fois (requêtes en parallèle)
  useInitialLoad([
    () => fetchPlaylists(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch seulement quand les filtres changent (skip le premier render)
  useFilteredLoad(filters, [
    () => fetchPlaylists(),
    () => fetchStatusCounts(),
  ], { skipInitial: true });

  // Form handling functions
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      topic: '',
      resolution: '',
      status: '',
    });
  };

  const populateFormWithPlaylist = (playlist: PlaylistSchema) => {
    setFormData({
      name: playlist.name || '',
      description: playlist.description || '',
      url: playlist.url || '',
      topic: playlist.topic || '',
      resolution: playlist.resolution || '',
      status: playlist.status || '',
    });
  };

  // Gestionnaire de changement de filtres
  const handleFiltersChange = useCallback((newFilters: PlaylistQueryParams) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Gestionnaire de changement de page
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  // Gestionnaires d'actions sur les playlists
  const handleView = useCallback((playlist: PlaylistSchema) => {
    setSelectedPlaylist(playlist);
    
    // For now, show a prominent notification that view was clicked
    // TODO: Replace this with actual view modal
    const viewMessage = `👁️ VIEW CLICKED!\n\nPlaylist: ${playlist.name || 'Unnamed'}\nID: ${playlist.id}\nDescription: ${playlist.description || 'No description'}\n\n(View modal not implemented yet)`;
    alert(viewMessage);
    
    // TODO: Implement view modal or navigate to detail page
  }, [setSelectedPlaylist]);

  const handleEdit = useCallback((playlist: PlaylistSchema) => {
    setEditingPlaylist(playlist);
    setSelectedPlaylist(playlist);
    populateFormWithPlaylist(playlist);
    setIsEditModalOpen(true);
  }, [setSelectedPlaylist]);

  const handleEditPlaylist = async () => {
    if (!editingPlaylist?.id) return;

    setFormLoading(true);
    try {
      // Create complete playlist data object with all required fields
      const playlistData: PlaylistSchema = {
        ...editingPlaylist, // Start with existing playlist data
        // Override with form data
        name: formData.name,
        description: formData.description || null,
        url: formData.url,
        topic: formData.topic || null,
        resolution: formData.resolution || null,
        status: formData.status || null,
      };

      const updatedPlaylist = await updatePlaylist(editingPlaylist.id, playlistData);
      
      if (updatedPlaylist) {
        setIsEditModalOpen(false);
        setEditingPlaylist(null);
        resetForm();

        addNotification({
          type: 'success',
          title: 'Playlist Updated',
          message: `Playlist "${updatedPlaylist.name}" has been updated successfully.`,
        });

        // Recharger les données
        fetchPlaylists();
        fetchStatusCounts();
      }
    } catch (error) {
      console.error('Failed to update playlist:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update the playlist. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = useCallback((playlist: PlaylistSchema) => {
    setSelectedPlaylist(playlist);
    // TODO: Implement delete confirmation modal
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la playlist "${playlist.name || playlist.id}" ?`);
    if (confirmDelete) {
      // Here we would call the actual delete API
      // deletePlaylist(playlist.id);
    }
    // setIsDeleteModalOpen(true);
  }, [setSelectedPlaylist]);

  const handleCreate = useCallback(() => {
    clearSelection();
    setIsCreateModalOpen(true);
  }, [clearSelection]);

  // Gestionnaire de création
  const handleCreateSubmit = useCallback(async (playlistData: PlaylistSchema) => {
    const result = await createPlaylist(playlistData);
    if (result) {
      setIsCreateModalOpen(false);
      // Recharger les données
      fetchPlaylists();
      fetchStatusCounts();
    }
  }, [createPlaylist, fetchPlaylists, fetchStatusCounts]);

  // Gestionnaire de mise à jour
  const handleUpdateSubmit = useCallback(async (playlistData: PlaylistSchema) => {
    if (selectedPlaylist?.id) {
      const result = await updatePlaylist(selectedPlaylist.id, playlistData);
      if (result) {
        setIsEditModalOpen(false);
        clearSelection();
        // Recharger les données
        fetchPlaylists();
        fetchStatusCounts();
      }
    }
  }, [selectedPlaylist, updatePlaylist, clearSelection, fetchPlaylists, fetchStatusCounts]);

  // Gestionnaire de suppression
  const handleDeleteConfirm = useCallback(async () => {
    if (selectedPlaylist?.id) {
      const result = await deletePlaylist(selectedPlaylist.id);
      if (result) {
        setIsDeleteModalOpen(false);
        clearSelection();
        // Recharger les données
        fetchPlaylists();
        fetchStatusCounts();
      }
    }
  }, [selectedPlaylist, deletePlaylist, clearSelection, fetchPlaylists, fetchStatusCounts]);

  // Gestionnaire de double-clic sur le statut pour passer en WAITING
  const handleStatusDoubleClick = useCallback(async (playlist: PlaylistSchema) => {
    if (!playlist.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Cannot update playlist: Invalid ID',
      });
      return;
    }

    try {
      // Créer les données de mise à jour avec seulement le statut modifié
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

        // Recharger les données
        fetchPlaylists();
        fetchStatusCounts();
      }
    } catch (error) {
      console.error('Failed to update playlist status:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update playlist status. Please try again.',
      });
    }
  }, [updatePlaylist, addNotification, fetchPlaylists, fetchStatusCounts]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Playlists</h1>
            <p className="text-gray-600 mt-2">
              {totalCount > 0 ? `${totalCount} playlist${totalCount > 1 ? 's' : ''} trouvée${totalCount > 1 ? 's' : ''}` : 'Aucune playlist trouvée'}
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={loading || creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              'Nouvelle Playlist'
            )}
          </Button>
        </div>

        {/* Affichage d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Fermer</span>
              ✕
            </button>
          </div>
        )}

        {/* Panel de filtres */}
        <PlaylistFilterPanel
          entityType="playlists"
          filters={filters}
          statusCounts={statusCounts}
          sortOptions={playlistFilterConfig.sortOptions}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          totalCount={totalCount}
        />

        {/* Contrôles de pagination (haut) */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Table des playlists */}
        <PlaylistTable
          playlists={playlists}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={(playlist) => setSelectedPlaylist(playlist)}
          onStatusDoubleClick={handleStatusDoubleClick}
        />

        {/* Contrôles de pagination (bas) */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* TODO: Modals pour création, édition et suppression */}
        {/* Ces modals peuvent être ajoutés plus tard */}
        
        {/* Debug info (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Total playlists: {totalCount}</p>
            <p>Current page: {currentPage} / {totalPages}</p>
            <p>Filters: {JSON.stringify(filters)}</p>
            <p>Status counts: {JSON.stringify(statusCounts)}</p>
            {selectedPlaylist && (
              <p>Selected playlist: {selectedPlaylist.name || selectedPlaylist.id}</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlaylist(null);
          resetForm();
        }}
        title="Edit Playlist"
        size="lg"
      >
        <div className="space-y-4">
          <FormInput
            label="Name"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            required
          />

          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            rows={3}
            placeholder="Optional description..."
          />

          <FormInput
            label="URL"
            value={formData.url}
            onChange={(e) => handleFormChange('url', e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
          />

          <FormInput
            label="Topic"
            value={formData.topic}
            onChange={(e) => handleFormChange('topic', e.target.value)}
            placeholder="e.g. music, tech, education..."
          />

          <FormSelect
            label="Resolution"
            value={formData.resolution}
            onChange={(e) => handleFormChange('resolution', e.target.value)}
          >
            <option value="">Select resolution</option>
            {resolutionOptions.map((resolution) => (
              <option key={resolution.value} value={resolution.value}>
                {resolution.label}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Status"
            value={formData.status}
            onChange={(e) => handleFormChange('status', e.target.value)}
          >
            <option value="">Select status</option>
            {playlistStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingPlaylist(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditPlaylist}
            disabled={formLoading || !formData.name}
          >
            {formLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              'Update Playlist'
            )}
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default PlaylistsPage;