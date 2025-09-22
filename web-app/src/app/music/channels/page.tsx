'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MusicChannelTable } from '@/components/tables';
import { MusicChannelFilterPanel } from '@/components/filters/MusicChannelFilterPanel';
import { useMusicChannelStore } from '@/stores';
import { MusicChannel, MusicChannelQueryParams } from '@/types/api';
import { Pagination } from '@/components/ui/pagination';

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
    setFilters,
    setCurrentPage,
    fetchChannels,
    deleteChannel,
  } = useMusicChannelStore();

  // Charger les données initiales
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

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
    console.log('View channel:', channel);
  };

  const handleEdit = (channel: MusicChannel) => {
    // TODO: Implement edit modal
    console.log('Edit channel:', channel);
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

        {/* Panel de filtres */}
        <MusicChannelFilterPanel
          entityType="canaux musicaux"
          filters={filters}
          statusCounts={statusCountsRecord}
          sortOptions={musicChannelFilterConfig.sortOptions}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          totalCount={totalChannels}
        />

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
          <MusicChannelTable
            channels={channels}
            loading={loading}
            onSort={handleSort}
            sortKey={filters.sort_by}
            sortDirection={filters.sort_order}
            onRowClick={handleRowClick}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
      </div>
    </Layout>
  );
}