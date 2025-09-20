import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VideoSchema, VideoQueryParams } from '../types/api';
import { videoApi, APIError } from '../lib/api/client';

interface VideoState {
  // Data
  videos: VideoSchema[];
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
  setSelectedVideo: (video: VideoSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: VideoQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;
  
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
      setSelectedVideo: (video) => set({ selectedVideo: video }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatusCounts: (counts) => set({ statusCounts: counts }),
      
      // API Actions
      fetchVideos: async (params) => {
        set({ loading: true, error: null });
        try {
          const queryParams = { ...get().filters, ...params };
          const videos = await videoApi.list(queryParams);
          set({ videos, loading: false });
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
          Object.entries(response).forEach(([key, value]) => {
            if (key !== 'count' && typeof value === 'number') {
              statusCounts[key] = value;
            }
          });
          
          set({ statusCounts });
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