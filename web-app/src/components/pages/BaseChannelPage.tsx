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
  type: 'text' | 'url' | 'number' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  gridSpan?: 1 | 2; // Pour les layouts 2 colonnes
  min?: number;
}

export interface BaseChannelPageLabels {
  pageTitle: string;
  pageSubtitle?: string | ((count: number) => string);
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

export interface BaseChannelPageConfig<TChannel, TFilters> {
  // Labels (i18n)
  labels: BaseChannelPageLabels;
  
  // Form fields configuration
  formFields: FormFieldConfig[];
  
  // Optional: Status options for select fields
  statusOptions?: { value: string; label: string }[];
  
  // Show create button and modal
  showCreateButton?: boolean;
  
  // Components to render (passed as children or render props)
  renderFilterPanel: () => ReactNode;
  renderTable: (props: {
    channels: TChannel[];
    loading: boolean;
    onSort: (key: string, direction?: 'asc' | 'desc') => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onEdit: (channel: TChannel) => void;
    onDelete: (channel: TChannel) => void;
    onStatusDoubleClick?: (channel: TChannel) => void;
    onRowClick?: (channel: TChannel) => void;
    onView?: (channel: TChannel) => void;
  }) => ReactNode;
  
  // Data and state from store
  channels: TChannel[];
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
  fetchChannels: (filters?: TFilters) => Promise<void>;
  
  // CRUD operations
  createChannel?: (data: Partial<TChannel>) => Promise<TChannel | null>;
  updateChannel: (id: number, data: Partial<TChannel>) => Promise<TChannel | null>;
  deleteChannel: (id: number) => Promise<boolean>;
  
  // Helpers to extract data from channel
  getChannelId: (channel: TChannel) => number | null | undefined;
  getChannelName: (channel: TChannel) => string;
  channelToFormData: (channel: TChannel) => Record<string, unknown>;
  formDataToChannel: (formData: Record<string, unknown>, existingChannel?: TChannel) => Partial<TChannel>;
  getInitialFormData: () => Record<string, unknown>;
  
  // Optional callbacks
  onStatusDoubleClick?: (channel: TChannel) => Promise<void>;
  
  // Optional: additional header content
  headerExtra?: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BaseChannelPage<TChannel, TFilters>({
  labels,
  formFields,
  statusOptions,
  showCreateButton = false,
  renderFilterPanel,
  renderTable,
  channels,
  loading,
  error,
  filters,
  currentPage,
  pageSize,
  totalCount,
  setCurrentPage,
  setPageSize,
  setFilters,
  fetchChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelId,
  getChannelName,
  channelToFormData,
  formDataToChannel,
  getInitialFormData,
  onStatusDoubleClick,
  headerExtra,
}: BaseChannelPageConfig<TChannel, TFilters>) {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<TChannel | null>(null);
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

  const openEditModal = useCallback((channel: TChannel) => {
    setEditingChannel(channel);
    setFormData(channelToFormData(channel));
    setShowEditModal(true);
  }, [channelToFormData]);

  const handleCreate = useCallback(async () => {
    if (!createChannel) return;
    
    setFormLoading(true);
    try {
      const channelData = formDataToChannel(formData);
      const newChannel = await createChannel(channelData);
      
      if (newChannel) {
        setShowCreateModal(false);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setFormLoading(false);
    }
  }, [createChannel, formData, formDataToChannel, getInitialFormData]);

  const handleEdit = useCallback(async () => {
    if (!editingChannel) return;
    
    const id = getChannelId(editingChannel);
    if (!id) return;

    setFormLoading(true);
    try {
      const channelData = formDataToChannel(formData, editingChannel);
      const updated = await updateChannel(id, channelData);
      
      if (updated) {
        setShowEditModal(false);
        setEditingChannel(null);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setFormLoading(false);
    }
  }, [editingChannel, formData, formDataToChannel, getChannelId, getInitialFormData, updateChannel]);

  const handleDelete = useCallback(async (channel: TChannel) => {
    const id = getChannelId(channel);
    if (!id) return;
    
    const name = getChannelName(channel);
    if (!confirm(labels.deleteConfirm(name))) return;

    await deleteChannel(id);
  }, [deleteChannel, getChannelId, getChannelName, labels]);

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
    
    if (field.type === 'select') {
      const options = field.options || statusOptions || [];
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
    const regularFields = fields.filter(f => !f.gridSpan || f.gridSpan === 1);
    const gridFields = fields.filter(f => f.gridSpan === 2);
    
    return (
      <div className="space-y-4">
        {regularFields.map(renderFormField)}
        {gridFields.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {gridFields.map(renderFormField)}
          </div>
        )}
      </div>
    );
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
  const subtitle = typeof labels.pageSubtitle === 'function' 
    ? labels.pageSubtitle(totalCount) 
    : labels.pageSubtitle;

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">{labels.loadingError}</p>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
            <Button 
              onClick={() => fetchChannels()} 
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
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {labels.pageTitle}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {headerExtra}
            {showCreateButton && createChannel && (
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {renderTable({
                  channels,
                  loading,
                  onSort: handleSort,
                  sortKey: (filters as Record<string, unknown>).sort_by as string | undefined,
                  sortDirection: (filters as Record<string, unknown>).sort_order as 'asc' | 'desc' | undefined,
                  onEdit: openEditModal,
                  onDelete: handleDelete,
                  onStatusDoubleClick,
                  onRowClick: undefined,
                  onView: undefined,
                })}
              </div>

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
        {showCreateButton && createChannel && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title={labels.createModalTitle || 'Create'}
            size="lg"
          >
            {renderFormFields(formFields)}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
          onClose={() => setShowEditModal(false)}
          title={labels.editModalTitle}
          size="lg"
        >
          {renderFormFields(formFields)}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={formLoading}
            >
              {labels.cancelButton}
            </Button>
            <Button
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

export default BaseChannelPage;
