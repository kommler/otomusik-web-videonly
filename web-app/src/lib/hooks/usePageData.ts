import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour charger les données initiales d'une page une seule fois
 * Évite les doubles chargements et optimise les requêtes parallèles
 */
export function useInitialLoad(
  loadFunctions: (() => Promise<void> | void)[],
  deps: React.DependencyList = []
) {
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // Exécuter toutes les fonctions en parallèle
    Promise.all(loadFunctions.map(fn => fn()));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook pour recharger les données quand les filtres changent
 * Avec debounce intégré pour éviter les requêtes trop fréquentes
 */
export function useFilteredLoad<T>(
  filters: T,
  loadFunctions: ((filters: T) => Promise<void> | void)[],
  options?: {
    debounceMs?: number;
    skipInitial?: boolean;
  }
) {
  const { debounceMs = 0, skipInitial = true } = options || {};
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip le premier render si demandé (évite le double load)
    if (skipInitial && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;

    const executeLoad = () => {
      Promise.all(loadFunctions.map(fn => fn(filters)));
    };

    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(executeLoad, debounceMs);
    } else {
      executeLoad();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook combiné pour le pattern commun : load initial + reload sur changement de filtres
 */
export function usePageData<T extends object>(
  config: {
    /** Fonctions à appeler au chargement initial (en parallèle) */
    initialLoad: (() => Promise<void> | void)[];
    /** Fonctions à appeler quand les filtres changent */
    onFiltersChange?: ((filters: T) => Promise<void> | void)[];
    /** Filtres actuels */
    filters?: T;
    /** Délai de debounce pour les changements de filtres (ms) */
    filterDebounceMs?: number;
  }
) {
  const { initialLoad, onFiltersChange, filters, filterDebounceMs = 0 } = config;
  
  // Chargement initial une seule fois
  useInitialLoad(initialLoad);
  
  // Rechargement sur changement de filtres
  if (onFiltersChange && filters) {
    useFilteredLoad(filters, onFiltersChange, {
      debounceMs: filterDebounceMs,
      skipInitial: true,
    });
  }
}

export default usePageData;
