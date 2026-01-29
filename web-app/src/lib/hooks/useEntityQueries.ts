'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../query/queryClient';
import { videoApi, channelApi } from '../api/client';
import type { 
  VideoSchema, 
  VideoQueryParams, 
  ChannelSchema, 
  ChannelQueryParams,
  CountResponse 
} from '@/types/api';

// Helper pour convertir les params en Record<string, unknown>
const toQueryParams = <T extends object>(params: T): Record<string, unknown> => 
  params as unknown as Record<string, unknown>;

// ============================================================================
// Video Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des vidéos
 */
export function useVideos(
  params: VideoQueryParams = {},
  options?: Omit<UseQueryOptions<VideoSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.videos.list(toQueryParams(params)),
    queryFn: () => videoApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer une vidéo par ID
 */
export function useVideo(
  id: number,
  options?: Omit<UseQueryOptions<VideoSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.videos.detail(id),
    queryFn: () => videoApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des vidéos
 */
export function useVideoStatusCounts(
  params: Omit<VideoQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.videos.statusCounts(toQueryParams(params)),
    queryFn: () => videoApi.count(params),
    staleTime: 10 * 1000, // 10 secondes pour les compteurs
    ...options,
  });
}

/**
 * Hook pour créer une vidéo
 */
export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: VideoSchema) => videoApi.create(video),
    onSuccess: () => {
      // Invalider la liste et les compteurs
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour une vidéo
 */
export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, video }: { id: number; video: VideoSchema }) => 
      videoApi.update(id, video),
    onSuccess: (updatedVideo) => {
      // Mettre à jour le cache de la vidéo spécifique
      if (updatedVideo.id) {
        queryClient.setQueryData(
          queryKeys.videos.detail(updatedVideo.id),
          updatedVideo
        );
      }
      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une vidéo
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => videoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.statusCounts() });
    },
  });
}

// ============================================================================
// Channel Hooks
// ============================================================================

/**
 * Hook pour récupérer la liste des channels
 */
export function useChannels(
  params: ChannelQueryParams = {},
  options?: Omit<UseQueryOptions<ChannelSchema[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.channels.list(toQueryParams(params)),
    queryFn: () => channelApi.list(params),
    ...options,
  });
}

/**
 * Hook pour récupérer un channel par ID
 */
export function useChannel(
  id: number,
  options?: Omit<UseQueryOptions<ChannelSchema, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.channels.detail(id),
    queryFn: () => channelApi.get(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour récupérer les compteurs de statut des channels
 */
export function useChannelStatusCounts(
  params: Omit<ChannelQueryParams, 'limit' | 'sort_by' | 'sort_order'> = {},
  options?: Omit<UseQueryOptions<CountResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.channels.statusCounts(toQueryParams(params)),
    queryFn: () => channelApi.count(params),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook pour créer un channel
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channel: ChannelSchema) => channelApi.create(channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.statusCounts() });
    },
  });
}

/**
 * Hook pour mettre à jour un channel
 */
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, channel }: { id: number; channel: ChannelSchema }) => 
      channelApi.update(id, channel),
    onSuccess: (updatedChannel) => {
      if (updatedChannel.id) {
        queryClient.setQueryData(
          queryKeys.channels.detail(updatedChannel.id),
          updatedChannel
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer un channel
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => channelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.statusCounts() });
    },
  });
}
