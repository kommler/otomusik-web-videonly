import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChannelSchema, ChannelQueryParams } from '../types/api';
import { channelApi, APIError } from '../lib/api/client';

interface ChannelState {
  // Data
  channels: ChannelSchema[];
  selectedChannel: ChannelSchema | null;
  totalCount: number;
  statusCounts: Record<string, number>;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Filters and pagination
  filters: ChannelQueryParams;
  currentPage: number;
  pageSize: number;
  
  // Actions
  setChannels: (channels: ChannelSchema[]) => void;
  setSelectedChannel: (channel: ChannelSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: ChannelQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;
  
  // API Actions
  fetchChannels: (params?: ChannelQueryParams) => Promise<void>;
  fetchChannelCount: (params?: ChannelQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: ChannelQueryParams) => Promise<void>;
  fetchChannel: (id: number) => Promise<ChannelSchema | null>;
  createChannel: (channel: ChannelSchema) => Promise<ChannelSchema | null>;
  updateChannel: (id: number, channel: ChannelSchema) => Promise<ChannelSchema | null>;
  patchChannel: (id: number, updates: Partial<ChannelSchema>) => Promise<ChannelSchema | null>;
  deleteChannel: (id: number) => Promise<boolean>;
  
  // Utility actions
  refreshChannels: () => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

const initialFilters: ChannelQueryParams = {
  limit: 50,
  sort_by: 'updated_at',
  sort_order: 'desc',
};

export const useChannelStore = create<ChannelState>()(
  devtools(
    (set, get) => ({
      // Initial state
      channels: [],
      selectedChannel: null,
      totalCount: 0,
      statusCounts: {},
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      filters: initialFilters,
      currentPage: 1,
      pageSize: 50,
      
      // Basic setters
      setChannels: (channels) => set({ channels }),
      setSelectedChannel: (channel) => set({ selectedChannel: channel }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatusCounts: (counts) => set({ statusCounts: counts }),
      
      // API Actions
      fetchChannels: async (params) => {
        set({ loading: true, error: null });
        try {
          const queryParams = { ...get().filters, ...params };
          const channels = await channelApi.list(queryParams);
          set({ channels, loading: false });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch channels';
          set({ error: errorMessage, loading: false });
        }
      },
      
      fetchChannelCount: async (params) => {
        try {
          const queryParams = { ...get().filters, ...params };
          const { count } = await channelApi.count(queryParams);
          set({ totalCount: count });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch channel count';
          set({ error: errorMessage });
        }
      },
      
      fetchStatusCounts: async (params) => {
        try {
          // Récupère les comptages en incluant les filtres actuels (notamment search)
          // mais exclut les filtres status, sort_by, sort_order et limit pour avoir tous les statuts
          const currentFilters = { ...get().filters, ...params };
          const { status, sort_by, sort_order, limit, ...filtersForCount } = currentFilters;
          
          const response = await channelApi.count(filtersForCount);
          
          // Convertit la réponse en objet de comptages par statut
          const statusCounts: Record<string, number> = {};
          let totalCount = 0;
          
          Object.entries(response).forEach(([key, value]) => {
            if (key !== 'count' && typeof value === 'number') {
              statusCounts[key] = value;
            } else if (key === 'count' && typeof value === 'number') {
              totalCount = value; // Utilise le count total si disponible
            }
          });
          
          // Si des statuts sont sélectionnés, calcule le total basé sur les statuts filtrés
          if (status && status.length > 0) {
            totalCount = status.reduce((sum, selectedStatus) => {
              return sum + (statusCounts[selectedStatus] || 0);
            }, 0);
          } else {
            // Si aucun statut sélectionné, utilise la somme de tous les statuts
            if (totalCount === 0) {
              totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
            }
          }
          
          set({ statusCounts, totalCount });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch status counts';
          set({ error: errorMessage });
        }
      },
      
      fetchChannel: async (id) => {
        set({ loading: true, error: null });
        try {
          const channel = await channelApi.get(id);
          set({ selectedChannel: channel, loading: false });
          return channel;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch channel';
          set({ error: errorMessage, loading: false });
          return null;
        }
      },
      
      createChannel: async (channel) => {
        set({ creating: true, error: null });
        try {
          const newChannel = await channelApi.create(channel);
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
            : 'Failed to create channel';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },
      
      updateChannel: async (id, channel) => {
        set({ updating: true, error: null });
        try {
          const updatedChannel = await channelApi.update(id, channel);
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
            : 'Failed to update channel';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },
      
      patchChannel: async (id, updates) => {
        set({ updating: true, error: null });
        try {
          const updatedChannel = await channelApi.patch(id, updates);
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
            : 'Failed to patch channel';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },
      
      deleteChannel: async (id) => {
        set({ deleting: true, error: null });
        try {
          await channelApi.delete(id);
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
            : 'Failed to delete channel';
          set({ error: errorMessage, deleting: false });
          return false;
        }
      },
      
      // Utility actions
      refreshChannels: async () => {
        await get().fetchChannels();
        await get().fetchChannelCount();
      },
      
      clearError: () => set({ error: null }),
      clearSelection: () => set({ selectedChannel: null }),
      resetFilters: () => set({ filters: initialFilters, currentPage: 1 }),
    }),
    {
      name: 'channel-store',
    }
  )
);