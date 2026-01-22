import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PlaylistSchema, PlaylistQueryParams } from '../types/api';
import { musicPlaylistApi, APIError } from '../lib/api/client';

interface MusicPlaylistState {
  // Data
  playlists: PlaylistSchema[];
  allPlaylists: PlaylistSchema[]; // Toutes les données filtrées (pour pagination client)
  selectedPlaylist: PlaylistSchema | null;
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
  filters: PlaylistQueryParams;
  currentPage: number;
  pageSize: number;

  // Actions
  setPlaylists: (playlists: PlaylistSchema[]) => void;
  setAllPlaylists: (playlists: PlaylistSchema[]) => void;
  setSelectedPlaylist: (playlist: PlaylistSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: PlaylistQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;

  // Utility method for client-side pagination
  updatePaginatedPlaylists: () => void;

  // API Actions
  fetchPlaylists: (params?: PlaylistQueryParams) => Promise<void>;
  fetchPlaylistCount: (params?: PlaylistQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: PlaylistQueryParams) => Promise<void>;
  fetchPlaylist: (id: number) => Promise<PlaylistSchema | null>;
  createPlaylist: (playlist: PlaylistSchema) => Promise<PlaylistSchema | null>;
  updatePlaylist: (id: number, playlist: PlaylistSchema) => Promise<PlaylistSchema | null>;
  patchPlaylist: (id: number, updates: Partial<PlaylistSchema>) => Promise<PlaylistSchema | null>;
  deletePlaylist: (id: number) => Promise<boolean>;

  // Utility actions
  clearSelection: () => void;
  resetFilters: () => void;
}

const ITEMS_PER_PAGE = 100;

export const useMusicPlaylistStore = create<MusicPlaylistState>()(
  devtools(
    (set, get) => ({
      // Initial state
      playlists: [],
      allPlaylists: [],
      selectedPlaylist: null,
      totalCount: 0,
      statusCounts: {},

      loading: false,
      creating: false,
      updating: false,
      deleting: false,

      error: null,

      filters: {
        limit: ITEMS_PER_PAGE,
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
      currentPage: 1,
      pageSize: ITEMS_PER_PAGE,

      // Basic setters
      setPlaylists: (playlists) => set({ playlists }),
      setAllPlaylists: (allPlaylists) => set({ allPlaylists }),
      setSelectedPlaylist: (selectedPlaylist) => set({ selectedPlaylist }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters, currentPage: 1 }),
      setCurrentPage: (currentPage) => {
        set({ currentPage });
        // Trigger pagination update after state change
        setTimeout(() => {
          get().updatePaginatedPlaylists();
        }, 0);
      },
      setPageSize: (pageSize) => {
        set({ pageSize, currentPage: 1 }, false, 'setPageSize');
        // Trigger pagination update after state change
        setTimeout(() => {
          get().updatePaginatedPlaylists();
        }, 0);
      },
      setStatusCounts: (statusCounts) => set({ statusCounts }),

      // Utility method for client-side pagination
      updatePaginatedPlaylists: () => {
        const { allPlaylists, currentPage, pageSize } = get();
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedPlaylists = allPlaylists.slice(startIndex, endIndex);
        set({ playlists: paginatedPlaylists, totalCount: allPlaylists.length });
      },

      // API Actions
      fetchPlaylists: async (params) => {
        set({ loading: true, error: null });
        try {
          const currentState = get();
          // Récupère toutes les données sans limite pour la pagination côté client
          const queryParams = { 
            ...currentState.filters, 
            ...params,
            limit: undefined // Supprime la limite pour récupérer toutes les données
          };
          const allPlaylists = await musicPlaylistApi.list(queryParams);
          set({ allPlaylists, loading: false });
          
          // Met à jour la pagination côté client
          get().updatePaginatedPlaylists();
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch music playlists';
          set({ error: errorMessage, loading: false });
        }
      },

      fetchPlaylistCount: async (params) => {
        try {
          const queryParams = { ...get().filters, ...params };
          const { count } = await musicPlaylistApi.count(queryParams);
          set({ totalCount: count });
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch music playlist count';
          set({ error: errorMessage });
        }
      },

      fetchStatusCounts: async (params) => {
        try {
          // Récupère les comptages en incluant les filtres actuels (notamment search)
          // mais exclut les filtres status, sort_by, sort_order et limit pour avoir tous les statuts
          const currentFilters = { ...get().filters, ...params };
          const { status, sort_by, sort_order, limit, ...filtersForCount } = currentFilters;
          
          const response = await musicPlaylistApi.count(filtersForCount);
          
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

      fetchPlaylist: async (id) => {
        set({ loading: true, error: null });
        try {
          const playlist = await musicPlaylistApi.get(id);
          set({ selectedPlaylist: playlist, loading: false });
          return playlist;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to fetch music playlist';
          set({ error: errorMessage, loading: false });
          return null;
        }
      },

      createPlaylist: async (playlist) => {
        set({ creating: true, error: null });
        try {
          const newPlaylist = await musicPlaylistApi.create(playlist);
          set({ creating: false });
          
          // Refresh playlists after create
          await get().fetchPlaylists();
          await get().fetchStatusCounts();
          
          return newPlaylist;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to create music playlist';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },

      updatePlaylist: async (id, playlist) => {
        set({ updating: true, error: null });
        try {
          const updatedPlaylist = await musicPlaylistApi.update(id, playlist);
          set({ updating: false });
          
          // Refresh playlists after update
          await get().fetchPlaylists();
          await get().fetchStatusCounts();
          
          return updatedPlaylist;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to update music playlist';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      patchPlaylist: async (id, updates) => {
        set({ updating: true, error: null });
        try {
          const patchedPlaylist = await musicPlaylistApi.patch(id, updates);
          set({ updating: false });
          
          // Refresh playlists after patch
          await get().fetchPlaylists();
          await get().fetchStatusCounts();
          
          return patchedPlaylist;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to patch music playlist';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      deletePlaylist: async (id) => {
        set({ deleting: true, error: null });
        try {
          await musicPlaylistApi.delete(id);
          set({ deleting: false });
          
          // Refresh playlists after delete
          await get().fetchPlaylists();
          await get().fetchStatusCounts();
          
          return true;
        } catch (error) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof Error 
            ? error.message
            : 'Failed to delete music playlist';
          set({ error: errorMessage, deleting: false });
          return false;
        }
      },

      // Utility actions
      clearSelection: () => set({ selectedPlaylist: null }),
      
      resetFilters: () => {
        set({ 
          filters: {
            limit: ITEMS_PER_PAGE,
            sort_by: 'updated_at',
            sort_order: 'desc',
          },
          currentPage: 1
        });
        get().fetchPlaylists();
        get().fetchStatusCounts();
      },
    }),
    { name: 'MusicPlaylistStore' }
  )
);
