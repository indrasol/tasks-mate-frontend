
export interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority?:string;
  owner: string;
  startDate?: string;
  targetDate?: string;
  comments?: number;
  progress?: number;
  tags?: string[];
  createdBy?: string;
  createdDate?: string;
  projectId?: string;
}

export interface BackendTask {
  task_id: string;
  title: string;
  description: string;
  status: string;
  priority?:string;
  assignee: string;
  start_date?: string;
  due_date?: string;
  comments?: number;
  progress?: number;
  tags?: string[];
  created_by?: string;
  created_at?: string;
}