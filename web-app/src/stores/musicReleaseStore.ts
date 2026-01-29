import { ReleaseSchema, MusicReleaseQueryParams } from '../types/api';
import { musicReleaseApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

// Create store using factory
const useMusicReleaseStoreBase = createEntityStore<ReleaseSchema, MusicReleaseQueryParams>({
  name: 'music-release-store',
  api: musicReleaseApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (release) => release.id,
  initialFilters: {
    sort_by: 'inserted_at',
    sort_order: 'desc',
  },
});

// Extended interface with compatibility aliases
interface MusicReleaseStoreExtended extends EntityState<ReleaseSchema, MusicReleaseQueryParams> {
  // Compatibility aliases
  releases: ReleaseSchema[];
  allReleases: ReleaseSchema[];
  selectedRelease: ReleaseSchema | null;
  fetchReleases: (params?: MusicReleaseQueryParams) => Promise<void>;
  fetchReleaseCount: (params?: MusicReleaseQueryParams) => Promise<void>;
  fetchRelease: (id: number) => Promise<ReleaseSchema | null>;
  createRelease: (item: ReleaseSchema) => Promise<ReleaseSchema | null>;
  updateRelease: (id: number, item: ReleaseSchema) => Promise<ReleaseSchema | null>;
  patchRelease: (id: number, updates: Partial<ReleaseSchema>) => Promise<ReleaseSchema | null>;
  deleteRelease: (id: number) => Promise<boolean>;
  setReleases: (items: ReleaseSchema[]) => void;
  setAllReleases: (items: ReleaseSchema[]) => void;
  setSelectedRelease: (item: ReleaseSchema | null) => void;
}

// Export with compatibility aliases
export const useMusicReleaseStore = (): MusicReleaseStoreExtended => {
  const store = useMusicReleaseStoreBase();
  
  return {
    ...store,
    // Compatibility aliases for existing code
    releases: store.items,
    allReleases: store.allItems,
    selectedRelease: store.selectedItem,
    fetchReleases: store.fetchItems,
    fetchReleaseCount: store.fetchItemCount,
    fetchRelease: store.fetchItem,
    createRelease: store.createItem,
    updateRelease: store.updateItem,
    patchRelease: store.patchItem,
    deleteRelease: store.deleteItem,
    setReleases: store.setItems,
    setAllReleases: store.setAllItems,
    setSelectedRelease: store.setSelectedItem,
  };
};