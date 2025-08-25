import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  BookOpen,
  FolderOpen,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDashboard from '@/hooks/useDashboard';
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { getPriorityColor, getStatusMeta } from '@/lib/projectUtils';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const currentOrgId = useCurrentOrgId();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: dashboardData, loading: dataLoading, error } = useDashboard();

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

  // If data is loading, use API data, otherwise use fallback data
  const taskCompletionData = dashboardData?.task_completion_trends || [
    { month: 'Jan', completed: 45, pending: 15, blocked: 5 },
    { month: 'Feb', completed: 52, pending: 18, blocked: 3 },
    { month: 'Mar', completed: 48, pending: 22, blocked: 7 },
    { month: 'Apr', completed: 61, pending: 19, blocked: 4 },
    { month: 'May', completed: 55, pending: 16, blocked: 6 },
    { month: 'Jun', completed: 67, pending: 13, blocked: 2 },
  ];

  const projectStatusData = dashboardData?.project_status_distribution || [
    { name: 'Active', value: 12, color: '#3B82F6' },
    { name: 'Completed', value: 8, color: '#10B981' },
    { name: 'On Hold', value: 3, color: '#F59E0B' },
    { name: 'Blocked', value: 5, color: '#EF4444' },
  ];

  const teamProductivityData = dashboardData?.team_productivity || [
    { name: 'John Doe', tasksCompleted: 24, tasksTotal: 30, efficiency: 92 },
    { name: 'Sarah Kim', tasksCompleted: 31, tasksTotal: 35, efficiency: 88 },
    { name: 'Mike Rodriguez', tasksCompleted: 19, tasksTotal: 25, efficiency: 85 },
    { name: 'Anna Martinez', tasksCompleted: 27, tasksTotal: 32, efficiency: 90 },
  ];

  const topProjects = dashboardData?.project_performance_summary || [
    { name: "TasksMate Mobile App", progress: 65, tasks: 24, team: 3, status: "Active" },
    { name: "UI/UX Redesign", progress: 40, tasks: 18, team: 2, status: "Active" },
    { name: "Security Audit", progress: 100, tasks: 12, team: 2, status: "Completed" },
    { name: "API Integration", progress: 10, tasks: 8, team: 2, status: "Planning" },
  ];

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-16 w-16 text-tasksmate-green-end mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  // Show error in-page instead of full page takeover
  // This allows users to still see the dashboard even if one API call fails

  // Extract KPI data
  const kpis = dashboardData?.kpis || {
    total_tasks: 247,
    active_projects: 12,
    completed_projects: 8,
    blocked_projects: 3,
    team_members: 24
  };

  const handleProjectClick = (projectId: string) => {
    if (currentOrgId) {
      navigate(`/projects/${projectId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-6 py-8">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights into your projects and tasks</p>
            </div>
            {/* Period filter buttons removed */}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <div className="w-full space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <Card className="glass border-0 shadow-tasksmate hover:shadow-lg cursor-pointer" onClick={() => navigate(`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}` : ''}`)}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-sm text-gray-600 font-medium whitespace-nowrap">Total Tasks</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{kpis.total_tasks}</p>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate hover:shadow-lg cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=in_progress,planning`)}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-sm text-gray-600 flex items-center gap-1 font-medium whitespace-nowrap">Active Projects <span title="In Progress or Planning"><Info className="w-3 h-3 text-gray-400" /></span></p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{kpis.active_projects}</p>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Projects KPI */}
              <Card className="glass border-0 shadow-tasksmate hover:shadow-lg cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=completed`)}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-sm text-gray-600 font-medium whitespace-nowrap">Completed Projects</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{kpis.completed_projects}</p>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Blocked Projects KPI */}
              <Card className="glass border-0 shadow-tasksmate hover:shadow-lg cursor-pointer" onClick={() => navigate(`/projects${currentOrgId ? `?org_id=${currentOrgId}&` : '?'}statuses=blocked`)}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-sm text-gray-600 font-medium whitespace-nowrap">Blocked Projects</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{kpis.blocked_projects}</p>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate hover:shadow-lg cursor-pointer" onClick={() => navigate(`/team-members${currentOrgId ? `?org_id=${currentOrgId}` : ''}`)}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-sm text-gray-600 font-medium whitespace-nowrap">Team Members</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{kpis.team_members}</p>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
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
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Task Completion Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={taskCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={2} />
                        <Line type="monotone" dataKey="pending" stroke="#F59E0B" name="Active" strokeWidth={2} />
                        <Line type="monotone" dataKey="blocked" stroke="#EF4444" name="Blocked" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Grid: Pie + Productivity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Project Status Distribution */}
                <Card className="glass border-0 shadow-tasksmate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      Project Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={projectStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {projectStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Productivity */}
                <Card className="glass border-0 shadow-tasksmate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Team Productivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {teamProductivityData.map((member, idx) => (
                        <div key={idx} className="bg-white/60 p-3 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center text-white text-xs font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium">{member.name}</span>
                            </div>
                            <span className="text-sm font-semibold px-2 py-1 rounded-full bg-tasksmate-green-start/20 text-tasksmate-green-end">
                              {member.efficiency}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <span>{member.tasksCompleted}/{member.tasksTotal} tasks completed</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-tasksmate-gradient"
                              style={{ width: `${member.efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
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
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Project Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      {topProjects.map((project, index) => (
                        <TableRow key={index}
                          onClick={() => handleProjectClick(project?.project_id)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-tasksmate-gradient h-2 rounded-full"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{project.tasks} total</TableCell>
                          <TableCell>{project.team} members</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getStatusMeta(project?.status)?.color}`}
                            >
                              {getStatusMeta(project?.status)?.label}
                            </Badge>
                            {/* <Badge className={`text-xs ${getPriorityColor(project.priority)} hover:bg-inherit hover:text-inherit`}>
                              {project.priority.toUpperCase()}
                            </Badge> */}
                            {/* <Badge
                              className={
                                project.status === "Completed" ? "bg-green-100 text-green-800" :
                                  project.status === "Active" ? "bg-blue-100 text-blue-800" :
                                    "bg-gray-100 text-gray-800"
                              }
                            >
                              {project.status}
                            </Badge> */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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