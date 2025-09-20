'use client';

import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { VideoTable } from '@/components/tables';
import { FilterPanel } from '@/components/filters';
import { Button, LoadingSpinner, Modal, Pagination } from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form';
import { useVideoStore, useChannelStore, useUIStore } from '@/stores';
import { VideoSchema } from '@/types/api';

interface VideoFormData {
  oto_channel_id: number | null;
  title: string;
  description: string;
  url: string;
  duration: number;
  view_count: number;
  status: string;
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
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchChannels();
    fetchStatusCounts();
  }, [fetchVideos, fetchChannels, fetchStatusCounts]);

  // Re-fetch videos and status counts when filters change
  useEffect(() => {
    fetchVideos(filters);
    fetchStatusCounts(filters);
  }, [filters, fetchVideos, fetchStatusCounts]);

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
    // Met à jour la pagination côté client (pas besoin de fetch)
    const { updatePaginatedVideos } = useVideoStore.getState();
    updatePaginatedVideos();
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = {
      ...filters,
      limit: size,
    };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when changing page size
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

        {/* Filters */}
        <div className="mb-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => {
              setFilters({
                limit: 50,
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
            type="video"
            statusCounts={statusCounts}
            totalFilteredCount={totalCount}
          />
        </div>

        {/* Video Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <VideoTable
              videos={videos}
              loading={loading}
              onSort={handleSort}
              sortKey={filters.sort_by}
              sortDirection={filters.sort_order}
              onEdit={openEditModal}
              onDelete={handleDeleteVideo}
              onStatusChange={handleStatusChange}
            />

            {/* Pagination */}
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