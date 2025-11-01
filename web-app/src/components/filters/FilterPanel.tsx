import React, { useState } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { VideoQueryParams, ChannelQueryParams } from '@/types/api';
import { 
  Button, 
  Input, 
  SearchInput,
  Modal,
  ModalContent,
  ModalFooter 
} from '@/components/ui';
import { cn } from '@/lib/utils';

// Status color mappings - consistent with tables
const getVideoStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'pending':
    case 'extracting':
    case 'downloading':
      return {
        normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
    case 'error':
      return {
        normal: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
      };
    case 'skip':
      return {
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
        count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
      };
    default:
      return {
        normal: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        active: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
        count: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
      };
  }
};

const getChannelStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'downloaded':
      return {
        normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
        count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
      };
    case 'pending':
    case 'scraping':
      return {
        normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
        count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
      };
    case 'failed':
      return {
        normal: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
        count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
      };
    default:
      return {
        normal: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        active: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
        count: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
      };
  }
};

interface BaseFilterProps {
  className?: string;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  statusCounts?: Record<string, number>;
  totalFilteredCount?: number; // Nombre total d'enregistrements après filtrage (toutes pages)
  onRefresh?: () => void;
  loading?: boolean;
}

interface VideoFiltersProps extends BaseFilterProps {
  type: 'video';
  filters: VideoQueryParams;
  onFiltersChange: (filters: VideoQueryParams) => void;
}

interface ChannelFiltersProps extends BaseFilterProps {
  type: 'channel';
  filters: ChannelQueryParams;
  onFiltersChange: (filters: ChannelQueryParams) => void;
}

type FilterPanelProps = VideoFiltersProps | ChannelFiltersProps;

// Status options for both videos and channels
const videoStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ERROR', label: 'Error' },
  { value: 'EXTRACTING', label: 'Extracting' },
  { value: 'SKIP', label: 'Skip' },
];

const channelStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'SCRAPING', label: 'Scraping' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'FAILED', label: 'Failed' },
];

export const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(props.filters);

  const handleQuickSearch = (search: string) => {
    props.onFiltersChange({ ...props.filters, search: search || undefined });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = props.filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    props.onFiltersChange({ 
      ...props.filters, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  };

  const applyAdvancedFilters = () => {
    props.onFiltersChange(tempFilters);
    setShowAdvancedFilters(false);
  };

  const resetAdvancedFilters = () => {
    setTempFilters(props.filters);
    setShowAdvancedFilters(false);
  };

  const statusOptions = props.type === 'video' ? videoStatusOptions : channelStatusOptions;

  return (
    <>
      <div className={cn("bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700", props.className)}>
        {/* Quick Search and Actions Row */}
        <div className="flex items-center justify-between space-x-4 mb-4">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={props.filters.search || ''}
              onChange={handleQuickSearch}
              placeholder={`Search ${props.type}s...`}
              size="md"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center space-x-2"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span>Advanced Filters</span>
              {props.activeFiltersCount > 0 && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-medium">
                  {props.activeFiltersCount}
                </span>
              )}
            </Button>
            
            {props.activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onClearFilters}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
            {statusOptions.map((status) => {
              const count = props.statusCounts?.[status.value] || 0;
              const isActive = (props.filters.status || []).includes(status.value);
              
              // Get appropriate colors based on filter type and status
              const colors = props.type === 'video' 
                ? getVideoStatusColors(status.value)
                : getChannelStatusColors(status.value);
              
              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusToggle(status.value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 hover:opacity-80 cursor-pointer",
                    isActive
                      ? colors.active  // Fond coloré complet quand sélectionné
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"  // Fond neutre quand non sélectionné
                  )}
                >
                  <span>{status.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                      isActive 
                        ? colors.count  // Fond coloré pour le compteur quand sélectionné
                        : colors.normal  // Fond coloré selon le status quand non sélectionné
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Controls section - Total count and refresh button */}
          <div className="flex items-center justify-between">
            {/* Total Records Count - Use total filtered count if available, otherwise sum status counts */}
            {(props.totalFilteredCount !== undefined || props.statusCounts) && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Total:</span>
                <span className="ml-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm">
                  {props.totalFilteredCount !== undefined 
                    ? props.totalFilteredCount.toLocaleString()
                    : Object.values(props.statusCounts || {}).reduce((sum, count) => sum + count, 0).toLocaleString()
                  }
                </span>
                <span className="ml-1">records</span>
              </div>
            )}

            {/* Refresh button */}
            {props.onRefresh && (
              <button
                onClick={props.onRefresh}
                disabled={props.loading}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 
                           bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                title="Actualiser les données"
              >
                <svg
                  className={`w-4 h-4 ${props.loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="ml-1.5">Actualiser</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title="Advanced Filters"
        size="2xl"
      >
        <ModalContent>
          <div className="space-y-6">
            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <Input
                  value={tempFilters.search || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value || undefined })}
                  placeholder="Search across all fields..."
                />
              </div>
              
              {props.type === 'video' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Video Title
                    </label>
                    <Input
                      value={(tempFilters as VideoQueryParams).title__ilike || ''}
                      onChange={(e) => setTempFilters({ 
                        ...tempFilters, 
                        title__ilike: e.target.value || undefined 
                      })}
                      placeholder="Search by title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Channel Name
                    </label>
                    <Input
                      value={(tempFilters as VideoQueryParams).channel_name__ilike || ''}
                      onChange={(e) => setTempFilters({ 
                        ...tempFilters, 
                        channel_name__ilike: e.target.value || undefined 
                      })}
                      placeholder="Search by channel..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Uploader
                    </label>
                    <Input
                      value={(tempFilters as VideoQueryParams).uploader__ilike || ''}
                      onChange={(e) => setTempFilters({ 
                        ...tempFilters, 
                        uploader__ilike: e.target.value || undefined 
                      })}
                      placeholder="Search by uploader..."
                    />
                  </div>
                </>
              )}
              
              {props.type === 'channel' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Channel Name
                    </label>
                    <Input
                      value={(tempFilters as ChannelQueryParams).name__ilike || ''}
                      onChange={(e) => setTempFilters({ 
                        ...tempFilters, 
                        name__ilike: e.target.value || undefined 
                      })}
                      placeholder="Search by name..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic
                    </label>
                    <Input
                      value={(tempFilters as ChannelQueryParams).topic__ilike || ''}
                      onChange={(e) => setTempFilters({ 
                        ...tempFilters, 
                        topic__ilike: e.target.value || undefined 
                      })}
                      placeholder="Search by topic..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={tempFilters.sort_by || ''}
                  onChange={(e) => setTempFilters({ 
                    ...tempFilters, 
                    sort_by: e.target.value || undefined 
                  })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Default</option>
                  {props.type === 'video' ? (
                    <>
                      <option value="title">Title</option>
                      <option value="channel_name">Channel</option>
                      <option value="duration_seconds">Duration</option>
                      <option value="view_count">Views</option>
                      <option value="published_at">Published Date</option>
                      <option value="updated_at">Updated Date</option>
                    </>
                  ) : (
                    <>
                      <option value="name">Name</option>
                      <option value="topic">Topic</option>
                      <option value="video_count">Video Count</option>
                      <option value="subscriber_count">Subscribers</option>
                      <option value="updated_at">Updated Date</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <select
                  value={tempFilters.sort_order || 'asc'}
                  onChange={(e) => setTempFilters({ 
                    ...tempFilters, 
                    sort_order: e.target.value as 'asc' | 'desc'
                  })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Results per page
              </label>
              <select
                value={tempFilters.limit || 50}
                onChange={(e) => setTempFilters({ 
                  ...tempFilters, 
                  limit: parseInt(e.target.value)
                })}
                className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </ModalContent>
        
        <ModalFooter>
          <Button variant="outline" onClick={resetAdvancedFilters}>
            Cancel
          </Button>
          <Button onClick={applyAdvancedFilters}>
            Apply Filters
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};