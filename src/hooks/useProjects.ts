import { useState, useEffect } from 'react';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';
import { Project } from '@/types/projects';
import { useCurrentOrgId } from './useCurrentOrgId';
import { useAuth } from './useAuth';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const currentOrgId = useCurrentOrgId();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (authLoading || !user || !currentOrgId) return;

      setLoading(true);
      setError(null);

      try {
        // Use show_all=true to fetch all projects in the organization
        const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}?show_all=true`);
        
        const mapped: Project[] = res.map((p: any) => ({
          id: p.project_id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: Number(p.progress_percent ?? 0),
          startDate: p.start_date ?? '',
          createdAt: p.created_at ?? p.created_date ?? p.created ?? p.start_date ?? '',
          endDate: p.end_date ?? '',
          teamMembers: p.team_members ?? [],
          tasksCount: p.tasks_total ?? 0,
          completedTasks: p.tasks_completed ?? 0,
          priority: p.priority,
          owner: p.owner ?? "",
          category: 'General',
        }));
        
        setProjects(mapped);
      } catch (err) {
        console.error('Failed to fetch projects', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, authLoading, currentOrgId]);

  return { projects, loading, error };
};
