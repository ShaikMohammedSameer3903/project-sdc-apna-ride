import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, ActivityItem } from '../types/admin';
import { adminApi, ApiError } from '../services/adminApi';

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalCustomers: 0,
    totalRides: 0,
    activeRides: 0,
    revenue: 0,
    pendingApprovals: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch data in parallel
      const [statsData, activitiesData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivities(10)
      ]);
      
      setStats(statsData);
      setRecentActivity(activitiesData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
      setError(error);
      console.error('Error fetching dashboard data:', error);
      // Re-throw to be caught by error boundary
      if (err instanceof ApiError && err.status === 401) {
        throw err; // Let error boundary handle auth errors
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling for real-time updates
  useEffect(() => {
    fetchDashboardData();
    
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  return {
    stats,
    recentActivity,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};
