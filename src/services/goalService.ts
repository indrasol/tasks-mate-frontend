import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';
import type { Goal, GoalFilters, PaginatedGoals, GoalUpdate, GoalAssignment } from '@/types/goal';

export async function getGoals(orgId: string, filters: GoalFilters): Promise<PaginatedGoals> {
  const params = new URLSearchParams();
  params.set('org_id', orgId);
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.q) params.set('q', filters.q);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.dueStart) params.set('dueStart', filters.dueStart);
  if (filters.dueEnd) params.set('dueEnd', filters.dueEnd);
  return api.get<PaginatedGoals>(`${API_ENDPOINTS.GOALS}?${params.toString()}`);
}

export async function getGoal(orgId: string, goalId: string): Promise<Goal> {
  return api.get<Goal>(`${API_ENDPOINTS.GOALS}/${goalId}?org_id=${orgId}`);
}

export async function createGoal(orgId: string, payload: Partial<Goal>): Promise<Goal> {
  return api.post<Goal>(`${API_ENDPOINTS.GOALS}?org_id=${orgId}`, payload);
}

export async function updateGoal(orgId: string, goalId: string, payload: Partial<Goal>): Promise<Goal> {
  return api.put<Goal>(`${API_ENDPOINTS.GOALS}/${goalId}?org_id=${orgId}`, payload);
}

export async function deleteGoal(orgId: string, goalId: string): Promise<{ success: boolean }> {
  return api.del(`${API_ENDPOINTS.GOALS}/${goalId}?org_id=${orgId}`);
}

export async function assignUser(orgId: string, goalId: string, assignment: GoalAssignment): Promise<Goal> {
  return api.post<Goal>(`${API_ENDPOINTS.GOALS}/${goalId}/assignments?org_id=${orgId}`, assignment);
}

export async function removeAssignment(orgId: string, goalId: string, userId: string): Promise<Goal> {
  return api.del(`${API_ENDPOINTS.GOALS}/${goalId}/assignments/${userId}?org_id=${orgId}`);
}

export async function addUpdate(orgId: string, goalId: string, payload: Pick<GoalUpdate, 'progress' | 'note'>): Promise<GoalUpdate> {
  return api.post<GoalUpdate>(`${API_ENDPOINTS.GOALS}/${goalId}/updates?org_id=${orgId}`, payload);
}

export async function getUpdates(orgId: string, goalId: string): Promise<GoalUpdate[]> {
  return api.get<GoalUpdate[]>(`${API_ENDPOINTS.GOALS}/${goalId}/updates?org_id=${orgId}`);
}
