
export interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority?: string;
  owner: string;
  startDate?: string;
  targetDate?: string;
  comments?: number;
  progress?: number;
  tags?: string[];
  createdBy?: string;
  createdDate?: string;
  projectId?: string;
  is_editable?: boolean;
}

export interface BackendTask {
  task_id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  assignee: string;
  start_date?: string;
  due_date?: string;
  comments?: number;
  progress?: number;
  tags?: string[];
  created_by?: string;
  created_at?: string;
}

export interface TaskCreateInitialData {
  projectId?: string;
  name?: string;
  description?: string;
  status?: string; // backend enum preferred (e.g., in_progress)
  priority?: string;
  owner?: string;
  startDate?: string; // YYYY-MM-DD or ISO
  targetDate?: string; // YYYY-MM-DD or ISO
  tags?: string[];
  is_subtask?: boolean;
  parentTaskId?: string; // For subtasks, if applicable
  bug_id?: string;
  tracker_id?:string;
}