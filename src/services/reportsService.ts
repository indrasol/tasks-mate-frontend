import { API_ENDPOINTS } from '@/config';
import { api } from '@/services/apiService'; // if you have a helper; otherwise pass headers in callers

export type ReportsFilters = {
  org_id: string;
  project_ids?: string[];
  member_ids?: string[];
  date_from?: string;
  date_to?: string;
  task_statuses?: string[];
  task_priorities?: string[];
  bug_statuses?: string[];
  bug_priorities?: string[];
};

export async function fetchOrgReports(payload: { filters: ReportsFilters }) {
    return api.post(`${API_ENDPOINTS.REPORTS}/org?org_id=${encodeURIComponent(payload.filters.org_id)}`, payload);  
}

export async function fetchOrgTimesheets(payload: { filters: ReportsFilters }) {
    return api.post(`${API_ENDPOINTS.REPORTS}/timesheets?org_id=${encodeURIComponent(payload.filters.org_id)}`, payload);
}