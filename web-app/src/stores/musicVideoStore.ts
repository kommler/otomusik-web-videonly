import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MusicVideoSchema, MusicVideoQueryParams } from '../types/api';
import { musicVideoApi, APIError } from '../lib/api/client';

interface MusicVideoState {
  // Data
  videos: MusicVideoSchema[];
  allVideos: MusicVideoSchema[]; // Toutes les données filtrées (pour pagination client)
  selectedVideo: MusicVideoSchema | null;
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
  filters: MusicVideoQueryParams;
  currentPage: number;
  pageSize: number;

  // Actions
  setVideos: (videos: MusicVideoSchema[]) => void;
  setAllVideos: (videos: MusicVideoSchema[]) => void;
  setSelectedVideo: (video: MusicVideoSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: MusicVideoQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;

  // Utility method for client-side pagination
  updatePaginatedVideos: () => void;

  // API Actions
  fetchVideos: (params?: MusicVideoQueryParams) => Promise<void>;
  fetchVideoCount: (params?: MusicVideoQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: MusicVideoQueryParams) => Promise<void>;
  fetchVideo: (id: number) => Promise<MusicVideoSchema | null>;
  createVideo: (video: MusicVideoSchema) => Promise<MusicVideoSchema | null>;
  updateVideo: (id: number, video: MusicVideoSchema) => Promise<MusicVideoSchema | null>;
  patchVideo: (id: number, updates: Partial<MusicVideoSchema>) => Promise<MusicVideoSchema | null>;
  deleteVideo: (id: number) => Promise<boolean>;

  // Utility actions
  refreshVideos: () => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

const initialFilters: MusicVideoQueryParams = {
  limit: 50,
  sort_by: 'updated_at',
  sort_order: 'desc',
};

export const useMusicVideoStore = create<MusicVideoState>()(
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
      setCurrentPage: (currentPage) => {
        set({ currentPage });
        // Trigger pagination update after state change
        setTimeout(() => {
          get().updatePaginatedVideos();
        }, 0);
      },
      setPageSize: (pageSize) => {
        set({ pageSize, currentPage: 1 }, false, 'setPageSize');
        // Trigger pagination update after state change
        setTimeout(() => {
          get().updatePaginatedVideos();
        }, 0);
      },
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
          const allVideos = await musicVideoApi.list(queryParams);
          set({ allVideos, loading: false });

          // Met à jour la pagination côté client
          get().updatePaginatedVideos();
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Failed to fetch music videos';
          set({ error: errorMessage, loading: false });
        }
      },

      fetchVideoCount: async (params) => {
        try {
          const queryParams = { ...get().filters, ...params };
          const { count } = await musicVideoApi.count(queryParams);
          set({ totalCount: count });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Failed to fetch music video count';
          set({ error: errorMessage });
        }
      },

      fetchStatusCounts: async (params) => {
        try {
          // Récupère les comptages en incluant les filtres actuels (notamment search)
          // mais exclut les filtres status, sort_by, sort_order et limit pour avoir tous les statuts
          const currentFilters = { ...get().filters, ...params };
          const { status, sort_by, sort_order, limit, ...filtersForCount } = currentFilters;

          const response = await musicVideoApi.count(filtersForCount);

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
          const video = await musicVideoApi.get(id);
          set({ selectedVideo: video, loading: false });
          return video;
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Failed to fetch music video';
          set({ error: errorMessage, loading: false });
          return null;
        }
      },

      createVideo: async (video) => {
        set({ creating: true, error: null });
        try {
          const newVideo = await musicVideoApi.create(video);
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
            : 'Failed to create music video';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },

      updateVideo: async (id, video) => {
        set({ updating: true, error: null });
        try {
          const updatedVideo = await musicVideoApi.update(id, video);
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
            : 'Failed to update music video';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      patchVideo: async (id, updates) => {
        set({ updating: true, error: null });
        try {
          const updatedVideo = await musicVideoApi.patch(id, updates);
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
            : 'Failed to patch music video';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      deleteVideo: async (id) => {
        set({ deleting: true, error: null });
        try {
          await musicVideoApi.delete(id);
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
            : 'Failed to delete music video';
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
      name: 'music-video-store',
    }
  )
);