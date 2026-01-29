'use client';

import { Suspense, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { LazyMusicChannelTable } from '@/components/tables';
import { LazyMusicChannelFilterPanel } from '@/components/filters';
import { useMusicChannelStore } from '@/stores';
import { MusicChannel, MusicChannelQueryParams } from '@/types/api';
import { Pagination } from '@/components/ui/pagination';
import { LazyModal as Modal } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton, FilterSkeleton, ErrorBoundary, LoadingSpinner } from '@/components/ui';
import { useInitialLoad } from '@/lib/hooks';

const ITEMS_PER_PAGE = 25;

// Configuration des filtres spécifiques aux music channels
const musicChannelFilterConfig = {
  sortOptions: [
    { value: 'channel_name', label: 'Nom du canal' },
    { value: 'uploader', label: 'Uploader' },
    { value: 'count_playlist', label: 'Nombre de playlists' },
    { value: 'status', label: 'Statut' },
    { value: 'inserted_at', label: 'Date de création' },
    { value: 'updated_at', label: 'Dernière modification' },
    { value: 'scraped_at', label: 'Dernière extraction' },
  ],
};

// Form data interface for editing
interface ChannelFormData {
  channel_name: string;
  url: string;
  uploader: string;
  refresh_interval_days: number | null;
  scrap_options: string;
}

export default function MusicChannelsPage() {
  const {
    channels,
    totalChannels,
    statusCountsRecord,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    updating,
    setFilters,
    setCurrentPage,
    fetchChannels,
    updateChannel,
    deleteChannel,
  } = useMusicChannelStore();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<MusicChannel | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<ChannelFormData>({
    channel_name: '',
    url: '',
    uploader: '',
    refresh_interval_days: null,
    scrap_options: '',
  });

  // Chargement initial une seule fois
  useInitialLoad([() => fetchChannels()]);

  // Gestion des changements de filtres
  const handleFiltersChange = (newFilters: MusicChannelQueryParams) => {
    setFilters(newFilters);
    fetchChannels(newFilters);
  };

  // Gestion des changements de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const offset = (page - 1) * pageSize;
    fetchChannels({ ...filters, limit: pageSize });
  };

  const handleSort = (key: string) => {
    const newSortOrder = (filters.sort_by === key && filters.sort_order === 'asc') ? 'desc' : 'asc';
    handleFiltersChange({
      ...filters,
      sort_by: key,
      sort_order: newSortOrder,
    });
  };

  const handleView = (channel: MusicChannel) => {
    // TODO: Implement view modal
  };

  const handleEdit = (channel: MusicChannel) => {
    setSelectedChannel(channel);
    setFormData({
      channel_name: channel.channel_name || '',
      url: channel.url || '',
      uploader: channel.uploader || '',
      refresh_interval_days: channel.refresh_interval_days ?? null,
      scrap_options: channel.scrap_options || '',
    });
    setShowEditModal(true);
  };

  const handleEditChannel = async () => {
    if (!selectedChannel?.id) return;

    setFormLoading(true);
    try {
      const updateData = {
        ...selectedChannel,
        channel_name: formData.channel_name,
        url: formData.url,
        uploader: formData.uploader,
        refresh_interval_days: formData.refresh_interval_days,
        scrap_options: formData.scrap_options,
      };
      
      await updateChannel(selectedChannel.id, updateData);
      setShowEditModal(false);
      setSelectedChannel(null);
      
      // Reset form
      setFormData({
        channel_name: '',
        url: '',
        uploader: '',
        refresh_interval_days: null,
        scrap_options: '',
      });
    } catch (error) {
      console.error('Error updating music channel:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetWaiting = async (channel: MusicChannel) => {
    if (!channel.id) return;
    
    if (confirm(`Définir le statut du canal "${channel.channel_name}" sur WAITING ?`)) {
      setFormLoading(true);
      try {
        const updateData = {
          ...channel,
          status: 'WAITING',
        };
        
        await updateChannel(channel.id, updateData);
        // Refresh current page data
        fetchChannels(filters);
      } catch (error) {
        console.error('Error updating music channel status:', error);
      } finally {
        setFormLoading(false);
      }
    }
  };

  // Double-clic sur le statut : DOWNLOADED ↔ WAITING
  const handleStatusDoubleClick = async (channel: MusicChannel) => {
    if (!channel.id) return;
    
    const currentStatus = channel.status?.toUpperCase();
    
    if (currentStatus === 'DOWNLOADED') {
      // DOWNLOADED → WAITING : pas de confirmation
      setFormLoading(true);
      try {
        await updateChannel(channel.id, { ...channel, status: 'WAITING' });
        fetchChannels(filters);
      } catch (error) {
        console.error('Error updating music channel status:', error);
      } finally {
        setFormLoading(false);
      }
    } else if (currentStatus === 'WAITING') {
      // WAITING → DOWNLOADED : avec confirmation
      if (confirm(`Repasser le canal "${channel.channel_name}" en DOWNLOADED ?`)) {
        setFormLoading(true);
        try {
          await updateChannel(channel.id, { ...channel, status: 'DOWNLOADED' });
          fetchChannels(filters);
        } catch (error) {
          console.error('Error updating music channel status:', error);
        } finally {
          setFormLoading(false);
        }
      }
    }
    // Autres statuts : ne rien faire
  };

  const handleDelete = async (channel: MusicChannel) => {
    if (!channel.id) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le canal musical "${channel.channel_name}" ?`)) {
      try {
        await deleteChannel(channel.id);
        // Refresh current page data
        fetchChannels(filters);
      } catch (error) {
        console.error('Error deleting music channel:', error);
      }
    }
  };

  const handleRowClick = (channel: MusicChannel) => {
    handleView(channel);
  };

  const totalPages = Math.ceil(totalChannels / pageSize);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Erreur lors du chargement des canaux musicaux</p>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
            <button 
              onClick={() => fetchChannels()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Canaux Musicaux
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {totalChannels > 0 
                ? `${totalChannels} canal${totalChannels > 1 ? 'aux' : ''} musical${totalChannels > 1 ? 'aux' : ''} trouvé${totalChannels > 1 ? 's' : ''}` 
                : 'Aucun canal musical trouvé'
              }
            </p>
          </div>
        </div>

        {/* Panel de filtres - lazy loaded */}
        <LazyMusicChannelFilterPanel
          entityType="canaux musicaux"
          filters={filters}
          statusCounts={statusCountsRecord}
          sortOptions={musicChannelFilterConfig.sortOptions}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          totalCount={totalChannels}
        />

        {/* Table - lazy loaded */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
                Échec du chargement des canaux
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                {error.message}
              </p>
              <Button onClick={reset} variant="secondary">
                Réessayer
              </Button>
            </div>
          )}
        >
          {/* Contrôles de pagination (haut) */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalChannels}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Table des canaux musicaux */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {loading ? (
              <TableSkeleton rows={10} columns={6} showHeader={false} showPagination={false} />
            ) : (
              <LazyMusicChannelTable
                channels={channels}
                loading={loading}
                onSort={handleSort}
                sortKey={filters.sort_by}
                sortDirection={filters.sort_order}
                onRowClick={handleRowClick}
                onView={handleView}
                onEdit={handleEdit}
                onSetWaiting={handleSetWaiting}
                onStatusDoubleClick={handleStatusDoubleClick}
                onDelete={handleDelete}
              />
            )}
          </div>

          {/* Contrôles de pagination (bas) */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalChannels}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </ErrorBoundary>

        {/* Modal d'édition */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier le Canal Musical"
          size="lg"
        >
          <div className="space-y-4">
            {/* Nom du canal */}
            <div>
              <label htmlFor="channel_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du Canal *
              </label>
              <Input
                id="channel_name"
                type="text"
                value={formData.channel_name}
                onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                placeholder="Nom du canal musical"
                disabled={formLoading}
                required
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL *
              </label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.youtube.com/@channel"
                disabled={formLoading}
                required
              />
            </div>

            {/* Uploader */}
            <div>
              <label htmlFor="uploader" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Uploader
              </label>
              <Input
                id="uploader"
                type="text"
                value={formData.uploader}
                onChange={(e) => setFormData({ ...formData, uploader: e.target.value })}
                placeholder="Nom de l'uploader"
                disabled={formLoading}
              />
            </div>

            {/* Intervalle de rafraîchissement */}
            <div>
              <label htmlFor="refresh_interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Intervalle de Rafraîchissement (jours)
              </label>
              <Input
                id="refresh_interval"
                type="number"
                min="1"
                value={formData.refresh_interval_days?.toString() || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  refresh_interval_days: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="7"
                disabled={formLoading}
              />
            </div>

            {/* Options de scraping */}
            <div>
              <label htmlFor="scrap_options" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options de Scraping
              </label>
              <Input
                id="scrap_options"
                type="text"
                value={formData.scrap_options}
                onChange={(e) => setFormData({ ...formData, scrap_options: e.target.value })}
                placeholder="Options JSON pour le scraping"
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={formLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleEditChannel}
              disabled={formLoading || !formData.channel_name || !formData.url}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : 'Modifier le Canal'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}