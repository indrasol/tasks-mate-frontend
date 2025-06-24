
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
  DollarSign
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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

  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 33000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 36000 },
    { month: 'Jun', revenue: 67000, expenses: 41000 },
  ];

  const topProjects = [
    { name: "TasksMate Mobile App", progress: 65, budget: 50000, team: 3 },
    { name: "UI/UX Redesign", progress: 40, budget: 25000, team: 2 },
    { name: "Security Audit", progress: 100, budget: 15000, team: 2 },
    { name: "API Integration", progress: 10, budget: 30000, team: 2 },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="ml-64 transition-all duration-300">
        {/* Page Header */}
        <div className="px-6 py-6 bg-white/50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into your projects and team performance</p>
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
              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">247</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">+12% vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Projects</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">+2 new projects</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">89% avg efficiency</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">$67k</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 ml-1">+18% vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <BarChart data={taskCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completed" stackId="a" fill="#10B981" />
                        <Bar dataKey="pending" stackId="a" fill="#F59E0B" />
                        <Bar dataKey="blocked" stackId="a" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

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
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Team Productivity */}
              <Card className="glass border-0 shadow-tasksmate">
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
                            <span className="text-sm font-medium">{member.name}</span>
                            <span className="text-sm text-gray-600">{member.tasksCompleted} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
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

            {/* Top Projects Table */}
            <Card className="glass border-0 shadow-tasksmate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Projects Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Team Size</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProjects.map((project, index) => (
                      <TableRow key={index}>
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
                        <TableCell>${project.budget.toLocaleString()}</TableCell>
                        <TableCell>{project.team} members</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              project.progress === 100 ? "bg-green-100 text-green-800" :
                              project.progress > 50 ? "bg-blue-100 text-blue-800" :
                              project.progress > 0 ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {project.progress === 100 ? "Completed" :
                             project.progress > 50 ? "Active" :
                             project.progress > 0 ? "In Progress" : "Planning"}
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
