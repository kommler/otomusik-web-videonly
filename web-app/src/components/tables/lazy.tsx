'use client';

import dynamic from 'next/dynamic';
import { TableSkeleton } from '../ui';

/**
 * Lazy-loaded table components
 * Ces composants sont chargés dynamiquement pour réduire le bundle initial
 */

// Video Table - lazy loaded
export const LazyVideoTable = dynamic(
  () => import('./VideoTable').then(mod => ({ default: mod.VideoTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={6} />,
    ssr: false, // Tables are interactive, no SSR needed
  }
);

// Channel Table - lazy loaded
export const LazyChannelTable = dynamic(
  () => import('./ChannelTable').then(mod => ({ default: mod.ChannelTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={6} />,
    ssr: false,
  }
);

// Playlist Table - lazy loaded
export const LazyPlaylistTable = dynamic(
  () => import('./PlaylistTable').then(mod => ({ default: mod.PlaylistTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={5} />,
    ssr: false,
  }
);

// Music Playlist Table - lazy loaded
export const LazyMusicPlaylistTable = dynamic(
  () => import('./MusicPlaylistTable').then(mod => ({ default: mod.MusicPlaylistTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={5} />,
    ssr: false,
  }
);

// Music Channel Table - lazy loaded
export const LazyMusicChannelTable = dynamic(
  () => import('./MusicChannelTable').then(mod => ({ default: mod.MusicChannelTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={6} />,
    ssr: false,
  }
);

// Music Release Table - lazy loaded
export const LazyMusicReleaseTable = dynamic(
  () => import('./MusicReleaseTable').then(mod => ({ default: mod.MusicReleaseTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={6} />,
    ssr: false,
  }
);

// Music Video Table - lazy loaded
export const LazyMusicVideoTable = dynamic(
  () => import('./MusicVideoTable').then(mod => ({ default: mod.MusicVideoTable })),
  {
    loading: () => <TableSkeleton rows={10} columns={6} />,
    ssr: false,
  }
);
