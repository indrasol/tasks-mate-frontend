import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { BackendOrgMember } from "@/types/organization";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetch organization members for the provided `orgId`.
 * Falls back to an empty array if the user isn't logged-in or no `orgId` supplied.
 */
export const useOrganizationMembers = (orgId?: string) => {
  const { user } = useAuth();

  return useQuery<BackendOrgMember[]>({
    queryKey: ["organization-members", orgId, user?.id],
    queryFn: async () => {
      if (!user || !orgId) return [];
      // Backend endpoint: /organization-members/:orgId
      return api.get<BackendOrgMember[]>(`${API_ENDPOINTS.ORGANIZATION_MEMBERS}/${orgId}`);
    },
    enabled: !!user && !!orgId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
