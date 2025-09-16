export 
interface Tracker {
  id: string;
  name: string;
  project: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: string[];
  tasksCount: number;
  completedTasks: number;
  priority: string;
  owner: string;
  category: string;
  date?: string;

//   id: id || 'TR-001',
//     name: 'Sprint 12 Testing',
//     project: 'TasksMate Web',
//     date: '2024-12-20',
//     testedBy: 'John Doe',
//     assignedTo: ['Jane Smith', 'Mike Johnson'],
//     status: 'running',
//     progress: 65,
//     summary: {
//       high: 2,
//       medium: 3,
//       low: 5,
//       total: 10
//     }
}

export
interface TestRun {
  id: string;
  name: string;
  project: string;
  project_id?: string;
  creator: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'archived' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'none';
  totalBugs: number;
  totalTasks: number;
  date: string;
}

export
interface TestRunTrackDetail {
  id: string;
  name: string;
  project: string;
  project_id?: string;
  creator: string;
  status?: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'archived' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'none';
  totalBugs?: number;
  totalTasks?: number;
  date?: string;
  testedBy?: string;
  assignedTo?: string[];
  progress?: number;
  summary?: BugSummary;
  is_editable?: boolean;
}

export 
interface BugSummary {
    total?: number;
    high?: number;
    medium?: number;
    low?: number;
    closed?: number;
    critical?: number;
    blocker?: number;
    totalTasks?: number;
    recentActivity?: any[];
}
