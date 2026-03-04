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
  const inactiveClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    blue: 'bg-blue-50 text-blue-400 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-400 dark:bg-green-950 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-400 dark:bg-yellow-950 dark:text-yellow-400',
    red: 'bg-red-50 text-red-400 dark:bg-red-950 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-400 dark:bg-purple-950 dark:text-purple-400',
    indigo: 'bg-indigo-50 text-indigo-400 dark:bg-indigo-950 dark:text-indigo-400',
    orange: 'bg-orange-50 text-orange-400 dark:bg-orange-950 dark:text-orange-400',
  };

  const activeClasses: Record<string, string> = {
    gray: 'bg-gray-600 text-white dark:bg-gray-300 dark:text-gray-900 shadow-lg scale-105',
    blue: 'bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950 shadow-lg scale-105',
    green: 'bg-green-600 text-white dark:bg-green-400 dark:text-green-950 shadow-lg scale-105',
    yellow: 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-yellow-950 shadow-lg scale-105',
    red: 'bg-red-600 text-white dark:bg-red-400 dark:text-red-950 shadow-lg scale-105',
    purple: 'bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950 shadow-lg scale-105',
    indigo: 'bg-indigo-600 text-white dark:bg-indigo-400 dark:text-indigo-950 shadow-lg scale-105',
    orange: 'bg-orange-500 text-white dark:bg-orange-400 dark:text-orange-950 shadow-lg scale-105',
  };

  const colorKey = color && (inactiveClasses[color] ? color : 'gray');
  const stateClasses = isActive
    ? (activeClasses[colorKey] || activeClasses.gray)
    : (inactiveClasses[colorKey] || inactiveClasses.gray);

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 rounded-lg transition-all duration-200
        ${stateClasses}
        ${onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
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
