'use client';

import React from 'react';
import { LazyChannelTable } from '@/components/tables';
import { LazyChannelFilterPanel } from '@/components/filters';
import { BaseChannelPage, FormFieldConfig, BaseChannelPageLabels } from '@/components/pages';
import { useChannelStore, useUIStore } from '@/stores';
import { ChannelSchema } from '@/types/api';
import { useInitialLoad, useFilteredLoad } from '@/lib/hooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const channelFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Channel Name', type: 'text', required: true },
  { name: 'uploader', label: 'Uploader', type: 'text' },
  { name: 'resolution', label: 'Resolution', type: 'text', placeholder: 'e.g., 1080p, 720p, 4K' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'url', label: 'Channel URL', type: 'url', required: true },
  { name: 'status', label: 'Status', type: 'select' },
  { name: 'max_videos', label: 'Max Videos', type: 'number', min: 1, gridSpan: 2 },
  { name: 'refresh_interval_days', label: 'Refresh Interval (days)', type: 'number', min: 1, gridSpan: 2 },
];

const channelStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SCRAPING', label: 'Scraping' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'ERROR', label: 'Error' },
  { value: 'FAILED', label: 'Failed' },
];

const labels: BaseChannelPageLabels = {
  pageTitle: 'Channel Management',
  pageSubtitle: 'Manage and organize your channel sources',
  createButton: 'Add Channel',
  createModalTitle: 'Create New Channel',
  editModalTitle: 'Edit Channel',
  cancelButton: 'Cancel',
  createSubmitButton: 'Create Channel',
  editSubmitButton: 'Update Channel',
  loadingError: 'Failed to load channels',
  retryButton: 'Try again',
  deleteConfirm: (name: string) => `Are you sure you want to delete "${name}"?`,
};

// ============================================================================
// HELPERS
// ============================================================================

const getInitialFormData = () => ({
  name: '',
  description: '',
  url: '',
  uploader: '',
  resolution: '',
  status: '',
  max_videos: 100,
  refresh_interval_days: 7,
});

const channelToFormData = (channel: ChannelSchema): Record<string, unknown> => ({
  name: channel.name || '',
  description: channel.description || '',
  url: channel.url || '',
  uploader: channel.uploader || '',
  resolution: channel.resolution || '',
  status: channel.status || '',
  max_videos: channel.max_videos || 100,
  refresh_interval_days: channel.refresh_interval_days || 7,
});

const formDataToChannel = (
  formData: Record<string, unknown>, 
  existingChannel?: ChannelSchema
): Partial<ChannelSchema> => ({
  ...(existingChannel || {}),
  name: formData.name as string,
  description: (formData.description as string) || null,
  url: formData.url as string,
  uploader: (formData.uploader as string) || null,
  resolution: (formData.resolution as string) || null,
  status: (formData.status as string) || null,
  max_videos: (formData.max_videos as number) || null,
  refresh_interval_days: (formData.refresh_interval_days as number) || null,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ChannelsPage() {
  const { 
    channels, 
    loading, 
    filters, 
    currentPage,
    pageSize,
    totalCount,
    fetchChannels, 
    setFilters,
    setCurrentPage,
    setPageSize,
    fetchStatusCounts,
    updateChannel,
    deleteChannel,
    createChannel
  } = useChannelStore();
  
  const { addNotification } = useUIStore();

  // Initial load
  useInitialLoad([
    () => fetchChannels(),
    () => fetchStatusCounts(),
  ]);

  // Re-fetch when filters change
  useFilteredLoad(filters, [
    () => fetchChannels(),
    () => fetchStatusCounts(filters),
  ], { skipInitial: true });

  // Wrap CRUD operations with notifications
  const handleCreateChannel = async (data: Partial<ChannelSchema>) => {
    const newChannel = await createChannel(data as ChannelSchema);
    if (newChannel) {
      addNotification({
        type: 'success',
        title: 'Channel Created',
        message: `Channel "${newChannel.name}" has been created successfully.`,
      });
    }
    return newChannel;
  };

  const handleUpdateChannel = async (id: number, data: Partial<ChannelSchema>) => {
    const updated = await updateChannel(id, data as ChannelSchema);
    if (updated) {
      addNotification({
        type: 'success',
        title: 'Channel Updated',
        message: `Channel "${updated.name}" has been updated successfully.`,
      });
    }
    return updated;
  };

  const handleDeleteChannel = async (id: number) => {
    const success = await deleteChannel(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Channel Deleted',
        message: 'Channel has been deleted successfully.',
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the channel. Please try again.',
      });
    }
    return success;
  };

  return (
    <BaseChannelPage<ChannelSchema, typeof filters>
      labels={labels}
      formFields={channelFormFields}
      statusOptions={channelStatusOptions}
      showCreateButton={true}
      
      // Data
      channels={channels}
      loading={loading}
      filters={filters}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      
      // Actions
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      setFilters={setFilters}
      fetchChannels={fetchChannels}
      createChannel={handleCreateChannel}
      updateChannel={handleUpdateChannel}
      deleteChannel={handleDeleteChannel}
      
      // Helpers
      getChannelId={(c) => c.id ?? undefined}
      getChannelName={(c) => c.name || c.uploader || 'Unknown'}
      channelToFormData={channelToFormData}
      formDataToChannel={formDataToChannel}
      getInitialFormData={getInitialFormData}
      
      // Render props
      renderFilterPanel={() => <LazyChannelFilterPanel />}
      renderTable={(props) => (
        <LazyChannelTable
          channels={props.channels}
          loading={props.loading}
          onSort={props.onSort}
          sortKey={props.sortKey}
          sortDirection={props.sortDirection}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />
      )}
    />
  );
}
