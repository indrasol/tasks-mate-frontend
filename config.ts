// Replace with your actual backend API URL

/// <reference types="vite/client" />

const ENV_MODE = import.meta.env.VITE_ENV_MODE || "PROD";

const APP_URL_DEV = import.meta.env.VITE_DEV_APP_URL || "http://localhost:8080";
const APP_URL_PROD = import.meta.env.VITE_APP_URL || "https://mytasksmate.netlify.app";

// const APP_URL = APP_URL_PROD
export const APP_URL = ENV_MODE === "DEV" ? APP_URL_DEV : APP_URL_PROD;

const API_BASE_URL_DEV = import.meta.env.VITE_DEV_BASE_API_URL || "http://localhost:800/v1";
const API_BASE_URL_PROD = import.meta.env.VITE_BASE_API_URL;


// const API_BASE_URL = API_BASE_URL_DEV
const API_BASE_URL = ENV_MODE === "DEV" ? API_BASE_URL_DEV : API_BASE_URL_PROD

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