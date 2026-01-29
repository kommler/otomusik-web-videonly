import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Configuration optimisée pour React Query
 * 
 * Stratégies de cache:
 * - staleTime: Temps pendant lequel les données sont considérées "fraîches"
 * - gcTime: Temps de conservation en cache après que le composant est démonté
 * - refetchOnWindowFocus: Revalider quand l'utilisateur revient sur l'onglet
 * - retry: Nombre de tentatives en cas d'erreur
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches pendant 30 secondes
      staleTime: 30 * 1000,
      
      // Garder en cache 5 minutes après démontage
      gcTime: 5 * 60 * 1000,
      
      // Revalider quand l'utilisateur revient sur l'onglet
      refetchOnWindowFocus: true,
      
      // Ne pas refetch automatiquement quand le composant remonte
      refetchOnMount: false,
      
      // Retry une fois en cas d'erreur
      retry: 1,
      
      // Délai entre les retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry les mutations une fois
      retry: 1,
    },
  },
});

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Factory pour générer des clés de query cohérentes
 * Permet une invalidation granulaire du cache
 */
export const queryKeys = {
  // Channels
  channels: {
    all: ['channels'] as const,
    lists: () => [...queryKeys.channels.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.channels.lists(), filters] as const,
    details: () => [...queryKeys.channels.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.channels.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.channels.all, 'statusCounts', filters] as const,
  },

  // Videos
  videos: {
    all: ['videos'] as const,
    lists: () => [...queryKeys.videos.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.videos.lists(), filters] as const,
    details: () => [...queryKeys.videos.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.videos.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.videos.all, 'statusCounts', filters] as const,
  },

  // Playlists
  playlists: {
    all: ['playlists'] as const,
    lists: () => [...queryKeys.playlists.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.playlists.lists(), filters] as const,
    details: () => [...queryKeys.playlists.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.playlists.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.playlists.all, 'statusCounts', filters] as const,
  },

  // Music Channels
  musicChannels: {
    all: ['musicChannels'] as const,
    lists: () => [...queryKeys.musicChannels.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.musicChannels.lists(), filters] as const,
    details: () => [...queryKeys.musicChannels.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.musicChannels.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.musicChannels.all, 'statusCounts', filters] as const,
  },

  // Music Videos
  musicVideos: {
    all: ['musicVideos'] as const,
    lists: () => [...queryKeys.musicVideos.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.musicVideos.lists(), filters] as const,
    details: () => [...queryKeys.musicVideos.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.musicVideos.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.musicVideos.all, 'statusCounts', filters] as const,
  },

  // Music Releases
  musicReleases: {
    all: ['musicReleases'] as const,
    lists: () => [...queryKeys.musicReleases.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.musicReleases.lists(), filters] as const,
    details: () => [...queryKeys.musicReleases.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.musicReleases.details(), id] as const,
    statusCounts: (filters?: Record<string, unknown>) => [...queryKeys.musicReleases.all, 'statusCounts', filters] as const,
  },
};

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Invalider toutes les queries d'une entité
 */
export function invalidateEntity(entity: keyof typeof queryKeys) {
  return queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
}

/**
 * Invalider les listes d'une entité (après création/suppression)
 */
export function invalidateEntityLists(entity: keyof typeof queryKeys) {
  return queryClient.invalidateQueries({ queryKey: queryKeys[entity].lists() });
}

/**
 * Mettre à jour optimistiquement une entité dans le cache
 */
export function setEntityInCache<T>(
  entity: keyof typeof queryKeys,
  id: number,
  updater: (old: T | undefined) => T
) {
  queryClient.setQueryData(
    queryKeys[entity].detail(id),
    updater
  );
}
