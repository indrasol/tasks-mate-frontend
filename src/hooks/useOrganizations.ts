import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { BackendOrg } from "@/types/organization";
import { useAuth } from "@/hooks/useAuth";

export interface SimpleOrg {
  id: string;
  name: string;
}

export const useOrganizations = () => {
  const { user } = useAuth();

  return useQuery<SimpleOrg[]>({
    queryKey: ["organizations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.get<BackendOrg[]>(API_ENDPOINTS.ORGANIZATIONS);
      return (data || []).map(org => ({ id: org.org_id, name: org.name }));
    },
    enabled: !!user,
    // Keep results for 5 minutes; no refetch on every mount within this window
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });
};
