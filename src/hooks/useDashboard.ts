import { useState, useEffect } from 'react';
import { useCurrentOrgId } from './useCurrentOrgId';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/../config';

export type DashboardData = {
  kpis: {
    total_tasks: number;
    active_projects: number;
    completed_projects: number;
    blocked_projects: number;
    team_members: number;
    tasks_this_month?: number;
    tasks_prev_month?: number;
    tasks_mom_pct?: number;
    new_projects_this_month?: number;
    projects_completed_this_month?: number;
  };
  project_status_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  task_completion_trends: Array<{
    month: string;
    completed: number;
    pending: number;
    blocked: number;
  }>;
  team_productivity: Array<{
    name: string;
    tasksCompleted: number;
    tasksTotal: number;
    efficiency: number;
  }>;
  project_performance_summary: Array<{
    name: string;
    progress: number;
    tasks: number;
    team: number;
    status: string;
    project_id: string;
  }>;
};

export const useDashboard = () => {
  const currentOrgId = useCurrentOrgId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching dashboard data for org:', currentOrgId);
        const response = await api.get<any>(`${API_ENDPOINTS.DASHBOARD}/${currentOrgId}`);
        
        if (response && response.data) {
          console.log('Dashboard data received:', response.data);
          setDashboardData(response.data);
        } else {
          console.warn('No dashboard data received');
          setError('No dashboard data available');
          // Use fallback data even when response is empty
          setDashboardData(null); // Reset to trigger fallbacks in Dashboard component
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to fetch dashboard data');
        // Ensure we reset any stale data on error
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentOrgId]);

  return {
    loading,
    error,
    data: dashboardData
  };
};

export default useDashboard;
