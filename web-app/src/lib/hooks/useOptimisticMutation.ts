'use client';

import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Types pour les mutations optimistes génériques
 */
interface OptimisticUpdateConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  getListsQueryKey: () => QueryKey;
  getDetailQueryKey: (id: number) => QueryKey;
  getStatusCountsQueryKey: () => QueryKey;
  getId: (variables: TVariables) => number;
  getData?: (variables: TVariables) => Partial<TData>;
}

interface OptimisticDeleteConfig<TData> {
  mutationFn: (id: number) => Promise<void>;
  getListsQueryKey: () => QueryKey;
  getDetailQueryKey: (id: number) => QueryKey;
  getStatusCountsQueryKey: () => QueryKey;
  getId: (item: TData) => number | undefined;
}

/**
 * Hook générique pour les mutations UPDATE avec optimistic updates
 */
export function useOptimisticUpdate<TData extends { id?: number }, TVariables extends { id: number }>(
  config: OptimisticUpdateConfig<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { mutationFn, getListsQueryKey, getDetailQueryKey, getStatusCountsQueryKey, getId, getData } = config;

  return useMutation({
    mutationFn,
    
    onMutate: async (variables) => {
      const id = getId(variables);
      
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: getListsQueryKey() });
      await queryClient.cancelQueries({ queryKey: getDetailQueryKey(id) });
      
      // Snapshot pour rollback
      const previousData = queryClient.getQueryData<TData>(getDetailQueryKey(id));
      
      // Mise à jour optimiste du détail
      if (getData) {
        const newData = getData(variables);
        queryClient.setQueryData<TData>(
          getDetailQueryKey(id),
          (old) => old ? { ...old, ...newData, id } as TData : old
        );
        
        // Mise à jour optimiste des listes
        queryClient.setQueriesData<TData[]>(
          { queryKey: getListsQueryKey() },
          (old) => old?.map(item => 
            (item as { id?: number }).id === id 
              ? { ...item, ...newData } as TData 
              : item
          )
        );
      }
      
      return { previousData };
    },
    
    onError: (_error, variables, context) => {
      const id = getId(variables);
      if (context?.previousData) {
        queryClient.setQueryData(getDetailQueryKey(id), context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: getListsQueryKey() });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getListsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getStatusCountsQueryKey() });
    },
  });
}

/**
 * Hook générique pour les mutations DELETE avec optimistic updates
 */
export function useOptimisticDelete<TData extends { id?: number }>(
  config: OptimisticDeleteConfig<TData>
) {
  const queryClient = useQueryClient();
  const { mutationFn, getListsQueryKey, getDetailQueryKey, getStatusCountsQueryKey, getId } = config;

  return useMutation({
    mutationFn,
    
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: getListsQueryKey() });
      
      // Snapshot des listes pour rollback
      const previousLists = queryClient.getQueriesData<TData[]>({
        queryKey: getListsQueryKey()
      });
      
      // Suppression optimiste de toutes les listes
      queryClient.setQueriesData<TData[]>(
        { queryKey: getListsQueryKey() },
        (old) => old?.filter(item => getId(item) !== id)
      );
      
      // Suppression du cache détail
      queryClient.removeQueries({ queryKey: getDetailQueryKey(id) });
      
      return { previousLists };
    },
    
    onError: (_error, _id, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getListsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getStatusCountsQueryKey() });
    },
  });
}
