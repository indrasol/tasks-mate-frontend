export 
interface Project {
  id: string;
  name: string;
  description: string;
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
}