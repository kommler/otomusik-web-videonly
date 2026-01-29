/**
 * Suspense-compatible data fetching utilities
 * 
 * These utilities enable React Suspense streaming by wrapping promises
 * in a way that Suspense can handle.
 */

// ============================================================================
// Types
// ============================================================================

type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

interface SuspenseResource<T> {
  read: () => T;
  status: PromiseStatus;
}

interface CacheEntry<T> {
  resource: SuspenseResource<T>;
  timestamp: number;
}

// ============================================================================
// Resource Cache
// ============================================================================

const resourceCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_CACHE_TTL = 30000; // 30 seconds

/**
 * Clear expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of resourceCache.entries()) {
    if (now - entry.timestamp > DEFAULT_CACHE_TTL * 2) {
      resourceCache.delete(key);
    }
  }
}

// Cleanup cache periodically
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 60000);
}

// ============================================================================
// Suspense Resource Creator
// ============================================================================

/**
 * Wraps a promise to make it compatible with React Suspense.
 * When the component using this resource renders:
 * - If pending: throws the promise (Suspense catches it, shows fallback)
 * - If fulfilled: returns the data
 * - If rejected: throws the error (ErrorBoundary catches it)
 */
export function createSuspenseResource<T>(promise: Promise<T>): SuspenseResource<T> {
  let status: PromiseStatus = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = 'fulfilled';
      result = data;
    },
    (err) => {
      status = 'rejected';
      error = err instanceof Error ? err : new Error(String(err));
    }
  );

  return {
    read() {
      switch (status) {
        case 'pending':
          throw suspender;
        case 'rejected':
          throw error;
        case 'fulfilled':
          return result;
      }
    },
    get status() {
      return status;
    },
  };
}

// ============================================================================
// Cached Suspense Resource
// ============================================================================

/**
 * Creates a cached suspense resource that can be reused across renders.
 * The cache key is used to store and retrieve the resource.
 */
export function createCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; forceRefresh?: boolean } = {}
): SuspenseResource<T> {
  const { ttl = DEFAULT_CACHE_TTL, forceRefresh = false } = options;
  const now = Date.now();

  // Check if we have a valid cached entry
  const cached = resourceCache.get(key) as CacheEntry<T> | undefined;
  
  if (cached && !forceRefresh) {
    const isExpired = now - cached.timestamp > ttl;
    
    // If not expired, return cached resource
    if (!isExpired) {
      return cached.resource;
    }
    
    // If expired but still fulfilled, start background refresh
    if (cached.resource.status === 'fulfilled') {
      // Trigger background refresh
      const newResource = createSuspenseResource(fetcher());
      resourceCache.set(key, { resource: newResource, timestamp: now });
      
      // Return stale data while refreshing (stale-while-revalidate)
      return cached.resource;
    }
  }

  // Create new resource
  const resource = createSuspenseResource(fetcher());
  resourceCache.set(key, { resource, timestamp: now });
  
  return resource;
}

/**
 * Invalidate a cached resource, forcing a refresh on next access
 */
export function invalidateResource(key: string) {
  resourceCache.delete(key);
}

/**
 * Invalidate all cached resources matching a pattern
 */
export function invalidateResources(pattern: string | RegExp) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  for (const key of resourceCache.keys()) {
    if (regex.test(key)) {
      resourceCache.delete(key);
    }
  }
}

// ============================================================================
// Preloading
// ============================================================================

/**
 * Preload data for a component before it mounts.
 * Useful for prefetching data on hover or anticipating navigation.
 */
export function preloadResource<T>(
  key: string,
  fetcher: () => Promise<T>
): void {
  // Don't preload if already cached
  if (resourceCache.has(key)) {
    return;
  }

  const resource = createSuspenseResource(fetcher());
  resourceCache.set(key, { resource, timestamp: Date.now() });
}

// ============================================================================
// Multiple Resources
// ============================================================================

interface ResourceMap {
  [key: string]: SuspenseResource<unknown>;
}

/**
 * Read multiple resources in parallel.
 * All resources must be fulfilled for this to return.
 */
export function readAllResources<T extends ResourceMap>(
  resources: T
): { [K in keyof T]: T[K] extends SuspenseResource<infer U> ? U : never } {
  const result = {} as { [K in keyof T]: T[K] extends SuspenseResource<infer U> ? U : never };
  
  for (const [key, resource] of Object.entries(resources)) {
    result[key as keyof T] = resource.read() as never;
  }
  
  return result;
}

// ============================================================================
// React Hook Integration (for non-Suspense fallback)
// ============================================================================

/**
 * Hook to use a suspense resource in a non-Suspense context.
 * Falls back to loading/error states instead of throwing.
 */
export function useResource<T>(resource: SuspenseResource<T>): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  try {
    const data = resource.read();
    return { data, loading: false, error: null };
  } catch (thrown) {
    if (thrown instanceof Promise) {
      return { data: null, loading: true, error: null };
    }
    return { 
      data: null, 
      loading: false, 
      error: thrown instanceof Error ? thrown : new Error(String(thrown)) 
    };
  }
}
