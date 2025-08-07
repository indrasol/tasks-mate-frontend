import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { useAuth } from "@/hooks/useAuth";

export interface BackendProjectMember {
  user_id: string;
  username?: string;
  email?: string;
  role?: string;
  designation?: string;
}

/**
 * Fetch members belonging to a project. Falls back to [] if unauthenticated
 * or the projectId is missing.
 */
export function useProjectMembers(projectId?: string) {
  const { user } = useAuth();

  return useQuery<BackendProjectMember[]>({
    queryKey: ["project-members", projectId, user?.id],
    enabled: !!user && !!projectId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!user || !projectId) return [];
      return api.get<BackendProjectMember[]>(`${API_ENDPOINTS.PROJECT_MEMBERS}?project_id=${projectId}`);
    },
  });
}
