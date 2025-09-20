'use client';

import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { ChannelTable } from '@/components/tables';
import { FilterPanel } from '@/components/filters';
import { Button, LoadingSpinner, Modal, Pagination } from '@/components/ui';
import { FormInput, FormTextarea } from '@/components/ui/form';
import { useChannelStore, useUIStore } from '@/stores';
import { ChannelSchema } from '@/types/api';

interface ChannelFormData {
  name: string;
  description: string;
  url: string;
  uploader: string;
  resolution: string;
  status: string;
  max_videos: number;
  refresh_interval_days: number;
}

// Status options for channels
const channelStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ERROR', label: 'Error' },
  { value: 'FAILED', label: 'Failed' },
];

export default function ChannelsPage() {
  const { 
    channels, 
    loading, 
    filters, 
    currentPage,
    pageSize,
    totalCount,
    statusCounts,
    fetchChannels, 
    setFilters,
    setCurrentPage,
    fetchStatusCounts,
    updateChannel,
    deleteChannel,
    createChannel
  } = useChannelStore();
  
  const { addNotification } = useUIStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelSchema | null>(null);
  const [formData, setFormData] = useState<ChannelFormData>({
    name: '',
    description: '',
    url: '',
    uploader: '',
    resolution: '',
    status: '',
    max_videos: 100,
    refresh_interval_days: 7,
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchStatusCounts();
  }, [fetchChannels, fetchStatusCounts]);

  // Re-fetch channels and status counts when filters change
  useEffect(() => {
    fetchChannels();
    fetchStatusCounts(filters);
  }, [filters, fetchChannels, fetchStatusCounts]);

  const handleCreateChannel = async () => {
    setFormLoading(true);
    try {
      const channelData: ChannelSchema = {
        name: formData.name,
        description: formData.description || null,
        url: formData.url,
        uploader: formData.uploader || null,
        resolution: formData.resolution || null,
        status: formData.status || null,
        max_videos: formData.max_videos || null,
        refresh_interval_days: formData.refresh_interval_days || null,
      };

      const newChannel = await createChannel(channelData);
      
      if (newChannel) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          url: '',
          uploader: '',
          resolution: '',
          status: '',
          max_videos: 100,
          refresh_interval_days: 7,
        });

        addNotification({
          type: 'success',
          title: 'Channel Created',
          message: `Channel "${newChannel.name}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create the channel. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditChannel = async () => {
    if (!editingChannel?.id) return;

    setFormLoading(true);
    try {
      // Create complete channel data object with all required fields
      const channelData: ChannelSchema = {
        ...editingChannel, // Start with existing channel data
        // Override with form data
        name: formData.name,
        description: formData.description || null,
        url: formData.url,
        uploader: formData.uploader || null,
        resolution: formData.resolution || null,
        status: formData.status || null,
        max_videos: formData.max_videos || null,
        refresh_interval_days: formData.refresh_interval_days || null,
      };

      const updatedChannel = await updateChannel(editingChannel.id, channelData);
      
      if (updatedChannel) {
        setShowEditModal(false);
        setEditingChannel(null);

        addNotification({
          type: 'success',
          title: 'Channel Updated',
          message: `Channel "${updatedChannel.name}" has been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to update channel:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update the channel. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteChannel = async (channel: ChannelSchema) => {
    if (!channel.id) return;
    if (!confirm(`Are you sure you want to delete "${channel.name || channel.uploader}"?`)) return;

    const success = await deleteChannel(channel.id);
    
    if (success) {
      addNotification({
        type: 'success',
        title: 'Channel Deleted',
        message: `Channel "${channel.name || channel.uploader}" has been deleted successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete the channel. Please try again.',
      });
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      uploader: '',
      resolution: '',
      status: '',
      max_videos: 100,
      refresh_interval_days: 7,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (channel: ChannelSchema) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name || '',
      description: channel.description || '',
      url: channel.url || '',
      uploader: channel.uploader || '',
      resolution: channel.resolution || '',
      status: channel.status || '',
      max_videos: channel.max_videos || 100,
      refresh_interval_days: channel.refresh_interval_days || 7,
    });
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof ChannelFormData, value: string | number) => {
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
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Channel Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize your channel sources
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Channel</span>
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
            type="channel"
            statusCounts={statusCounts}
          />
        </div>

        {/* Channel Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <ChannelTable
              channels={channels}
              loading={loading}
              onSort={handleSort}
              sortKey={filters.sort_by}
              sortDirection={filters.sort_order}
              onEdit={openEditModal}
              onDelete={handleDeleteChannel}
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
          title="Create New Channel"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Channel Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <FormInput
              label="Uploader"
              value={formData.uploader}
              onChange={(e) => handleFormChange('uploader', e.target.value)}
            />

            <FormInput
              label="Resolution"
              value={formData.resolution}
              onChange={(e) => handleFormChange('resolution', e.target.value)}
              placeholder="e.g., 1080p, 720p, 4K"
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
            />

            <FormInput
              label="Channel URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Max Videos"
                type="number"
                value={formData.max_videos}
                onChange={(e) => handleFormChange('max_videos', parseInt(e.target.value) || 100)}
                min="1"
              />

              <FormInput
                label="Refresh Interval (days)"
                type="number"
                value={formData.refresh_interval_days}
                onChange={(e) => handleFormChange('refresh_interval_days', parseInt(e.target.value) || 7)}
                min="1"
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
              onClick={handleCreateChannel}
              disabled={formLoading || !formData.name || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Create Channel'}
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Channel"
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Channel Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <FormInput
              label="Uploader"
              value={formData.uploader}
              onChange={(e) => handleFormChange('uploader', e.target.value)}
            />

            <FormInput
              label="Resolution"
              value={formData.resolution}
              onChange={(e) => handleFormChange('resolution', e.target.value)}
              placeholder="e.g., 1080p, 720p, 4K"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {channelStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
            />

            <FormInput
              label="Channel URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Max Videos"
                type="number"
                value={formData.max_videos}
                onChange={(e) => handleFormChange('max_videos', parseInt(e.target.value) || 100)}
                min="1"
              />

              <FormInput
                label="Refresh Interval (days)"
                type="number"
                value={formData.refresh_interval_days}
                onChange={(e) => handleFormChange('refresh_interval_days', parseInt(e.target.value) || 7)}
                min="1"
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
              onClick={handleEditChannel}
              disabled={formLoading || !formData.name || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Update Channel'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}