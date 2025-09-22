'use client';

import { useState, useEffect, useMemo } from 'react';
import { MusicChannelTable } from '@/components/tables';
import { useMusicChannelStore } from '@/stores';
import { MusicChannel, StatusCount } from '@/types/api';
import { SearchInput } from '@/components/ui/search-input';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 25;

// Simple filter component for music channels
const MusicChannelFilters = ({ 
  statusFilter, 
  onStatusFilterChange, 
  statusFilters, 
  loading 
}: {
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  statusFilters: { value: string; label: string; count: number; }[];
  loading: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <div className="flex items-center gap-4">
      <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Status:
      </label>
      <select
        id="status-filter"
        value={statusFilter || ''}
        onChange={(e) => onStatusFilterChange(e.target.value || null)}
        disabled={loading}
        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All statuses</option>
        {statusFilters.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default function MusicChannelsPage() {
  const {
    channels,
    totalChannels,
    statusCounts,
    loading,
    error,
    sortKey,
    sortDirection,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    fetchChannels,
    setSortKey,
    setSortDirection,
    deleteChannel,
  } = useMusicChannelStore();

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch channels on mount and when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      await fetchChannels({
        search: searchTerm || undefined,
        status: statusFilter ? [statusFilter] : undefined,
        sort_by: sortKey || 'updated_at',
        sort_order: sortDirection,
        limit: ITEMS_PER_PAGE,
      });
    };
    
    fetchData();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    sortKey,
    sortDirection,
    fetchChannels,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key as any);
      setSortDirection('asc');
    }
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
    
    if (confirm(`Are you sure you want to delete the music channel "${channel.channel_name}"?`)) {
      try {
        await deleteChannel(channel.id);
        // Refresh current page data
        await fetchChannels({
          search: searchTerm || undefined,
          status: statusFilter ? [statusFilter] : undefined,
          sort_by: sortKey || 'updated_at',
          sort_order: sortDirection,
          limit: ITEMS_PER_PAGE,
        });
      } catch (error) {
        console.error('Error deleting music channel:', error);
      }
    }
  };

  const handleRowClick = (channel: MusicChannel) => {
    handleView(channel);
  };

  const totalPages = Math.ceil(totalChannels / ITEMS_PER_PAGE);

  // Generate dynamic status filters from counts
  const statusFilters = useMemo(() => {
    if (!statusCounts || statusCounts.length === 0) return [];
    
    return statusCounts.map((statusCount: StatusCount) => ({
      value: statusCount.status || '',
      label: `${statusCount.status || 'Unknown'} (${statusCount.count})`,
      count: statusCount.count,
    }));
  }, [statusCounts]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading music channels</p>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => fetchChannels()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Music Channels
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and monitor music channels ({totalChannels} total)
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search music channels by name, uploader..."
          />
        </div>
        <div className="lg:w-80">
          <MusicChannelFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusFilters={statusFilters}
            loading={loading}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <MusicChannelTable
          channels={channels}
          loading={loading}
          onSort={handleSort}
          sortKey={sortKey || undefined}
          sortDirection={sortDirection}
          onRowClick={handleRowClick}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalChannels}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}