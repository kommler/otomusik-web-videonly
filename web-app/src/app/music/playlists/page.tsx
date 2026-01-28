'use client';

import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { MusicPlaylistTable } from '@/components/tables';
import { MusicPlaylistFilterPanel } from '@/components/filters';
import { Button, LoadingSpinner, Modal, Pagination } from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form';
import { useMusicPlaylistStore, useUIStore } from '@/stores';
import { PlaylistSchema, PlaylistQueryParams } from '@/types/api';

interface PlaylistFormData {
  name: string;
  url: string;
  description: string;
  status: string;
  topic: string;
  resolution: string;
}

// Available playlist status options
const playlistStatusOptions = [
  { value: 'WAITING', label: 'Waiting' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'CURRENT', label: 'Current' },
  { value: 'ANALYZED', label: 'Analyzed' },
  { value: 'FAILED', label: 'Failed' },
];

const topicOptions = [
  { value: 'music', label: 'Music' },
  { value: 'video', label: 'Video' },
];

const resolutionOptions = [
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistSchema | null>(null);
  const [formData, setFormData] = useState<PlaylistFormData>({
    name: '',
    url: '',
    description: '',
    status: '',
    topic: 'music',
    resolution: 'audio',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPlaylists();
    fetchStatusCounts();
  }, [fetchPlaylists, fetchStatusCounts]);

  // Re-fetch playlists and status counts when filters change
  useEffect(() => {
    fetchPlaylists(filters);
    fetchStatusCounts(filters);
  }, [filters, fetchPlaylists, fetchStatusCounts]);

  const handleCreatePlaylist = async () => {
    setFormLoading(true);
    try {
      const playlistData: PlaylistSchema = {
        name: formData.name || null,
        url: formData.url || null,
        description: formData.description || null,
        status: formData.status || null,
        topic: formData.topic || null,
        resolution: formData.resolution || null,
      };

      const newPlaylist = await createPlaylist(playlistData);

      if (newPlaylist) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          url: '',
          description: '',
          status: '',
          topic: 'music',
          resolution: 'audio',
        });

        addNotification({
          type: 'success',
          title: 'Playlist Created',
          message: `Playlist "${newPlaylist.name}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create the playlist. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPlaylist = async () => {
    if (!editingPlaylist?.id) return;

    setFormLoading(true);
    try {
      // Create complete playlist data object with all required fields
      const playlistData: PlaylistSchema = {
        ...editingPlaylist, // Start with existing playlist data
        // Override with form data
        name: formData.name || null,
        url: formData.url || null,
        description: formData.description || null,
        status: formData.status || null,
        topic: formData.topic || null,
        resolution: formData.resolution || null,
      };

      const updatedPlaylist = await updatePlaylist(editingPlaylist.id, playlistData);

      if (updatedPlaylist) {
        setShowEditModal(false);
        setEditingPlaylist(null);

        addNotification({
          type: 'success',
          title: 'Playlist Updated',
          message: `Playlist "${updatedPlaylist.name}" has been updated successfully.`,
        });
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

  const handleDeletePlaylist = async (playlist: PlaylistSchema) => {
    if (!playlist.id) return;
    
    const displayName = playlist.name || playlist.channel_name || `Playlist #${playlist.id}`;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${displayName}" ?`)) return;

    const success = await deletePlaylist(playlist.id);

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
  };

  // Handle double-click on status to change to WAITING
  const handleStatusDoubleClick = async (playlist: PlaylistSchema) => {
    if (!playlist.id) return;
    
    const fromStatus = playlist.status;
    const newStatus = 'WAITING';
    
    if (fromStatus === newStatus) {
      return; // No action needed
    }

    try {
      // Use patch to update only the status field
      const updatedPlaylist = await patchPlaylist(playlist.id, {
        status: newStatus,
      });

      if (updatedPlaylist) {
        addNotification({
          type: 'success',
          title: `Status Changed to ${newStatus}`,
          message: `Playlist "${playlist.name}" status changed from ${fromStatus} to ${newStatus}`,
        });

        // Refresh data to reflect changes
        fetchPlaylists();
        fetchStatusCounts();
      }
    } catch (error) {
      console.error('Failed to update playlist status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: `Failed to change status to ${newStatus}. Please try again.`,
      });
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      status: '',
      topic: 'music',
      resolution: 'audio',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (playlist: PlaylistSchema) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name || '',
      url: playlist.url || '',
      description: playlist.description || '',
      status: playlist.status || '',
      topic: playlist.topic || 'music',
      resolution: playlist.resolution || 'audio',
    });
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof PlaylistFormData, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    const newFilters = {
      ...filters,
      sort_by: key,
      sort_order: direction,
    };
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    // Update page size in store (this will automatically trigger pagination update)
    setPageSize(size);
    
    // Update filters with new limit
    const newFilters = {
      ...filters,
      limit: size,
    };
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    // Refresh all data
    fetchPlaylists(filters);
    fetchStatusCounts(filters);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Playlists Musicales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {totalCount > 0 ? `${totalCount} playlist${totalCount > 1 ? 's' : ''} trouvée${totalCount > 1 ? 's' : ''}` : 'Aucune playlist trouvée'}
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            disabled={loading || formLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {formLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              'Nouvelle Playlist'
            )}
          </Button>
        </div>

        {/* Filters */}
        <MusicPlaylistFilterPanel
            entityType="playlists musicales"
            filters={filters}
            statusCounts={statusCounts}
            onFiltersChange={setFilters}
            loading={loading}
            totalCount={totalCount}
            onRefresh={handleRefresh}
          />

        {/* Top Pagination */}
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

        {/* Playlist Table */}
        <MusicPlaylistTable
              playlists={playlists}
              loading={loading}
              onSort={handleSort}
              sortKey={filters.sort_by}
              sortDirection={filters.sort_order}
              onEdit={openEditModal}
              onDelete={handleDeletePlaylist}
              onStatusDoubleClick={handleStatusDoubleClick}
            />

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>        )}

        {/* Create Modal */}        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Créer une Nouvelle Playlist Musicale"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Nom"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <FormInput
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Statut"
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <option value="">Sélectionner un statut</option>
                {playlistStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Topic"
                value={formData.topic}
                onChange={(e) => handleFormChange('topic', e.target.value)}
              >
                {topicOptions.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <FormSelect
              label="Resolution"
              value={formData.resolution}
              onChange={(e) => handleFormChange('resolution', e.target.value)}
            >
              {resolutionOptions.map((resolution) => (
                <option key={resolution.value} value={resolution.value}>
                  {resolution.label}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={formLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={formLoading || !formData.name || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Créer la Playlist'}
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier la Playlist Musicale"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Nom"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <FormInput
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Statut"
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <option value="">Sélectionner un statut</option>
                {playlistStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Topic"
                value={formData.topic}
                onChange={(e) => handleFormChange('topic', e.target.value)}
              >
                {topicOptions.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <FormSelect
              label="Resolution"
              value={formData.resolution}
              onChange={(e) => handleFormChange('resolution', e.target.value)}
            >
              {resolutionOptions.map((resolution) => (
                <option key={resolution.value} value={resolution.value}>
                  {resolution.label}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={formLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditPlaylist}
              disabled={formLoading || !formData.name || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Mettre à Jour'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
