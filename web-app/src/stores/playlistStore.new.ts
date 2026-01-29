import { PlaylistSchema, PlaylistQueryParams } from '../types/api';
import { playlistApi } from '../lib/api/client';
import { createEntityStore, EntityState } from './createEntityStore';
import { DEFAULT_PAGE_SIZE } from '../lib/status-utils';

/**
 * Store Playlist utilisant la factory générique
 * Avec aliases pour compatibilité avec le code existant
 */

// Créer le store de base avec la factory
const baseStore = createEntityStore<PlaylistSchema, PlaylistQueryParams>({
  name: 'playlist',
  api: playlistApi,
  pageSize: DEFAULT_PAGE_SIZE,
  getId: (playlist) => playlist.id,
});

// Type étendu avec les aliases de compatibilité
interface PlaylistState extends EntityState<PlaylistSchema, PlaylistQueryParams> {
  // Aliases pour compatibilité
  playlists: PlaylistSchema[];
  allPlaylists: PlaylistSchema[];
  selectedPlaylist: PlaylistSchema | null;
  setPlaylists: (playlists: PlaylistSchema[]) => void;
  setAllPlaylists: (playlists: PlaylistSchema[]) => void;
  setSelectedPlaylist: (playlist: PlaylistSchema | null) => void;
  updatePaginatedPlaylists: () => void;
  fetchPlaylists: (params?: PlaylistQueryParams) => Promise<void>;
  fetchPlaylistCount: (params?: PlaylistQueryParams) => Promise<void>;
  fetchPlaylist: (id: number) => Promise<PlaylistSchema | null>;
  createPlaylist: (playlist: PlaylistSchema) => Promise<PlaylistSchema | null>;
  updatePlaylist: (id: number, playlist: PlaylistSchema) => Promise<PlaylistSchema | null>;
  patchPlaylist: (id: number, updates: Partial<PlaylistSchema>) => Promise<PlaylistSchema | null>;
  deletePlaylist: (id: number) => Promise<boolean>;
  clearSelection: () => void;
  refreshPlaylists: () => Promise<void>;
}

/**
 * Hook du store Playlist avec compatibilité
 * Mappe les noms génériques vers les noms spécifiques à l'entité
 */
export const usePlaylistStore = () => {
  const store = baseStore();
  
  return {
    ...store,
    // Aliases de données pour compatibilité
    playlists: store.items,
    allPlaylists: store.allItems,
    selectedPlaylist: store.selectedItem,
    
    // Aliases de setters pour compatibilité
    setPlaylists: store.setItems,
    setAllPlaylists: store.setAllItems,
    setSelectedPlaylist: store.setSelectedItem,
    
    // Aliases de méthodes pour compatibilité
    updatePaginatedPlaylists: store.updatePaginatedItems,
    fetchPlaylists: store.fetchItems,
    fetchPlaylistCount: store.fetchItemCount,
    fetchPlaylist: store.fetchItem,
    createPlaylist: store.createItem,
    updatePlaylist: store.updateItem,
    patchPlaylist: store.patchItem,
    deletePlaylist: store.deleteItem,
    refreshPlaylists: store.refreshItems,
    clearSelection: store.clearSelection,
  } as PlaylistState;
};
