export type GoalStatus = 'draft' | 'active' | 'paused' | 'done';

export interface GoalAssignment {
  userId: string;
  role: 'owner' | 'contributor' | 'viewer';
}

export interface GoalUpdate {
  id: string;
  goalId: string;
  userId: string;
  progress: number; // 0-100
  note?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  startDate?: string;
  dueDate?: string;
  visibility?: 'org' | 'private';
  progress?: number; // derived from latest update
  assignees: GoalAssignment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilters {
  userId?: string;
  status?: GoalStatus | 'all';
  q?: string;
  page?: number;
  pageSize?: number;
  dueStart?: string;
  dueEnd?: string;
}

export interface PaginatedGoals {
  items: Goal[];
  total: number;
  page: number;
  pageSize: number;
}
