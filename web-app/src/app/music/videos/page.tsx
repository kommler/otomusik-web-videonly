'use client';

import React, { useCallback, useMemo } from 'react';
import { LazyMusicVideoTable } from '@/components/tables';
import { LazyMusicVideoFilterPanel } from '@/components/filters';
import { BaseVideoPage, VideoFormFieldConfig, BaseVideoPageLabels, ChannelOption } from '@/components/pages';
import { useMusicVideoStore, useMusicChannelStore, useUIStore } from '@/stores';
import { MusicVideoSchema, MusicVideoQueryParams } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const musicVideoStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

const musicVideoFormFields: VideoFormFieldConfig[] = [
  { name: 'oto_channel_id', label: 'Music Channel (optional)', type: 'channel-select' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'url', label: 'URL', type: 'url', required: true },
  { name: 'status', label: 'Status', type: 'select', options: musicVideoStatusOptions },
  { name: 'duration', label: 'Duration (seconds)', type: 'number', min: 0, gridSpan: 2 },
  { name: 'view_count', label: 'View Count', type: 'number', min: 0, gridSpan: 2 },
];

const labels: BaseVideoPageLabels = {
  pageTitle: 'Music Video Management',
  pageSubtitle: 'Manage and organize your music video content',
  createButton: 'Add Music Video',
  createModalTitle: 'Create New Music Video',
  editModalTitle: 'Edit Music Video',
  cancelButton: 'Cancel',
  createSubmitButton: 'Create Music Video',
  editSubmitButton: 'Update Music Video',
  loadingError: 'Failed to load music videos',
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
});

const videoToFormData = (video: MusicVideoSchema): Record<string, unknown> => ({
  oto_channel_id: video.oto_channel_id || null,
  title: video.title || video.video_name || '',
  description: video.description || '',
  url: video.url || '',
  duration: video.duration || video.duration_seconds || 0,
  view_count: video.view_count || 0,
  status: video.status || '',
});

const formDataToVideo = (
  formData: Record<string, unknown>, 
  existingVideo?: MusicVideoSchema
): Partial<MusicVideoSchema> => ({
  ...(existingVideo || {}),
  oto_channel_id: formData.oto_channel_id as number | null,
  title: formData.title as string,
  description: (formData.description as string) || null,
  url: formData.url as string,
  duration: (formData.duration as number) || null,
  view_count: (formData.view_count as number) || null,
  status: (formData.status as string) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

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
      name: c.channel_name || c.uploader || 'Unnamed Channel',
    })),
    [channels]
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchVideos(filters);
    fetchStatusCounts(filters);
  }, [fetchVideos, fetchStatusCounts, filters]);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setFilters({
      limit: 100,
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  }, [setFilters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => 
    Object.keys(filters).filter(key =>
      filters[key as keyof typeof filters] !== undefined &&
      key !== 'limit' &&
      key !== 'sort_by' &&
      key !== 'sort_order'
    ).length,
    [filters]
  );

  // Status change handler
  const handleStatusChange = useCallback(async (video: MusicVideoSchema, newStatus: string) => {
    if (!video.id) return;

    const videoData: MusicVideoSchema = { ...video, status: newStatus };
    const updatedVideo = await updateVideo(video.id, videoData);
    
    if (updatedVideo) {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Video status changed to ${newStatus}`,
      });
    }
  }, [updateVideo, addNotification]);

  // CRUD with notifications
  const handleCreateVideo = useCallback(async (data: Partial<MusicVideoSchema>) => {
    const newVideo = await createVideo(data as MusicVideoSchema);
    if (newVideo) {
      addNotification({
        type: 'success',
        title: 'Music Video Created',
        message: `Video "${newVideo.title}" has been created successfully.`,
      });
    }
    return newVideo;
  }, [createVideo, addNotification]);

  const handleUpdateVideo = useCallback(async (id: number, data: Partial<MusicVideoSchema>) => {
    const updated = await updateVideo(id, data as MusicVideoSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Music Video Updated',
        message: `Video "${updated.title}" has been updated successfully.`,
      });
    }
    return updated;
  }, [updateVideo, addNotification]);

  const handleDeleteVideo = useCallback(async (id: number) => {
    const video = videos.find(v => v.id === id);
    const displayName = video?.title || video?.video_name || `Video #${id}`;
    
    const success = await deleteVideo(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Music Video Deleted',
        message: `Video "${displayName}" has been deleted successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the music video. Please try again.',
      });
    }
    return success;
  }, [deleteVideo, addNotification, videos]);

  return (
    <BaseVideoPage<MusicVideoSchema, MusicVideoQueryParams>
      labels={labels}
      formFields={musicVideoFormFields}
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
      
      // Render props
      renderFilterPanel={() => (
        <LazyMusicVideoFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          statusCounts={statusCounts}
          totalFilteredCount={totalCount}
          onRefresh={handleRefresh}
          loading={loading}
        />
      )}
      renderTable={(props) => (
        <LazyMusicVideoTable
          videos={props.videos}
          loading={props.loading}
          onSort={props.onSort}
          sortKey={props.sortKey}
          sortDirection={props.sortDirection}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onStatusChange={props.onStatusChange}
        />
      )}
    />
  );
}
