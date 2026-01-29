import { ChannelSchema, ChannelQueryParams } from '../types/api';
import { channelApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

// Create store using factory
const useChannelStoreBase = createEntityStore<ChannelSchema, ChannelQueryParams>({
  name: 'channel-store',
  api: channelApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (channel) => channel.id,
});

// Extended interface with compatibility aliases
interface ChannelStoreExtended extends EntityState<ChannelSchema, ChannelQueryParams> {
  // Compatibility aliases
  channels: ChannelSchema[];
  allChannels: ChannelSchema[];
  selectedChannel: ChannelSchema | null;
  fetchChannels: (params?: ChannelQueryParams) => Promise<void>;
  fetchChannelCount: (params?: ChannelQueryParams) => Promise<void>;
  fetchChannel: (id: number) => Promise<ChannelSchema | null>;
  createChannel: (item: ChannelSchema) => Promise<ChannelSchema | null>;
  updateChannel: (id: number, item: ChannelSchema) => Promise<ChannelSchema | null>;
  patchChannel: (id: number, updates: Partial<ChannelSchema>) => Promise<ChannelSchema | null>;
  deleteChannel: (id: number) => Promise<boolean>;
  refreshChannels: () => Promise<void>;
  setChannels: (items: ChannelSchema[]) => void;
  setAllChannels: (items: ChannelSchema[]) => void;
  setSelectedChannel: (item: ChannelSchema | null) => void;
}

// Export with compatibility aliases
export const useChannelStore = (): ChannelStoreExtended => {
  const store = useChannelStoreBase();
  
  return {
    ...store,
    // Compatibility aliases for existing code
    channels: store.items,
    allChannels: store.allItems,
    selectedChannel: store.selectedItem,
    fetchChannels: store.fetchItems,
    fetchChannelCount: store.fetchItemCount,
    fetchChannel: store.fetchItem,
    createChannel: store.createItem,
    updateChannel: store.updateItem,
    patchChannel: store.patchItem,
    deleteChannel: store.deleteItem,
    refreshChannels: store.refreshItems,
    setChannels: store.setItems,
    setAllChannels: store.setAllItems,
    setSelectedChannel: store.setSelectedItem,
  };
};