'use client';

import React, { useCallback, useRef } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Mapping des routes vers les fonctions de prefetch
 * Permet de précharger les données quand on survole un lien
 */
type PrefetchFunction = () => Promise<void> | void;

interface PrefetchConfig {
  [route: string]: PrefetchFunction[];
}

// Store global pour les fonctions de prefetch
let prefetchConfig: PrefetchConfig = {};

/**
 * Enregistre les fonctions de prefetch pour une route
 */
export function registerPrefetch(route: string, functions: PrefetchFunction[]) {
  prefetchConfig[route] = functions;
}

/**
 * Efface la config de prefetch pour une route
 */
export function clearPrefetch(route: string) {
  delete prefetchConfig[route];
}

interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  prefetchData?: PrefetchFunction[];
  prefetchDelay?: number;
  title?: string;
}

/**
 * Lien avec prefetch des données au survol
 * Précharge les données avant même que l'utilisateur clique
 */
export function PrefetchLink({
  children,
  className,
  prefetchData,
  prefetchDelay = 100,
  href,
  title,
  ...props
}: PrefetchLinkProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current) return;

    // Utiliser les fonctions passées en props ou celles enregistrées pour la route
    const functions = prefetchData || prefetchConfig[href.toString()];
    if (!functions || functions.length === 0) return;

    timeoutRef.current = setTimeout(() => {
      prefetchedRef.current = true;
      // Exécuter tous les prefetch en parallèle
      Promise.all(functions.map(fn => fn())).catch(console.error);
    }, prefetchDelay);
  }, [prefetchData, prefetchDelay, href]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={title}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Hook pour préfetcher des données manuellement
 */
export function usePrefetch() {
  const prefetch = useCallback((functions: PrefetchFunction[]) => {
    Promise.all(functions.map(fn => fn())).catch(console.error);
  }, []);

  const prefetchRoute = useCallback((route: string) => {
    const functions = prefetchConfig[route];
    if (functions && functions.length > 0) {
      Promise.all(functions.map(fn => fn())).catch(console.error);
    }
  }, []);

  return { prefetch, prefetchRoute };
}

export default PrefetchLink;
