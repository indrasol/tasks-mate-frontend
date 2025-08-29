/// <reference types="vite/client" />
// Import environment configuration
import { getApiUrl, isDevelopment } from "./src/config/env";

// Get the appropriate base URL from the environment configuration
const API_BASE_URL = `${getApiUrl()}/v1`;
// Log the API base URL being used
if (isDevelopment) {
  console.log(`Using API base URL: ${API_BASE_URL}`);
}


export const API_ENDPOINTS = {
  ORGANIZATIONS: `${API_BASE_URL}/organizations`,
  ORGANIZATION_INVITES: `${API_BASE_URL}/organization-invites`,
  ORGANIZATION_MEMBERS: `${API_BASE_URL}/organization-members`,
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_STATS: `${API_BASE_URL}/project-stats`,
  PROJECT_MEMBERS: `${API_BASE_URL}/project-members`,
  PROJECT_RESOURCES: `${API_BASE_URL}/project-resources`,
  TASKS: `${API_BASE_URL}/tasks`,
  TASK_COMMENTS: `${API_BASE_URL}/task-comments`,
  TASK_ATTACHMENTS: `${API_BASE_URL}/task-attachments`,
  TASK_HISTORY: `${API_BASE_URL}/task-history`,
  SCRATCHPADS: `${API_BASE_URL}/scratchpads`,
  AUTHENTICATE: `${API_BASE_URL}/authenticate`,
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  DESIGNATIONS: `${API_BASE_URL}/designations`,
  USER_ROLES: `${API_BASE_URL}/user-roles`,
  GET_EMAIL: `${API_BASE_URL}/get-email`,
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  TRACKERS: `${API_BASE_URL}/trackers`,
  BUGS: `${API_BASE_URL}/bugs`,
};