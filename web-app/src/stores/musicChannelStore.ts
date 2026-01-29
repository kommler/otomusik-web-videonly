import { MusicChannelSchema, MusicChannelQueryParams } from '../types/api';
import { musicChannelApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

// Create store using factory
const useMusicChannelStoreBase = createEntityStore<MusicChannelSchema, MusicChannelQueryParams>({
  name: 'music-channel-store',
  api: musicChannelApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (channel) => channel.id,
});

// Extended interface with compatibility aliases
interface MusicChannelStoreExtended extends EntityState<MusicChannelSchema, MusicChannelQueryParams> {
  // Compatibility aliases
  channels: MusicChannelSchema[];
  selectedChannel: MusicChannelSchema | null;
  totalChannels: number;
  statusCountsRecord: Record<string, number>;
  fetchChannels: (params?: MusicChannelQueryParams) => Promise<void>;
  createChannel: (item: MusicChannelSchema) => Promise<MusicChannelSchema | null>;
  updateChannel: (id: number, item: MusicChannelSchema) => Promise<MusicChannelSchema | null>;
  deleteChannel: (id: number) => Promise<boolean>;
  reset: () => void;
}

// Export with compatibility aliases
export const useMusicChannelStore = (): MusicChannelStoreExtended => {
  const store = useMusicChannelStoreBase();
  
  return {
    ...store,
    // Compatibility aliases for existing code
    channels: store.items,
    selectedChannel: store.selectedItem,
    totalChannels: store.totalCount,
    statusCountsRecord: store.statusCounts,
    fetchChannels: store.fetchItems,
    createChannel: store.createItem,
    updateChannel: store.updateItem,
    deleteChannel: store.deleteItem,
    reset: store.resetFilters,
  };
};