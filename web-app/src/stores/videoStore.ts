import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VideoSchema, VideoQueryParams } from '../types/api';
import { videoApi, APIError } from '../lib/api/client';

interface VideoState {
  // Data
  videos: VideoSchema[];
  allVideos: VideoSchema[]; // Toutes les données filtrées (pour pagination client)
  selectedVideo: VideoSchema | null;
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
  filters: VideoQueryParams;
  currentPage: number;
  pageSize: number;
  
  // Actions
  setVideos: (videos: VideoSchema[]) => void;
  setAllVideos: (videos: VideoSchema[]) => void;
  setSelectedVideo: (video: VideoSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: VideoQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;
  
  // Utility method for client-side pagination
  updatePaginatedVideos: () => void;
  
  // API Actions
  fetchVideos: (params?: VideoQueryParams) => Promise<void>;
  fetchVideoCount: (params?: VideoQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: VideoQueryParams) => Promise<void>;
  fetchVideo: (id: number) => Promise<VideoSchema | null>;
  createVideo: (video: VideoSchema) => Promise<VideoSchema | null>;
  updateVideo: (id: number, video: VideoSchema) => Promise<VideoSchema | null>;
  patchVideo: (id: number, updates: Partial<VideoSchema>) => Promise<VideoSchema | null>;
  deleteVideo: (id: number) => Promise<boolean>;
  
  // Utility actions
  refreshVideos: () => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

const initialFilters: VideoQueryParams = {
  limit: 50,
  sort_by: 'updated_at',
  sort_order: 'desc',
};

export const useVideoStore = create<VideoState>()(
  devtools(
    (set, get) => ({
      // Initial state
      videos: [],
      allVideos: [],
      selectedVideo: null,
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
      setVideos: (videos) => set({ videos }),
      setAllVideos: (videos) => set({ allVideos: videos }),
      setSelectedVideo: (video) => set({ selectedVideo: video }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters, currentPage: 1 }), // Reset page to 1 when filters change
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatusCounts: (counts) => set({ statusCounts: counts }),
      
      // Utility method for client-side pagination
      updatePaginatedVideos: () => {
        const { allVideos, currentPage, pageSize } = get();
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedVideos = allVideos.slice(startIndex, endIndex);
        set({ videos: paginatedVideos, totalCount: allVideos.length });
      },
      
      // API Actions
      fetchVideos: async (params) => {
        set({ loading: true, error: null });
        try {
          const currentState = get();
          // Récupère toutes les données sans limite pour la pagination côté client
          const queryParams = { 
            ...currentState.filters, 
            ...params,
            limit: undefined // Supprime la limite pour récupérer toutes les données
          };
          const allVideos = await videoApi.list(queryParams);
          set({ allVideos, loading: false });
          
          // Met à jour la pagination côté client
          get().updatePaginatedVideos();
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch videos';
          set({ error: errorMessage, loading: false });
        }
      },
      
      fetchVideoCount: async (params) => {
        try {
          const queryParams = { ...get().filters, ...params };
          const { count } = await videoApi.count(queryParams);
          set({ totalCount: count });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch video count';
          set({ error: errorMessage });
        }
      },
      
      fetchStatusCounts: async (params) => {
        try {
          // Récupère les comptages en incluant les filtres actuels (notamment search)
          // mais exclut les filtres status, sort_by, sort_order et limit pour avoir tous les statuts
          const currentFilters = { ...get().filters, ...params };
          const { status, sort_by, sort_order, limit, ...filtersForCount } = currentFilters;
          
          const response = await videoApi.count(filtersForCount);
          
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
      
      fetchVideo: async (id) => {
        set({ loading: true, error: null });
        try {
          const video = await videoApi.get(id);
          set({ selectedVideo: video, loading: false });
          return video;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch video';
          set({ error: errorMessage, loading: false });
          return null;
        }
      },
      
      createVideo: async (video) => {
        set({ creating: true, error: null });
        try {
          const newVideo = await videoApi.create(video);
          const currentVideos = get().videos;
          set({ 
            videos: [newVideo, ...currentVideos],
            creating: false,
            selectedVideo: newVideo
          });
          return newVideo;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to create video';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },
      
      updateVideo: async (id, video) => {
        set({ updating: true, error: null });
        try {
          const updatedVideo = await videoApi.update(id, video);
          const currentVideos = get().videos;
          const updatedVideos = currentVideos.map(v => 
            v.id === id ? updatedVideo : v
          );
          set({ 
            videos: updatedVideos,
            updating: false,
            selectedVideo: updatedVideo
          });
          return updatedVideo;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to update video';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },
      
      patchVideo: async (id, updates) => {
        set({ updating: true, error: null });
        try {
          const updatedVideo = await videoApi.patch(id, updates);
          const currentVideos = get().videos;
          const updatedVideos = currentVideos.map(v => 
            v.id === id ? updatedVideo : v
          );
          set({ 
            videos: updatedVideos,
            updating: false,
            selectedVideo: updatedVideo
          });
          return updatedVideo;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to patch video';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },
      
      deleteVideo: async (id) => {
        set({ deleting: true, error: null });
        try {
          await videoApi.delete(id);
          const currentVideos = get().videos;
          const filteredVideos = currentVideos.filter(v => v.id !== id);
          set({ 
            videos: filteredVideos,
            deleting: false,
            selectedVideo: get().selectedVideo?.id === id ? null : get().selectedVideo
          });
          return true;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to delete video';
          set({ error: errorMessage, deleting: false });
          return false;
        }
      },
      
      // Utility actions
      refreshVideos: async () => {
        await get().fetchVideos();
        await get().fetchVideoCount();
      },
      
      clearError: () => set({ error: null }),
      clearSelection: () => set({ selectedVideo: null }),
      resetFilters: () => set({ filters: initialFilters, currentPage: 1 }),
    }),
    {
      name: 'video-store',
    }
  )
);