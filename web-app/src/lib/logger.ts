/**
 * Logger utilitaire pour le développement
 * Désactivé automatiquement en production
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log uniquement en développement
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    // Les erreurs sont toujours loggées
    console.error('[ERROR]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args);
  },
  api: (message: string, data?: unknown) => {
    if (isDev) console.log(`[API] ${message}`, data || '');
  },
  cache: (hit: boolean, endpoint: string) => {
    if (isDev) console.log(`[Cache ${hit ? 'HIT' : 'MISS'}] ${endpoint}`);
  },
  perf: (label: string, startTime: number) => {
    if (isDev) {
      const duration = performance.now() - startTime;
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};

export default logger;
