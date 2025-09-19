import { API_ENDPOINTS } from '@/config';
import { api } from '@/services/apiService';

// Types for Daily Timesheets
export interface DailyTimesheetCreate {
  org_id: string;
  project_id: string;
  user_id: string;
  entry_date: string; // ISO date string (YYYY-MM-DD)
  in_progress?: string;
  completed?: string;
  blocked?: string;
}

export interface DailyTimesheetUpdate {
  in_progress?: string;
  completed?: string;
  blocked?: string;
}

export interface DailyTimesheetInDB {
  id: number;
  org_id: string;
  project_id: string;
  user_id: string;
  entry_date: string;
  in_progress?: string;
  completed?: string;
  blocked?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyTimesheetWithDetails extends DailyTimesheetInDB {
  user_name?: string;
  user_email?: string;
  user_designation?: string;
  project_name?: string;
}

export interface DailyTimesheetFilters {
  org_id: string;
  project_ids?: string[];
  user_ids?: string[];
  date_from?: string;
  date_to?: string;
}

export interface DailyTimesheetResponse {
  success: boolean;
  message: string;
  data?: DailyTimesheetInDB;
}

export interface DailyTimesheetListResponse {
  success: boolean;
  message: string;
  data: DailyTimesheetWithDetails[];
  total: number;
}

export interface TeamTimesheetUser {
  user_id: string;
  name: string;
  email: string;
  designation?: string;
  avatar_initials: string;
  role: string;
  total_hours_today: number;
  total_hours_week: number;
  in_progress: Array<{
    id: string;
    title: string;
    project: string;
    hours_logged?: number;
  }>;
  completed: Array<{
    id: string;
    title: string;
    project: string;
    hours_logged?: number;
  }>;
  blockers: Array<{
    id: string;
    title: string;
    project: string;
    blocked_reason?: string;
  }>;
}

export interface TeamTimesheetProject {
  project_id: string;
  project_name: string;
  description?: string;
  owner?: string;
  team_members: string[];
  members: TeamTimesheetUser[];
}

export interface TeamTimesheetsResponse {
  success: boolean;
  message: string;
  users: TeamTimesheetUser[];
  projects: TeamTimesheetProject[];
  date: string;
  org_id: string;
}

// API Functions
export async function createOrUpdateDailyTimesheet(timesheet: DailyTimesheetCreate): Promise<DailyTimesheetResponse> {
  return api.post(`${API_ENDPOINTS.DAILY_TIMESHEETS}`, timesheet);
}

export async function getDailyTimesheet(
  orgId: string, 
  projectId: string, 
  userId: string, 
  entryDate: string
): Promise<DailyTimesheetResponse> {
  return api.get(`${API_ENDPOINTS.DAILY_TIMESHEETS}/${orgId}/${projectId}/${userId}/${entryDate}`);
}

export async function searchDailyTimesheets(filters: DailyTimesheetFilters): Promise<DailyTimesheetListResponse> {
  return api.post(`${API_ENDPOINTS.DAILY_TIMESHEETS}/search`, filters);
}

export async function getUserTimesheetRange(
  userId: string,
  orgId: string,
  dateFrom: string,
  dateTo: string
): Promise<DailyTimesheetListResponse> {
  const params = new URLSearchParams({
    org_id: orgId,
    date_from: dateFrom,
    date_to: dateTo
  });
  return api.get(`${API_ENDPOINTS.DAILY_TIMESHEETS}/user/${userId}/range?${params}`);
}

export async function deleteDailyTimesheet(
  orgId: string,
  projectId: string,
  userId: string,
  entryDate: string
): Promise<{ success: boolean; message: string }> {
  return api.del(`${API_ENDPOINTS.DAILY_TIMESHEETS}/${orgId}/${projectId}/${userId}/${entryDate}`);
}

export async function updateTimesheetFields(
  orgId: string,
  projectId: string,
  userId: string,
  entryDate: string,
  updates: DailyTimesheetUpdate
): Promise<DailyTimesheetResponse> {
  return api.put(`${API_ENDPOINTS.DAILY_TIMESHEETS}/${orgId}/${projectId}/${userId}/${entryDate}`, updates);
}

export async function bulkUpdateTimesheets(entries: DailyTimesheetCreate[]): Promise<DailyTimesheetListResponse> {
  return api.post(`${API_ENDPOINTS.DAILY_TIMESHEETS}/bulk`, { entries });
}

export async function getTeamTimesheetsSummary(
  orgId: string,
  entryDate: string,
  projectIds?: string[]
): Promise<TeamTimesheetsResponse> {
  const params = new URLSearchParams();
  if (projectIds && projectIds.length > 0) {
    projectIds.forEach(id => params.append('project_ids', id));
  }
  
  const queryString = params.toString();
  const url = `${API_ENDPOINTS.DAILY_TIMESHEETS}/team-summary/${orgId}/${entryDate}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
}

// Utility functions
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

export function parseTasksFromText(text: string): Array<{ title: string; project?: string; hours?: number }> {
  if (!text) return [];
  
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, index) => {
      // Remove bullet points
      const cleanLine = line.replace(/^[•\-*]\s*/, '');
      
      // Try to extract project and hours from patterns like "Task name (Project) - 2h"
      const projectMatch = cleanLine.match(/^(.+?)\s*\(([^)]+)\)(?:\s*-\s*(\d+)h)?/);
      if (projectMatch) {
        return {
          title: projectMatch[1].trim(),
          project: projectMatch[2].trim(),
          hours: projectMatch[3] ? parseInt(projectMatch[3]) : undefined
        };
      }
      
      // Try to extract hours from patterns like "Task name - 2h"
      const hoursMatch = cleanLine.match(/^(.+?)\s*-\s*(\d+)h$/);
      if (hoursMatch) {
        return {
          title: hoursMatch[1].trim(),
          hours: parseInt(hoursMatch[2])
        };
      }
      
      // Default: just the title
      return {
        title: cleanLine
      };
    });
}

export function formatTasksToText(tasks: Array<{ title: string; project?: string; hours?: number }>): string {
  return tasks.map(task => {
    let line = `• ${task.title}`;
    if (task.project) {
      line += ` (${task.project})`;
    }
    if (task.hours) {
      line += ` - ${task.hours}h`;
    }
    return line;
  }).join('\n');
}
