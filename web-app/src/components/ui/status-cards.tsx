'use client';

import React, { Suspense } from 'react';
import { StatsSkeleton } from '@/components/ui/skeletons';

// ============================================================================
// Types
// ============================================================================

interface StatusCount {
  status: string;
  count: number;
  color?: string;
  icon?: React.ReactNode;
}

interface StatusCardsProps {
  counts: StatusCount[];
  loading?: boolean;
  onStatusClick?: (status: string) => void;
  activeStatus?: string | null;
}

// ============================================================================
// Status Card Component
// ============================================================================

function StatusCard({
  status,
  count,
  color = 'gray',
  icon,
  isActive,
  onClick,
}: {
  status: string;
  count: number;
  color?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 rounded-lg transition-all
        ${colorClasses[color] || colorClasses.gray}
        ${isActive ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
      `}
    >
      <div className="flex items-center space-x-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div className="text-left">
          <p className="text-sm font-medium opacity-75">{status}</p>
          <p className="text-2xl font-bold">{count.toLocaleString()}</p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Status Cards Grid
// ============================================================================

export function StatusCards({
  counts,
  loading,
  onStatusClick,
  activeStatus,
}: StatusCardsProps) {
  if (loading) {
    return <StatsSkeleton cards={counts.length || 4} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {counts.map(({ status, count, color, icon }) => (
        <StatusCard
          key={status}
          status={status}
          count={count}
          color={color}
          icon={icon}
          isActive={activeStatus === status}
          onClick={onStatusClick ? () => onStatusClick(status) : undefined}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Suspense-wrapped version
// ============================================================================

export function StatusCardsWithSuspense(props: StatusCardsProps) {
  return (
    <Suspense fallback={<StatsSkeleton cards={props.counts.length || 4} />}>
      <StatusCards {...props} />
    </Suspense>
  );
}

export default StatusCards;
