'use client';

import React, { useCallback, useMemo } from 'react';
import { LazyVideoTable } from '@/components/tables';
import { LazyVideoFilterPanel } from '@/components/filters';
import { BaseVideoPage, VideoFormFieldConfig, BaseVideoPageLabels, ChannelOption } from '@/components/pages';
import { useVideoStore, useChannelStore, useUIStore } from '@/stores';
import { VideoSchema, VideoQueryParams } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const videoStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

const resolutionOptions = [
  { value: '', label: 'Select resolution' },
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

const videoFormFields: VideoFormFieldConfig[] = [
  { name: 'oto_channel_id', label: 'Channel (optional)', type: 'channel-select' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'url', label: 'URL', type: 'url', required: true },
  { name: 'resolution', label: 'Resolution', type: 'select', options: resolutionOptions },
  { name: 'status', label: 'Status', type: 'select', options: videoStatusOptions },
  { name: 'duration', label: 'Duration (seconds)', type: 'number', min: 0, gridSpan: 2 },
  { name: 'view_count', label: 'View Count', type: 'number', min: 0, gridSpan: 2 },
];

const labels: BaseVideoPageLabels = {
  pageTitle: 'Video Management',
  pageSubtitle: 'Manage and organize your video content',
  createButton: 'Add Video',
  createModalTitle: 'Create New Video',
  editModalTitle: 'Edit Video',
  cancelButton: 'Cancel',
  createSubmitButton: 'Create Video',
  editSubmitButton: 'Update Video',
  loadingError: 'Failed to load videos',
  retryButton: 'Try again',
  deleteConfirm: (name: string) => `Are you sure you want to delete "${name}"?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  oto_channel_id: null as number | null,
  title: '',
  description: '',
  url: '',
  duration: 0,
  view_count: 0,
  status: '',
  resolution: '',
});

const videoToFormData = (video: VideoSchema): Record<string, unknown> => ({
  oto_channel_id: video.oto_channel_id || null,
  title: video.title || video.video_name || '',
  description: video.description || '',
  url: video.url || '',
  duration: video.duration || video.duration_seconds || 0,
  view_count: video.view_count || 0,
  status: video.status || '',
  resolution: video.resolution || '',
});

const formDataToVideo = (
  formData: Record<string, unknown>, 
  existingVideo?: VideoSchema
): Partial<VideoSchema> => ({
  ...(existingVideo || {}),
  oto_channel_id: formData.oto_channel_id as number | null,
  title: formData.title as string,
  description: (formData.description as string) || null,
  url: formData.url as string,
  duration: (formData.duration as number) || null,
  view_count: (formData.view_count as number) || null,
  status: (formData.status as string) || null,
  resolution: (formData.resolution as string) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

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

  // Initial load
  useInitialLoad([
    () => fetchVideos(),
    () => fetchChannels(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch when filters change
  useFilteredLoad(filters, [
    (f) => fetchVideos(f),
    (f) => fetchStatusCounts(f),
  ], { skipInitial: true });

  // Channel options for select
  const channelOptions: ChannelOption[] = useMemo(() => 
    channels.map(c => ({
      id: c.id,
      name: c.name || c.uploader || 'Unnamed Channel',
    })),
    [channels]
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchVideos(filters);
    fetchStatusCounts(filters);
  }, [fetchVideos, fetchStatusCounts, filters]);

  // Status change handler
  const handleStatusChange = useCallback(async (video: VideoSchema, newStatus: string) => {
    if (!video.id) return;

    const videoData: VideoSchema = { ...video, status: newStatus };
    const updatedVideo = await updateVideo(video.id, videoData);
    
    if (updatedVideo) {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Video status changed to ${newStatus}`,
      });
    }
  }, [updateVideo, addNotification]);

  // Status double-click to set PENDING and reset downloaded_at
  const handleStatusDoubleClick = useCallback(async (video: VideoSchema) => {
    if (!video.id) return;

    const updatedVideoData: VideoSchema = {
      ...video,
      status: 'PENDING',
      downloaded_at: null,
    };

    const result = await updateVideo(video.id, updatedVideoData);
    
    if (result) {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Video "${video.title || video.video_name || video.id}" status changed to PENDING and download date reset`,
      });
      fetchVideos(filters);
      fetchStatusCounts(filters);
    }
  }, [updateVideo, addNotification, fetchVideos, fetchStatusCounts, filters]);

  // CRUD with notifications
  const handleCreateVideo = useCallback(async (data: Partial<VideoSchema>) => {
    const newVideo = await createVideo(data as VideoSchema);
    if (newVideo) {
      addNotification({
        type: 'success',
        title: 'Video Created',
        message: `Video "${newVideo.title}" has been created successfully.`,
      });
    }
    return newVideo;
  }, [createVideo, addNotification]);

  const handleUpdateVideo = useCallback(async (id: number, data: Partial<VideoSchema>) => {
    const updated = await updateVideo(id, data as VideoSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Video Updated',
        message: `Video "${updated.title}" has been updated successfully.`,
      });
    }
    return updated;
  }, [updateVideo, addNotification]);

  const handleDeleteVideo = useCallback(async (id: number) => {
    const success = await deleteVideo(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Video Deleted',
        message: 'Video has been deleted successfully.',
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the video. Please try again.',
      });
    }
    return success;
  }, [deleteVideo, addNotification]);

  return (
    <BaseVideoPage<VideoSchema, VideoQueryParams>
      labels={labels}
      formFields={videoFormFields}
      channelOptions={channelOptions}
      showCreateButton={true}
      
      // Data
      videos={videos}
      loading={loading}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      
      // Actions
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      setFilters={setFilters}
      fetchVideos={fetchVideos}
      createVideo={handleCreateVideo}
      updateVideo={handleUpdateVideo}
      deleteVideo={handleDeleteVideo}
      
      // Helpers
      getVideoId={(v) => v.id ?? undefined}
      getVideoName={(v) => v.title || v.video_name || 'Unknown'}
      videoToFormData={videoToFormData}
      formDataToVideo={formDataToVideo}
      getInitialFormData={getInitialFormData}
      
      // Callbacks
      onStatusChange={handleStatusChange}
      onStatusDoubleClick={handleStatusDoubleClick}
      
      // Render props
      renderFilterPanel={() => <LazyVideoFilterPanel />}
      renderTable={(props) => (
        <LazyVideoTable
          videos={props.videos}
          loading={props.loading}
          onSort={props.onSort}
          sortKey={props.sortKey}
          sortDirection={props.sortDirection}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onStatusChange={props.onStatusChange}
          onStatusDoubleClick={props.onStatusDoubleClick}
        />
      )}
    />
  );
}
