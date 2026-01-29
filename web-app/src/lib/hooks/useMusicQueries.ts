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
 * Hook pour mettre à jour une playlist
 */
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, playlist }: { id: number; playlist: PlaylistSchema }) => 
      playlistApi.update(id, playlist),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist.id) {
        queryClient.setQueryData(
          queryKeys.playlists.detail(updatedPlaylist.id),
          updatedPlaylist
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une playlist
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => playlistApi.delete(id),
    onSuccess: () => {
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
 * Hook pour mettre à jour un music channel
 */
export function useUpdateMusicChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, channel }: { id: number; channel: MusicChannelSchema }) => 
      musicChannelApi.update(id, channel),
    onSuccess: (updatedChannel) => {
      if (updatedChannel.id) {
        queryClient.setQueryData(
          queryKeys.musicChannels.detail(updatedChannel.id),
          updatedChannel
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicChannels.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer un music channel
 */
export function useDeleteMusicChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicChannelApi.delete(id),
    onSuccess: () => {
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
 * Hook pour mettre à jour une release
 */
export function useUpdateMusicRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, release }: { id: number; release: ReleaseSchema }) => 
      musicReleaseApi.update(id, release),
    onSuccess: (updatedRelease) => {
      if (updatedRelease.id) {
        queryClient.setQueryData(
          queryKeys.musicReleases.detail(updatedRelease.id),
          updatedRelease
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicReleases.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une release
 */
export function useDeleteMusicRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicReleaseApi.delete(id),
    onSuccess: () => {
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
 * Hook pour mettre à jour une music video
 */
export function useUpdateMusicVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, video }: { id: number; video: MusicVideoSchema }) => 
      musicVideoApi.update(id, video),
    onSuccess: (updatedVideo) => {
      if (updatedVideo.id) {
        queryClient.setQueryData(
          queryKeys.musicVideos.detail(updatedVideo.id),
          updatedVideo
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une music video
 */
export function useDeleteMusicVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => musicVideoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.musicVideos.statusCounts() });
    },
  });
}
