import { API_ENDPOINTS } from '@/config';
import { api } from '@/services/apiService';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TimesheetEntry {
  id: string;
  title: string;
  created_at?: string;
  completed_at?: string;
  blocked_since?: string;
}

export interface UserTimesheetData {
  in_progress: TimesheetEntry[];
  completed: TimesheetEntry[];
  blocked: TimesheetEntry[];
}

export interface UserTimesheetFieldUpdate {
  org_id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD format
  field_type: 'in_progress' | 'completed' | 'blocked';
  field_content: string;
}

export interface TeamTimesheetUser {
  user_id: string;
  name: string;
  email: string;
  designation: string;
  avatar_initials: string;
  role: string;
  in_progress: TimesheetEntry[];
  completed: TimesheetEntry[];
  blocked: TimesheetEntry[];
}

export interface TeamTimesheetsResponse {
  success: boolean;
  message: string;
  users: TeamTimesheetUser[];
  date: string;
  org_id: string;
}

export interface CalendarStatusEntry {
  hasData: boolean;
  userCount: number;
}

export interface CalendarStatusResponse {
  success: boolean;
  message: string;
  calendar_status: Record<string, CalendarStatusEntry>;
  year: number;
  month: number;
  org_id: string;
}

export interface UserTimesheetResponse {
  success: boolean;
  message: string;
  data?: {
    org_id: string;
    user_id: string;
    entry_date: string;
    timesheet_data: UserTimesheetData;
    has_data: boolean;
    created_at: string;
    updated_at: string;
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Update a specific field in user's timesheet
 */
export async function updateTimesheetField(data: UserTimesheetFieldUpdate): Promise<UserTimesheetResponse> {
  try {
    // Validate input
    if (!data.org_id || !data.user_id || !data.entry_date || !data.field_type) {
      throw new Error('Missing required fields for timesheet update');
    }

    if (!['in_progress', 'completed', 'blocked'].includes(data.field_type)) {
      throw new Error('Invalid field type. Must be in_progress, completed, or blocked');
    }

    if (data.field_content.length > 5000) {
      throw new Error('Field content too long (max 5000 characters)');
    }

    const response: any = await api.post(`${API_ENDPOINTS.USER_TIMESHEETS}/field`, data);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update timesheet field');
    }

    return response;
  } catch (error) {
    console.error('Error updating timesheet field:', error);
    throw error;
  }
}

/**
 * Get user's timesheet for a specific date
 */
export async function getUserTimesheet(
  userId: string,
  entryDate: string,
  orgId: string
): Promise<UserTimesheetResponse> {
  try {
    if (!userId || !entryDate || !orgId) {
      throw new Error('Missing required parameters for getUserTimesheet');
    }

    const response: any = await api.get(
      `${API_ENDPOINTS.USER_TIMESHEETS}/user/${userId}/${entryDate}?org_id=${orgId}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user timesheet');
    }

    return response;
  } catch (error) {
    console.error('Error fetching user timesheet:', error);
    throw error;
  }
}

/**
 * Get team timesheets for a specific date
 */
export async function getTeamTimesheets(
  orgId: string,
  entryDate?: string,
  userIds?: string[]
): Promise<TeamTimesheetsResponse> {
  try {
    if (!orgId || !entryDate) {
      throw new Error('Missing required parameters for getTeamTimesheets');
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (userIds && userIds.length > 0) {
      userIds.forEach(id => params.append('user_ids', id));
    }

    const queryString = params.toString();
    const url = `${API_ENDPOINTS.USER_TIMESHEETS}/team/${orgId}/${entryDate}${queryString ? `?${queryString}` : ''}`;

    const response: any = await api.get(url);

    if (!response.success) {  
      throw new Error(response.message || 'Failed to fetch team timesheets');
    }

    return response;
  } catch (error) {
    console.error('Error fetching team timesheets:', error);
    throw error;
  }
}

/**
 * Get calendar month status for timesheet indicators
 */
export async function getCalendarMonthStatus(
  orgId: string,
  year: number,
  month: number,
  userIds?: string[]
): Promise<CalendarStatusResponse> {
  try {
    if (!orgId || !year || !month) {
      throw new Error('Missing required parameters for getCalendarMonthStatus');
    }

    if (year < 2020 || year > 2030) {
      throw new Error('Invalid year. Must be between 2020 and 2030');
    }

    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Must be between 1 and 12');
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (userIds && userIds.length > 0) {
      userIds.forEach(id => params.append('user_ids', id));
    }

    const queryString = params.toString();
    const url = `${API_ENDPOINTS.USER_TIMESHEETS}/calendar-status/${orgId}/${year}/${month}${queryString ? `?${queryString}` : ''}`;

    const response: any = await api.get(url);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch calendar status');
    }

    return response;
  } catch (error) {
    console.error('Error fetching calendar status:', error);
    throw error;
  }
}

/**
 * Delete a user's timesheet for a specific date
 */
export async function deleteUserTimesheet(
  userId: string,
  entryDate: string,
  orgId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!userId || !entryDate || !orgId) {
      throw new Error('Missing required parameters for deleteUserTimesheet');
    }

    const response: any = await api.del(
      `${API_ENDPOINTS.USER_TIMESHEETS}/user/${userId}/${entryDate}?org_id=${orgId}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete timesheet');
    }

    return response;
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format Date object to API date string (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateForAPI');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse API date string to Date object
 */
export function parseAPIDate(dateString: string): Date {
  if (!dateString) {
    throw new Error('Empty date string provided to parseAPIDate');
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return date;
}

/**
 * Convert timesheet entries to plain text format
 */
export function convertEntriesToText(entries: TimesheetEntry[]): string {
  if (!entries || !Array.isArray(entries)) {
    return '';
  }

  return entries
    .filter(entry => entry && entry.title)
    .map(entry => entry.title.trim())
    .join('\n');
}

/**
 * Convert plain text to timesheet entries format (for display purposes)
 */
export function convertTextToEntries(text: string): TimesheetEntry[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, index) => {
      const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
      return {
        id: `temp_${Date.now()}_${index}`,
        title: cleanLine,
        created_at: new Date().toISOString()
      };
    });
}

/**
 * Check if a timesheet has any data
 */
export function hasTimesheetData(timesheet: UserTimesheetData): boolean {
  if (!timesheet) return false;

  return (
    (timesheet.in_progress && timesheet.in_progress.length > 0) ||
    (timesheet.completed && timesheet.completed.length > 0) ||
    (timesheet.blocked && timesheet.blocked.length > 0)
  );
}

/**
 * Get total task count from timesheet data
 */
export function getTotalTaskCount(timesheet: UserTimesheetData): number {
  if (!timesheet) return 0;

  return (
    (timesheet.in_progress?.length || 0) +
    (timesheet.completed?.length || 0) +
    (timesheet.blocked?.length || 0)
  );
}

/**
 * Validate timesheet field content
 */
export function validateTimesheetContent(content: string): { isValid: boolean; error?: string } {
  if (typeof content !== 'string') {
    return { isValid: false, error: 'Content must be a string' };
  }

  if (content.length > 5000) {
    return { isValid: false, error: 'Content too long (max 5000 characters)' };
  }

  // Check for potentially malicious content (basic sanitization)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Content contains potentially unsafe elements' };
    }
  }

  return { isValid: true };
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get user initials from name or email
 */
export function getUserInitials(name: string, email?: string): string {
  if (!name && !email) return '??';
  
  const displayName = name || (email ? email.split('@')[0] : '');
  const parts = displayName.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts[0] && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    return (parts[0] ? parts[0][0] : '?').toUpperCase() + '?';
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  if (!date || !(date instanceof Date)) return false;
  
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  if (!date || !(date instanceof Date)) return false;
  
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  return date > today;
}

/**
 * Get relative date string (e.g., "Today", "Yesterday", "2 days ago")
 */
export function getRelativeDateString(date: Date): string {
  if (!date || !(date instanceof Date)) return 'Invalid date';
  
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays < -1) return `In ${Math.abs(diffDays)} days`;
  
  return date.toLocaleDateString();
}
