import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';

export type UserDashboardData = {
  kpis: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    total_projects: number;
  };
  my_project_summary: Array<{
    project_id: string;
    project_name: string;
    progress_percent: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_pending: number;
  }>;
  my_workload_distribution: {
    tasks_total: number;
    tasks_completed: number;
    tasks_pending: number;
  };
  my_upcoming_deadlines: Array<{
    task_id: string;
    title: string;
    due_date: string;
    project_id: string;
  }>;
  my_overdue_tasks: Array<{
    task_id: string;
    title: string;
    due_date: string;
    project_id: string;
  }>;
};

export const useUserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDashboardData, setUserDashboardData] = useState<UserDashboardData | null>(null);

  useEffect(() => {
    const fetchUserDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`${API_ENDPOINTS.DASHBOARD}/user/${user.id}`);
        
        if (response && response.data) {
          setUserDashboardData(response.data);
        } else {
          console.warn('No user dashboard data received');
          setError('No user dashboard data available');
          setUserDashboardData(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch user dashboard data:', err);
        setError(err.message || 'Failed to fetch user dashboard data');
        setUserDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDashboardData();
  }, [user?.id]);

  return {
    loading,
    error,
    data: userDashboardData
  };
};

export default useUserDashboard;
