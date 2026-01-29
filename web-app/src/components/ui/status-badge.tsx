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
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer select-none transition-all duration-200 hover:shadow-md",
        getStatusColor(status),
        className
      )}
      onDoubleClick={onDoubleClick}
      title={onDoubleClick ? "Double-cliquez pour passer le statut en WAITING" : undefined}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
