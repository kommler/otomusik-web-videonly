// Hooks personnalisés
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce';
export { useInitialLoad, useFilteredLoad, usePageData } from './usePageData';

// React Query hooks - Videos & Channels
export {
  useVideos,
  useVideo,
  useVideoStatusCounts,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  useChannels,
  useChannel,
  useChannelStatusCounts,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from './useEntityQueries';

// React Query hooks - Playlists & Music
export {
  usePlaylists,
  usePlaylist,
  usePlaylistStatusCounts,
  useCreatePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
  useMusicChannels,
  useMusicChannel,
  useMusicChannelStatusCounts,
  useCreateMusicChannel,
  useUpdateMusicChannel,
  useDeleteMusicChannel,
  useMusicReleases,
  useMusicRelease,
  useMusicReleaseStatusCounts,
  useCreateMusicRelease,
  useUpdateMusicRelease,
  useDeleteMusicRelease,
  useMusicVideos,
  useMusicVideo,
  useMusicVideoStatusCounts,
  useCreateMusicVideo,
  useUpdateMusicVideo,
  useDeleteMusicVideo,
} from './useMusicQueries';
