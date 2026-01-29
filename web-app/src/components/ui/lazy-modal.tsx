'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from './loading';

/**
 * Lazy-loaded Modal component
 * Le Modal est chargé dynamiquement car il n'est pas toujours visible
 */
export const LazyModal = dynamic(
  () => import('./modal').then(mod => ({ default: mod.Modal })),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
        <LoadingSpinner size="lg" />
      </div>
    ),
    ssr: false,
  }
);

/**
 * Lazy-loaded ModalContent
 */
export const LazyModalContent = dynamic(
  () => import('./modal').then(mod => ({ default: mod.ModalContent })),
  { ssr: false }
);

/**
 * Lazy-loaded ModalFooter
 */
export const LazyModalFooter = dynamic(
  () => import('./modal').then(mod => ({ default: mod.ModalFooter })),
  { ssr: false }
);
