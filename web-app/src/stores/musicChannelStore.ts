import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MusicChannelSchema, MusicChannelQueryParams, StatusCount } from '../types/api';
import { musicChannelApi, APIError } from '../lib/api/client';

interface MusicChannelState {
  // Data
  channels: MusicChannelSchema[];
  selectedChannel: MusicChannelSchema | null;
  totalChannels: number;
  statusCounts: StatusCount[];
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Filter and sort state - match the pattern used by other stores/pages
  searchTerm: string;
  statusFilter: string | null;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  
  // Actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string | null) => void;
  setSortKey: (key: string | null) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // API Actions
  fetchChannels: (params?: MusicChannelQueryParams) => Promise<void>;
  createChannel: (channel: MusicChannelSchema) => Promise<MusicChannelSchema | null>;
  updateChannel: (id: number, channel: MusicChannelSchema) => Promise<MusicChannelSchema | null>;
  deleteChannel: (id: number) => Promise<boolean>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  channels: [],
  selectedChannel: null,
  totalChannels: 0,
  statusCounts: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  searchTerm: '',
  statusFilter: null,
  sortKey: 'updated_at',
  sortDirection: 'desc' as 'desc',
};

export const useMusicChannelStore = create<MusicChannelState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Filter and sort actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSortKey: (key) => set({ sortKey: key }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      
      // API Actions
      fetchChannels: async (params) => {
        set({ loading: true, error: null });
        try {
          const queryParams: MusicChannelQueryParams = {
            search: params?.search,
            limit: params?.limit || 50,
            sort_by: params?.sort_by || 'updated_at',
            sort_order: params?.sort_order || 'desc',
            status__ilike: params?.status ? `%${params.status}%` : undefined,
            ...params,
          };
          
          // Fetch channels and counts in parallel
          const [channelsResult, countsResult] = await Promise.all([
            musicChannelApi.list(queryParams),
            musicChannelApi.count({
              search: params?.search,
              status__ilike: params?.status ? `%${params.status}%` : undefined,
            }),
          ]);
          
          const channels = Array.isArray(channelsResult) ? channelsResult : [];
          const totalChannels = typeof countsResult === 'object' && countsResult !== null 
            ? countsResult.count || 0 
            : 0;
          
          // Convert status counts
          const statusCounts: StatusCount[] = [];
          if (typeof countsResult === 'object' && countsResult !== null) {
            Object.entries(countsResult).forEach(([key, value]) => {
              if (key !== 'count' && typeof value === 'number') {
                statusCounts.push({ status: key, count: value });
              }
            });
          }
          
          set({ 
            channels, 
            totalChannels, 
            statusCounts, 
            loading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch music channels';
          set({ error: errorMessage, loading: false });
        }
      },
      
      createChannel: async (channel) => {
        set({ creating: true, error: null });
        try {
          const newChannel = await musicChannelApi.create(channel);
          const currentChannels = get().channels;
          set({ 
            channels: [newChannel, ...currentChannels],
            creating: false,
            selectedChannel: newChannel
          });
          return newChannel;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to create music channel';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },
      
      updateChannel: async (id, channel) => {
        set({ updating: true, error: null });
        try {
          const updatedChannel = await musicChannelApi.update(id, channel);
          const currentChannels = get().channels;
          const updatedChannels = currentChannels.map(c => 
            c.id === id ? updatedChannel : c
          );
          set({ 
            channels: updatedChannels,
            updating: false,
            selectedChannel: updatedChannel
          });
          return updatedChannel;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to update music channel';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },
      
      deleteChannel: async (id) => {
        set({ deleting: true, error: null });
        try {
          await musicChannelApi.delete(id);
          const currentChannels = get().channels;
          const filteredChannels = currentChannels.filter(c => c.id !== id);
          set({ 
            channels: filteredChannels,
            deleting: false,
            selectedChannel: get().selectedChannel?.id === id ? null : get().selectedChannel
          });
          return true;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to delete music channel';
          set({ error: errorMessage, deleting: false });
          return false;
        }
      },
      
      // Utility actions
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'music-channel-store',
    }
  )
);