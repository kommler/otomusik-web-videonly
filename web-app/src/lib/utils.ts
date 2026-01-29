import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un nombre avec notation abrégée (K, M)
 */
export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Formate une durée en secondes en format HH:MM:SS ou MM:SS
 */
export function formatDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds === 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate une taille en bytes en format lisible (KB, MB, GB)
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || bytes === 0) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formate un message d'erreur de façon lisible
 */
export function formatErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return err.join(', ');
  if (typeof err === 'object' && err !== null) {
    if ('message' in err) return String((err as { message: unknown }).message);
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return 'Error details available';
    }
  }
  return String(err);
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 heures")
 */
export function formatRelativeDate(date?: string | Date | null): string {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '-';
  }
}