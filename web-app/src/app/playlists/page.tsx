'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PlaylistFilterPanel } from '../../components/filters/PlaylistFilterPanel';
import { PlaylistTable } from '../../components/tables/PlaylistTable';
import { Button } from '../../components/ui/button';
import { Pagination } from '../../components/ui/pagination';
import { usePlaylistStore } from '../../stores';
import { PlaylistSchema, PlaylistQueryParams } from '../../types/api';

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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    fetchPlaylists();
    fetchStatusCounts();
  }, [fetchPlaylists, fetchStatusCounts]);

  // Recharger les données quand les filtres changent
  useEffect(() => {
    fetchPlaylists();
    fetchStatusCounts();
  }, [filters, fetchPlaylists, fetchStatusCounts]);

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
    // TODO: Implement view modal or navigate to detail page
    console.log('View playlist:', playlist.name || playlist.id);
  }, [setSelectedPlaylist]);

  const handleEdit = useCallback((playlist: PlaylistSchema) => {
    setSelectedPlaylist(playlist);
    // TODO: Implement edit modal
    console.log('Edit playlist:', playlist.name || playlist.id);
    // setIsEditModalOpen(true);
  }, [setSelectedPlaylist]);

  const handleDelete = useCallback((playlist: PlaylistSchema) => {
    setSelectedPlaylist(playlist);
    // TODO: Implement delete confirmation modal
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la playlist "${playlist.name || playlist.id}" ?`);
    if (confirmDelete) {
      console.log('Delete confirmed for playlist:', playlist.name || playlist.id);
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
    </Layout>
  );
};

export default PlaylistsPage;