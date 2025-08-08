import { api } from "./apiService";
import { supabase } from "@/integrations/supabase/client";

import { API_ENDPOINTS } from "@/../config";
// Use a fallback for uuid if not installed
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Backend expects snake_case, frontend uses camelCase. Map as needed.

export const taskService = {
  async getTasks(params = {}) {
    // Accepts optional params: project_id, search, limit, offset, sort_by, sort_order, status
    const query = new URLSearchParams(params as any).toString();
    return api.get(`${API_ENDPOINTS.TASKS}${query ? `?${query}` : ""}`);
  },

  async getTaskById(taskId: string) {
    return api.get(`${API_ENDPOINTS.TASKS}/${taskId}`);
  },

  async createTask(task: any) {
    // Do NOT set task_id on the client; backend generates sequential IDs (e.g., T00001)
    return api.post(`${API_ENDPOINTS.TASKS}`, task);
  },

  async updateTask(taskId: string, updates: any) {    
    return api.put(`${API_ENDPOINTS.TASKS}/${taskId}`, updates);
  },

  async deleteTask(taskId: string) {
    return api.del(`${API_ENDPOINTS.TASKS}/${taskId}`, {});
  },
  // Attachments
  async getTaskAttachments(taskId: string) {
    return api.get<any[]>(`${API_ENDPOINTS.TASK_ATTACHMENTS}?task_id=${taskId}`);
  },
  async uploadTaskAttachment(projectId: string, data: any) {
    return api.post(`${API_ENDPOINTS.TASK_ATTACHMENTS}?project_id=${projectId}`, data);
  },
  async deleteTaskAttachment(attachmentId: string, projectId: string) {
    return api.del(`${API_ENDPOINTS.TASK_ATTACHMENTS}/${attachmentId}?project_id=${projectId}`, {});
  },
  // History
  async getTaskHistory(taskId: string) {
    return api.get(`${API_ENDPOINTS.TASK_HISTORY}?task_id=${taskId}`);
  },
  async addTaskHistory(projectId: string, data: any) {
    return api.post(`${API_ENDPOINTS.TASK_HISTORY}?project_id=${projectId}`, data);
  },
  // Supabase Storage: Task Attachment
  async uploadTaskAttachmentToStorage({ projectId, taskId, file }: { projectId: string, taskId: string, file: File }) {
    const attachmentId = uuidv4();
    const path = `${projectId}/${taskId}/${attachmentId}/${file.name}`;
    const { error } = await supabase.storage.from('task-attachments').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('task-attachments').getPublicUrl(path);
    return { url: data.publicUrl, path, attachmentId };
  },
  // Supabase Storage: Task Inline Image
  async uploadTaskInlineImageToStorage({ projectId, taskId, file }: { projectId: string, taskId: string, file: File }) {
    const imageId = uuidv4();
    const path = `${projectId}/${taskId}/${imageId}/${file.name}`;
    const { error } = await supabase.storage.from('task-inline-images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('task-inline-images').getPublicUrl(path);
    return { url: data.publicUrl, path, imageId };
  },
  // Supabase Storage: Project Resource
  async uploadProjectResourceToStorage({ projectId, file }: { projectId: string, file: File }) {
    const resourceId = uuidv4();
    const path = `${projectId}/${resourceId}/${file.name}`;
    const { error } = await supabase.storage.from('project-resources').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('project-resources').getPublicUrl(path);
    return { url: data.publicUrl, path, resourceId };
  },
};
