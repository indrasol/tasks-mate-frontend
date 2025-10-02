import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';

export async function listSections(orgId: string) {
  return api.get(`${API_ENDPOINTS.GOAL_SECTIONS}?org_id=${orgId}`);
}

export async function createSection(orgId: string, payload: { title: string; order?: number }) {
  return api.post(`${API_ENDPOINTS.GOAL_SECTIONS}?org_id=${orgId}`, payload);
}

export async function updateSection(orgId: string, sectionId: string, payload: { title?: string; order?: number }) {
  return api.put(`${API_ENDPOINTS.GOAL_SECTIONS}/${sectionId}?org_id=${orgId}`, payload);
}

export async function deleteSection(orgId: string, sectionId: string) {
  return api.del(`${API_ENDPOINTS.GOAL_SECTIONS}/${sectionId}?org_id=${orgId}`);
}


