
import MainNavigation from "@/components/navigation/MainNavigation";
import NewProjectModal from '@/components/projects/NewProjectModal';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyableBadge from "@/components/ui/copyable-badge";
import DateBadge from "@/components/ui/date-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_ENDPOINTS } from "@/config";
import { toast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useOrganizations } from "@/hooks/useOrganizations";
import { stringArrayDeserialize, stringArraySerialize, usePersistedParam } from "@/hooks/usePersistedParam";
import { deriveDisplayFromEmail, formatDate, getPriorityColor, getStatusMeta } from "@/lib/projectUtils";
import { api } from "@/services/apiService";
import type { BackendOrgMember } from "@/types/organization";
import { Project } from '@/types/projects';
import {
  AlertCircle,
  ArrowRight,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  FolderOpen,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Target,
  Users
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';


type ViewMode = 'table';
type SortOption = 'name' | 'progress' | 'startDate' | 'endDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pageKey: string = 'projects';

  const [searchQuery, setSearchQuery] = usePersistedParam<string>(
    'q',
    "",
    { pageKey: pageKey, urlKey: 'q', storage: 'local', serialize: v => v?.trim() ? v : null, deserialize: v => v }
  );
  const [filterStatuses, setFilterStatuses] = usePersistedParam<string[]>(
    'statuses',
    [],
    { pageKey: pageKey, urlKey: 'statuses', storage: 'local', serialize: stringArraySerialize, deserialize: stringArrayDeserialize as any }
  );
  const [filterPriorities, setFilterPriorities] = usePersistedParam<string[]>(
    'priorities',
    [],
    { pageKey: pageKey, urlKey: 'priorities', storage: 'local', serialize: stringArraySerialize, deserialize: stringArrayDeserialize as any }
  );
  const [filterProjectName, setFilterProjectName] = usePersistedParam<string>(
    'proj',
    "all",
    { pageKey: pageKey, urlKey: 'proj', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => v || 'all' }
  );
  const [dateFilter, setDateFilter] = usePersistedParam<string>(
    'date',
    "all",
    { pageKey: pageKey, urlKey: 'date', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => v || 'all' }
  );
  const [completionFilter, setCompletionFilter] = usePersistedParam<string>('completion', 'hide', {
    pageKey, urlKey: 'completion', storage: 'local',
    serialize: v => v === 'show' ? 'show' : v, deserialize: v => v || 'hide'
  });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isTruncated, setIsTruncated] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = usePersistedParam<SortOption>(
    'sortBy',
    'name',
    { pageKey: pageKey, urlKey: 'sort', storage: 'local', serialize: v => v === 'name' ? null : v, deserialize: v => (v as SortOption) || 'name' }
  );
  const [sortDirection, setSortDirection] = usePersistedParam<SortDirection>(
    'sortDir',
    'asc',
    { pageKey: pageKey, urlKey: 'dir', storage: 'local', serialize: v => v === 'asc' ? null : v, deserialize: v => (v as SortDirection) || 'asc' }
  );

  const [tab, setTab] = usePersistedParam<'all' | 'mine'>(
    'tab',
    'all',
    { pageKey: pageKey, urlKey: 'tab', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => (v as 'all' | 'mine') || 'all' }
  );

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { data: organizations } = useOrganizations();
  const currentOrgId = useCurrentOrgId() ?? organizations?.[0]?.id;
  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);


  // Projects state populated from backend
  const [projects, setProjects] = useState<Project[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;

  const userDisplayMap = React.useMemo(() => {
    const map: Record<string, { displayName: string; initials: string; isOwner: boolean }> = {};
    orgMembers.forEach(m => {
      // const info = deriveDisplayFromEmail(m.email ?? m.user_id);
      map[m.user_id] = {
        displayName: m.displayName,
        initials: m.initials,
        isOwner: m.role === 'owner',
      };
    });
    return map;
  }, [orgMembers]);
  const renderMemberAvatar = (memberId: string, idx: number) => {
    const info = userDisplayMap[memberId];
    return info && (
      <HoverCard key={idx}>
        <HoverCardTrigger asChild>
          <Avatar className="w-8 h-8 border-2 border-white cursor-default">
            <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
              {info?.initials}
            </AvatarFallback>
          </Avatar>
        </HoverCardTrigger>
        <HoverCardContent className="text-sm p-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-gray-200">
              <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                {info.initials}
              </AvatarFallback>
            </Avatar>
            <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
              {info.displayName}
            </Badge>
          </div>
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

  const fetchProjects = async () => {
    if (loading) return;
    const orgId = currentOrgId;
    if (!user || !orgId) return;

    setLoadingProjects(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
    setLoadingProjects(false);
  };

  // Fetch projects from backend
  useEffect(() => {
    fetchProjects();
  }, [user, loading, currentOrgId]);

  // if (loadingProjects) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading Projects...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
  //     </div>
  //   );
  // }

  const [restoreCompletion, setRestoreCompletion] = useState<string | null>(null);

  useEffect(() => {
    if (completionFilter === 'hide') {
      setRestoreCompletion(completionFilter);
    }
    if (filterStatuses.includes('completed')) {
      setCompletionFilter('show');
    } else {
      if (restoreCompletion) {
        setCompletionFilter(restoreCompletion);
        setRestoreCompletion(null);
      }
    }
  }, [filterStatuses]);

  useEffect(() => {
    if (completionFilter === 'hide') {
      if(filterStatuses.includes('completed')) {
        setFilterStatuses(filterStatuses.filter(s => s !== 'completed'));
      }
    }    
  }, [completionFilter]);

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
        const statusOrder = { completed: 6, in_progress: 5, planning: 4, on_hold: 3, not_started: 2, archived: 1 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredProjects = useMemo(() => {
    return sortProjects(projects.filter(project => {

      // Tab filter (all vs mine)
      if (tab === 'mine') {
        // const ownerString = String(project.owner ?? '').toLowerCase();
        // const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
        // if (!userIdentifiers.includes(ownerString) && !userIdentifiers.includes(ownerDisplay)) {
        //   return false;
        // }

        if (!project.teamMembers.some(member => userIdentifiers.includes(String(member).toLowerCase())) &&
          !userIdentifiers.includes(String(project.owner).toLowerCase())) return false;
      }

      const matchesSearch = searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(project.status);
      const matchesPriority = filterPriorities.length === 0 || filterPriorities.includes(project.priority);
      const matchesDate = dateFilter === "all" || isDateInRange(project.endDate, dateFilter);
      // For Projects page, optional project-name filter (mainly to spotlight one project)
      const matchesName = filterProjectName === "all" || project.id === filterProjectName;

      const matchesCompletion =
        completionFilter === 'show' ||
        (completionFilter === 'hide' ? project.status !== 'completed' : true);

      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesName && matchesCompletion;
    }));
  }, [projects, searchQuery, filterStatuses, filterPriorities, dateFilter, filterProjectName, tab, sortBy, sortDirection, userIdentifiers, completionFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentPageProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatuses, filterPriorities, dateFilter, filterProjectName, tab, completionFilter]);

  // Reset to last valid page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      toast({
        title: "Updating project status",
        description: "Please wait...",
      });
      await api.put(`${API_ENDPOINTS.PROJECTS}/${projectId}`, { status: newStatus });
      toast({
        title: "Success",
        description: "Project status updated successfully!",
        variant: "default"
      });
    } catch (err) {
      console.error('Failed to update project status', err);
      // 3️⃣ Revert UI if the backend rejects the change
      setProjects(prev => prev.map(project =>
        project.id === projectId ? { ...project, status: prevStatus ?? project.status } : project
      ));
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive"
      });
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
      toast({
        title: "Creating project",
        description: "Please wait...",
      });
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
        // if (created && created.project_id) {
        //   const newProject: Project = {
        //     id: created.project_id,
        //     name: created.name,
        //     description: created.description,
        //     status: created.status,
        //     progress: Number(created.progress_percent ?? 0),
        //     startDate: created.start_date ?? '',
        //     createdAt: created.created_at ?? created.start_date ?? new Date().toISOString().split("T")[0],
        //     endDate: created.end_date ?? "", // fallback
        //     teamMembers: (created.team_members ?? projectData.teamMembers) || [],
        //     tasksCount: created.tasks_total ?? 0,
        //     completedTasks: created.tasks_completed ?? 0,
        //               priority: created.priority,
        //   owner: created.owner ?? projectData.owner,
        //   category: "General",
        //   };
        //   setProjects(prev => [...prev, newProject]);

        // }
        setIsNewProjectModalOpen(false);
        fetchProjects();

        toast({
          title: "Success",
          description: "Project has been successfully created.",
          variant: "default"
        });

      } catch (err) {
        console.error("Failed to create project", err);
        toast({
          title: "Failed to create project",
          description: err.message,
          variant: "destructive"
        });
      }
    }

    // const newProject: Project = {
    //   id: `P${(projects.length + 1).toString().padStart(3, '0')}`,
    //   name: projectData.name,
    //   description: projectData.description,
    //   status: projectData.status as any,
    //   progress: 0,
    //   startDate: '',
    //   createdAt: new Date().toISOString().split('T')[0],
    //   endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    //   teamMembers: [projectData.owner, ...(projectData.teamMembers || [])].filter(Boolean),
    //   tasksCount: 0,
    //   completedTasks: 0,
    //   priority: projectData.priority,
    //   owner: projectData.owner,
    //   category: 'General'
    // };

    // setProjects([...projects, newProject]);
    // setIsNewProjectModalOpen(false);
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const handleNavigation = (tab: string, projectId: string) => {
    if (currentOrgId) {
      navigate(`/${tab}/${projectId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/${tab}/${projectId}`);
    }
  };

  const ProjectGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentPageProjects.map((project) => (
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
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${project.status === 'completed'
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
                <CopyableBadge copyText={project.id} org_id={currentOrgId ?? ''} variant="default" className="text-xs font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white">
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
            <div className="space-y-2 cursor-pointer" onClick={() => handleNavigation('tasks_catalog', project.id)}>
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
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer">
                          <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-2 bg-white w-fit max-w-[280px]">
                        <div className="text-sm font-medium mb-1">Additional Team Members</div>
                        <div className="grid grid-cols-2 gap-2">
                          {project.teamMembers.slice(3).map((memberId, idx) => {
                            const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
                            return info && (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-8 h-8 border-2 border-gray-200">
                                  <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                    {info.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                                  {info.displayName}
                                </Badge>
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
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${project.status === 'completed'
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
                  <div className="md:col-span-4 flex items-center gap-6 pl-2 cursor-pointer" onClick={() => handleNavigation('tasks_catalog', project.id)}>
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
                      <span className="text-sm">Tasks Completed</span>
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
                            return info && (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                    {info.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                                  {info.displayName}
                                </Badge>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-6 py-8">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 dark:text-white mb-2">Projects</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and track all your projects in one place</p>
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

        <div className="px-6 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Tabs value={tab} onValueChange={v => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Projects</TabsTrigger>
                <TabsTrigger value="mine">My Projects</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* placeholder to keep flex spacing */}

            {/* Include a switch to toggle between completed and not completed projects */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="completionFilter" className="ml-2 text-xs font-xs text-gray-700 dark:text-gray-200">
                {completionFilter === 'hide' ? 'Show' : 'Hide'} Completed
              </Label>
              <Switch
                id="completionFilter"
                name="completionFilter"
                className="ml-1"
                checked={completionFilter === 'show'}
                onCheckedChange={v => setCompletionFilter(v ? 'show' : 'hide')}
              />

            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-white/30 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between">
              {/* Search Bar - Left side */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10 bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end dark:text-white dark:placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-4">
                {/* <Filter className="w-4 h-4 text-gray-500" /> */}

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
                          setFilterStatuses(checked ? [...filterStatuses, opt.value] : filterStatuses.filter(s => s !== opt.value));
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
                    {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={filterPriorities.includes(p)}
                        onCheckedChange={(checked) => {
                          setFilterPriorities(checked ? [...filterPriorities, p] : filterPriorities.filter(x => x !== p));
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
                    {projects.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
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

                {/* View Toggle removed as we only have table view */}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-2">
          <div className="w-full">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          </div>
        </div>

        {/* Projects Content */}
        <div className="px-6 py-6">
          <div className="w-full">
            {
              error ?
                (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <p className="text-red-500">Error loading projects <br></br> {error}</p>
                    <Button
                      className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                      onClick={fetchProjects}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try again
                    </Button>
                  </div>
                )
                :
                (loadingProjects ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading projects...</p>
                  </div>
                ) : filteredProjects.length === 0 ?
                  (<div className="text-center py-16 bg-white rounded-lg border">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-12 h-12 text-green-600" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No projects found</p>
                    <p className="text-gray-400 mb-4">
                      {searchQuery || filterStatuses.length > 0 || filterPriorities.length > 0 || dateFilter !== "all" || filterProjectName !== "all"
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
                  ) : (
                    <div className="rounded-md border dark:border-gray-700 shadow-tasksmate overflow-x-auto">
                      <div className="min-w-max w-full">
                        <Table className="w-full">
                          <TableHeader className="bg-gray-50 dark:bg-gray-800">
                            <TableRow>
                              <TableHead className="w-12 text-center flex-shrink-0"></TableHead>
                              <TableHead className="w-20 sm:w-24 md:w-28 text-center min-w-[5rem]">ID</TableHead>
                              <TableHead className="min-w-[150px] sm:min-w-[180px] md:w-60">Title</TableHead>
                              <TableHead className="min-w-[200px] sm:min-w-[250px] md:w-80">Description</TableHead>
                              <TableHead className="w-50 sm:w-50 md:w-50 text-center">Progress</TableHead>
                              <TableHead className="w-24 sm:w-28 md:w-32 text-center">Status</TableHead>
                              <TableHead className="w-24 sm:w-28 md:w-32 text-center">Priority</TableHead>
                              <TableHead className="w-28 sm:w-32 md:w-40 text-center">Owner</TableHead>
                              <TableHead className="w-32 sm:w-32 md:w-40 text-center">Start Date</TableHead>
                              <TableHead className="w-32 sm:w-32 md:w-40 text-center">Due Date</TableHead>
                              <TableHead className="w-32 sm:w-32 md:w-40 text-center">Members</TableHead>
                              {/* <TableHead className="w-40 text-center font-bold">Tags</TableHead> */}
                              <TableHead className="w-20 sm:w-24 text-center flex-shrink-0">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentPageProjects.map((project) => (
                              <TableRow
                                key={project.id}
                                className={`hover:bg-slate-50/60 dark:hover:bg-gray-700/60 transition-colors ${project.status === 'completed' ? 'bg-gray-50/60 dark:bg-gray-800/60' : ''}`}
                              >
                                <TableCell className="p-2 text-center">
                                  <div
                                    className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${project.status === 'completed'
                                      ? 'bg-tasksmate-gradient border-transparent'
                                      : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        // check for project membership or project creation
                                        !(project.teamMembers.some(member => member === user?.id || member === user?.user_metadata?.username)
                                          || userDisplayMap[user?.id]?.isOwner)
                                      ) {
                                        toast({
                                          title: "Access Denied",
                                          description: "You do not have permission to update this project",
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                      handleProjectStatusToggle(project.id);
                                    }}

                                  >
                                    {project.status === 'completed' && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center p-2">
                                  <div className="flex justify-center min-w-0">
                                    <CopyableBadge copyText={project.id} org_id={currentOrgId ?? ''} variant="default" className="text-xs font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white max-w-full min-w-0 flex-shrink">
                                      {project.id}
                                    </CopyableBadge>
                                  </div>
                                </TableCell>

                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <div
                                      className={`truncate ${project.status === 'completed' ? 'line-through text-gray-400' : 'hover:underline cursor-pointer'}`}
                                      ref={(el) => {
                                        if (el) {
                                          // Check if text is truncated
                                          const isTrunc = el.scrollWidth > el.clientWidth;
                                          if (isTruncated[project.id] !== isTrunc) {
                                            setIsTruncated(prev => ({ ...prev, [project.id]: isTrunc }));
                                          }
                                        }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          // check for project membership or project creation
                                          !(project.teamMembers.some(member => member === user?.id || member === user?.user_metadata?.username)
                                            || userDisplayMap[user?.id]?.isOwner)
                                        ) {
                                          toast({
                                            title: "Access Denied",
                                            description: "You do not have permission to view this project",
                                            variant: "destructive"
                                          });
                                          return;
                                        }
                                        handleProjectClick(project.id);
                                      }}
                                    >
                                      {project.name}
                                    </div>
                                    {isTruncated[project.id] && (
                                      <Button
                                        variant="ghost"
                                        className="ml-1 p-0 h-6 w-6 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedProject(project);
                                          setIsDialogOpen(true);
                                        }}
                                      >
                                        <Maximize2 className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="min-w-0 max-w-xs">
                                    <div
                                      className="text-sm text-gray-600 dark:text-gray-300 break-words overflow-hidden"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        lineHeight: '1.4em',
                                        maxHeight: '2.8em'
                                      }}
                                      title={project.description}
                                    >
                                      {project.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center" onClick={() => handleNavigation('tasks_catalog', project.id)}>
                                  <div className="flex flex-col items-center">
                                    <div className="w-full items-center space-x-2">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                          <div
                                            className="bg-tasksmate-gradient h-2 rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-300 w-20">{project.progress}%</span>
                                      </div>
                                    </div>
                                    <div className="w-full items-center text-xs text-gray-500 mt-2">
                                      <span>(<span className="font-semibold text-xs">{project.completedTasks}</span>/<span className="font-semibold text-xs">{project.tasksCount}</span>
                                        <span className="ml-1 font-semibold text-xs">Tasks Completed</span>)</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Select
                                      value={project.status}
                                      onValueChange={(value) => {
                                        // Optimistic update
                                        setProjects(prev =>
                                          prev.map(p => p.id === project.id ? { ...p, status: value } : p)
                                        );
                                        toast({
                                          title: "Updating project status",
                                          description: "Please wait...",
                                        });
                                        // API update
                                        api.put(`${API_ENDPOINTS.PROJECTS}/${project.id}`, { status: value })
                                          .then(() => {
                                            toast({
                                              title: "Success",
                                              description: "Project status updated successfully!",
                                              variant: "default"
                                            });
                                          })
                                          .catch(error => {
                                            console.error('Failed to update status:', error);
                                            // Revert on error
                                            setProjects(prev =>
                                              prev.map(p => p.id === project.id ? { ...p, status: project.status } : p)
                                            );
                                            toast({
                                              title: "Error",
                                              description: "Failed to update status",
                                              variant: "destructive"
                                            });
                                          });
                                      }}

                                      disabled={
                                        // check for project membership or project creation
                                        !((project.owner === user?.user_metadata?.username || project.owner === user?.id)
                                          || userDisplayMap[user?.id]?.isOwner)
                                      }
                                    >
                                      <SelectTrigger className={`h-8 px-2 py-0 w-fit min-w-[7rem] border-0 ${getStatusMeta(project.status).color}`}>
                                        <SelectValue>{getStatusMeta(project.status).label}</SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          { value: 'not_started', label: 'Not Started', cls: 'bg-gray-100 text-gray-800' },
                                          { value: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-800' },
                                          { value: 'completed', label: 'Completed', cls: 'bg-green-100 text-green-800' },
                                          { value: 'blocked', label: 'Blocked', cls: 'bg-red-100 text-red-800' },
                                          { value: 'on_hold', label: 'On Hold', cls: 'bg-yellow-100 text-yellow-800' },
                                          { value: 'planning', label: 'Planning', cls: 'bg-purple-100 text-purple-800' },
                                          { value: 'archived', label: 'Archived', cls: 'bg-black text-white' },
                                          { value: 'active', label: 'Active', cls: 'bg-blue-100 text-blue-800' },
                                        ].map(opt => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            <span className={`px-2 py-1 rounded-full text-xs ${opt.cls}`}>{opt.label}</span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Select
                                      value={project.priority}
                                      onValueChange={(value) => {
                                        // Optimistic update
                                        setProjects(prev =>
                                          prev.map(p => p.id === project.id ? { ...p, priority: value } : p)
                                        );
                                        toast({
                                          title: "Updating project priority",
                                          description: "Please wait...",
                                        });
                                        // API update
                                        api.put(`${API_ENDPOINTS.PROJECTS}/${project.id}`, { priority: value })
                                          .then(() => {
                                            toast({
                                              title: "Success",
                                              description: "Project priority updated successfully!",
                                              variant: "default"
                                            });
                                          })
                                          .catch(error => {
                                            console.error('Failed to update priority:', error);
                                            // Revert on error
                                            setProjects(prev =>
                                              prev.map(p => p.id === project.id ? { ...p, priority: project.priority } : p)
                                            );
                                            toast({
                                              title: "Error",
                                              description: "Failed to update priority",
                                              variant: "destructive"
                                            });
                                          });
                                      }}
                                      disabled={
                                        // check for project membership or project creation
                                        !((project.owner === user?.user_metadata?.username || project.owner === user?.id)
                                          || userDisplayMap[user?.id]?.isOwner)
                                      }
                                    >
                                      <SelectTrigger className={`h-8 px-2 py-0 w-fit min-w-[5rem] border-0 ${getPriorityColor(project.priority)}`}>
                                        <SelectValue>{project.priority?.toUpperCase()}</SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                                          <SelectItem key={p} value={p}>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>{p.toUpperCase()}</span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Badge className="text-xs bg-indigo-100 text-indigo-800">
                                      {userDisplayMap[project.owner]?.displayName ?? deriveDisplayFromEmail(project.owner).displayName}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <DateBadge date={project.startDate ? project.startDate : project.createdAt} className="text-xs bg-blue-100 text-blue-800" />
                                </TableCell>
                                <TableCell className="text-center">
                                  <DateBadge date={project.endDate ? project.endDate : project.createdAt} className="text-xs bg-rose-100 text-rose-800" />
                                </TableCell>

                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <div className="flex -space-x-2">
                                      {project.teamMembers.slice(0, 3).map((m, idx) => renderMemberAvatar(m, idx))}
                                      {project.teamMembers.length > 3 && (
                                        <HoverCard>
                                          <HoverCardTrigger asChild>
                                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer">
                                              <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                                            </div>
                                          </HoverCardTrigger>
                                          <HoverCardContent className="p-2 bg-white w-fit max-w-[280px]">
                                            <div className="text-sm font-medium mb-1">Team Members</div>
                                            <div className="grid grid-cols-2 gap-2">
                                              {project.teamMembers.slice(3).map((memberId, idx) => {
                                                const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
                                                return info && (
                                                  <div key={idx} className="flex items-center gap-2">
                                                    <Avatar className="w-8 h-8 border-2 border-white">
                                                      <AvatarFallback className="text-xs bg-tasksmate-gradient text-gray-200">
                                                        {info.initials}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                                                      {info.displayName}
                                                    </Badge>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </HoverCardContent>
                                        </HoverCard>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* <TableCell className="text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {project.hasOwnProperty('tags') && Array.isArray((project as any).tags) && (project as any).tags.length > 0 ? (
                            (project as any).tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          {project.hasOwnProperty('tags') && Array.isArray((project as any).tags) && (project as any).tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              +{(project as any).tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell> */}
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      className="p-1.5 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                                      onClick={() => {
                                        if (!(project.teamMembers.some(member => userIdentifiers.includes(String(member).toLowerCase())) ||
                                          userIdentifiers.includes(String(project.owner).toLowerCase())
                                          || userDisplayMap[user?.id]?.isOwner)) {
                                          toast({
                                            title: "Access Denied",
                                            description: "You do not have permission to view this project.",
                                            variant: "destructive",
                                          });
                                        } else {
                                          handleProjectClick(project.id)
                                        }
                                      }}
                                      title="View project details"

                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                )}

            {/* Pagination */}
            {filteredProjects.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
                </div>

                <div className="flex items-center space-x-2 flex-wrap justify-center">
                  {/* Previous button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1"
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      // Adjust start if we're near the end
                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      // First page + ellipsis
                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="ellipsis1" className="text-gray-400 px-2">...</span>);
                        }
                      }

                      // Visible page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={i === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="w-8 h-8 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }

                      // Last page + ellipsis
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(<span key="ellipsis2" className="text-gray-400 px-2">...</span>);
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant={totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Next button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1"
                  >
                    Next
                  </Button>
                </div>
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

      {/* Project Detail Dialog - Simplified */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  if (selectedProject) handleProjectClick(selectedProject.id);
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
