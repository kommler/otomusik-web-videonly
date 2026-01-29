import { MusicVideoSchema, MusicVideoQueryParams } from '../types/api';
import { musicVideoApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

// Create store using factory
const useMusicVideoStoreBase = createEntityStore<MusicVideoSchema, MusicVideoQueryParams>({
  name: 'music-video-store',
  api: musicVideoApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (video) => video.id,
});

// Extended interface with compatibility aliases
interface MusicVideoStoreExtended extends EntityState<MusicVideoSchema, MusicVideoQueryParams> {
  // Compatibility aliases
  videos: MusicVideoSchema[];
  allVideos: MusicVideoSchema[];
  selectedVideo: MusicVideoSchema | null;
  fetchVideos: (params?: MusicVideoQueryParams) => Promise<void>;
  fetchVideoCount: (params?: MusicVideoQueryParams) => Promise<void>;
  fetchVideo: (id: number) => Promise<MusicVideoSchema | null>;
  createVideo: (item: MusicVideoSchema) => Promise<MusicVideoSchema | null>;
  updateVideo: (id: number, item: MusicVideoSchema) => Promise<MusicVideoSchema | null>;
  patchVideo: (id: number, updates: Partial<MusicVideoSchema>) => Promise<MusicVideoSchema | null>;
  deleteVideo: (id: number) => Promise<boolean>;
  refreshVideos: () => Promise<void>;
  setVideos: (items: MusicVideoSchema[]) => void;
  setAllVideos: (items: MusicVideoSchema[]) => void;
  setSelectedVideo: (item: MusicVideoSchema | null) => void;
}

// Export with compatibility aliases
export const useMusicVideoStore = (): MusicVideoStoreExtended => {
  const store = useMusicVideoStoreBase();
  
  return {
    ...store,
    // Compatibility aliases for existing code
    videos: store.items,
    allVideos: store.allItems,
    selectedVideo: store.selectedItem,
    fetchVideos: store.fetchItems,
    fetchVideoCount: store.fetchItemCount,
    fetchVideo: store.fetchItem,
    createVideo: store.createItem,
    updateVideo: store.updateItem,
    patchVideo: store.patchItem,
    deleteVideo: store.deleteItem,
    refreshVideos: store.refreshItems,
    setVideos: store.setItems,
    setAllVideos: store.setAllItems,
    setSelectedVideo: store.setSelectedItem,
  };
};