'use client';

import dynamic from 'next/dynamic';
import { FilterSkeleton } from '../ui';

/**
 * Lazy-loaded filter panel components
 * Ces composants sont chargés dynamiquement pour réduire le bundle initial
 */

// Video Filter Panel - lazy loaded
export const LazyVideoFilterPanel = dynamic(
  () => import('./VideoFilterPanel').then(mod => ({ default: mod.VideoFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Channel Filter Panel - lazy loaded
export const LazyChannelFilterPanel = dynamic(
  () => import('./ChannelFilterPanel').then(mod => ({ default: mod.ChannelFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Playlist Filter Panel - lazy loaded
export const LazyPlaylistFilterPanel = dynamic(
  () => import('./PlaylistFilterPanel').then(mod => ({ default: mod.PlaylistFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Music Playlist Filter Panel - lazy loaded
export const LazyMusicPlaylistFilterPanel = dynamic(
  () => import('./MusicPlaylistFilterPanel').then(mod => ({ default: mod.MusicPlaylistFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Music Channel Filter Panel - lazy loaded
export const LazyMusicChannelFilterPanel = dynamic(
  () => import('./MusicChannelFilterPanel').then(mod => ({ default: mod.MusicChannelFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Music Release Filter Panel - lazy loaded
export const LazyMusicReleaseFilterPanel = dynamic(
  () => import('./MusicReleaseFilterPanel').then(mod => ({ default: mod.MusicReleaseFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);

// Music Video Filter Panel - lazy loaded
export const LazyMusicVideoFilterPanel = dynamic(
  () => import('./MusicVideoFilterPanel').then(mod => ({ default: mod.MusicVideoFilterPanel })),
  {
    loading: () => <FilterSkeleton filters={4} />,
    ssr: false,
  }
);
