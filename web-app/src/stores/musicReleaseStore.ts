import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ReleaseSchema, MusicReleaseQueryParams } from '../types/api';
import { musicReleaseApi, APIError } from '../lib/api/client';

interface MusicReleaseState {
  // Data
  releases: ReleaseSchema[];
  allReleases: ReleaseSchema[]; // Toutes les données filtrées (pour pagination client)
  selectedRelease: ReleaseSchema | null;
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
  filters: MusicReleaseQueryParams;
  currentPage: number;
  pageSize: number;

  // Actions
  setReleases: (releases: ReleaseSchema[]) => void;
  setAllReleases: (releases: ReleaseSchema[]) => void;
  setSelectedRelease: (release: ReleaseSchema | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: MusicReleaseQueryParams) => void;
  setCurrentPage: (page: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;

  // Utility method for client-side pagination
  updatePaginatedReleases: () => void;

  // API Actions
  fetchReleases: (params?: MusicReleaseQueryParams) => Promise<void>;
  fetchReleaseCount: (params?: MusicReleaseQueryParams) => Promise<void>;
  fetchStatusCounts: (params?: MusicReleaseQueryParams) => Promise<void>;
  fetchRelease: (id: number) => Promise<ReleaseSchema | null>;
  createRelease: (release: ReleaseSchema) => Promise<ReleaseSchema | null>;
  updateRelease: (id: number, release: ReleaseSchema) => Promise<ReleaseSchema | null>;
  patchRelease: (id: number, updates: Partial<ReleaseSchema>) => Promise<ReleaseSchema | null>;
  deleteRelease: (id: number) => Promise<boolean>;

  // Utility actions
  clearSelection: () => void;
  resetFilters: () => void;
}

const ITEMS_PER_PAGE = 25;

export const useMusicReleaseStore = create<MusicReleaseState>()(
  devtools(
    (set, get) => ({
      // Initial state
      releases: [],
      allReleases: [],
      selectedRelease: null,
      totalCount: 0,
      statusCounts: {},

      loading: false,
      creating: false,
      updating: false,
      deleting: false,

      error: null,

      filters: {
        limit: ITEMS_PER_PAGE,
        sort_by: 'inserted_at',
        sort_order: 'desc',
      },
      currentPage: 1,
      pageSize: ITEMS_PER_PAGE,

      // Basic setters
      setReleases: (releases) => set({ releases }),
      setAllReleases: (allReleases) => set({ allReleases }),
      setSelectedRelease: (selectedRelease) => set({ selectedRelease }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setStatusCounts: (statusCounts) => set({ statusCounts }),

      // Client-side pagination utility
      updatePaginatedReleases: () => {
        const { allReleases, currentPage, pageSize } = get();
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedReleases = allReleases.slice(startIndex, endIndex);
        set({ releases: paginatedReleases });
      },

      // API Actions
      fetchReleases: async (params) => {
        const state = get();
        const queryParams = params || state.filters;

        set({ loading: true, error: null });

        try {
          const releases = await musicReleaseApi.list(queryParams);
          set({
            releases,
            allReleases: releases,
            loading: false,
            totalCount: releases.length
          });

          // Update pagination if needed
          get().updatePaginatedReleases();
        } catch (error) {
          console.error('Failed to fetch music releases:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to fetch music releases';
          set({ error: errorMessage, loading: false });
        }
      },

      fetchReleaseCount: async (params) => {
        const queryParams = params || get().filters;

        try {
          const countResponse = await musicReleaseApi.count(queryParams);
          set({ totalCount: countResponse.count });
        } catch (error) {
          console.error('Failed to fetch release count:', error);
        }
      },

      fetchStatusCounts: async (params) => {
        const queryParams = params || get().filters;

        try {
          const countResponse = await musicReleaseApi.count(queryParams);
          // For status counts, we need to make separate calls for each status
          // This is a simplified version - in a real app you might want to optimize this
          const statusCounts: Record<string, number> = {};

          // Get counts for common statuses
          const statuses = ['PENDING', 'DOWNLOADING', 'DOWNLOADED', 'ERROR', 'FAILED'];
          for (const status of statuses) {
            try {
              const statusCount = await musicReleaseApi.count({ ...queryParams, status });
              statusCounts[status] = statusCount.count || 0;
            } catch (error) {
              console.error(`Failed to fetch count for status ${status}:`, error);
              statusCounts[status] = 0;
            }
          }

          set({ statusCounts });
        } catch (error) {
          console.error('Failed to fetch status counts:', error);
        }
      },

      fetchRelease: async (id) => {
        try {
          const release = await musicReleaseApi.get(id);
          set({ selectedRelease: release });
          return release;
        } catch (error) {
          console.error('Failed to fetch release:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to fetch release';
          set({ error: errorMessage });
          return null;
        }
      },

      createRelease: async (release) => {
        set({ creating: true, error: null });

        try {
          const newRelease = await musicReleaseApi.create(release);
          set({ creating: false });

          // Refresh the list
          await get().fetchReleases();
          await get().fetchStatusCounts();

          return newRelease;
        } catch (error) {
          console.error('Failed to create release:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to create release';
          set({ error: errorMessage, creating: false });
          return null;
        }
      },

      updateRelease: async (id, release) => {
        set({ updating: true, error: null });

        try {
          const updatedRelease = await musicReleaseApi.update(id, release);
          set({ updating: false });

          // Refresh the list
          await get().fetchReleases();
          await get().fetchStatusCounts();

          return updatedRelease;
        } catch (error) {
          console.error('Failed to update release:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to update release';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      patchRelease: async (id, updates) => {
        set({ updating: true, error: null });

        try {
          const updatedRelease = await musicReleaseApi.patch(id, updates);
          set({ updating: false });

          // Refresh the list
          await get().fetchReleases();
          await get().fetchStatusCounts();

          return updatedRelease;
        } catch (error) {
          console.error('Failed to patch release:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to patch release';
          set({ error: errorMessage, updating: false });
          return null;
        }
      },

      deleteRelease: async (id) => {
        set({ deleting: true, error: null });

        try {
          await musicReleaseApi.delete(id);
          set({ deleting: false });

          // Refresh the list
          await get().fetchReleases();
          await get().fetchStatusCounts();

          return true;
        } catch (error) {
          console.error('Failed to delete release:', error);
          const errorMessage = error instanceof APIError
            ? error.message
            : 'Failed to delete release';
          set({ error: errorMessage, deleting: false });
          return false;
        }
      },

      // Utility actions
      clearSelection: () => set({ selectedRelease: null }),
      resetFilters: () => set({
        filters: {
          limit: ITEMS_PER_PAGE,
          sort_by: 'inserted_at',
          sort_order: 'desc',
        },
        currentPage: 1
      }),
    }),
    {
      name: 'music-release-store',
    }
  )
);