import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/hooks/useAuth";

export interface BackendProjectResource {
  resource_id: string;
  resource_type: string;
  resource_name: string;
  resource_url?: string;
  resource_size?: string;
  created_by: string;
  created_at: string;
}

/**
 * Fetch members belonging to a project. Falls back to [] if unauthenticated
 * or the projectId is missing.
 */
export function useProjectResources(projectId?: string) {
  const { user } = useAuth();

  return useQuery<BackendProjectResource[]>({
    queryKey: ["project-resources", projectId, user?.id],
    enabled: !!user && !!projectId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!user || !projectId) return [];
      return api.get<BackendProjectResource[]>(`${API_ENDPOINTS.PROJECT_RESOURCES}?project_id=${projectId}`);
    },
  });
}
