// Export table components for easy importing
export { DataTable } from '../ui/data-table';
export * from './BaseTable';
export { VideoTable } from './VideoTable';
export { ChannelTable } from './ChannelTable';
export { MusicChannelTable } from './MusicChannelTable';
export { MusicReleaseTable } from './MusicReleaseTable';
export { MusicVideoTable } from './MusicVideoTable';
export { PlaylistTable } from './PlaylistTable';
export { MusicPlaylistTable } from './MusicPlaylistTable';

// Lazy-loaded versions for code splitting
export {
  LazyVideoTable,
  LazyChannelTable,
  LazyPlaylistTable,
  LazyMusicPlaylistTable,
  LazyMusicChannelTable,
  LazyMusicReleaseTable,
  LazyMusicVideoTable,
} from './lazy';