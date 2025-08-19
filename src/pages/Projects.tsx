
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import MainNavigation from "@/components/navigation/MainNavigation";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyableBadge from "@/components/ui/copyable-badge";
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
  Check,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import NewProjectModal from '@/components/projects/NewProjectModal';
import { getStatusMeta, getPriorityColor, formatDate, deriveDisplayFromEmail } from "@/lib/projectUtils";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import type { BackendOrgMember } from "@/types/organization";
import { Project } from '@/types/projects';


type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'progress' | 'startDate' | 'endDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]); // empty → all
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const [filterProjectName, setFilterProjectName] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { data: organizations } = useOrganizations();
  const currentOrgId = useCurrentOrgId() ?? organizations?.[0]?.id;
  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = (orgMembersRaw ?? []) as BackendOrgMember[];

  const userDisplayMap = React.useMemo(() => {
    const map: Record<string, { displayName: string; initials: string }> = {};
    orgMembers.forEach(m => {
      const info = deriveDisplayFromEmail(m.email ?? m.user_id);
      map[m.user_id] = info;
    });
    return map;
  }, [orgMembers]);
  const renderMemberAvatar = (memberId: string, idx: number) => {
    const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
    return (
      <HoverCard key={idx}>
        <HoverCardTrigger asChild>
          <Avatar className="w-6 h-6 border-2 border-white cursor-default">
            <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
              {info.initials}
            </AvatarFallback>
          </Avatar>
        </HoverCardTrigger>
        <HoverCardContent className="text-sm p-2">
          {info.displayName}
        </HoverCardContent>
      </HoverCard>
    );
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Identify current user strings for ownership checks
  const userIdentifiers = React.useMemo(() => {
    const ids: string[] = [];
    if (user?.id) ids.push(String(user.id));
    if ((user as any)?.username) ids.push(String((user as any).username));
    if (user?.email) {
      ids.push(String(user.email));
      ids.push(deriveDisplayFromEmail(user.email).displayName);
    }
    return ids.map((x) => x.toLowerCase());
  }, [user]);

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

  // Initialize status filters from URL query param (e.g., ?statuses=in_progress,planning)
  useEffect(() => {
    const param = searchParams.get('statuses');
    if (param) {
      const arr = param.split(',').map(s => s.trim()).filter(Boolean);
      setFilterStatuses(arr);
    }
  // we only want to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      if (loading) return;
      const orgId = currentOrgId;
      if (!user || !orgId) return;

      setLoadingProjects(true);

      try {
        // Use show_all=true to fetch all projects in the organization, not just user's projects
        const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${orgId}?show_all=true`);
        const mapped: Project[] = res.map((p: any) => ({
          id: p.project_id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: Number(p.progress_percent ?? 0),
          startDate: p.start_date ?? '',
          createdAt: p.created_at ?? p.created_date ?? p.created ?? p.start_date ?? '',
          endDate: p.end_date ?? '',
          teamMembers: p.team_members ?? [],
          tasksCount: p.tasks_total ?? 0,
          completedTasks: p.tasks_completed ?? 0,
          priority: p.priority,
          owner: p.owner ?? "",
          category: 'General',
        }));
        setProjects(mapped);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
      setLoadingProjects(false);
    };
    fetchProjects();
  }, [user, loading, currentOrgId]);

  // Projects state populated from backend
  const [projects, setProjects] = useState<Project[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);

  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Projects...</p>
        </div>
      </div>
    );
  }

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



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "on_hold": return <AlertCircle className="w-4 h-4" />;
      case "planning": return <Target className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
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
        const statusOrder = { completed: 6, in_progress:5, planning: 4, on_hold:3, not_started:2, archived:1 };
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

    const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(project.status);
    const matchesPriority = filterPriorities.length === 0 || filterPriorities.includes(project.priority);
    const matchesDate = dateFilter === "all" || isDateInRange(project.endDate, dateFilter);
    // For Projects page, optional project-name filter (mainly to spotlight one project)
    const matchesName = filterProjectName === "all" || project.id === filterProjectName;

    return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesName;
  }));

  const handleProjectClick = (projectId: string) => {
    if (currentOrgId) {
      navigate(`/projects/${projectId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const handleProjectStatusToggle = async (projectId: string) => {
    // Capture previous status before optimistic update
    const prevStatus = projects.find(p => p.id === projectId)?.status;
    const newStatus = prevStatus === 'completed' ? 'not_started' : 'completed';

    // 1️⃣ Optimistic UI update for snappy UX
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? {
            ...project,
            status: newStatus,
          }
        : project
    ));

    // 2️⃣ Persist change to backend
    try {
      await api.put(`${API_ENDPOINTS.PROJECTS}/${projectId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update project status', err);
      // 3️⃣ Revert UI if the backend rejects the change
      setProjects(prev => prev.map(project =>
        project.id === projectId ? { ...project, status: prevStatus ?? project.status } : project
      ));
    }
  };

  const canDeleteProject = (project: Project) => {
    const ownerString = String(project.owner ?? '').toLowerCase();
    const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
    return userIdentifiers.includes(ownerString) || userIdentifiers.includes(ownerDisplay);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project? This action cannot be undone.')) return;
    try {
      await api.del(`${API_ENDPOINTS.PROJECTS}/${projectId}`, {});
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  };

  const handleNewProject = async (projectData: any) => {
    // Optimistically add project locally; also attempt to persist to backend
    const orgId = currentOrgId;

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
          owner_designation: projectData.ownerDesignation || "",
          team_members: projectData.teamMembers || [],
          team_member_designations: projectData.teamMemberDesignations || [],
        });

        // Prefer the server-generated card if available
        if (created && created.project_id) {
          const newProject: Project = {
            id: created.project_id,
            name: created.name,
            description: created.description,
            status: created.status,
            progress: Number(created.progress_percent ?? 0),
            startDate: created.start_date ?? '',
            createdAt: created.created_at ?? created.start_date ?? new Date().toISOString().split("T")[0],
            endDate: created.end_date ?? "", // fallback
            teamMembers: (created.team_members ?? projectData.teamMembers) || [],
            tasksCount: created.tasks_total ?? 0,
            completedTasks: created.tasks_completed ?? 0,
                      priority: created.priority,
          owner: created.owner ?? projectData.owner,
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
      startDate: '',
      createdAt: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      teamMembers: [projectData.owner, ...(projectData.teamMembers || [])].filter(Boolean),
      tasksCount: 0,
      completedTasks: 0,
      priority: projectData.priority,
      owner: projectData.owner,
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
                <CopyableBadge copyText={project.id} variant="default" className="text-xs font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white">
                  {project.id}
                </CopyableBadge>
              </div>
              
              {/* Status tag positioned at the right */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusMeta(project.status).color}`}
                  >
                    {getStatusMeta(project.status).label}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(project.priority)} hover:bg-inherit hover:text-inherit`}>
                    {project.priority.toUpperCase()}
                  </Badge>
                  
                </div>
                {/* <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                  {project.priority.toUpperCase()}
                </Badge> */}
              </div>
            </div>
            
            <CardTitle className={`text-lg font-semibold transition-colors ${project.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
              {project.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* <HoverCard>
              <HoverCardTrigger asChild>
                <p className={`text-sm line-clamp-2 cursor-default ${project.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                  {project.description}
                </p>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="max-w-sm p-4 bg-white shadow-lg rounded-md border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </HoverCardContent>
            </HoverCard> */}
            
            {/* Dates removed as per request */}
            
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
            
            {/* Tasks Summary & Created date */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Target className="w-4 h-4" />
                <span>{project.completedTasks}/{project.tasksCount} tasks</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-xs font-semibold">Created:</span>
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                  {formatDate(project.createdAt || project.startDate)}
                </Badge>
              </div>
            </div>
            
            {/* Team Members */}
            <div className="flex items-center justify-between">
              {/* Owner Badge left */}
              <div className="flex items-center gap-1">
                <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                  👤 {userDisplayMap[project.owner]?.displayName ?? deriveDisplayFromEmail(project.owner).displayName}
                </Badge>
              </div>

              {/* Team icon, label and avatars */}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Team :</span>
                <div className="flex -space-x-2">
                  {project.teamMembers.slice(0, 3).map((m, idx) => renderMemberAvatar(m, idx))}
                    
                  {project.teamMembers.length > 3 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer">
                          <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-2 bg-white w-fit max-w-[280px]">
                        <div className="text-sm font-medium mb-1">Additional Team Members</div>
                        <div className="grid grid-cols-2 gap-2">
                          {project.teamMembers.slice(3).map((memberId, idx) => {
                            const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                    {info.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-700 truncate">{info.displayName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
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
                  <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                    👤 {userDisplayMap[project.owner]?.displayName ?? deriveDisplayFromEmail(project.owner).displayName}
                  </Badge>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  {/* Project Info */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full">
                        <h3 className={`font-semibold transition-colors ${project.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                          {project.name}
                        </h3>
                        {/* Description removed */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dates removed */}
                  
                  {/* Progress and Tasks - Horizontal layout with better spacing */}
                  <div className="md:col-span-4 flex items-center gap-6 pl-2">
                    {/* Progress */}
                    <div className="flex-1 space-y-1 max-w-48">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    {/* Tasks - Horizontally aligned */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">{project.completedTasks}/{project.tasksCount}</span>
                      <span className="text-sm">Tasks</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status tag and team positioned at the right end - Similar to Tasks */}
              <div className="ml-4 flex flex-col items-end space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Created:</span>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                    {formatDate(project.createdAt || project.startDate)}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusMeta(project.status).color}`}
                  >
                    {getStatusMeta(project.status).label}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(project.priority)} hover:bg-inherit hover:text-inherit`}>
                    {project.priority.toUpperCase()}
                  </Badge>
                  
                </div>
                
                {/* Team under status tag */}
                <div className="flex -space-x-2">
                  {project.teamMembers.slice(0, 3).map((m, idx) => renderMemberAvatar(m, idx))}
                    
                  {project.teamMembers.length > 3 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer">
                          <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-2 bg-white w-fit max-w-[280px]" side="left">
                        <div className="text-sm font-medium mb-1">Additional Team Members</div>
                        <div className="grid grid-cols-2 gap-2">
                          {project.teamMembers.slice(3).map((memberId, idx) => {
                            const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                    {info.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-700 truncate">{info.displayName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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
                
                {/* Status Filter – Multi-select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status {filterStatuses.length > 0 ? `(${filterStatuses.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {[
                      { value: 'not_started', label: 'Not Started', cls: 'bg-gray-100 text-gray-800' },
                      { value: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-800' },
                      { value: 'completed', label: 'Completed', cls: 'bg-green-100 text-green-800' },
                      { value: 'blocked', label: 'Blocked', cls: 'bg-red-100 text-red-800' },
                      { value: 'on_hold', label: 'On Hold', cls: 'bg-yellow-100 text-yellow-800' },
                      { value: 'paused', label: 'Paused', cls: 'bg-orange-100 text-orange-800' },
                      { value: 'planning', label: 'Planning', cls: 'bg-purple-100 text-purple-800' },
                      { value: 'archived', label: 'Archived', cls: 'bg-black text-white' },
                      { value: 'active', label: 'Active', cls: 'bg-blue-100 text-blue-800' },
                    ].map(opt => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={filterStatuses.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setFilterStatuses(prev => checked ? [...prev, opt.value] : prev.filter(s => s !== opt.value));
                        }}
                        className="cursor-pointer"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs ${opt.cls}`}>{opt.label}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority Filter – Multi-select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Priority {filterPriorities.length > 0 ? `(${filterPriorities.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {['critical','high','medium','low','none'].map(p => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={filterPriorities.includes(p)}
                        onCheckedChange={(checked) => {
                          setFilterPriorities(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                        }}
                        className="cursor-pointer"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>{p.toUpperCase()}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Project Filter (focus on a single project) */}
                <Select value={filterProjectName} onValueChange={setFilterProjectName}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Projects</span>
                    </SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">{p.name}</span>
                      </SelectItem>
                    ))}
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
                  {searchQuery || filterStatuses.length>0 || filterPriorities.length>0 || dateFilter !== "all" || filterProjectName !== "all" 
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
        orgId={currentOrgId}
      />
    </div>
  );
};

export default Projects;
