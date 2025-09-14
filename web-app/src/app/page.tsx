'use client';

import React, { useEffect, useState } from 'react';
import { PlayIcon, TvIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, Button } from '@/components/ui';
import { useVideoStore, useChannelStore, useUIStore } from '@/stores';
import { api } from '@/lib/api/client';

interface DashboardStats {
  totalVideos: number;
  totalChannels: number;
  apiConnected: boolean;
  loading: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalChannels: 0,
    apiConnected: false,
    loading: true,
  });

  const { addNotification } = useUIStore();
  
  const testApiConnection = async () => {
    setStats(prev => ({ ...prev, loading: true }));
    
    try {
      // Test API connection by fetching counts
      const [videosResult, channelsResult] = await Promise.all([
        api.videos.count(),
        api.channels.count(),
      ]);

      setStats({
        totalVideos: videosResult.count || 0,
        totalChannels: channelsResult.count || 0,
        apiConnected: true,
        loading: false,
      });

      addNotification({
        type: 'success',
        title: 'API Connection Successful',
        message: 'Successfully connected to the OtoMusik API',
      });
    } catch (error) {
      console.error('API connection failed:', error);
      
      setStats(prev => ({
        ...prev,
        apiConnected: false,
        loading: false,
      }));

      addNotification({
        type: 'error',
        title: 'API Connection Failed',
        message: 'Could not connect to the API. Please ensure the backend is running.',
      });
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            OtoMusik Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Video and Channel Management System
          </p>
        </div>

        {/* API Connection Status */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>API Connection Status</span>
                {stats.loading && <LoadingSpinner size="sm" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {stats.apiConnected ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-medium">Disconnected</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-500">
                    API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                  </span>
                </div>
                <Button 
                  onClick={testApiConnection} 
                  disabled={stats.loading}
                  size="sm"
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <PlayIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  stats.totalVideos.toLocaleString()
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.apiConnected ? 'Connected to database' : 'Unable to fetch data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
              <TvIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  stats.totalChannels.toLocaleString()
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.apiConnected ? 'Active channels' : 'Unable to fetch data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => window.location.href = '/videos'}>
                Manage Videos
              </Button>
              <Button className="w-full" onClick={() => window.location.href = '/channels'}>
                Manage Channels
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frontend:</span>
                <span className="font-medium">Next.js 14 + TypeScript</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">State Management:</span>
                <span className="font-medium">Zustand</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">UI Framework:</span>
                <span className="font-medium">TailwindCSS + Headless UI</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">API Backend:</span>
                <span className="font-medium">FastAPI</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Instructions */}
        {!stats.apiConnected && !stats.loading && (
          <div className="mt-6">
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200">
                  API Connection Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <p>To use the application, please ensure your FastAPI backend is running:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Start your FastAPI backend server</li>
                    <li>Ensure it's running on: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</li>
                    <li>Check that your database is connected</li>
                    <li>Click "Test Connection" to retry</li>
                  </ol>
                  <p className="mt-3">
                    <strong>API Documentation:</strong> 
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      View API Docs
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
