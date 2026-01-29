'use client';

import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { LazyMusicReleaseTable } from '@/components/tables';
import { LazyMusicReleaseFilterPanel } from '@/components/filters';
import { 
  Button, 
  LazyModal as Modal, 
  Pagination,
  TableSkeleton,
  FilterSkeleton,
  ErrorBoundary,
  LoadingSpinner,
} from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form';
import { useMusicReleaseStore, useMusicChannelStore, useUIStore } from '@/stores';
import { ReleaseSchema, MusicReleaseQueryParams } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

interface ReleaseFormData {
  title: string;
  uploader: string;
  url: string;
  playlist_name: string;
  channel_name: string;
  status: string;
  priority: number;
}

// Available release status options
const releaseStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

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
    createRelease
  } = useMusicReleaseStore();

  const { channels, fetchChannels } = useMusicChannelStore();
  const { addNotification } = useUIStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseSchema | null>(null);
  const [formData, setFormData] = useState<ReleaseFormData>({
    title: '',
    uploader: '',
    url: '',
    playlist_name: '',
    channel_name: '',
    status: '',
    priority: 5,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Chargement initial une seule fois (requêtes en parallèle)
  useInitialLoad([
    () => fetchReleases(),
    () => fetchChannels(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch seulement quand les filtres changent (skip le premier render)
  useFilteredLoad(filters, [
    (f) => fetchReleases(f),
    (f) => fetchStatusCounts(f),
  ], { skipInitial: true });

  const handleCreateRelease = async () => {
    setFormLoading(true);
    try {
      const releaseData: ReleaseSchema = {
        title: formData.title || null,
        uploader: formData.uploader || null,
        url: formData.url || null,
        playlist_name: formData.playlist_name || null,
        channel_name: formData.channel_name || null,
        status: formData.status || null,
        priority: formData.priority || null,
      };

      const newRelease = await createRelease(releaseData);

      if (newRelease) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          uploader: '',
          url: '',
          playlist_name: '',
          channel_name: '',
          status: '',
          priority: 5,
        });

        addNotification({
          type: 'success',
          title: 'Release Created',
          message: `Release "${newRelease.title}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create release:', error);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create the release. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditRelease = async () => {
    if (!editingRelease?.id) return;

    setFormLoading(true);
    try {
      // Create complete release data object with all required fields
      const releaseData: ReleaseSchema = {
        ...editingRelease, // Start with existing release data
        // Override with form data
        title: formData.title || null,
        uploader: formData.uploader || null,
        url: formData.url || null,
        playlist_name: formData.playlist_name || null,
        channel_name: formData.channel_name || null,
        status: formData.status || null,
        priority: formData.priority || null,
      };

      const updatedRelease = await updateRelease(editingRelease.id, releaseData);

      if (updatedRelease) {
        setShowEditModal(false);
        setEditingRelease(null);

        addNotification({
          type: 'success',
          title: 'Release Updated',
          message: `Release "${updatedRelease.title}" has been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to update release:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update the release. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRelease = async (release: ReleaseSchema) => {
    if (!release.id) return;
    if (!confirm(`Are you sure you want to delete "${release.title}"?`)) return;

    const success = await deleteRelease(release.id);

    if (success) {
      addNotification({
        type: 'success',
        title: 'Release Deleted',
        message: `Release "${release.title}" has been deleted successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the release. Please try again.',
      });
    }
  };

  const handleStatusChange = async (release: ReleaseSchema, newStatus: string) => {
    if (!release.id) return;

    try {
      // Create updated release data with new status
      const releaseData: ReleaseSchema = {
        ...release,
        status: newStatus,
      };

      const updatedRelease = await updateRelease(release.id, releaseData);

      if (updatedRelease) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Release status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Failed to update release status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update the release status. Please try again.',
      });
    }
  };

  // Handle double-click on FAILED status to change to PENDING or DOWNLOADED to change to WAITING
  const handleStatusDoubleClick = async (release: ReleaseSchema) => {
    if (!release.id) return;
    
    let newStatus: string | null = null;
    let fromStatus: string | null = null;
    
    if (release.status === 'FAILED') {
      newStatus = 'PENDING';
      fromStatus = 'FAILED';
    } else if (release.status === 'DOWNLOADED') {
      newStatus = 'WAITING';
      fromStatus = 'DOWNLOADED';
    } else {
      return; // No action for other statuses
    }

    try {
      // Create updated release data with new status
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

        // Refresh data to reflect changes
        fetchReleases();
        fetchStatusCounts();
      }
    } catch (error) {
      console.error('Failed to update release status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: `Failed to change status to ${newStatus}. Please try again.`,
      });
    }
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      uploader: '',
      url: '',
      playlist_name: '',
      channel_name: '',
      status: '',
      priority: 5,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (release: ReleaseSchema) => {
    setEditingRelease(release);
    setFormData({
      title: release.title || '',
      uploader: release.uploader || '',
      url: release.url || '',
      playlist_name: release.playlist_name || '',
      channel_name: release.channel_name || '',
      status: release.status || '',
      priority: release.priority || 5,
    });
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof ReleaseFormData, value: string | number | null) => {
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
    fetchReleases(filters);
    fetchStatusCounts(filters);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Releases Musicales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez et organisez vos releases musicales
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Ajouter une Release</span>
          </Button>
        </div>

        {/* Filters - lazy loaded */}
        <div className="mb-6">
          <LazyMusicReleaseFilterPanel
            entityType="releases musicales"
            filters={filters}
            statusCounts={statusCounts}
            onFiltersChange={setFilters}
            loading={loading}
            totalCount={totalCount}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Release Table - lazy loaded */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
                Échec du chargement des releases
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                {error.message}
              </p>
              <Button onClick={reset} variant="secondary">
                Réessayer
              </Button>
            </div>
          )}
        >
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            <>
              {/* Top Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  className="mb-4"
                />
              )}

              <LazyMusicReleaseTable
                releases={releases}
                loading={loading}
                onSort={handleSort}
                sortKey={filters.sort_by}
                sortDirection={filters.sort_order}
                onEdit={openEditModal}
                onDelete={handleDeleteRelease}
                onStatusChange={handleStatusChange}
                onStatusDoubleClick={handleStatusDoubleClick}
              />

              {/* Bottom Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  className="mt-4"
                />
              )}
            </>
          )}
        </ErrorBoundary>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Créer une Nouvelle Release"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Titre"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />

            <FormInput
              label="Artiste"
              value={formData.uploader}
              onChange={(e) => handleFormChange('uploader', e.target.value)}
            />

            <FormInput
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Nom de la playlist"
                value={formData.playlist_name}
                onChange={(e) => handleFormChange('playlist_name', e.target.value)}
              />

              <FormSelect
                label="Canal musical"
                value={formData.channel_name}
                onChange={(e) => handleFormChange('channel_name', e.target.value)}
              >
                <option value="">Sélectionner un canal</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.channel_name || ''}>
                    {channel.channel_name || 'Canal sans nom'}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Statut"
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <option value="">Sélectionner un statut</option>
                {releaseStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Priorité"
                type="number"
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', parseInt(e.target.value) || 5)}
                min="1"
                max="10"
              />
            </div>
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
              onClick={handleCreateRelease}
              disabled={formLoading || !formData.title || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Créer la Release'}
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier la Release"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Titre"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />

            <FormInput
              label="Artiste"
              value={formData.uploader}
              onChange={(e) => handleFormChange('uploader', e.target.value)}
            />

            <FormInput
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Nom de la playlist"
                value={formData.playlist_name}
                onChange={(e) => handleFormChange('playlist_name', e.target.value)}
              />

              <FormSelect
                label="Canal musical"
                value={formData.channel_name}
                onChange={(e) => handleFormChange('channel_name', e.target.value)}
              >
                <option value="">Sélectionner un canal</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.channel_name || ''}>
                    {channel.channel_name || 'Canal sans nom'}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Statut"
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <option value="">Sélectionner un statut</option>
                {releaseStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Priorité"
                type="number"
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', parseInt(e.target.value) || 5)}
                min="1"
                max="10"
              />
            </div>
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
              onClick={handleEditRelease}
              disabled={formLoading || !formData.title || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Mettre à Jour'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}