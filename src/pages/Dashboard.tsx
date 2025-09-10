import MainNavigation from "@/components/navigation/MainNavigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import useDashboard from '@/hooks/useDashboard';
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { deriveDisplayFromEmail, getStatusMeta } from '@/lib/projectUtils';
import { BackendOrgMember } from "@/types/organization";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FolderOpen,
  Info,
  Loader2,
  PieChart as PieChartIcon,
  Target,
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
  const { data: dashboardData, loading: dataLoading, error } = useDashboard();

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
      navigate('/');
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

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-tasksmate-green-end mr-2" />
      <span className="text-gray-600 dark:text-gray-300">Loading dashboard data...</span>
    </div>
  );

  const renderEmptyState = (type: 'tasks' | 'projects' | 'team' | 'performance') => {
    const emptyStates = {
      tasks: {
        title: 'No Task Data Available',
        message: 'No task completion data found for the selected period.',
        action: 'Create New Task',
        icon: <Activity className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog?org_id=${currentOrgId}`
      },
      projects: {
        title: 'No Projects Found',
        message: 'You don\'t have any projects yet. Create your first project to get started.',
        action: 'Create Project',
        icon: <FolderOpen className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/projects?org_id=${currentOrgId}`
      },
      team: {
        title: 'No Team Members',
        message: 'Add team members to track their productivity and progress.',
        action: 'Invite Member',
        icon: <Users className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/team-members?org_id=${currentOrgId}`
      },
      performance: {
        title: 'No Performance Data',
        message: 'Performance metrics will appear once you complete some tasks.',
        action: 'View Tasks',
        icon: <BarChart3 className="h-12 w-12 mb-4 text-tasksmate-green-end" />,
        path: `/tasks_catalog?org_id=${currentOrgId}`
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
          onClick={() => navigate(path)}
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
          <YAxis />
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
        {teamProductivityData.map((member: any, idx: number) => (
          <div key={idx} className="bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {
                  orgMembers.filter((m: any) => m.username === member.name).map((memberInfo: any) => (
                    <>
                      <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center text-white text-xs font-bold">
                        {memberInfo.initials}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{memberInfo.displayName}</span>
                    </>
                  ))
                }

              </div>
              <span className="text-sm font-semibold px-2 py-1 rounded-full bg-tasksmate-green-start/20 dark:bg-tasksmate-green-start/30 text-tasksmate-green-end dark:text-tasksmate-green-start">
                {member.efficiency}%
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>{member.tasksCompleted}/{member.tasksTotal} tasks completed</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-tasksmate-gradient"
                style={{ width: `${member.efficiency}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTopProjects = () => {
    if (dataLoading) return renderLoadingState();
    if (!topProjects?.length) return renderEmptyState('performance');

    return (
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
          {topProjects.map((project: any, index: number) => (
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
    if (currentOrgId) {
      navigate(`/projects/${projectId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
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

        {/* Main Content */}
        <div className="px-6 py-6">
          <div className="w-full space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate" onClick={() => navigate(`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}` : ''}`)}>
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

              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=in_progress,planning`)}>
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
              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=completed`)}>
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
              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=blocked`)}>
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

              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate" onClick={() => navigate(`/team-members${currentOrgId ? `?org_id=${currentOrgId}` : ''}`)}>
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

            {/* Charts Section */}
            <div className="space-y-6">
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

              {/* Grid: Pie + Productivity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

                {/* Team Productivity */}
                <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      Team Productivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderTeamProductivityTable()}
                  </CardContent>
                </Card>

              </div> {/* end grid */}
            </div> {/* end space-y-6 charts section */}

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6">
              {/* Meeting Books Analytics */}
              {/* <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Meeting Books Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={meetingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="statusCalls" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Status Calls" />
                        <Area type="monotone" dataKey="retrospectives" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Retrospectives" />
                        <Area type="monotone" dataKey="knowshare" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Knowshare" />
                        <Area type="monotone" dataKey="adhoc" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Ad-hoc" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card> */}

              {/* Project Progress Overview card removed */}

              {/* Top Projects Table */}
              <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Target className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    Project Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderTopProjects()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;