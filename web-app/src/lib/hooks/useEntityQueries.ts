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
 * Hook pour mettre à jour une vidéo avec Optimistic Update
 */
export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, video }: { id: number; video: VideoSchema }) => 
      videoApi.update(id, video),
    
    // Optimistic update: mettre à jour le cache AVANT la réponse serveur
    onMutate: async ({ id, video }) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: queryKeys.videos.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.videos.detail(id) });
      
      // Snapshot de l'état précédent pour rollback
      const previousVideo = queryClient.getQueryData<VideoSchema>(
        queryKeys.videos.detail(id)
      );
      
      // Mettre à jour optimistiquement le détail
      queryClient.setQueryData(
        queryKeys.videos.detail(id),
        { ...previousVideo, ...video, id }
      );
      
      // Mettre à jour optimistiquement dans toutes les listes
      queryClient.setQueriesData<VideoSchema[]>(
        { queryKey: queryKeys.videos.lists() },
        (old) => old?.map(v => v.id === id ? { ...v, ...video } : v)
      );
      
      return { previousVideo };
    },
    
    // Rollback en cas d'erreur
    onError: (_error, { id }, context) => {
      if (context?.previousVideo) {
        queryClient.setQueryData(
          queryKeys.videos.detail(id),
          context.previousVideo
        );
      }
      // Revalider pour récupérer l'état serveur
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() });
    },
    
    // Toujours revalider après mutation (succès ou erreur)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer une vidéo avec Optimistic Update
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => videoApi.delete(id),
    
    // Optimistic update: supprimer immédiatement de l'UI
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.videos.lists() });
      
      // Snapshot des listes pour rollback
      const previousLists = queryClient.getQueriesData<VideoSchema[]>({
        queryKey: queryKeys.videos.lists()
      });
      
      // Supprimer optimistiquement de toutes les listes
      queryClient.setQueriesData<VideoSchema[]>(
        { queryKey: queryKeys.videos.lists() },
        (old) => old?.filter(v => v.id !== id)
      );
      
      // Supprimer du cache détail
      queryClient.removeQueries({ queryKey: queryKeys.videos.detail(id) });
      
      return { previousLists };
    },
    
    // Rollback en cas d'erreur
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
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
 * Hook pour mettre à jour un channel avec Optimistic Update
 */
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, channel }: { id: number; channel: ChannelSchema }) => 
      channelApi.update(id, channel),
    
    // Optimistic update
    onMutate: async ({ id, channel }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.channels.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.channels.detail(id) });
      
      const previousChannel = queryClient.getQueryData<ChannelSchema>(
        queryKeys.channels.detail(id)
      );
      
      queryClient.setQueryData(
        queryKeys.channels.detail(id),
        { ...previousChannel, ...channel, id }
      );
      
      queryClient.setQueriesData<ChannelSchema[]>(
        { queryKey: queryKeys.channels.lists() },
        (old) => old?.map(c => c.id === id ? { ...c, ...channel } : c)
      );
      
      return { previousChannel };
    },
    
    onError: (_error, { id }, context) => {
      if (context?.previousChannel) {
        queryClient.setQueryData(
          queryKeys.channels.detail(id),
          context.previousChannel
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.statusCounts() });
    },
  });
}

/**
 * Hook pour supprimer un channel avec Optimistic Update
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => channelApi.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.channels.lists() });
      
      const previousLists = queryClient.getQueriesData<ChannelSchema[]>({
        queryKey: queryKeys.channels.lists()
      });
      
      queryClient.setQueriesData<ChannelSchema[]>(
        { queryKey: queryKeys.channels.lists() },
        (old) => old?.filter(c => c.id !== id)
      );
      
      queryClient.removeQueries({ queryKey: queryKeys.channels.detail(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.statusCounts() });
    },
  });
}
