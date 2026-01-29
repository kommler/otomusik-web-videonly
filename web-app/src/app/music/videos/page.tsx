'use client';

import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { MusicVideoTable } from '@/components/tables';
import { MusicVideoFilterPanel } from '@/components/filters';
import { 
  Button, 
  Modal, 
  Pagination,
  TableSkeleton,
  FilterSkeleton,
  ErrorBoundary,
  LoadingSpinner,
} from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form';
import { useMusicVideoStore, useMusicChannelStore, useUIStore } from '@/stores';
import { MusicVideoSchema } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

interface MusicVideoFormData {
  oto_channel_id: number | null;
  title: string;
  description: string;
  url: string;
  duration: number;
  view_count: number;
  status: string;
}

// Available music video status options
const musicVideoStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

export default function MusicVideosPage() {
  const {
    videos,
    loading,
    filters,
    currentPage,
    pageSize,
    totalCount,
    statusCounts,
    fetchVideos,
    setFilters,
    setCurrentPage,
    setPageSize,
    fetchStatusCounts,
    updateVideo,
    deleteVideo,
    createVideo
  } = useMusicVideoStore();

  const { channels, fetchChannels } = useMusicChannelStore();
  const { addNotification } = useUIStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MusicVideoSchema | null>(null);
  const [formData, setFormData] = useState<MusicVideoFormData>({
    oto_channel_id: null,
    title: '',
    description: '',
    url: '',
    duration: 0,
    view_count: 0,
    status: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Chargement initial une seule fois (requêtes en parallèle)
  useInitialLoad([
    () => fetchVideos(),
    () => fetchChannels(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch seulement quand les filtres changent (skip le premier render)
  useFilteredLoad(filters, [
    (f) => fetchVideos(f),
    (f) => fetchStatusCounts(f),
  ], { skipInitial: true });

  const handleCreateVideo = async () => {
    setFormLoading(true);
    try {
      const videoData: MusicVideoSchema = {
        oto_channel_id: formData.oto_channel_id,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        duration: formData.duration || null,
        view_count: formData.view_count || null,
        status: formData.status || null,
      };

      const newVideo = await createVideo(videoData);

      if (newVideo) {
        setShowCreateModal(false);
        setFormData({
          oto_channel_id: null,
          title: '',
          description: '',
          url: '',
          duration: 0,
          view_count: 0,
          status: '',
        });

        addNotification({
          type: 'success',
          title: 'Music Video Created',
          message: `Video "${newVideo.title}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create music video:', error);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create the music video. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditVideo = async () => {
    if (!editingVideo?.id) return;

    setFormLoading(true);
    try {
      // Create complete video data object with all required fields
      const videoData: MusicVideoSchema = {
        ...editingVideo, // Start with existing video data
        // Override with form data
        oto_channel_id: formData.oto_channel_id,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        duration: formData.duration || null,
        view_count: formData.view_count || null,
        status: formData.status || null,
      };

      const updatedVideo = await updateVideo(editingVideo.id, videoData);

      if (updatedVideo) {
        setShowEditModal(false);
        setEditingVideo(null);

        addNotification({
          type: 'success',
          title: 'Music Video Updated',
          message: `Video "${updatedVideo.title}" has been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to update music video:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update the music video. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVideo = async (video: MusicVideoSchema) => {
    if (!video.id) return;
    if (!confirm(`Are you sure you want to delete "${video.title || video.video_name}"?`)) return;

    const success = await deleteVideo(video.id);

    if (success) {
      addNotification({
        type: 'success',
        title: 'Music Video Deleted',
        message: `Video "${video.title || video.video_name}" has been deleted successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the music video. Please try again.',
      });
    }
  };

  const handleStatusChange = async (video: MusicVideoSchema, newStatus: string) => {
    if (!video.id) return;

    try {
      // Create updated video data with new status
      const videoData: MusicVideoSchema = {
        ...video,
        status: newStatus,
      };

      const updatedVideo = await updateVideo(video.id, videoData);

      if (updatedVideo) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Video status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Failed to update music video status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update the music video status. Please try again.',
      });
    }
  };

  const openCreateModal = () => {
    setFormData({
      oto_channel_id: null,
      title: '',
      description: '',
      url: '',
      duration: 0,
      view_count: 0,
      status: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (video: MusicVideoSchema) => {
    setEditingVideo(video);
    setFormData({
      oto_channel_id: video.oto_channel_id || null,
      title: video.title || video.video_name || '',
      description: video.description || '',
      url: video.url || '',
      duration: video.duration || video.duration_seconds || 0,
      view_count: video.view_count || 0,
      status: video.status || '',
    });
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof MusicVideoFormData, value: string | number | null) => {
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
    fetchVideos(filters);
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
              Music Video Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize your music video content
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Music Video</span>
          </Button>
        </div>

        {/* Filters with Suspense */}
        <div className="mb-6">
          <Suspense fallback={<FilterSkeleton filters={4} />}>
            <MusicVideoFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => {
                setFilters({
                  limit: 100,
                  sort_by: 'updated_at',
                  sort_order: 'desc',
                });
              }}
              activeFiltersCount={Object.keys(filters).filter(key =>
                filters[key as keyof typeof filters] !== undefined &&
                key !== 'limit' &&
                key !== 'sort_by' &&
                key !== 'sort_order'
              ).length}
              statusCounts={statusCounts}
              totalFilteredCount={totalCount}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </Suspense>
        </div>

        {/* Music Video Table with Suspense */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
                Failed to load music videos
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                {error.message}
              </p>
              <Button onClick={reset} variant="secondary">
                Try again
              </Button>
            </div>
          )}
        >
          <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
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

                <MusicVideoTable
                  videos={videos}
                  loading={loading}
                  onSort={handleSort}
                  sortKey={filters.sort_by}
                  sortDirection={filters.sort_order}
                  onEdit={openEditModal}
                  onDelete={handleDeleteVideo}
                  onStatusChange={handleStatusChange}
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
          </Suspense>
        </ErrorBoundary>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Music Video"
          size="lg"
        >
          <div className="space-y-4">
            <FormSelect
              label="Music Channel (optional)"
              value={formData.oto_channel_id || ''}
              onChange={(e) => handleFormChange('oto_channel_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id || ''}>
                  {channel.channel_name || channel.uploader || 'Unnamed Channel'}
                </option>
              ))}
            </FormSelect>

            <FormInput
              label="Title"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
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
                label="Duration (seconds)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleFormChange('duration', parseInt(e.target.value) || 0)}
                min="0"
              />

              <FormInput
                label="View Count"
                type="number"
                value={formData.view_count}
                onChange={(e) => handleFormChange('view_count', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVideo}
              disabled={formLoading || !formData.title || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Create Music Video'}
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Music Video"
          size="lg"
        >
          <div className="space-y-4">
            <FormSelect
              label="Music Channel (optional)"
              value={formData.oto_channel_id || ''}
              onChange={(e) => handleFormChange('oto_channel_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id || ''}>
                  {channel.channel_name || channel.uploader || 'Unnamed Channel'}
                </option>
              ))}
            </FormSelect>

            <FormInput
              label="Title"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />

            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
            >
              <option value="">Select status</option>
              {musicVideoStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FormSelect>

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
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
                label="Duration (seconds)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleFormChange('duration', parseInt(e.target.value) || 0)}
                min="0"
              />

              <FormInput
                label="View Count"
                type="number"
                value={formData.view_count}
                onChange={(e) => handleFormChange('view_count', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditVideo}
              disabled={formLoading || !formData.title || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Update Music Video'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}