
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import MainNavigation from "@/components/navigation/MainNavigation";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Target, 
  MoreVertical,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Grid3X3,
  List,
  Filter,
  SortDesc,
  SortAsc,
  CalendarRange,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import NewProjectModal from '@/components/projects/NewProjectModal';

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
  category: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'progress' | 'startDate' | 'endDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { data: organizations } = useOrganizations();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      if (loading) return;
      const orgId = organizations?.[0]?.id;
      if (!user || !orgId) return;
      try {
        const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}?org_id=${orgId}`);
        const mapped: Project[] = res.map((p: any) => ({
          id: p.project_id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: Number(p.progress_percent ?? 0),
          startDate: p.start_date ?? '',
          endDate: p.end_date ?? '',
          teamMembers: p.team_members ?? [],
          tasksCount: p.tasks_total ?? 0,
          completedTasks: p.tasks_completed ?? 0,
          priority: p.priority,
          category: 'General',
        }));
        setProjects(mapped);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, [user, loading, organizations]);

  // Projects state populated from backend
  const [projects, setProjects] = useState<Project[]>([]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "on-hold": return "bg-yellow-100 text-yellow-800";
      case "planning": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "completed": return "Completed";
      case "on-hold": return "On Hold";
      case "planning": return "Planning";
      default: return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "on-hold": return <AlertCircle className="w-4 h-4" />;
      case "planning": return <Target className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isDateInRange = (projectDate: string, filter: string) => {
    const date = new Date(projectDate);
    const now = new Date();
    
    switch (filter) {
      case "thisWeek":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return date >= weekStart && date <= weekEnd;
      case "thisMonth":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case "nextMonth":
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
        return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear();
      case "overdue":
        return date < now && projects.find(p => p.endDate === projectDate)?.status !== 'completed';
      default:
        return true;
    }
  };

  const sortProjects = (projects: Project[]) => {
    return [...projects].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Special handling for different data types
      if (sortBy === 'startDate' || sortBy === 'endDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
      } else if (sortBy === 'status') {
        const statusOrder = { active: 4, planning: 3, 'on-hold': 2, completed: 1 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredProjects = sortProjects(projects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesPriority = filterPriority === "all" || project.priority === filterPriority;
    const matchesDate = dateFilter === "all" || isDateInRange(project.endDate, dateFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  }));

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleProjectStatusToggle = (projectId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            status: project.status === 'completed' ? 'active' : 'completed',
            progress: project.status === 'completed' ? project.progress : 100
          }
        : project
    ));
  };

  const handleNewProject = async (projectData: any) => {
    // Optimistically add project locally; also attempt to persist to backend
    const orgId = organizations?.[0]?.id;

    if (orgId) {
      try {
        const created = await api.post<any>(API_ENDPOINTS.PROJECTS, {
          org_id: orgId,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          priority: projectData.priority,
          start_date: projectData.startDate || null,
          end_date: projectData.endDate || null,
          owner: projectData.owner,
          team_members: projectData.teamMembers || [],
        });

        // Prefer the server-generated card if available
        if (created && created.project_id) {
          const newProject: Project = {
            id: created.project_id,
            name: created.name,
            description: created.description,
            status: created.status,
            progress: Number(created.progress_percent ?? 0),
            startDate: created.start_date ?? new Date().toISOString().split("T")[0],
            endDate: created.end_date ?? "", // fallback
            teamMembers: (created.team_members ?? projectData.teamMembers) || [],
            tasksCount: created.tasks_total ?? 0,
            completedTasks: created.tasks_completed ?? 0,
            priority: created.priority,
            category: "General",
          };
          setProjects(prev => [...prev, newProject]);
          setIsNewProjectModalOpen(false);
          return;
        }
      } catch (err) {
        console.error("Failed to create project on server", err);
      }
    }

    const newProject: Project = {
      id: `P${(projects.length + 1).toString().padStart(3, '0')}`,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status as any,
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      teamMembers: [projectData.owner, ...(projectData.teamMembers || [])].filter(Boolean),
      tasksCount: 0,
      completedTasks: 0,
      priority: projectData.priority,
      category: 'General'
    };
    
    setProjects([...projects, newProject]);
    setIsNewProjectModalOpen(false);
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const ProjectGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <Card 
          key={project.id} 
          className="glass border-0 shadow-tasksmate micro-lift cursor-pointer group hover:scale-105 transition-all duration-200"
          onClick={() => handleProjectClick(project.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {/* Tick Circle - Similar to Tasks */}
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    project.status === 'completed' 
                      ? 'bg-tasksmate-gradient border-transparent' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectStatusToggle(project.id);
                  }}
                >
                  {project.status === 'completed' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <Badge className="text-xs font-mono bg-blue-600 text-white">
                  {project.id}
                </Badge>
              </div>
              
              {/* Status tag positioned at the right */}
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(project.status)}`}
              >
                {getStatusText(project.status)}
              </Badge>
            </div>
            
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
            
            {/* Priority Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                {project.priority.toUpperCase()}
              </Badge>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Tasks Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Target className="w-4 h-4" />
                <span>{project.completedTasks}/{project.tasksCount} tasks</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Team Members */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Team</span>
              </div>
              <div className="flex -space-x-2">
                {project.teamMembers.slice(0, 3).map((member, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-white">
                    <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                      {member}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.teamMembers.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ProjectListView = () => (
    <div className="space-y-4">
      {filteredProjects.map((project) => (
        <Card 
          key={project.id} 
          className="glass border-0 shadow-tasksmate cursor-pointer group hover:shadow-lg transition-all duration-200"
          onClick={() => handleProjectClick(project.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Checkbox and ID - Similar to Tasks */}
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      project.status === 'completed' 
                        ? 'bg-tasksmate-gradient border-transparent' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectStatusToggle(project.id);
                    }}
                  >
                    {project.status === 'completed' && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <Badge className="text-xs font-mono bg-blue-600 text-white">
                    {project.id}
                  </Badge>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Project Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{project.description}</p>
                        {/* Priority Badge */}
                        <Badge className={`text-xs mt-1 ${getPriorityColor(project.priority)}`}>
                          {project.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  
                  {/* Tasks */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">{project.completedTasks}/{project.tasksCount}</span>
                    </div>
                    <p className="text-xs text-gray-500">tasks</p>
                  </div>
                  
                  {/* Dates */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">due date</p>
                  </div>
                </div>
              </div>
              
              {/* Status tag and team positioned at the right end - Similar to Tasks */}
              <div className="ml-4 flex flex-col items-end space-y-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(project.status)}`}
                >
                  {getStatusText(project.status)}
                </Badge>
                
                {/* Team under status tag */}
                <div className="flex -space-x-2">
                  {project.teamMembers.slice(0, 3).map((member, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-white">
                      <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                        {member}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.teamMembers.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-6 py-8">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">Manage and track all your projects in one place</p>
            </div>
            <Button 
              className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-white/30 border-b border-gray-200">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between">
              {/* Search Bar - Left side */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />
                
                {/* Status Filter Dropdown */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Status</span>
                    </SelectItem>
                    <SelectItem value="active">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Active</span>
                    </SelectItem>
                    <SelectItem value="planning">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Planning</span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                    </SelectItem>
                    <SelectItem value="on-hold">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">On Hold</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Priority</span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">High</span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">Medium</span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Low</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-36">
                    <CalendarRange className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Dates</span>
                    </SelectItem>
                    <SelectItem value="thisWeek">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">This Week</span>
                    </SelectItem>
                    <SelectItem value="thisMonth">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">This Month</span>
                    </SelectItem>
                    <SelectItem value="nextMonth">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Next Month</span>
                    </SelectItem>
                    <SelectItem value="overdue">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Overdue</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleSort('name')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 mr-2">Name</span>
                      {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('progress')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800 mr-2">Progress</span>
                      {sortBy === 'progress' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('startDate')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 mr-2">Start Date</span>
                      {sortBy === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('endDate')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 mr-2">End Date</span>
                      {sortBy === 'endDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('priority')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800 mr-2">Priority</span>
                      {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('status')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-800 mr-2">Status</span>
                      {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <div className="flex items-center space-x-2 ml-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Content */}
        <div className="px-6 py-6">
          <div className="w-full">
            {viewMode === 'grid' ? <ProjectGridView /> : <ProjectListView />}

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No projects found</p>
                <p className="text-gray-400 mb-4">
                  {searchQuery || filterStatus !== "all" || filterPriority !== "all" || dateFilter !== "all" 
                    ? "Try adjusting your filters or search query" 
                    : "Create your first project to get started"
                  }
                </p>
                <Button 
                  className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                  onClick={() => setIsNewProjectModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleNewProject}
      />
    </div>
  );
};

export default Projects;
