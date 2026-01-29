import { VideoSchema, VideoQueryParams } from '../types/api';
import { videoApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

// Create store using factory
const useVideoStoreBase = createEntityStore<VideoSchema, VideoQueryParams>({
  name: 'video-store',
  api: videoApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (video) => video.id,
});

// Extended interface with compatibility aliases
interface VideoStoreExtended extends EntityState<VideoSchema, VideoQueryParams> {
  // Compatibility aliases
  videos: VideoSchema[];
  allVideos: VideoSchema[];
  selectedVideo: VideoSchema | null;
  fetchVideos: (params?: VideoQueryParams) => Promise<void>;
  fetchVideoCount: (params?: VideoQueryParams) => Promise<void>;
  fetchVideo: (id: number) => Promise<VideoSchema | null>;
  createVideo: (item: VideoSchema) => Promise<VideoSchema | null>;
  updateVideo: (id: number, item: VideoSchema) => Promise<VideoSchema | null>;
  patchVideo: (id: number, updates: Partial<VideoSchema>) => Promise<VideoSchema | null>;
  deleteVideo: (id: number) => Promise<boolean>;
  refreshVideos: () => Promise<void>;
  setVideos: (items: VideoSchema[]) => void;
  setAllVideos: (items: VideoSchema[]) => void;
  setSelectedVideo: (item: VideoSchema | null) => void;
}

// Export with compatibility aliases
export const useVideoStore = (): VideoStoreExtended => {
  const store = useVideoStoreBase();
  
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