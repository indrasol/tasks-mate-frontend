
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
  FolderOpen
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Sample data for charts
  const taskCompletionData = [
    { month: 'Jan', completed: 45, pending: 15, blocked: 5 },
    { month: 'Feb', completed: 52, pending: 18, blocked: 3 },
    { month: 'Mar', completed: 48, pending: 22, blocked: 7 },
    { month: 'Apr', completed: 61, pending: 19, blocked: 4 },
    { month: 'May', completed: 55, pending: 16, blocked: 6 },
    { month: 'Jun', completed: 67, pending: 13, blocked: 2 },
  ];

  const projectStatusData = [
    { name: 'Active', value: 12, color: '#3B82F6' },
    { name: 'Completed', value: 8, color: '#10B981' },
    { name: 'On Hold', value: 3, color: '#F59E0B' },
    { name: 'Planning', value: 5, color: '#8B5CF6' },
  ];

  const teamProductivityData = [
    { name: 'John Doe', tasksCompleted: 24, efficiency: 92 },
    { name: 'Sarah Kim', tasksCompleted: 31, efficiency: 88 },
    { name: 'Mike Rodriguez', tasksCompleted: 19, efficiency: 85 },
    { name: 'Anna Martinez', tasksCompleted: 27, efficiency: 90 },
  ];

  const meetingData = [
    { month: 'Jan', statusCalls: 8, retrospectives: 4, knowshare: 6, adhoc: 12 },
    { month: 'Feb', statusCalls: 10, retrospectives: 3, knowshare: 8, adhoc: 15 },
    { month: 'Mar', statusCalls: 9, retrospectives: 5, knowshare: 7, adhoc: 10 },
    { month: 'Apr', statusCalls: 12, retrospectives: 4, knowshare: 9, adhoc: 18 },
    { month: 'May', statusCalls: 11, retrospectives: 6, knowshare: 5, adhoc: 14 },
    { month: 'Jun', statusCalls: 13, retrospectives: 4, knowshare: 11, adhoc: 16 },
  ];

  const projectProgressData = [
    { name: 'TasksMate Mobile', progress: 65, tasks: 24, completed: 16 },
    { name: 'UI/UX Redesign', progress: 40, tasks: 18, completed: 7 },
    { name: 'Security Audit', progress: 100, tasks: 12, completed: 12 },
    { name: 'API Integration', progress: 10, tasks: 8, completed: 1 },
  ];

  const topProjects = [
    { name: "TasksMate Mobile App", progress: 65, tasks: 24, team: 3, status: "Active" },
    { name: "UI/UX Redesign", progress: 40, tasks: 18, team: 2, status: "Active" },
    { name: "Security Audit", progress: 100, tasks: 12, team: 2, status: "Completed" },
    { name: "API Integration", progress: 10, tasks: 8, team: 2, status: "Planning" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <MainNavigation />

      <div className="ml-64 transition-all duration-300">
        {/* Page Header */}
        <div className="px-6 py-6 bg-white/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 dark:text-gray-100 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into your projects, tasks, and meetings</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant={selectedPeriod === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("7d")}
              >
                7 Days
              </Button>
              <Button 
                variant={selectedPeriod === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("30d")}
              >
                30 Days
              </Button>
              <Button 
                variant={selectedPeriod === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("90d")}
              >
                90 Days
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">247</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 ml-1">+12% vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 ml-1">+2 new projects</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">24</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 ml-1">89% avg efficiency</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Meeting Books</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">156</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 ml-1">+8 this week</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Completion Trends */}
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Task Completion Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={taskCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                        <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                        <Bar dataKey="blocked" stackId="a" fill="#EF4444" name="Blocked" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Project Status Distribution */}
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Project Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px]">
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
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meeting Books Analytics */}
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Meeting Books Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px]">
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
              </Card>

              {/* Team Productivity */}
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Productivity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamProductivityData.map((member, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{member.tasksCompleted} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                              style={{ width: `${member.efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-3">
                          {member.efficiency}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Progress Chart */}
            <Card className="glass border-0 shadow-tasksmate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Project Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                      <Bar dataKey="progress" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

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
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{project.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-[100px]">
                              <div 
                                className="bg-tasksmate-gradient h-2 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">{project.tasks} total</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">{project.team} members</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              project.status === "Completed" ? "bg-green-100 text-green-800" :
                              project.status === "Active" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {project.status}
                          </Badge>
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
  );
};

export default Reports;
