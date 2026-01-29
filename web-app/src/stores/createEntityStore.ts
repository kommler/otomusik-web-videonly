import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { APIError } from '../lib/api/client';
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from '../lib/status-utils';

/**
 * Interface générique pour l'API CRUD
 */
export interface CrudApi<T, Q> {
  list: (params?: Q) => Promise<T[]>;
  get: (id: number) => Promise<T>;
  create: (item: T) => Promise<T>;
  update: (id: number, item: T) => Promise<T>;
  patch: (id: number, updates: Partial<T>) => Promise<T>;
  delete: (id: number) => Promise<void>;
  count: (params?: Partial<Q>) => Promise<{ count?: number; [key: string]: number | undefined }>;
}

/**
 * Interface d'état générique pour tous les stores d'entité
 */
export interface EntityState<T, Q> {
  // Data
  items: T[];
  allItems: T[];
  selectedItem: T | null;
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
  filters: Q;
  currentPage: number;
  pageSize: number;

  // Setters
  setItems: (items: T[]) => void;
  setAllItems: (items: T[]) => void;
  setSelectedItem: (item: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Q) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setStatusCounts: (counts: Record<string, number>) => void;

  // Utility method for client-side pagination
  updatePaginatedItems: () => void;

  // API Actions
  fetchItems: (params?: Q) => Promise<void>;
  fetchItemCount: (params?: Q) => Promise<void>;
  fetchStatusCounts: (params?: Q) => Promise<void>;
  fetchItem: (id: number) => Promise<T | null>;
  createItem: (item: T) => Promise<T | null>;
  updateItem: (id: number, item: T) => Promise<T | null>;
  patchItem: (id: number, updates: Partial<T>) => Promise<T | null>;
  deleteItem: (id: number) => Promise<boolean>;

  // Utility actions
  refreshItems: () => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

/**
 * Configuration pour créer un store d'entité
 */
export interface EntityStoreConfig<T, Q> {
  name: string;
  api: CrudApi<T, Q>;
  initialFilters?: Partial<Q>;
  pageSize?: number;
  getId: (item: T) => number | null | undefined;
}

/**
 * Utilitaire pour extraire le message d'erreur
 */
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof APIError) return error.message;
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

/**
 * Factory pour créer un store Zustand générique pour une entité CRUD
 */
export function createEntityStore<T, Q extends object>(
  config: EntityStoreConfig<T, Q>
) {
  const { name, api, pageSize = DEFAULT_PAGE_SIZE, getId } = config;
  
  const initialFilters: Q = {
    limit: pageSize,
    sort_by: DEFAULT_SORT_BY,
    sort_order: DEFAULT_SORT_ORDER,
    ...config.initialFilters,
  } as Q;

  return create<EntityState<T, Q>>()(
    devtools(
      (set, get) => ({
        // Initial state
        items: [],
        allItems: [],
        selectedItem: null,
        totalCount: 0,
        statusCounts: {},
        loading: false,
        creating: false,
        updating: false,
        deleting: false,
        error: null,
        filters: initialFilters,
        currentPage: 1,
        pageSize,

        // Basic setters
        setItems: (items) => set({ items }),
        setAllItems: (items) => set({ allItems: items }),
        setSelectedItem: (item) => set({ selectedItem: item }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set({ filters, currentPage: 1 }),
        setCurrentPage: (currentPage) => {
          set({ currentPage });
          setTimeout(() => get().updatePaginatedItems(), 0);
        },
        setPageSize: (pageSize) => {
          set({ pageSize, currentPage: 1 });
          setTimeout(() => get().updatePaginatedItems(), 0);
        },
        setStatusCounts: (counts) => set({ statusCounts: counts }),

        // Utility method for client-side pagination
        updatePaginatedItems: () => {
          const { allItems, currentPage, pageSize } = get();
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedItems = allItems.slice(startIndex, endIndex);
          set({ items: paginatedItems, totalCount: allItems.length });
        },

        // API Actions
        fetchItems: async (params) => {
          set({ loading: true, error: null });
          try {
            const currentState = get();
            const queryParams = {
              ...currentState.filters,
              ...params,
              limit: undefined, // Remove limit to get all data for client-side pagination
            } as Q;
            const allItems = await api.list(queryParams);
            set({ allItems, loading: false });
            get().updatePaginatedItems();
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to fetch ${name}`), loading: false });
          }
        },

        fetchItemCount: async (params) => {
          try {
            const queryParams = { ...get().filters, ...params };
            const { count } = await api.count(queryParams);
            set({ totalCount: count });
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to fetch ${name} count`) });
          }
        },

        fetchStatusCounts: async (params) => {
          try {
            const currentFilters = { ...get().filters, ...params } as Record<string, unknown>;
            // Exclude status, sort_by, sort_order, limit to get all status counts
            const { status, sort_by, sort_order, limit, ...filtersForCount } = currentFilters;

            const response = await api.count(filtersForCount as Partial<Q>);

            const statusCounts: Record<string, number> = {};
            let totalCount = 0;

            Object.entries(response).forEach(([key, value]) => {
              if (key !== 'count' && typeof value === 'number') {
                statusCounts[key] = value;
              } else if (key === 'count' && typeof value === 'number') {
                totalCount = value;
              }
            });

            // Calculate total based on selected statuses
            const selectedStatuses = status as string[] | undefined;
            if (selectedStatuses && selectedStatuses.length > 0) {
              totalCount = selectedStatuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
            } else if (totalCount === 0) {
              totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
            }

            set({ statusCounts, totalCount });
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to fetch ${name} status counts`) });
          }
        },

        fetchItem: async (id) => {
          set({ loading: true, error: null });
          try {
            const item = await api.get(id);
            set({ selectedItem: item, loading: false });
            return item;
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to fetch ${name}`), loading: false });
            return null;
          }
        },

        createItem: async (item) => {
          set({ creating: true, error: null });
          try {
            const newItem = await api.create(item);
            const currentItems = get().items;
            set({
              items: [newItem, ...currentItems],
              creating: false,
              selectedItem: newItem,
            });
            return newItem;
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to create ${name}`), creating: false });
            return null;
          }
        },

        updateItem: async (id, item) => {
          set({ updating: true, error: null });
          try {
            const updatedItem = await api.update(id, item);
            const currentItems = get().items;
            const updatedItems = currentItems.map((i) =>
              getId(i) === id ? updatedItem : i
            );
            set({
              items: updatedItems,
              updating: false,
              selectedItem: updatedItem,
            });
            return updatedItem;
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to update ${name}`), updating: false });
            return null;
          }
        },

        patchItem: async (id, updates) => {
          set({ updating: true, error: null });
          try {
            const updatedItem = await api.patch(id, updates);
            const currentItems = get().items;
            const updatedItems = currentItems.map((i) =>
              getId(i) === id ? updatedItem : i
            );
            set({
              items: updatedItems,
              updating: false,
              selectedItem: updatedItem,
            });
            return updatedItem;
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to patch ${name}`), updating: false });
            return null;
          }
        },

        deleteItem: async (id) => {
          set({ deleting: true, error: null });
          try {
            await api.delete(id);
            const currentItems = get().items;
            const filteredItems = currentItems.filter((i) => getId(i) !== id);
            const selectedItem = get().selectedItem;
            set({
              items: filteredItems,
              deleting: false,
              selectedItem: selectedItem && getId(selectedItem) === id ? null : selectedItem,
            });
            return true;
          } catch (error) {
            set({ error: getErrorMessage(error, `Failed to delete ${name}`), deleting: false });
            return false;
          }
        },

        // Utility actions
        refreshItems: async () => {
          await get().fetchItems();
          await get().fetchItemCount();
        },

        clearError: () => set({ error: null }),
        clearSelection: () => set({ selectedItem: null }),
        resetFilters: () => set({ filters: initialFilters, currentPage: 1 }),
      }),
      { name: `${name}-store` }
    )
  );
}

/**
 * Type helper pour les stores créés avec la factory
 */
export type EntityStore<T, Q extends object> = ReturnType<typeof createEntityStore<T, Q>>;

// ============================================================================
// Sélecteurs optimisés pour éviter les re-renders inutiles
// ============================================================================

/**
 * Sélecteurs pour accéder uniquement aux données nécessaires
 * Utilisation: const items = useMyStore(selectItems)
 */
export const selectItems = <T, Q extends object>(state: EntityState<T, Q>) => state.items;
export const selectAllItems = <T, Q extends object>(state: EntityState<T, Q>) => state.allItems;
export const selectSelectedItem = <T, Q extends object>(state: EntityState<T, Q>) => state.selectedItem;
export const selectTotalCount = <T, Q extends object>(state: EntityState<T, Q>) => state.totalCount;
export const selectStatusCounts = <T, Q extends object>(state: EntityState<T, Q>) => state.statusCounts;

/**
 * Sélecteurs pour les états de chargement
 */
export const selectLoading = <T, Q extends object>(state: EntityState<T, Q>) => state.loading;
export const selectCreating = <T, Q extends object>(state: EntityState<T, Q>) => state.creating;
export const selectUpdating = <T, Q extends object>(state: EntityState<T, Q>) => state.updating;
export const selectDeleting = <T, Q extends object>(state: EntityState<T, Q>) => state.deleting;
export const selectError = <T, Q extends object>(state: EntityState<T, Q>) => state.error;

/**
 * Sélecteur pour les états de chargement combinés
 */
export const selectIsLoading = <T, Q extends object>(state: EntityState<T, Q>) => 
  state.loading || state.creating || state.updating || state.deleting;

/**
 * Sélecteurs pour la pagination et les filtres
 */
export const selectFilters = <T, Q extends object>(state: EntityState<T, Q>) => state.filters;
export const selectCurrentPage = <T, Q extends object>(state: EntityState<T, Q>) => state.currentPage;
export const selectPageSize = <T, Q extends object>(state: EntityState<T, Q>) => state.pageSize;

/**
 * Sélecteur pour les données de table (items + état de chargement)
 */
export const selectTableData = <T, Q extends object>(state: EntityState<T, Q>) => ({
  items: state.items,
  loading: state.loading,
  totalCount: state.totalCount,
});

/**
 * Sélecteur pour les filtres et pagination
 */
export const selectFilterState = <T, Q extends object>(state: EntityState<T, Q>) => ({
  filters: state.filters,
  statusCounts: state.statusCounts,
  totalCount: state.totalCount,
  loading: state.loading,
});
