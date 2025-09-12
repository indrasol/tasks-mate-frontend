import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/config";
import { BackendOrg } from "@/types/organization";
import { useAuth } from "@/hooks/useAuth";

export const useCurrentOrganization = (orgId: string) => {
  const { user } = useAuth();

  return useQuery<BackendOrg | null>({
    queryKey: ["current_organization", user?.id, orgId], // Include orgId in the queryKey
    queryFn: async () => {
      if (!user || !orgId) return null;
      // console.log(`Fetching organization data for orgId: ${orgId}`);
      const data = await api.get<BackendOrg>(API_ENDPOINTS.ORGANIZATIONS + `/user/${orgId}`);
      if (!data) return null;
      // console.log('Fetched organization data:', data);
      return data[0];
    },
    enabled: !!user && !!orgId,
    // Keep results for 5 minutes; no refetch on every mount within this window
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
