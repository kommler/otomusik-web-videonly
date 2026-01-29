/**
 * Couleurs de statut standardisées pour toutes les entités
 */
export const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  DOWNLOADED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  DOWNLOADING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  EXTRACTING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  CURRENT: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400',
  ANALYZED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  SCRAPING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  SKIP: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  DEFAULT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

/**
 * Retourne la classe CSS pour un statut donné
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status?.toUpperCase()] || STATUS_COLORS.DEFAULT;
};

/**
 * Couleurs pour les filtres (normal, active, count)
 */
export const getStatusFilterColors = (status: string) => {
  const base = status?.toLowerCase() || '';
  
  const colorMap: Record<string, { normal: string; active: string; count: string }> = {
    downloaded: {
      normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      active: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
      count: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
    },
    downloading: {
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
      count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
    },
    pending: {
      normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
      count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
    },
    extracting: {
      normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
      count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
    },
    scraping: {
      normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
      count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
    },
    current: {
      normal: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400',
      active: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100',
      count: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100'
    },
    analyzed: {
      normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
      count: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100'
    },
    failed: {
      normal: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
      count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
    },
    error: {
      normal: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      active: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
      count: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
    },
    skip: {
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      active: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
      count: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
    },
    waiting: {
      normal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      active: 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100',
      count: 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100'
    },
  };

  return colorMap[base] || {
    normal: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    active: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    count: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
  };
};

/**
 * Constantes de pagination standardisées
 */
export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_SORT_BY = 'updated_at';
export const DEFAULT_SORT_ORDER = 'desc' as const;

/**
 * Filtres initiaux par défaut
 */
export const createDefaultFilters = <T extends object>(overrides?: Partial<T>): T => ({
  limit: DEFAULT_PAGE_SIZE,
  sort_by: DEFAULT_SORT_BY,
  sort_order: DEFAULT_SORT_ORDER,
  ...overrides,
} as T);
