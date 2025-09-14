import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PlayIcon,
  TvIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/stores';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Videos', href: '/videos', icon: PlayIcon },
  { name: 'Channels', href: '/channels', icon: TvIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  children: React.ReactNode;
}

export const Layout: React.FC<SidebarProps> = ({ children }) => {
  const pathname = usePathname();
  const { collapsed, toggle, setCollapsed } = useSidebar();

  // Update navigation current state based on current route
  const navigationWithCurrent = navigation.map((item) => ({
    ...item,
    current: pathname === item.href,
  }));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          collapsed ? "-translate-x-full lg:w-20" : "translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                OtoMusik
              </h1>
            </div>
          )}
          <button
            type="button"
            className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-700"
            onClick={() => setCollapsed(true)}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigationWithCurrent.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  item.current
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-6 w-6 flex-shrink-0 transition-colors",
                    item.current
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="flex flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex items-center justify-center w-full rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-700"
          >
            <span className="sr-only">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between bg-white px-4 shadow-sm dark:bg-gray-800 lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-700"
            onClick={() => setCollapsed(false)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              OtoMusik
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};