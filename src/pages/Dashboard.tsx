import MainNavigation from "@/components/navigation/MainNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import useDashboard from '@/hooks/useDashboard';
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import useUserDashboard from '@/hooks/useUserDashboard';
import { deriveDisplayFromEmail, getStatusMeta } from '@/lib/projectUtils';
import clearPersistedStateFor from "@/lib/storageUtils";
import { BackendOrgMember } from "@/types/organization";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  FolderOpen,
  Info,
  Loader2,
  PieChart as PieChartIcon,
  Search,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const currentOrgId = useCurrentOrgId();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("org");

  // Project Performance Summary filters and pagination
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;

  // My Projects pagination
  const [myProjectsCurrentPage, setMyProjectsCurrentPage] = useState(1);
  const myProjectsPerPage = 5;
  const { data: dashboardData, loading: dataLoading, error } = useDashboard();
  const { data: userDashboardData, loading: userDataLoading, error: userError } = useUserDashboard();

  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);

  React.useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    // initialize from CSS variable
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', {
        state: {
            redirectTo: location.pathname + location.search
        },
        replace: true
    });
    }
  }, [user, authLoading, navigate]);

  // If data is loading, show loading state, otherwise use API data or show empty state
  const taskCompletionData = dataLoading
    ? null
    : dashboardData?.task_completion_trends || [];

  const projectStatusData = dataLoading
    ? null
    : dashboardData?.project_status_distribution || [];

  const teamProductivityData = dataLoading
    ? null
    : dashboardData?.team_productivity || [];

  const topProjects = dataLoading
    ? null
    : dashboardData?.project_performance_summary || [];

  const topContributors = dataLoading
    ? null
    : dashboardData?.top_contributors || [];

  const bugSummary = dataLoading
    ? null
    : dashboardData?.bug_summary || { open_bugs: 0, closed_bugs: 0, high_severity_bugs: 0 };

  const overdueTasks = dataLoading
    ? null
    : dashboardData?.overdue_tasks || [];

  const upcomingDeadlines = dataLoading
    ? null
    : dashboardData?.upcoming_deadlines || [];

  const workloadDistribution = dataLoading
    ? null
    : dashboardData?.workload_distribution || [];

  // Filtered and paginated projects
  const filteredProjects = useMemo(() => {
    if (!topProjects) return [];

    let filtered = topProjects.filter((project: any) => {
      const matchesSearch = project.name.toLowerCase().includes(projectSearchTerm.toLowerCase());
      const matchesStatus = projectStatusFilter === "all" || project.status === projectStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered;
  }, [topProjects, projectSearchTerm, projectStatusFilter]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, projectsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [projectSearchTerm, projectStatusFilter]);

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-tasksmate-green-end mr-2" />
      <span className="text-gray-600 dark:text-gray-300">Loading dashboard data...</span>
    </div>
  );

  const handleEmptyStateAction = (path: string) => {

    if (path.startsWith('/project')) {
      clearPersistedStateFor('projects');
    }

    if (path.startsWith('/task')) {
      clearPersistedStateFor('tasks');
    }

    if (path.startsWith('/tester-zone')) {
      clearPersistedStateFor('tester');
      clearPersistedStateFor('bugs');
    }

    if (currentOrgId) {
      path += `?org_id=${currentOrgId}`;
    }

    navigate(path);
  };

  const renderEmptyState = (type: 'tasks' | 'projects' | 'team' | 'performance' | 'contributors' | 'overdue' | 'upcoming' | 'workload') => {
    const emptyStates = {
      tasks: {
        title: 'No Task Data Available',
        message: 'No task completion data found for the selected period.',
        action: 'Create New Task',
        icon: <Activity className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog`
      },
      projects: {
        title: 'No Projects Found',
        message: 'You don\'t have any projects yet. Create your first project to get started.',
        action: 'Create Project',
        icon: <FolderOpen className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/projects`
      },
      team: {
        title: 'No Team Members',
        message: 'Add team members to track their productivity and progress.',
        action: 'Invite Member',
        icon: <Users className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/team-members`
      },
      performance: {
        title: 'No Performance Data',
        message: 'Performance metrics will appear once you complete some tasks.',
        action: 'View Tasks',
        icon: <BarChart3 className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog`
      },
      contributors: {
        title: 'No Contributors Yet',
        message: 'Top contributors will appear once team members complete tasks.',
        action: 'View Team',
        icon: <Trophy className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/team-members`
      },
      overdue: {
        title: 'No Overdue Tasks',
        message: 'Great! You don\'t have any overdue tasks at the moment.',
        action: 'View All Tasks',
        icon: <CheckCircle2 className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog`
      },
      upcoming: {
        title: 'No Upcoming Deadlines',
        message: 'No tasks with upcoming deadlines found.',
        action: 'Create Task',
        icon: <Calendar className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog`
      },
      workload: {
        title: 'No Workload Data',
        message: 'Workload distribution will appear once tasks are assigned to team members.',
        action: 'Assign Tasks',
        icon: <Users className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog`
      }
    };

    const { title, message, action, icon, path } = emptyStates[type];

    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
        <div className="p-4 rounded-full bg-tasksmate-green-start/10 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">{message}</p>
        <button
          onClick={() => handleEmptyStateAction(path)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-tasksmate-green-end hover:bg-tasksmate-green-start focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tasksmate-green-end transition-colors"
        >
          {action}
        </button>
      </div>
    );
  };

  const renderTaskCompletionChart = () => {
    if (dataLoading) return renderLoadingState();
    if (!taskCompletionData?.length) return renderEmptyState('tasks');

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={taskCompletionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(value) => Math.floor(value).toString()}
            domain={[0, 'dataMax']}
          />
          <Tooltip />
          <Line type="monotone" dataKey="completed" stroke="#10B981" />
          <Line type="monotone" dataKey="pending" stroke="#F59E0B" />
          <Line type="monotone" dataKey="blocked" stroke="#EF4444" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderProjectStatusChart = () => {
    if (dataLoading) return renderLoadingState();
    if (!projectStatusData?.length) return renderEmptyState('projects');

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={projectStatusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {projectStatusData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderTeamProductivityTable = () => {
    if (dataLoading) return renderLoadingState();
    if (!teamProductivityData?.length) return renderEmptyState('team');

    return (
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {teamProductivityData.map((member: any, idx: number) => {
          const tasksPending = member.tasksTotal - member.tasksCompleted;

          return (
            <div key={idx} className="bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {
                    orgMembers.filter((m: any) => m.username === member.name).map((memberInfo: any) => (
                      <>
                        <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center text-white text-xs font-bold">
                          {memberInfo.initials}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{memberInfo.displayName}</span>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {member.tasksTotal} total
                            </span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {member.tasksCompleted} completed
                            </span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {tasksPending} pending
                            </span>
                          </div>
                        </div>
                      </>
                    ))
                  }

                </div>
                <span className="text-sm font-semibold px-2 py-1 rounded-full bg-tasksmate-green-start/20 dark:bg-tasksmate-green-start/30 text-tasksmate-green-end dark:text-tasksmate-green-start">
                  {member.efficiency}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-tasksmate-gradient"
                  style={{ width: `${member.efficiency}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTopProjects = () => {
    if (dataLoading) return renderLoadingState();
    if (!topProjects?.length) return renderEmptyState('performance');

    return (
      <div className="space-y-4">

        {/* Table */}
        {paginatedProjects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project: any, index: number) => (
                <TableRow
                  key={index}
                  onClick={() => handleProjectClick(project?.project_id)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">{project.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-tasksmate-gradient h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{project.tasks} total</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{project.team} members</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusMeta(project?.status)?.color}`}
                    >
                      {getStatusMeta(project?.status)?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No projects match your search criteria.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProjectSearchTerm("");
                setProjectStatusFilter("all");
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * projectsPerPage) + 1} to {Math.min(currentPage * projectsPerPage, filteredProjects.length)} of {filteredProjects.length} results
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTopContributors = () => {
    if (dataLoading) return renderLoadingState();
    if (!topContributors?.length) return renderEmptyState('contributors');

    return (
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {topContributors.slice(0, 5).map((contributor: any, idx: number) => (
          <div key={idx} className="bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  {idx === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                  {idx === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                  {idx === 2 && <Trophy className="w-4 h-4 text-amber-600" />}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {contributor.contributor_name || 'Unknown'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contributor.completed_tasks} tasks completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-tasksmate-green-end">
                  {contributor.completed_tasks}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBugInsights = () => {
    if (dataLoading) return renderLoadingState();

    const handleBugClick = () => {
      handleEmptyStateAction('/tester-zone');
    };

    return (
      <div className="grid grid-cols-1 gap-4">
        <div
          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          onClick={handleBugClick}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Open Bugs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Needs attention</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
            {bugSummary?.open_bugs || 0}
          </span>
        </div>

        <div
          className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          onClick={handleBugClick}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Closed Bugs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {bugSummary?.closed_bugs || 0}
          </span>
        </div>

        <div
          className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          onClick={handleBugClick}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">High Priority</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Critical bugs</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {bugSummary?.high_severity_bugs || 0}
          </span>
        </div>
      </div>
    );
  };

  const renderOverdueTasks = () => {
    if (dataLoading) return renderLoadingState();
    if (!overdueTasks?.length) return renderEmptyState('overdue');

    return (
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {overdueTasks.slice(0, 5).map((task: any, idx: number) => (
          <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {task.title}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned to: {task.assignee || 'Unassigned'}
                  </span>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUpcomingDeadlines = () => {
    if (dataLoading) return renderLoadingState();
    if (!upcomingDeadlines?.length) return renderEmptyState('upcoming');

    return (
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {upcomingDeadlines.slice(0, 5).map((task: any, idx: number) => (
          <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {task.title}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned to: {task.assignee || 'Unassigned'}
                  </span>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWorkloadDistribution = () => {
    if (dataLoading) return renderLoadingState();
    if (!workloadDistribution?.length) return renderEmptyState('workload');

    return (
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {workloadDistribution.slice(0, 8).map((member: any, idx: number) => {
          const completionRate = member.tasks_total > 0 ? Math.round((member.tasks_completed / member.tasks_total) * 100) : 0;

          return (
            <div key={idx} className="bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {member.assignee_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {member.assignee_name === 'unassigned' ? 'Unassigned' : member.assignee_name}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {member.tasks_total} total
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {member.tasks_completed} completed
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {member.tasks_pending} pending
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {completionRate}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-16 w-16 text-tasksmate-green-end mb-4" />
          <p className="text-gray-600 font-medium">Loading user session...</p>
        </div>
      </div>
    );
  }

  // Only show loading for initial data fetch, not for API errors that could be handled with fallbacks
  const isInitialLoading = dataLoading && !dashboardData;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <MainNavigation />

        <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          {/* Page Header */}
          <div className="px-6 py-8">
            <div className="min-h-screen w-full flex justify-center items-center">
              <Loader2 className="animate-spin h-16 w-16 text-tasksmate-green-end mb-4" />
              <p className="text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error in-page instead of full page takeover
  // This allows users to still see the dashboard even if one API call fails

  // Extract KPI data
  const kpis = dashboardData?.kpis || {
    total_tasks: 0,
    active_projects: 0,
    completed_projects: 0,
    blocked_projects: 0,
    team_members: 0
  };

  const handleProjectClick = (projectId: string) => {
    clearPersistedStateFor('projects');
    if (currentOrgId) {
      navigate(`/projects/${projectId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const renderUserDashboard = () => {
    if (userDataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-tasksmate-green-end mr-2" />
          <span className="text-gray-600 dark:text-gray-300">Loading your dashboard...</span>
        </div>
      );
    }

    if (userError || !userDashboardData) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mb-4 text-red-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Unable to Load Dashboard</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {userError || 'No dashboard data available'}
          </p>
        </div>
      );
    }

    const userKpis = userDashboardData.kpis;
    const userProjects = userDashboardData.my_project_summary || [];
    const userWorkload = userDashboardData.my_workload_distribution;
    const userUpcoming = userDashboardData.my_upcoming_deadlines || [];
    const userOverdue = userDashboardData.my_overdue_tasks || [];

    return (
      <>
        {/* User KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (user?.id && currentOrgId) {
                navigate(`/tasks_catalog?org_id=${currentOrgId}&tab=mine&owner=${encodeURIComponent(user.id)}`);
              }
            }}>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">My Total Tasks</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userKpis.total_tasks}</p>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (user?.id && currentOrgId) {
                navigate(`/tasks_catalog?org_id=${currentOrgId}&tab=mine&owner=${encodeURIComponent(user.id)}&statuses=completed&completion=show`);
              }
            }}>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">My Completed Tasks</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userKpis.completed_tasks}</p>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (user?.id && currentOrgId) {
                navigate(`/tasks_catalog?org_id=${currentOrgId}&tab=mine&owner=${encodeURIComponent(user.id)}&statuses=in-progress,not_started,blocked,on_hold,archived`);
              }
            }}>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">My Pending Tasks</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userKpis.pending_tasks}</p>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (currentOrgId) {
                navigate(`/projects?org_id=${currentOrgId}&tab=mine`);
              }
            }}>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">My Projects</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userKpis.total_projects}</p>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Projects Summary */}
        {userProjects.length > 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Target className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                My Projects
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({userProjects.length} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate pagination for My Projects
                const startIndex = (myProjectsCurrentPage - 1) * myProjectsPerPage;
                const endIndex = startIndex + myProjectsPerPage;
                const paginatedMyProjects = userProjects.slice(startIndex, endIndex);
                const totalMyProjectPages = Math.ceil(userProjects.length / myProjectsPerPage);

                return (
                  <div className="space-y-4">
                    {/* Projects List */}
                    <div className="space-y-4">
                      {paginatedMyProjects.map((project, index) => (
                        <div key={index} className="bg-white/60 dark:bg-gray-700/60 p-4 rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow"
                          onClick={() => handleProjectClick(project.project_id)}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900 dark:text-white">{project.project_name}</h3>
                            <span className="text-sm font-semibold px-2 py-1 rounded-full bg-tasksmate-green-start/20 dark:bg-tasksmate-green-start/30 text-tasksmate-green-end dark:text-tasksmate-green-start">
                              {project.progress_percent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                            <div
                              className="h-2 rounded-full bg-tasksmate-gradient"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                            <span>{project.tasks_total} total tasks</span>
                            <span className="text-green-600 dark:text-green-400">{project.tasks_completed} completed</span>
                            <span className="text-orange-600 dark:text-orange-400">{project.tasks_pending} pending</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalMyProjectPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Showing {startIndex + 1} to {Math.min(endIndex, userProjects.length)} of {userProjects.length} projects
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMyProjectsCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={myProjectsCurrentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: totalMyProjectPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={myProjectsCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMyProjectsCurrentPage(page)}
                                className="h-8 w-8 p-0"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMyProjectsCurrentPage(prev => Math.min(prev + 1, totalMyProjectPages))}
                            disabled={myProjectsCurrentPage === totalMyProjectPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* My Workload and Task Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Workload Distribution */}
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                My Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white/60 dark:bg-gray-700/60 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Task Distribution</span>
                    <span className="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {userWorkload.tasks_total > 0 ? Math.round((userWorkload.tasks_completed / userWorkload.tasks_total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ width: `${userWorkload.tasks_total > 0 ? (userWorkload.tasks_completed / userWorkload.tasks_total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-900 dark:text-white font-medium">{userWorkload.tasks_total} total</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{userWorkload.tasks_completed} completed</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">{userWorkload.tasks_pending} pending</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Overdue Tasks */}
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (user?.id && currentOrgId) {
                navigate(`/tasks_catalog?org_id=${currentOrgId}&tab=mine&owner=${encodeURIComponent(user.id)}&ddate=overdue`);
              }
            }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <AlertTriangle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                My Overdue Tasks
                {userOverdue.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {userOverdue.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userOverdue.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {userOverdue.slice(0, 5).map((task, idx) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {task.title}
                          </h4>
                        </div>
                        <div className="text-right ml-3">
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mb-4 text-tasksmate-green-end mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Overdue Tasks</h3>
                  <p className="text-gray-500 dark:text-gray-400">Great! You're on top of your deadlines.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Upcoming Deadlines */}
        {userUpcoming.length > 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                My Upcoming Deadlines
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  Next 5 Tasks
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {userUpcoming.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </h4>
                      </div>
                      <div className="text-right ml-3">
                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-6 py-8">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into your projects and tasks</p>
            </div>
            {/* Period filter buttons removed */}
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="org">Org Dashboard</TabsTrigger>
              <TabsTrigger value="my">My Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="org" className="space-y-6">
              <div className="w-full space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer" onClick={() => handleEmptyStateAction('/tasks_catalog')}>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Total Tasks</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.total_tasks}</p>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=in_progress,planning`)}>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 font-medium whitespace-nowrap">Active Projects <span title="In Progress or Planning"><Info className="w-3 h-3 text-gray-400 dark:text-gray-500" /></span></p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.active_projects}</p>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Completed Projects KPI */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=completed`)}>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Completed Projects</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.completed_projects}</p>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked Projects KPI */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=blocked`)}>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Blocked Projects</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.blocked_projects}</p>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer" onClick={() => handleEmptyStateAction(`/team-members`)}>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Team Members</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.team_members}</p>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Meeting Books</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">+8 this week</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card> */}
                </div>

                {/* Project Performance Summary */}
                <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Target className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Project Performance Summary
                      </CardTitle>

                      {/* Search and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Search Bar with Animation */}
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-tasksmate-green-end h-4 w-4 transition-colors duration-200" />
                          <Input
                            placeholder="Search projects..."
                            value={projectSearchTerm}
                            onChange={(e) => setProjectSearchTerm(e.target.value)}
                            className="pl-10 h-9 w-[250px] focus:w-[320px] transition-all duration-300 ease-in-out focus:ring-2 focus:ring-tasksmate-green-end/20 focus:border-tasksmate-green-end"
                          />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center">
                          <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                            <SelectTrigger className="w-[140px] h-9 focus:ring-2 focus:ring-tasksmate-green-end/20 focus:border-tasksmate-green-end transition-all duration-200">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              {topProjects && [...new Set(topProjects.map((project: any) => project.status))].map((status) => (
                                <SelectItem key={status} value={status}>
                                  {getStatusMeta(status)?.label || status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Results Count */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {filteredProjects.length} of {topProjects?.length || 0}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderTopProjects()}
                  </CardContent>
                </Card>

                {/* Top Row: Top Contributors + Team Productivity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Contributors Leaderboard */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Trophy className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Top Contributors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTopContributors()}
                    </CardContent>
                  </Card>

                  {/* Team Productivity */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Team Productivity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* {renderTeamProductivityTable()} */}
                      {renderWorkloadDistribution()}
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Row: Bug Insights + Overdue Tasks + Upcoming Deadlines */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bug Insights */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Bug className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Bug Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderBugInsights()}
                    </CardContent>
                  </Card>

                  {/* Overdue Tasks */}
                  <Card
                    className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}&ddate=overdue` : '?ddate=overdue'}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <AlertTriangle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Overdue Tasks
                        {overdueTasks?.length > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {overdueTasks.length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderOverdueTasks()}
                    </CardContent>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        Upcoming Deadlines
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          Top 5 Tasks
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderUpcomingDeadlines()}
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="space-y-6">
                  {/* Grid: Task Completion Trends + Project Status Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Task Completion Trends */}
                    <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          Task Completion Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderTaskCompletionChart()}
                      </CardContent>
                    </Card>

                    {/* Project Status Distribution */}
                    <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <PieChartIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          Project Status Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderProjectStatusChart()}
                      </CardContent>
                    </Card>
                  </div>

                </div> {/* end space-y-6 charts section */}



              </div>
            </TabsContent>

            <TabsContent value="my" className="space-y-6">
              <div className="w-full space-y-6">
                {renderUserDashboard()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;