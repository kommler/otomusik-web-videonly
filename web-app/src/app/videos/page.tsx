'use client';

import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { LazyVideoTable } from '@/components/tables';
import { LazyVideoFilterPanel } from '@/components/filters';
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
import { useVideoStore, useChannelStore, useUIStore } from '@/stores';
import { VideoSchema } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

interface VideoFormData {
  oto_channel_id: number | null;
  title: string;
  description: string;
  url: string;
  duration: number;
  view_count: number;
  status: string;
  resolution: string;
}

// Available video status options
const videoStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

// Available resolution options (matching yt-dlp format values)
const resolutionOptions = [
  { value: '144', label: '144p' },
  { value: '240', label: '240p' },
  { value: '360', label: '360p' },
  { value: '480', label: '480p' },
  { value: '720', label: '720p (HD)' },
  { value: '1080', label: '1080p (Full HD)' },
  { value: '1440', label: '1440p (2K)' },
  { value: '2160', label: '2160p (4K)' },
  { value: 'best', label: 'Best available' },
  { value: 'worst', label: 'Worst available' },
];

export default function VideosPage() {
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
  } = useVideoStore();
  
  const { channels, fetchChannels } = useChannelStore();
  const { addNotification } = useUIStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoSchema | null>(null);
  const [formData, setFormData] = useState<VideoFormData>({
    oto_channel_id: null,
    title: '',
    description: '',
    url: '',
    duration: 0,
    view_count: 0,
    status: '',
    resolution: '',
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
      const videoData: VideoSchema = {
        oto_channel_id: formData.oto_channel_id,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        duration: formData.duration || null,
        view_count: formData.view_count || null,
        status: formData.status || null,
        resolution: formData.resolution || null,
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
          resolution: '',
        });

        addNotification({
          type: 'success',
          title: 'Video Created',
          message: `Video "${newVideo.title}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create video:', error);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create the video. Please try again.',
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
      const videoData: VideoSchema = {
        ...editingVideo, // Start with existing video data
        // Override with form data
        oto_channel_id: formData.oto_channel_id,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        duration: formData.duration || null,
        view_count: formData.view_count || null,
        status: formData.status || null,
        resolution: formData.resolution || null,
      };

      const updatedVideo = await updateVideo(editingVideo.id, videoData);
      
      if (updatedVideo) {
        setShowEditModal(false);
        setEditingVideo(null);

        addNotification({
          type: 'success',
          title: 'Video Updated',
          message: `Video "${updatedVideo.title}" has been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to update video:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update the video. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVideo = async (video: VideoSchema) => {
    if (!video.id) return;
    if (!confirm(`Are you sure you want to delete "${video.title || video.video_name}"?`)) return;

    const success = await deleteVideo(video.id);
    
    if (success) {
      addNotification({
        type: 'success',
        title: 'Video Deleted',
        message: `Video "${video.title || video.video_name}" has been deleted successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the video. Please try again.',
      });
    }
  };

  const handleStatusChange = async (video: VideoSchema, newStatus: string) => {
    if (!video.id) return;

    try {
      // Create updated video data with new status
      const videoData: VideoSchema = {
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
      console.error('Failed to update video status:', error);
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Failed to update the video status. Please try again.',
      });
    }
  };

  // Gestionnaire de double-clic sur le statut pour passer en PENDING et reset downloaded_at
  const handleStatusDoubleClick = async (video: VideoSchema) => {
    if (!video.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Cannot update video: Invalid ID',
      });
      return;
    }

    try {
      // Créer les données de mise à jour avec statut PENDING et downloaded_at à null
      const updatedVideoData: VideoSchema = {
        ...video,
        status: 'PENDING',
        downloaded_at: null
      };

      const result = await updateVideo(video.id, updatedVideoData);
      
      if (result) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Video "${video.title || video.video_name || video.id}" status changed to PENDING and download date reset`,
        });

        // Recharger les données pour refléter les changements
        fetchVideos(filters);
        fetchStatusCounts(filters);
      }
    } catch (error) {
      console.error('Failed to update video status:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update video status. Please try again.',
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
      resolution: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (video: VideoSchema) => {
    setEditingVideo(video);
    
    setFormData({
      oto_channel_id: video.oto_channel_id || null,
      title: video.title || video.video_name || '',
      description: video.description || '',
      url: video.url || '',
      duration: video.duration || video.duration_seconds || 0,
      view_count: video.view_count || 0,
      status: video.status || '',
      resolution: video.resolution || '',
    });
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof VideoFormData, value: string | number | null) => {
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
              Video Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize your video content
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Video</span>
          </Button>
        </div>

        {/* Filters - lazy loaded */}
        <div className="mb-6">
          <LazyVideoFilterPanel />
        </div>

        {/* Video Table - lazy loaded */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
                Failed to load videos
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
              
              <LazyVideoTable
                videos={videos}
                loading={loading}
                onSort={handleSort}
                sortKey={filters.sort_by}
                sortDirection={filters.sort_order}
                onEdit={openEditModal}
                onDelete={handleDeleteVideo}
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
          title="Create New Video"
          size="lg"
        >
          <div className="space-y-4">
            <FormSelect
              label="Channel (optional)"
              value={formData.oto_channel_id || ''}
              onChange={(e) => handleFormChange('oto_channel_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id || ''}>
                  {channel.name || channel.uploader || 'Unnamed Channel'}
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
              {formLoading ? <LoadingSpinner size="sm" /> : 'Create Video'}
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Video"
          size="lg"
        >
          <div className="space-y-4">
            <FormSelect
              label="Channel (optional)"
              value={formData.oto_channel_id || ''}
              onChange={(e) => handleFormChange('oto_channel_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id || ''}>
                  {channel.name || channel.uploader || 'Unnamed Channel'}
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
              {videoStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FormSelect>

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
              {formLoading ? <LoadingSpinner size="sm" /> : 'Update Video'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}