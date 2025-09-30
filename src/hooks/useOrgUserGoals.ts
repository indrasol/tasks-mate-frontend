import { useQuery } from '@tanstack/react-query';
import { getGoals } from '@/services/goalService';
import type { GoalFilters, PaginatedGoals } from '@/types/goal';

export const useOrgUserGoals = (orgId?: string, filters?: GoalFilters) => {
  return useQuery<PaginatedGoals>({
    queryKey: ['org-user-goals', orgId, filters],
    queryFn: async () => {
      if (!orgId) return { items: [], total: 0, page: 1, pageSize: 20 } as PaginatedGoals;
      return getGoals(orgId, {
        userId: filters?.userId,
        status: filters?.status,
        q: filters?.q,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        dueStart: filters?.dueStart,
        dueEnd: filters?.dueEnd,
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};
