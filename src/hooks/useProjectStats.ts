import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/hooks/useAuth";

export interface ProjectStats {
  project_id: string;
  tasks_completed: number;
  tasks_total: number;
  progress_percent: number;
  team_members: number;
  days_left: number;
  duration_days?: number;
  bugs_total?: number;
}

/**
 * Fetch up-to-date aggregated statistics for a single project.
 * Relies on the `project_stats_view` materialised view exposed via
 * GET /project-stats/{projectId}/stats
 */
export function useProjectStats(projectId?: string) {
  const { user } = useAuth();

  return useQuery<ProjectStats | null>({
    queryKey: ["project-stats", projectId, user?.id],
    enabled: !!user && !!projectId,
    staleTime: 1000 * 30, // 30 s – cheap query but still cache briefly
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!user || !projectId) return null;
      const url = `${API_ENDPOINTS.PROJECT_STATS}/${projectId}/stats`;
      return api.get<ProjectStats>(url);
    },
  });
}
