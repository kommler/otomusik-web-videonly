/**
 * Cache API simple en mémoire avec TTL
 * Améliore les temps de réponse en évitant les requêtes réseau répétitives
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  /** TTL par défaut en millisecondes (5 minutes) */
  defaultTTL: number;
  /** Taille max du cache */
  maxSize: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
};

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Génère une clé de cache basée sur l'endpoint et les paramètres
   */
  private generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const sortedParams = params 
      ? JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)))
      : '';
    return `${endpoint}:${sortedParams}`;
  }

  /**
   * Récupère une entrée du cache si elle existe et n'est pas expirée
   */
  get<T>(endpoint: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Vérifier si expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set<T>(endpoint: string, params: Record<string, unknown> | undefined, data: T, ttl?: number): void {
    const key = this.generateKey(endpoint, params);
    const now = Date.now();

    // Nettoyer le cache si trop grand
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl ?? this.config.defaultTTL),
    });
  }

  /**
   * Invalide le cache pour un endpoint spécifique
   */
  invalidate(endpoint: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(endpoint)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalide tout le cache
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Supprime les entrées les plus anciennes
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
    };
  }
}

// Instance singleton du cache
export const apiCache = new APICache();

/**
 * HOF pour wrapper une fonction API avec cache
 */
export function withCache<T, P extends Record<string, unknown>>(
  fn: (params?: P) => Promise<T>,
  endpoint: string,
  options: { ttl?: number; enabled?: boolean } = {}
): (params?: P) => Promise<T> {
  const { ttl, enabled = true } = options;

  return async (params?: P): Promise<T> => {
    if (!enabled) {
      return fn(params);
    }

    // Essayer le cache d'abord
    const cached = apiCache.get<T>(endpoint, params as Record<string, unknown>);
    if (cached !== null) {
      console.log(`[Cache HIT] ${endpoint}`);
      return cached;
    }

    // Sinon, faire la requête
    console.log(`[Cache MISS] ${endpoint}`);
    const data = await fn(params);
    apiCache.set(endpoint, params as Record<string, unknown>, data, ttl);
    return data;
  };
}

/**
 * TTL courts pour les données fréquemment mises à jour
 */
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 secondes - pour les counts
  MEDIUM: 2 * 60 * 1000, // 2 minutes - pour les listes
  LONG: 10 * 60 * 1000,  // 10 minutes - pour les données statiques
} as const;

export default apiCache;
