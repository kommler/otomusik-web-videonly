'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { 
  Button, 
  LazyModal as Modal, 
  Pagination,
  TableSkeleton,
  ErrorBoundary,
  LoadingSpinner,
} from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form';

// ============================================================================
// TYPES
// ============================================================================

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'textarea' | 'select' | 'channel-select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  gridSpan?: 1 | 2; // Pour les layouts 2 colonnes
  min?: number;
}

export interface BaseVideoPageLabels {
  pageTitle: string;
  pageSubtitle?: string;
  createButton?: string;
  createModalTitle?: string;
  editModalTitle: string;
  cancelButton: string;
  createSubmitButton: string;
  editSubmitButton: string;
  loadingError: string;
  retryButton: string;
  deleteConfirm: (name: string) => string;
}

export interface ChannelOption {
  id: number | null | undefined;
  name: string;
}

export interface BaseVideoPageConfig<TVideo, TFilters> {
  // Labels (i18n)
  labels: BaseVideoPageLabels;
  
  // Form fields configuration
  formFields: FormFieldConfig[];
  
  // Channel options for select
  channelOptions?: ChannelOption[];
  
  // Show create button and modal
  showCreateButton?: boolean;
  
  // Components to render (passed as children or render props)
  renderFilterPanel: () => ReactNode;
  renderTable: (props: {
    videos: TVideo[];
    loading: boolean;
    onSort: (key: string, direction?: 'asc' | 'desc') => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onEdit: (video: TVideo) => void;
    onDelete: (video: TVideo) => void;
    onStatusChange?: (video: TVideo, newStatus: string) => void;
    onStatusDoubleClick?: (video: TVideo) => void;
  }) => ReactNode;
  
  // Data and state from store
  videos: TVideo[];
  loading: boolean;
  error?: string | null;
  filters: TFilters;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  
  // Store actions
  setCurrentPage: (page: number) => void;
  setPageSize?: (size: number) => void;
  setFilters: (filters: TFilters) => void;
  fetchVideos: (filters?: TFilters) => Promise<void>;
  
  // CRUD operations
  createVideo?: (data: Partial<TVideo>) => Promise<TVideo | null>;
  updateVideo: (id: number, data: Partial<TVideo>) => Promise<TVideo | null>;
  deleteVideo: (id: number) => Promise<boolean>;
  
  // Helpers to extract data from video
  getVideoId: (video: TVideo) => number | null | undefined;
  getVideoName: (video: TVideo) => string;
  videoToFormData: (video: TVideo) => Record<string, unknown>;
  formDataToVideo: (formData: Record<string, unknown>, existingVideo?: TVideo) => Partial<TVideo>;
  getInitialFormData: () => Record<string, unknown>;
  
  // Optional callbacks
  onStatusChange?: (video: TVideo, newStatus: string) => Promise<void>;
  onStatusDoubleClick?: (video: TVideo) => Promise<void>;
  
  // Optional: additional header content
  headerExtra?: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BaseVideoPage<TVideo, TFilters>({
  labels,
  formFields,
  channelOptions = [],
  showCreateButton = false,
  renderFilterPanel,
  renderTable,
  videos,
  loading,
  error,
  filters,
  currentPage,
  pageSize,
  totalCount,
  setCurrentPage,
  setPageSize,
  setFilters,
  fetchVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoId,
  getVideoName,
  videoToFormData,
  formDataToVideo,
  getInitialFormData,
  onStatusChange,
  onStatusDoubleClick,
  headerExtra,
}: BaseVideoPageConfig<TVideo, TFilters>) {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TVideo | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(getInitialFormData());
  const [formLoading, setFormLoading] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFormChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const openCreateModal = useCallback(() => {
    setFormData(getInitialFormData());
    setShowCreateModal(true);
  }, [getInitialFormData]);

  const openEditModal = useCallback((video: TVideo) => {
    setEditingVideo(video);
    setFormData(videoToFormData(video));
    setShowEditModal(true);
  }, [videoToFormData]);

  const handleCreate = useCallback(async () => {
    if (!createVideo) return;
    
    setFormLoading(true);
    try {
      const videoData = formDataToVideo(formData);
      const newVideo = await createVideo(videoData);
      
      if (newVideo) {
        setShowCreateModal(false);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setFormLoading(false);
    }
  }, [createVideo, formData, formDataToVideo, getInitialFormData]);

  const handleEdit = useCallback(async () => {
    if (!editingVideo) return;
    
    const id = getVideoId(editingVideo);
    if (!id) return;

    setFormLoading(true);
    try {
      const videoData = formDataToVideo(formData, editingVideo);
      const updated = await updateVideo(id, videoData);
      
      if (updated) {
        setShowEditModal(false);
        setEditingVideo(null);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setFormLoading(false);
    }
  }, [editingVideo, formData, formDataToVideo, getVideoId, getInitialFormData, updateVideo]);

  const handleDelete = useCallback(async (video: TVideo) => {
    const id = getVideoId(video);
    if (!id) return;
    
    const name = getVideoName(video);
    if (!confirm(labels.deleteConfirm(name))) return;

    await deleteVideo(id);
  }, [deleteVideo, getVideoId, getVideoName, labels]);

  const handleSort = useCallback((key: string, direction?: 'asc' | 'desc') => {
    const currentSortBy = (filters as Record<string, unknown>).sort_by as string | undefined;
    const currentSortOrder = (filters as Record<string, unknown>).sort_order as 'asc' | 'desc' | undefined;
    
    const newDirection = direction ?? (currentSortBy === key && currentSortOrder === 'asc' ? 'desc' : 'asc');
    
    const newFilters = {
      ...filters,
      sort_by: key,
      sort_order: newDirection,
    } as TFilters;
    
    setFilters(newFilters);
  }, [filters, setFilters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handlePageSizeChange = useCallback((size: number) => {
    if (setPageSize) {
      setPageSize(size);
      const newFilters = { ...filters, limit: size } as TFilters;
      setFilters(newFilters);
    }
  }, [filters, setFilters, setPageSize]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderFormField = (field: FormFieldConfig) => {
    const value = formData[field.name];
    
    if (field.type === 'textarea') {
      return (
        <FormTextarea
          key={field.name}
          label={field.label}
          value={(value as string) || ''}
          onChange={(e) => handleFormChange(field.name, e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          rows={3}
          disabled={formLoading}
        />
      );
    }
    
    if (field.type === 'channel-select') {
      return (
        <FormSelect
          key={field.name}
          label={field.label}
          value={(value as number | string) || ''}
          onChange={(e) => handleFormChange(field.name, e.target.value ? Number(e.target.value) : null)}
          required={field.required}
          disabled={formLoading}
        >
          <option value="">No channel</option>
          {channelOptions.map((channel) => (
            <option key={channel.id ?? 'no-id'} value={channel.id ?? ''}>
              {channel.name}
            </option>
          ))}
        </FormSelect>
      );
    }
    
    if (field.type === 'select') {
      const options = field.options || [];
      return (
        <FormSelect
          key={field.name}
          label={field.label}
          value={(value as string) || ''}
          onChange={(e) => handleFormChange(field.name, e.target.value)}
          required={field.required}
          disabled={formLoading}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FormSelect>
      );
    }
    
    return (
      <FormInput
        key={field.name}
        label={field.label}
        type={field.type}
        value={field.type === 'number' ? (value as number) ?? '' : (value as string) || ''}
        onChange={(e) => {
          const newValue = field.type === 'number' 
            ? (e.target.value ? parseInt(e.target.value, 10) : null)
            : e.target.value;
          handleFormChange(field.name, newValue);
        }}
        required={field.required}
        placeholder={field.placeholder}
        min={field.min?.toString()}
        disabled={formLoading}
      />
    );
  };

  const renderFormFields = (fields: FormFieldConfig[]) => {
    const result: React.ReactNode[] = [];
    let gridBuffer: FormFieldConfig[] = [];
    
    fields.forEach((field, index) => {
      if (field.gridSpan === 2) {
        gridBuffer.push(field);
        if (gridBuffer.length === 2 || index === fields.length - 1) {
          result.push(
            <div key={`grid-${index}`} className="grid grid-cols-2 gap-4">
              {gridBuffer.map(renderFormField)}
            </div>
          );
          gridBuffer = [];
        }
      } else {
        if (gridBuffer.length > 0) {
          result.push(
            <div key={`grid-${index}-flush`} className="grid grid-cols-2 gap-4">
              {gridBuffer.map(renderFormField)}
            </div>
          );
          gridBuffer = [];
        }
        result.push(renderFormField(field));
      }
    });
    
    return <div className="space-y-4">{result}</div>;
  };

  const isFormValid = () => {
    return formFields
      .filter(f => f.required)
      .every(f => {
        const value = formData[f.name];
        return value !== undefined && value !== null && value !== '';
      });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const totalPages = Math.ceil(totalCount / pageSize);

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">{labels.loadingError}</p>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
            <Button 
              onClick={() => fetchVideos()} 
              className="mt-4"
            >
              {labels.retryButton}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {labels.pageTitle}
            </h1>
            {labels.pageSubtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {labels.pageSubtitle}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {headerExtra}
            {showCreateButton && createVideo && (
              <Button onClick={openCreateModal} className="flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>{labels.createButton}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          {renderFilterPanel()}
        </div>

        {/* Table with ErrorBoundary */}
        <ErrorBoundary
          fallback={(err, reset) => (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
                {labels.loadingError}
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                {err.message}
              </p>
              <Button onClick={reset} variant="secondary">
                {labels.retryButton}
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
                  onPageSizeChange={setPageSize ? handlePageSizeChange : undefined}
                  className="mb-4"
                />
              )}
              
              {/* Table */}
              {renderTable({
                videos,
                loading,
                onSort: handleSort,
                sortKey: (filters as Record<string, unknown>).sort_by as string | undefined,
                sortDirection: (filters as Record<string, unknown>).sort_order as 'asc' | 'desc' | undefined,
                onEdit: openEditModal,
                onDelete: handleDelete,
                onStatusChange,
                onStatusDoubleClick,
              })}

              {/* Bottom Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={setPageSize ? handlePageSizeChange : undefined}
                  className="mt-4"
                />
              )}
            </>
          )}
        </ErrorBoundary>

        {/* Create Modal */}
        {showCreateButton && createVideo && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title={labels.createModalTitle || 'Create'}
            size="lg"
          >
            {renderFormFields(formFields)}

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={formLoading}
              >
                {labels.cancelButton}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={formLoading || !isFormValid()}
              >
                {formLoading ? <LoadingSpinner size="sm" /> : labels.createSubmitButton}
              </Button>
            </div>
          </Modal>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingVideo(null);
            setFormData(getInitialFormData());
          }}
          title={labels.editModalTitle}
          size="lg"
        >
          {renderFormFields(formFields)}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingVideo(null);
                setFormData(getInitialFormData());
              }}
              disabled={formLoading}
            >
              {labels.cancelButton}
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
              disabled={formLoading || !isFormValid()}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : labels.editSubmitButton}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

export default BaseVideoPage;
