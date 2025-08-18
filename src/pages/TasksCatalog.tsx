import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyableIdBadge from "@/components/ui/copyable-id-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Check,
  Search,
  Plus,
  MoreVertical,
  MessageSquare,
  LogOut,
  Grid3X3,
  List,
  Filter,
  SortDesc,
  SortAsc,
  CalendarRange,
  Trash2,
  X,
  ChevronRight,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { deriveDisplayFromEmail, formatDate, getPriorityColor } from "@/lib/projectUtils";
import { api } from "@/services/apiService";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/../config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import TaskListView from "@/components/tasks/TaskListView";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import MainNavigation from "@/components/navigation/MainNavigation";
import { taskService } from "@/services/taskService";
import { BackendTask, Task } from "@/types/tasks";
import { RichTextEditor } from "@/components/ui/rich-text-editor";


type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'status' | 'targetDate' | 'createdDate' | 'progress' | 'owner';
type SortDirection = 'asc' | 'desc';

const TasksCatalog = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Handle authentication and loading BEFORE any other hooks
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Early returns AFTER useEffect but BEFORE other hooks
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

  return <TasksCatalogContent navigate={navigate} user={user} signOut={signOut} />;
};

// Separate component to handle all the main logic
const TasksCatalogContent = ({ navigate, user, signOut }: { navigate: any, user: any, signOut: () => void }) => {
  // State management - enhanced with new filter and sort options
  const [view, setView] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]); // empty array -> all
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [createdDateFilter, setCreatedDateFilter] = useState<string>("all");
  const [createdDateRange, setCreatedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isCustomCreatedDateRange, setIsCustomCreatedDateRange] = useState(false);
  
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [dueDateRange, setDueDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isCustomDueDateRange, setIsCustomDueDateRange] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: organizations } = useOrganizations();
  const currentOrgId = useCurrentOrgId() ?? organizations?.[0]?.id;
  const { data: orgMembers } = useOrganizationMembers(currentOrgId);

  // Build possible identifiers for current user (id, username, email, displayName)
  const userIdentifiers = useMemo(() => {
    if (!user) return [] as string[];
    const ids: string[] = [];
    if (user.id) ids.push(String(user.id));
    if ((user as any).username) ids.push(String((user as any).username));
    if (user.email) ids.push(String(user.email));
    if (user.email) {
      ids.push(deriveDisplayFromEmail(user.email).displayName);
    }
    return ids.map((x) => x.toLowerCase());
  }, [user]);

  useEffect(() => {
    if (!currentOrgId) return;
    setLoadingTasks(true);
    setError(null);
    taskService.getTasks({ org_id: currentOrgId })
      .then((data: BackendTask[]) => {
        // Map backend data to frontend Task type
        const mapped = (data || []).map((t: any) => ({
          id: t.task_id,
          name: t.title,
          description: t.description,
          // Normalize API statuses for UI expectations
          status: (t.status || "not_started")
            .replace("in_progress", "in-progress"),
          owner: t.assignee, // Backend returns 'assignee'
          startDate: t.start_date,
          targetDate: t.due_date,
          comments: t.comments ?? 0,
          progress: t.progress ?? 0,
          priority: t.priority,
          tags: t.tags,
          projectId: t.project_id,
          createdBy: t.created_by,
          createdDate: t.created_at,
        }));
        setTasks(mapped);
        setLoadingTasks(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tasks");
        setLoadingTasks(false);
      });
  }, [currentOrgId]);

  // Fetch projects for current org to map project names
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentOrgId) return;
      try {
        // Fetch *all* projects in the organization (not just those where the current user is a member)
        const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}?show_all=true`);
        const mapped = res.map((p: any) => ({ id: p.project_id, name: p.name }));
        setProjects(mapped);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    };
    fetchProjects();
  }, [currentOrgId]);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  // Mock project context
  const currentProject = 'TasksMate Web';

  // Enhanced date filtering logic with custom date range support
  const isDateInRange = (
    taskDate: string, 
    filter: string, 
    customRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    if (!taskDate) return true; // Handle empty dates
    
    // Normalize the task date to midnight UTC
    const date = new Date(taskDate + 'T00:00:00Z');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If we're in custom date range mode and have a valid range
    if (filter === 'custom' && customRange?.from) {
      // If only "from" date is set
      if (!customRange.to) {
        return date >= customRange.from;
      }
      // If both dates are set
      return date >= customRange.from && date <= customRange.to;
    }
    
    // Handle preset filters
    switch (filter) {
      case "today":
        return date.getFullYear() === today.getFullYear() && 
               date.getMonth() === today.getMonth() && 
               date.getDate() === today.getDate();
               
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return date.getFullYear() === tomorrow.getFullYear() && 
               date.getMonth() === tomorrow.getMonth() && 
               date.getDate() === tomorrow.getDate();
               
      case "thisWeek": {
        // Get the first day of current week (Sunday)
        const firstDay = new Date(today);
        const day = today.getDay();
        firstDay.setDate(today.getDate() - day);
        
        // Get the last day of current week (Saturday)
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        
        return date >= firstDay && date <= lastDay;
      }
      
      case "next7Days": {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return date >= today && date <= nextWeek;
      }
      
      case "next30Days": {
        const next30 = new Date(today);
        next30.setDate(today.getDate() + 30);
        return date >= today && date <= next30;
      }
      
      case "thisMonth":
        return date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
               
      case "nextMonth": {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return date >= nextMonth && date <= lastDayNextMonth;
      }
      
      case "overdue":
        // A task is overdue if its due date is before today and it's not completed
        return date < today && 
               tasks.find(t => t.targetDate === taskDate)?.status !== 'completed';
               
      default:
        return true; // "all" filter or any other value
    }
  };

  // Sort tasks function
  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Special handling for different data types
      if (sortBy === 'targetDate' || sortBy === 'createdDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'status') {
        const statusOrder = { 'in-progress': 4, todo: 3, blocked: 2, completed: 1 };
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const canDeleteTask = (t: Task) => {
    const ownerString = String(t.owner ?? '').toLowerCase();
    const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
    return userIdentifiers.includes(ownerString) || userIdentifiers.includes(ownerDisplay);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  // Enhanced filter and search logic with custom date range support
  const filteredTasks = useMemo(() => {
    return sortTasks(tasks.filter(task => {
      // Tab filter (all vs mine)
      if (tab === 'mine') {
        const ownerString = String(task.owner ?? '').toLowerCase();
        const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
        if (!userIdentifiers.includes(ownerString) && !userIdentifiers.includes(ownerDisplay)) {
          return false;
        }
      }
      // Search filter
      const matchesSearch = searchQuery === "" ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      // Status filter
      const matchesStatus =
        filterStatuses.length === 0 || filterStatuses.includes(task.status);

      // Owner filter
      const matchesOwner = filterOwner === "all" || task.owner === filterOwner;
      const matchesPriority =
        filterPriorities.length === 0 || filterPriorities.includes((task.priority ?? 'none'));
      
      // Project filter
      const matchesProject = filterProject === "all" || task.projectId === filterProject;

      // Created date filter - Check createdDate
      const matchesCreatedDate = 
        createdDateFilter === "all" || 
        (isCustomCreatedDateRange && createdDateRange.from) ? 
          // For custom date range, check created date
          isDateInRange(task.createdDate, 'custom', createdDateRange) :
          // For preset filters, check created date
          isDateInRange(task.createdDate, createdDateFilter);
          
      // Due date filter - Check targetDate
      const matchesDueDate = 
        dueDateFilter === "all" || 
        (isCustomDueDateRange && dueDateRange.from) ? 
          // For custom date range, check due date
          isDateInRange(task.targetDate, 'custom', dueDateRange) :
          // For preset filters, check due date
          isDateInRange(task.targetDate, dueDateFilter);

      return matchesSearch && matchesStatus && matchesOwner && matchesPriority && matchesProject && matchesCreatedDate && matchesDueDate;
    }));
  }, [tasks, searchQuery, filterStatuses, filterOwner, filterPriorities, filterProject, 
     createdDateFilter, createdDateRange, isCustomCreatedDateRange,
     dueDateFilter, dueDateRange, isCustomDueDateRange,
     sortBy, sortDirection, tab, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "blocked": return "bg-red-500";
      case "not_started": return "bg-gray-400";
      case "critical": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    const normalized = status.replace("in_progress", "in-progress");
    switch (normalized) {
      case "completed": return "Completed";
      case "in-progress": return "In Progress";
      case "blocked": return "Blocked";
      case "not_started": return "Not Started";
      case "on_hold": return "On Hold";
      case "archived": return "Archived";

      default: return "Unknown";
    }
  };

  const getUniqueOwners = () => {
    return Array.from(new Set(tasks.map(task => task.owner).filter(Boolean)));
  };

  const handleTaskClick = (taskId: string) => {
    if (currentOrgId) {
      navigate(`/tasks/${taskId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/tasks/${taskId}`);
    }
  };

  const handleNewTask = () => {
    setIsNewTaskModalOpen(true);
  };

  const handleNewMeeting = () => {
    console.log("New meeting clicked");
  };

  const handleTaskCreated = (newTask: Task) => {
    console.log("Direct task creation:", newTask);
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskStatusToggle = (taskId: string) => {

    // Capture previous status before optimistic update
    const prevStatus = tasks.find(p => p.id === taskId)?.status;
    const newStatus = prevStatus === 'completed' ? 'not_started' : 'completed';

    // 1️⃣ Optimistic UI update for snappy UX
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'not_started' : 'completed' }
        : task
    ));

    // 2️⃣ Persist change to backend
    try {
      const t = tasks.find(x => x.id === taskId);
      taskService.updateTask(taskId, { status: newStatus, project_id: (t as any)?.projectId, title: t?.name });

    } catch (err) {
      console.error('Failed to update project status', err);
      // 3️⃣ Revert UI if the backend rejects the change
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: prevStatus ?? task.status } : task
      ));
    }
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };
  
  // Format date range for display
  const formatDateRange = (dateRange: { from: Date | undefined; to: Date | undefined }) => {
    if (!dateRange.from) {
      return "Custom Range";
    }
    
    const formatDateStr = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    if (!dateRange.to) {
      return `From ${formatDateStr(dateRange.from)}`;
    }
    
    return `${formatDateStr(dateRange.from)} - ${formatDateStr(dateRange.to)}`;
  };
  
  // Handle Created date range selection
  const handleCreatedDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setCreatedDateRange(range);
    if (range.from) {
      setIsCustomCreatedDateRange(true);
      setCreatedDateFilter('custom');
    }
  };
  
  // Reset Created date range
  const resetCreatedDateRange = () => {
    setIsCustomCreatedDateRange(false);
    setCreatedDateRange({ from: undefined, to: undefined });
    setCreatedDateFilter('all');
  };
  
  // Handle Due date range selection
  const handleDueDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDueDateRange(range);
    if (range.from) {
      setIsCustomDueDateRange(true);
      setDueDateFilter('custom');
    }
  };
  
  // Reset Due date range
  const resetDueDateRange = () => {
    setIsCustomDueDateRange(false);
    setDueDateRange({ from: undefined, to: undefined });
    setDueDateFilter('all');
  };

  const clearFilters = () => {
    setFilterStatuses([]);
    setFilterOwner("all");
    setFilterProject("all");
    setFilterPriorities([]);
    setCreatedDateFilter("all");
    setIsCustomCreatedDateRange(false);
    setCreatedDateRange({ from: undefined, to: undefined });
    setDueDateFilter("all");
    setIsCustomDueDateRange(false);
    setDueDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };

  // In the render, show loading/error states
  if (loadingTasks) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const statusOptions = [
    { value: "not_started", label: "Not Started", className: "bg-gray-100 text-gray-800" },
    { value: "in-progress", label: "In Progress", className: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", className: "bg-green-100 text-green-800" },
    { value: "blocked", label: "Blocked", className: "bg-red-100 text-red-800" },
    { value: "on_hold", label: "On Hold", className: "bg-yellow-100 text-yellow-800" },
    { value: "archived", label: "Archived", className: "bg-black text-white" },
  ];
  const priorityOptions = ["critical", "high", "medium", "low", "none"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation
        onNewTask={handleNewTask}
        onNewMeeting={handleNewMeeting}
      />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-6 py-8">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Tasks Catalog</h1>
              <p className="text-gray-600">Manage and track all your tasks in one place</p>
            </div>
            <Button
              onClick={handleNewTask}
              className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Tabs for Tasks / My Tasks */}
        <div className="px-6 pt-4">
          <Tabs value={tab} onValueChange={v => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Tasks</TabsTrigger>
              <TabsTrigger value="mine">My Tasks</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Enhanced Controls */}
        <div className="px-6 py-4 bg-white/30 border-b border-gray-200">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between">
              {/* Search Bar - Left side */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by keyword or ID (e.g. T1234)"
                  className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />

                {/* Status Filter Multi-Select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status {filterStatuses.length > 0 ? `(${filterStatuses.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {statusOptions.map(opt => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={filterStatuses.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setFilterStatuses(prev => checked ? [...prev, opt.value] : prev.filter(s => s !== opt.value));
                        }}
                        className="cursor-pointer"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs ${opt.className}`}>{opt.label}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority Filter Multi-Select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Priority {filterPriorities.length > 0 ? `(${filterPriorities.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {priorityOptions.map(p => (
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

                {/* Project Filter */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Projects</span>
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">{project.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Owner Filter */}
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Owners</span>
                    </SelectItem>
                    {getUniqueOwners().map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">{owner}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Created Date Filter with Calendar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant={createdDateFilter !== 'all' || isCustomCreatedDateRange ? "default" : "outline"} 
                      className={`w-fit ${createdDateFilter !== 'all' || isCustomCreatedDateRange ? "bg-tasksmate-gradient text-white hover:bg-tasksmate-green-end" : ""}`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {isCustomCreatedDateRange 
                        ? `Created: ${formatDateRange(createdDateRange)}` 
                        : 'Created date'}
                      {(createdDateFilter !== 'all' || isCustomCreatedDateRange) && (
                        <Button 
                          variant="ghost" 
                          className="h-6 w-6 p-0 rounded-full ml-1 hover:bg-white/20"
                          onClick={(e) => { e.stopPropagation(); resetCreatedDateRange(); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Created Date Range</h4>
                      </div>
                      <CalendarComponent
                        mode="range"
                        defaultMonth={createdDateRange.from}
                        selected={createdDateRange}
                        onSelect={handleCreatedDateRangeSelect}
                        numberOfMonths={2}
                        className="rounded-md border"
                      />
                      <div className="flex justify-between pt-2">
                        <Button type="button" onClick={resetCreatedDateRange} variant="outline" size="sm">
                          Reset
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => {
                            if (createdDateRange.from) {
                              setIsCustomCreatedDateRange(true);
                              setCreatedDateFilter('custom');
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Due Date Filter with Calendar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant={dueDateFilter !== 'all' || isCustomDueDateRange ? "default" : "outline"} 
                      className={`w-fit ${dueDateFilter !== 'all' || isCustomDueDateRange ? "bg-tasksmate-gradient text-white hover:bg-tasksmate-green-end" : ""}`}
                    >
                      <CalendarRange className="w-4 h-4 mr-2" />
                      {isCustomDueDateRange 
                        ? `Due: ${formatDateRange(dueDateRange)}` 
                        : 'Due date'}
                      {(dueDateFilter !== 'all' || isCustomDueDateRange) && (
                        <Button 
                          variant="ghost" 
                          className="h-6 w-6 p-0 rounded-full ml-1 hover:bg-white/20"
                          onClick={(e) => { e.stopPropagation(); resetDueDateRange(); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Due Date Range</h4>
                      </div>
                      <CalendarComponent
                        mode="range"
                        defaultMonth={dueDateRange.from}
                        selected={dueDateRange}
                        onSelect={handleDueDateRangeSelect}
                        numberOfMonths={2}
                        className="rounded-md border"
                      />
                      <div className="flex justify-between pt-2">
                        <Button type="button" onClick={resetDueDateRange} variant="outline" size="sm">
                          Reset
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => {
                            if (dueDateRange.from) {
                              setIsCustomDueDateRange(true);
                              setDueDateFilter('custom');
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

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
                    <DropdownMenuItem onClick={() => toggleSort('status')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800 mr-2">Status</span>
                      {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('targetDate')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 mr-2">Target Date</span>
                      {sortBy === 'targetDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('createdDate')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 mr-2">Created Date</span>
                      {sortBy === 'createdDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('progress')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800 mr-2">Progress</span>
                      {sortBy === 'progress' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('owner')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-800 mr-2">Owner</span>
                      {sortBy === 'owner' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <div className="flex items-center space-x-2 ml-2">
                  <Button
                    variant={view === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-6 py-2">
          <div className="w-full">
            <p className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
        </div>

        {/* Tasks Display */}
        <div className="px-6 py-6">
          <div className="w-full">
            {view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="glass border-0 shadow-tasksmate micro-lift cursor-pointer group hover:scale-105 transition-all duration-200"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <CardContent className="p-6">
                      {/* Header with checkbox and task ID */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {/* Checkbox styled like TasksMate logo */}
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${task.status === 'completed'
                              ? 'bg-tasksmate-gradient border-transparent'
                              : 'border-gray-300 hover:border-gray-400'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusToggle(task.id);
                            }}
                          >
                            {task.status === 'completed' && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <CopyableIdBadge id={task.id} isCompleted={task.status === 'completed'} />
                          </div>
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                            {(() => {
                              const { displayName } = deriveDisplayFromEmail((task.owner ?? '') as string);
                              return `👤 ${displayName}`;
                            })()}
                          </Badge>
                        </div>

                        {/* Status + Priority badges */}
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {getStatusText(task.status)}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority ?? 'none')}`}>
                            {task.priority?.toUpperCase()}
                          </Badge>
                          {/* Delete icon removed as requested */}
                        </div>
                      </div>

                      {/* Task Info - Fixed height to ensure consistent margin line alignment */}
                      <div className="space-y-3 mb-4" style={{ minHeight: '100px' }}>
                        <div>
                          <h3 className={`font-semibold mb-1 transition-colors ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 hover:text-blue-600'}`}>{task.name}</h3>
                          {/* <p className={`text-sm line-clamp-2 ${task.status==='completed' ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                            {task.description}
                          </p> */}
                          {/* <RichTextEditor
                            content={task.description}
                            className="max-h-[120px]"
                            hideToolbar
                          /> */}
                          {/* Project badge removed from here */}
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="text-gray-600 text-xs mr-1 font-semibold">Tags:</span>
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-800"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                +{task.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}


                      </div>

                      <div className="pb-2">
                        {/* Start Date + Due */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-gray-600 text-xs font-semibold">Start date:</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
                              {formatDate(task.startDate ?? task.createdDate)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-gray-600 text-xs font-semibold">Due date:</span>
                            <Badge variant="secondary" className="bg-rose-100 text-rose-800 text-xs whitespace-nowrap">
                              {task.targetDate ? formatDate(task.targetDate) : '—'}
                            </Badge>
                          </div>
                        </div>
                      </div>


                      {/* Footer with metadata and comments */}
                      <div className="pt-4 border-t border-gray-200">
                        {/* Single row with metadata and comments */}
                        <div className="flex items-center justify-between">
                          {/* Metadata as colored tags */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="text-gray-600 text-xs font-semibold">Project:</span>
                              <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                                {projects.find(p => p.id === (task as any).projectId)?.name ?? "—"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="text-gray-600 text-xs font-semibold">Created:</span>
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                                {formatDate(task.createdDate)}
                              </Badge>
                            </div>
                          </div>

                          {/* Comments */}
                          <div className="flex items-center space-x-1 text-gray-500">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">{task.comments}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <TaskListView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onTaskStatusToggle={handleTaskStatusToggle}
                projectMap={Object.fromEntries(projects.map(p => [p.id, p.name]))}
                canDeleteTask={canDeleteTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <Grid3X3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tasks found</p>
                <p className="text-gray-400 mb-4">
                  {searchQuery || filterStatuses.length>0 || filterOwner !== "all" || createdDateFilter !== "all" || dueDateFilter !== "all"
                    ? "Try adjusting your filters or search query"
                    : "Create your first task to get started"
                  }
                </p>
                <div className="flex items-center justify-center gap-3">
                  {/* <Button 
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button> */}
                  <Button
                    className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                    onClick={handleNewTask}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Task Modal */}
        <NewTaskModal
          open={isNewTaskModalOpen}
          onOpenChange={setIsNewTaskModalOpen}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </div>
  );
};

export default TasksCatalog;
