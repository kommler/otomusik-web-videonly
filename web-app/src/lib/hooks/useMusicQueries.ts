'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../query/queryClient';
import { playlistApi, musicChannelApi, musicReleaseApi, musicVideoApi } from '../api/client';
import type { 
  PlaylistSchema, 
  PlaylistQueryParams,
  MusicChannelSchema,
  MusicChannelQueryParams,
  ReleaseSchema,
  MusicReleaseQueryParams,
  MusicVideoSchema,
  MusicVideoQueryParams,
  CountResponse 
} from '@/types/api';

// Helper pour convertir les params en Record<string, unknown>
const toQueryParams = <T extends object>(params: T): Record<string, unknown> => 
  params as unknown as Record<string, unknown>;

// ============================================================================
// Playlist Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des playlists
 */
export function usePlaylists(
  params: PlaylistQueryParams = {},
  options?: Omit<UseQueryOptions<PlaylistSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.playlists.list(toQueryParams(params)),
    queryFn: () => playlistApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer une playlist par ID
 */
export function usePlaylist(
  id: number,
  options?: Omit<UseQueryOptions<PlaylistSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.playlists.detail(id),
    queryFn: () => playlistApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des playlists
 */
export function usePlaylistStatusCounts(
  params: Omit<PlaylistQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.playlists.statusCounts(toQueryParams(params)),
    queryFn: () => playlistApi.count(params),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook pour créer une playlist
 */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlist: PlaylistSchema) => playlistApi.create(playlist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour une playlist avec Optimistic Update
 */
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, playlist }: { id: number; playlist: PlaylistSchema }) => 
      playlistApi.update(id, playlist),
    
    onMutate: async ({ id, playlist }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.playlists.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.playlists.detail(id) });
      
      const previousData = queryClient.getQueryData<PlaylistSchema>(
        queryKeys.playlists.detail(id)
      );
      
      queryClient.setQueryData(
        queryKeys.playlists.detail(id),
        { ...previousData, ...playlist, id }
      );
      
      queryClient.setQueriesData<PlaylistSchema[]>(
        { queryKey: queryKeys.playlists.lists() },
        (old) => old?.map(p => p.id === id ? { ...p, ...playlist } : p)
      );
      
      return { previousData };
    },
    
    onError: (_error, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.playlists.detail(id), context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.lists() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une playlist avec Optimistic Update
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => playlistApi.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.playlists.lists() });
      
      const previousLists = queryClient.getQueriesData<PlaylistSchema[]>({
        queryKey: queryKeys.playlists.lists()
      });
      
      queryClient.setQueriesData<PlaylistSchema[]>(
        { queryKey: queryKeys.playlists.lists() },
        (old) => old?.filter(p => p.id !== id)
      );
      
      queryClient.removeQueries({ queryKey: queryKeys.playlists.detail(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.statusCounts() });
    },
  });
}

// ============================================================================
// Music Channel Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des music channels
 */
export function useMusicChannels(
  params: MusicChannelQueryParams = {},
  options?: Omit<UseQueryOptions<MusicChannelSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicChannels.list(toQueryParams(params)),
    queryFn: () => musicChannelApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer un music channel par ID
 */
export function useMusicChannel(
  id: number,
  options?: Omit<UseQueryOptions<MusicChannelSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicChannels.detail(id),
    queryFn: () => musicChannelApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des music channels
 */
export function useMusicChannelStatusCounts(
  params: Omit<MusicChannelQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicChannels.statusCounts(toQueryParams(params)),
    queryFn: () => musicChannelApi.count(params),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook pour créer un music channel
 */
export function useCreateMusicChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channel: MusicChannelSchema) => musicChannelApi.create(channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour un music channel avec Optimistic Update
 */
export function useUpdateMusicChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, channel }: { id: number; channel: MusicChannelSchema }) => 
      musicChannelApi.update(id, channel),
    
    onMutate: async ({ id, channel }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicChannels.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.musicChannels.detail(id) });
      
      const previousData = queryClient.getQueryData<MusicChannelSchema>(
        queryKeys.musicChannels.detail(id)
      );
      
      queryClient.setQueryData(
        queryKeys.musicChannels.detail(id),
        { ...previousData, ...channel, id }
      );
      
      queryClient.setQueriesData<MusicChannelSchema[]>(
        { queryKey: queryKeys.musicChannels.lists() },
        (old) => old?.map(c => c.id === id ? { ...c, ...channel } : c)
      );
      
      return { previousData };
    },
    
    onError: (_error, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.musicChannels.detail(id), context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.lists() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer un music channel avec Optimistic Update
 */
export function useDeleteMusicChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicChannelApi.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicChannels.lists() });
      
      const previousLists = queryClient.getQueriesData<MusicChannelSchema[]>({
        queryKey: queryKeys.musicChannels.lists()
      });
      
      queryClient.setQueriesData<MusicChannelSchema[]>(
        { queryKey: queryKeys.musicChannels.lists() },
        (old) => old?.filter(c => c.id !== id)
      );
      
      queryClient.removeQueries({ queryKey: queryKeys.musicChannels.detail(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.statusCounts() });
    },
  });
}

// ============================================================================
// Music Release Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des releases
 */
export function useMusicReleases(
  params: MusicReleaseQueryParams = {},
  options?: Omit<UseQueryOptions<ReleaseSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicReleases.list(toQueryParams(params)),
    queryFn: () => musicReleaseApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer une release par ID
 */
export function useMusicRelease(
  id: number,
  options?: Omit<UseQueryOptions<ReleaseSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicReleases.detail(id),
    queryFn: () => musicReleaseApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des releases
 */
export function useMusicReleaseStatusCounts(
  params: Omit<MusicReleaseQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicReleases.statusCounts(toQueryParams(params)),
    queryFn: () => musicReleaseApi.count(params),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook pour créer une release
 */
export function useCreateMusicRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (release: ReleaseSchema) => musicReleaseApi.create(release),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour une release avec Optimistic Update
 */
export function useUpdateMusicRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, release }: { id: number; release: ReleaseSchema }) => 
      musicReleaseApi.update(id, release),
    
    onMutate: async ({ id, release }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicReleases.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.musicReleases.detail(id) });
      
      const previousData = queryClient.getQueryData<ReleaseSchema>(
        queryKeys.musicReleases.detail(id)
      );
      
      queryClient.setQueryData(
        queryKeys.musicReleases.detail(id),
        { ...previousData, ...release, id }
      );
      
      queryClient.setQueriesData<ReleaseSchema[]>(
        { queryKey: queryKeys.musicReleases.lists() },
        (old) => old?.map(r => r.id === id ? { ...r, ...release } : r)
      );
      
      return { previousData };
    },
    
    onError: (_error, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.musicReleases.detail(id), context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.lists() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une release avec Optimistic Update
 */
export function useDeleteMusicRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicReleaseApi.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicReleases.lists() });
      
      const previousLists = queryClient.getQueriesData<ReleaseSchema[]>({
        queryKey: queryKeys.musicReleases.lists()
      });
      
      queryClient.setQueriesData<ReleaseSchema[]>(
        { queryKey: queryKeys.musicReleases.lists() },
        (old) => old?.filter(r => r.id !== id)
      );
      
      queryClient.removeQueries({ queryKey: queryKeys.musicReleases.detail(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.statusCounts() });
    },
  });
}

// ============================================================================
// Music Video Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des music videos
 */
export function useMusicVideos(
  params: MusicVideoQueryParams = {},
  options?: Omit<UseQueryOptions<MusicVideoSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicVideos.list(toQueryParams(params)),
    queryFn: () => musicVideoApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer une music video par ID
 */
export function useMusicVideo(
  id: number,
  options?: Omit<UseQueryOptions<MusicVideoSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicVideos.detail(id),
    queryFn: () => musicVideoApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des music videos
 */
export function useMusicVideoStatusCounts(
  params: Omit<MusicVideoQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.musicVideos.statusCounts(toQueryParams(params)),
    queryFn: () => musicVideoApi.count(params),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook pour créer une music video
 */
export function useCreateMusicVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: MusicVideoSchema) => musicVideoApi.create(video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour une music video avec Optimistic Update
 */
export function useUpdateMusicVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, video }: { id: number; video: MusicVideoSchema }) => 
      musicVideoApi.update(id, video),
    
    onMutate: async ({ id, video }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicVideos.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.musicVideos.detail(id) });
      
      const previousData = queryClient.getQueryData<MusicVideoSchema>(
        queryKeys.musicVideos.detail(id)
      );
      
      queryClient.setQueryData(
        queryKeys.musicVideos.detail(id),
        { ...previousData, ...video, id }
      );
      
      queryClient.setQueriesData<MusicVideoSchema[]>(
        { queryKey: queryKeys.musicVideos.lists() },
        (old) => old?.map(v => v.id === id ? { ...v, ...video } : v)
      );
      
      return { previousData };
    },
    
    onError: (_error, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.musicVideos.detail(id), context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une music video avec Optimistic Update
 */
export function useDeleteMusicVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicVideoApi.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.musicVideos.lists() });
      
      const previousLists = queryClient.getQueriesData<MusicVideoSchema[]>({
        queryKey: queryKeys.musicVideos.lists()
      });
      
      queryClient.setQueriesData<MusicVideoSchema[]>(
        { queryKey: queryKeys.musicVideos.lists() },
        (old) => old?.filter(v => v.id !== id)
      );
      
      queryClient.removeQueries({ queryKey: queryKeys.musicVideos.detail(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.statusCounts() });
    },
  });
}
