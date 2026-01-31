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

export interface BasePlaylistPageLabels {
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

export interface BasePlaylistPageConfig<TPlaylist, TFilters> {
  // Labels (i18n)
  labels: BasePlaylistPageLabels;
  
  // Form fields configuration
  formFields: FormFieldConfig[];
  
  // Show create button and modal
  showCreateButton?: boolean;
  
  // Components to render (passed as children or render props)
  renderFilterPanel: () => ReactNode;
  renderTable: (props: {
    playlists: TPlaylist[];
    loading: boolean;
    onSort: (key: string, direction?: 'asc' | 'desc') => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onEdit: (playlist: TPlaylist) => void;
    onDelete: (playlist: TPlaylist) => void;
    onStatusDoubleClick?: (playlist: TPlaylist) => void;
    onRowClick?: (playlist: TPlaylist) => void;
    onView?: (playlist: TPlaylist) => void;
  }) => ReactNode;
  
  // Data and state from store
  playlists: TPlaylist[];
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
  fetchPlaylists: (filters?: TFilters) => Promise<void>;
  
  // CRUD operations
  createPlaylist?: (data: Partial<TPlaylist>) => Promise<TPlaylist | null>;
  updatePlaylist: (id: number, data: Partial<TPlaylist>) => Promise<TPlaylist | null>;
  deletePlaylist: (id: number) => Promise<boolean>;
  
  // Helpers to extract data from playlist
  getPlaylistId: (playlist: TPlaylist) => number | null | undefined;
  getPlaylistName: (playlist: TPlaylist) => string;
  playlistToFormData: (playlist: TPlaylist) => Record<string, unknown>;
  formDataToPlaylist: (formData: Record<string, unknown>, existingPlaylist?: TPlaylist) => Partial<TPlaylist>;
  getInitialFormData: () => Record<string, unknown>;
  
  // Optional callbacks
  onStatusDoubleClick?: (playlist: TPlaylist) => Promise<void>;
  onRowClick?: (playlist: TPlaylist) => void;
  onView?: (playlist: TPlaylist) => void;
  
  // Optional: additional header content
  headerExtra?: ReactNode;
  
  // Optional: show debug info in dev
  showDebugInfo?: boolean;
  debugData?: Record<string, unknown>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BasePlaylistPage<TPlaylist, TFilters>({
  labels,
  formFields,
  showCreateButton = false,
  renderFilterPanel,
  renderTable,
  playlists,
  loading,
  error,
  filters,
  currentPage,
  pageSize,
  totalCount,
  setCurrentPage,
  setPageSize,
  setFilters,
  fetchPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistId,
  getPlaylistName,
  playlistToFormData,
  formDataToPlaylist,
  getInitialFormData,
  onStatusDoubleClick,
  onRowClick,
  onView,
  headerExtra,
  showDebugInfo,
  debugData,
}: BasePlaylistPageConfig<TPlaylist, TFilters>) {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<TPlaylist | null>(null);
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

  const openEditModal = useCallback((playlist: TPlaylist) => {
    setEditingPlaylist(playlist);
    setFormData(playlistToFormData(playlist));
    setShowEditModal(true);
  }, [playlistToFormData]);

  const handleCreate = useCallback(async () => {
    if (!createPlaylist) return;
    
    setFormLoading(true);
    try {
      const playlistData = formDataToPlaylist(formData);
      const newPlaylist = await createPlaylist(playlistData);
      
      if (newPlaylist) {
        setShowCreateModal(false);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setFormLoading(false);
    }
  }, [createPlaylist, formData, formDataToPlaylist, getInitialFormData]);

  const handleEdit = useCallback(async () => {
    if (!editingPlaylist) return;
    
    const id = getPlaylistId(editingPlaylist);
    if (!id) return;

    setFormLoading(true);
    try {
      const playlistData = formDataToPlaylist(formData, editingPlaylist);
      const updated = await updatePlaylist(id, playlistData);
      
      if (updated) {
        setShowEditModal(false);
        setEditingPlaylist(null);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setFormLoading(false);
    }
  }, [editingPlaylist, formData, formDataToPlaylist, getPlaylistId, getInitialFormData, updatePlaylist]);

  const handleDelete = useCallback(async (playlist: TPlaylist) => {
    const id = getPlaylistId(playlist);
    if (!id) return;
    
    const name = getPlaylistName(playlist);
    if (!confirm(labels.deleteConfirm(name))) return;

    await deletePlaylist(id);
  }, [deletePlaylist, getPlaylistId, getPlaylistName, labels]);

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
    // Séparer les champs normaux et ceux avec gridSpan
    const result: React.ReactNode[] = [];
    let gridBuffer: FormFieldConfig[] = [];
    
    fields.forEach((field, index) => {
      if (field.gridSpan === 2) {
        gridBuffer.push(field);
        // Si on a 2 champs en grid ou si c'est le dernier champ
        if (gridBuffer.length === 2 || index === fields.length - 1) {
          result.push(
            <div key={`grid-${index}`} className="grid grid-cols-2 gap-4">
              {gridBuffer.map(renderFormField)}
            </div>
          );
          gridBuffer = [];
        }
      } else {
        // Flush le buffer grid si besoin
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
              onClick={() => fetchPlaylists()} 
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {labels.pageTitle}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {headerExtra}
            {showCreateButton && createPlaylist && (
              <Button 
                onClick={openCreateModal} 
                disabled={loading || formLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  labels.createButton || 'Nouvelle Playlist'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {renderFilterPanel()}

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
          {/* Top Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={setPageSize ? handlePageSizeChange : undefined}
              />
            </div>
          )}
          
          {/* Table */}
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            renderTable({
              playlists,
              loading,
              onSort: handleSort,
              sortKey: (filters as Record<string, unknown>).sort_by as string | undefined,
              sortDirection: (filters as Record<string, unknown>).sort_order as 'asc' | 'desc' | undefined,
              onEdit: openEditModal,
              onDelete: handleDelete,
              onStatusDoubleClick,
              onRowClick,
              onView,
            })
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={setPageSize ? handlePageSizeChange : undefined}
              />
            </div>
          )}
        </ErrorBoundary>

        {/* Debug info (dev only) */}
        {showDebugInfo && process.env.NODE_ENV === 'development' && debugData && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            {Object.entries(debugData).map(([key, value]) => (
              <p key={key}>{key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateButton && createPlaylist && (
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
          onClose={() => {
            setShowEditModal(false);
            setEditingPlaylist(null);
            setFormData(getInitialFormData());
          }}
          title={labels.editModalTitle}
          size="lg"
        >
          {renderFormFields(formFields)}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingPlaylist(null);
                setFormData(getInitialFormData());
              }}
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

export default BasePlaylistPage;
