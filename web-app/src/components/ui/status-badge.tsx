'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { getStatusColor } from '../../lib/status-utils';

interface StatusBadgeProps {
  status: string | null | undefined;
  onDoubleClick?: () => void;
  className?: string;
}

/**
 * Badge de statut réutilisable pour toutes les entités
 * Double-clic pour modifier le statut (si handler fourni)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ 
  status, 
  onDoubleClick,
  className 
}) => {
  if (!status) {
    return <span className="text-gray-400">-</span>;
  }

  // Titre dynamique selon le statut
  const getTooltip = () => {
    if (!onDoubleClick) return undefined;
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'DOWNLOADED') return 'Double-cliquez pour passer en WAITING';
    if (upperStatus === 'WAITING') return 'Double-cliquez pour repasser en DOWNLOADED';
    return undefined;
  };

  // Cursor pointer seulement si double-click possible
  const isClickable = onDoubleClick && ['DOWNLOADED', 'WAITING'].includes(status.toUpperCase());
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize select-none transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-blue-300",
        getStatusColor(status),
        className
      )}
      onDoubleClick={onDoubleClick}
      title={getTooltip()}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
