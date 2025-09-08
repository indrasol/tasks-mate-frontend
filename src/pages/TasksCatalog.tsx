import { API_ENDPOINTS } from "@/config";
import MainNavigation from "@/components/navigation/MainNavigation";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import TaskListView from "@/components/tasks/TaskListView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import CopyableIdBadge from "@/components/ui/copyable-id-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useOrganizations } from "@/hooks/useOrganizations";
import { capitalizeFirstLetter, deriveDisplayFromEmail, formatDate, getPriorityColor, getStatusMeta } from "@/lib/projectUtils";
import { api } from "@/services/apiService";
import { taskService } from "@/services/taskService";
import { BackendTask, Task } from "@/types/tasks";
import {
  Calendar,
  CalendarRange,
  Check,
  Filter,
  Grid3X3,
  List,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


type ViewMode = 'table';
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
  // State for task detail dialog
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isTruncated, setIsTruncated] = useState<Record<string, boolean>>({});

  // State management - enhanced with new filter and sort options
  const [view, setView] = useState<ViewMode>("table");
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

  const [isCreatedDatePopoverOpen, setIsCreatedDatePopoverOpen] = useState(false);
  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);

  const [tempCreatedDateRange, setTempCreatedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [tempDueDateRange, setTempDueDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // check for project_id query param and filter the test runs
  const { projectId } = useParams();
  useEffect(() => {
    if (projectId) {
      setFilterProject(projectId);
    }
  }, [projectId]);


  // Build possible identifiers for current user (id, username, email, displayName)
  const userIdentifiers = useMemo(() => {
    if (!user) return [] as string[];
    const ids: string[] = [];
    if (user.id) ids.push(String(user.id));
    if ((user as any).username) ids.push(String((user as any).username));
    if ((user as any)?.user_metadata?.username) ids.push(String((user as any).user_metadata.username));
    if (user.email) ids.push(String(user.email));
    if (user.email) {
      ids.push(deriveDisplayFromEmail(user.email).displayName);
    }
    return ids.map((x) => x.toLowerCase());
  }, [user]);

  // Fetch projects for current org to map project names
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
  useEffect(() => {
    fetchProjects();
  }, [currentOrgId]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
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
          // is_editable: userIdentifiers.includes(t.created_by) || userIdentifiers.includes(t.assignee)
          is_editable: true

        }));
        setTasks(mapped);
        setLoadingTasks(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tasks");
        setLoadingTasks(false);
      });
  };

  useEffect(() => {
    fetchTasks();
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
    // Parse the task date, handling both ISO strings and other formats
    let date: Date;
    try {
      date = new Date(taskDate);
    } catch (e) {
      console.error("Failed to parse date", e);
      return true; // Invalid date
    }
    if (isNaN(date.getTime())) return true; // Invalid date

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If we're in custom date range mode and have a valid range
    if (filter === 'custom' && customRange?.from) {
      // Normalize times to start of day for comparison
      const from = new Date(customRange.from);
      from.setHours(0, 0, 0, 0);

      const taskDateStart = new Date(date);
      taskDateStart.setHours(0, 0, 0, 0);

      // If only "from" date is set
      if (!customRange.to) {
        return taskDateStart >= from;
      }

      // If both dates are set
      const to = new Date(customRange.to);
      to.setHours(23, 59, 59, 999);
      return taskDateStart >= from && taskDateStart <= to;
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
        const statusOrder: Record<string, number> = {
          'in-progress': 4,
          'inprogress': 4,
          'in_progress': 4,
          'todo': 3,
          'blocked': 2,
          'completed': 1,
          'complete': 1,
          'done': 1
        };

        const getStatusOrder = (status: string): number => {
          if (!status) return 0;
          const normalizedStatus = status.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return statusOrder[normalizedStatus] || 0;
        };

        aValue = getStatusOrder(a.status);
        bValue = getStatusOrder(b.status);
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
      toast({
        title: "Deleting task",
        description: "Please wait...",
      });
      await taskService.deleteTask(taskId);
      toast({
        title: "Success",
        description: "Task deleted successfully",
        variant: "default"
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('Failed to delete task', e);
      toast({
        title: "Failed to delete task",
        description: "Please try again later",
        variant: "destructive"
      });
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
          (isCustomCreatedDateRange && createdDateRange?.from) ?
          // For custom date range, check created date
          isDateInRange(task.createdDate, 'custom', createdDateRange) :
          // For preset filters, check created date
          isDateInRange(task.createdDate, createdDateFilter);

      // Due date filter - Check targetDate
      const matchesDueDate =
        dueDateFilter === "all" ||
          (isCustomDueDateRange && dueDateRange?.from) ?
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
    if(projects?.length == 0){
      fetchProjects();
    }
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
      toast({
        title: "Updating task status",
        description: "Please wait...",
      });
      taskService.updateTask(taskId, { status: newStatus, project_id: (t as any)?.projectId, title: t?.name });
      toast({
        title: "Success",
        description: "Task status updated successfully",
        variant: "default"
      });
    } catch (err) {
      console.error('Failed to update project status', err);
      // 3️⃣ Revert UI if the backend rejects the change
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: prevStatus ?? task.status } : task
      ));
      toast({
        title: "Failed to update task status",
        description: "Please try again later",
        variant: "destructive"
      });
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

  // Replace the existing handleCreatedDateRangeSelect
  const handleCreatedDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setTempCreatedDateRange(range);
  };

  // Replace the existing handleDueDateRangeSelect
  const handleDueDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setTempDueDateRange(range);
  };

  // Add these new handlers for the Apply buttons
  const handleApplyCreatedDateRange = () => {
    setCreatedDateRange(tempCreatedDateRange);
    if (tempCreatedDateRange.from) {
      setIsCustomCreatedDateRange(true);
      setCreatedDateFilter('custom');
    }
    setIsCreatedDatePopoverOpen(false);
  };

  const handleApplyDueDateRange = () => {
    setDueDateRange(tempDueDateRange);
    if (tempDueDateRange.from) {
      setIsCustomDueDateRange(true);
      setDueDateFilter('custom');
    }
    setIsDueDatePopoverOpen(false);
  };

  const resetCreatedDateRange = () => {
    setIsCustomCreatedDateRange(false);
    setCreatedDateRange({ from: undefined, to: undefined });
    setTempCreatedDateRange({ from: undefined, to: undefined });
    setCreatedDateFilter('all');
    setIsCreatedDatePopoverOpen(false);
  };

  const resetDueDateRange = () => {
    setIsCustomDueDateRange(false);
    setDueDateRange({ from: undefined, to: undefined });
    setTempDueDateRange({ from: undefined, to: undefined });
    setDueDateFilter('all');
    setIsDueDatePopoverOpen(false);
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
  // if (loadingTasks) {
  //   return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div></div>;
  // }
  // if (error) {
  //   return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  // }

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

        {/* Tabs for Tasks / My Tasks with Search bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Tabs value={tab} onValueChange={v => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Tasks</TabsTrigger>
                <TabsTrigger value="mine">My Tasks</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* placeholder to keep flex spacing */}
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="px-6 py-4 bg-white/30 border-b border-gray-200">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between w-full">
              {/* Search bar moved above */}

              <div className="relative w-full max-w-md mr-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by keyword or ID (e.g. T1234)"
                  className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search + Filters and Controls */}
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
                <Popover open={isCreatedDatePopoverOpen} onOpenChange={setIsCreatedDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={createdDateFilter !== 'all' || isCustomCreatedDateRange ? "default" : "outline"}
                      className="px-3 py-2 flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Created</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="center"
                    onInteractOutside={(e) => {
                      // Prevent closing when clicking the calendar
                      if ((e.target as HTMLElement).closest('.rdp')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Created Date Range</h4>
                      </div>
                      <CalendarComponent
                        mode="range"
                        defaultMonth={tempCreatedDateRange.from}
                        selected={tempCreatedDateRange}
                        onSelect={handleCreatedDateRangeSelect}
                        numberOfMonths={2}
                        className="rounded-md border"
                      />
                      <div className="flex justify-between pt-2">
                        <Button type="button" onClick={() => {
                          resetCreatedDateRange();
                          setTempCreatedDateRange({ from: undefined, to: undefined });

                        }} variant="outline" size="sm">
                          Reset
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyCreatedDateRange}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Due Date Filter with Calendar */}
                <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dueDateFilter !== 'all' || isCustomDueDateRange ? "default" : "outline"}
                      className="px-3 py-2 flex items-center gap-1"
                    >
                      <CalendarRange className="w-4 h-4" />
                      <span className="text-xs">Due</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="center"
                    onInteractOutside={(e) => {
                      // Prevent closing when clicking the calendar
                      if ((e.target as HTMLElement).closest('.rdp')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Due Date Range</h4>
                      </div>
                      <CalendarComponent
                        mode="range"
                        defaultMonth={tempDueDateRange.from}
                        selected={tempDueDateRange}
                        onSelect={handleDueDateRangeSelect}
                        numberOfMonths={2}
                        className="rounded-md border"
                      />
                      <div className="flex justify-between pt-2">
                        <Button type="button" onClick={() => {
                          resetDueDateRange();
                          setTempDueDateRange({ from: undefined, to: undefined });
                          // setIsDueDatePopoverOpen(false);
                        }} variant="outline" size="sm">
                          Reset
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyDueDateRange}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort Options + View Toggle */}
                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="p-2">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
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
                </div>

                {/* View Toggle removed as we only have table view now */}
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
            {/* Loading state */}
            {
              error ?
                (
                  <div className="text-center py-16 bg-white rounded-lg border">
                    <p className="text-red-500">Error loading tasks <br></br> {error}</p>
                    <Button
                      className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                      onClick={fetchTasks}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try again
                    </Button>
                  </div>
                )
                :
                (loadingTasks ? (
                  <div className="text-center py-16 bg-white rounded-lg border">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading tasks...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Grid3X3 className="w-12 h-12 text-green-600" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No tasks found</p>
                    <p className="text-gray-400 mb-4">
                      {searchQuery || filterStatuses.length > 0 || filterOwner !== "all" || createdDateFilter !== "all" || dueDateFilter !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Create your first task to get started"
                      }
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                        onClick={handleNewTask}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border shadow-tasksmate">
                    <Table className="table-fixed">
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-12 text-center"></TableHead>
                          <TableHead className="w-28 text-center font-bold">ID</TableHead>
                          <TableHead className="w-80 font-bold">Title</TableHead>
                          <TableHead className="w-32 text-center font-bold">Status</TableHead>
                          <TableHead className="w-28 text-center font-bold">Priority</TableHead>
                          <TableHead className="w-40 text-center font-bold">Assigned To</TableHead>
                          <TableHead className="w-36 text-center font-bold">Start Date</TableHead>
                          <TableHead className="w-36 text-center font-bold">Due Date</TableHead>
                          <TableHead className="w-36 text-center font-bold">Project</TableHead>
                          <TableHead className="w-40 text-center font-bold">Tags</TableHead>
                          <TableHead className="w-24 text-center font-bold">Created By</TableHead>
                          <TableHead className="w-24 text-center font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => (
                          <TableRow
                            key={task.id}
                            className={`hover:bg-slate-50/60 transition-colors ${task.status === 'completed' ? 'bg-gray-50/60' : ''}`}
                          >
                            <TableCell className="p-2 text-center">
                              <div
                                className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${task.status === 'completed'
                                  ? 'bg-tasksmate-gradient border-transparent'
                                  : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!task.is_editable) return;
                                  handleTaskStatusToggle(task.id);
                                }}
                              >
                                {task.status === 'completed' && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
                                <CopyableIdBadge id={task.id} org_id={currentOrgId} isCompleted={task.status === 'completed'} />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium w-80">
                              <div className="flex items-center">
                                <div
                                  className={`truncate max-w-[260px] ${task.status === 'completed' ? 'line-through text-gray-400' : 'hover:underline cursor-pointer'}`}
                                  ref={(el) => {
                                    if (el) {
                                      // Check if text is truncated
                                      const isTrunc = el.scrollWidth > el.clientWidth;
                                      if (isTruncated[task.id] !== isTrunc) {
                                        setIsTruncated(prev => ({ ...prev, [task.id]: isTrunc }));
                                      }
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskClick(task.id);
                                  }}
                                >
                                  {task.name}
                                </div>
                                {isTruncated[task.id] && (
                                  <Button
                                    variant="ghost"
                                    className="ml-1 p-0 h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task);
                                      setIsDialogOpen(true);
                                    }}
                                  >
                                    <Maximize2 className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => {
                                    // Optimistic update
                                    setTasks(prev =>
                                      prev.map(t => t.id === task.id ? { ...t, status: value } : t)
                                    );
                                    toast({
                                      title: "Updating task status",
                                      description: "Please wait...",
                                    });
                                    // API update
                                    taskService.updateTask(task.id, {
                                      status: value,
                                      project_id: task.projectId,
                                      title: task.name
                                    }).then(() => {
                                      toast({
                                        title: "Success",
                                        description: "Task status updated successfully",
                                        variant: "default"
                                      });
                                    })
                                      .catch(error => {
                                        console.error('Failed to update status:', error);
                                        // Revert on error
                                        setTasks(prev =>
                                          prev.map(t => t.id === task.id ? { ...t, status: task.status } : t)
                                        );
                                        toast({
                                          title: "Error",
                                          description: "Failed to update status",
                                          variant: "destructive"
                                        });
                                      });
                                  }}
                                >
                                  <SelectTrigger
                                    className={`h-8 px-2 py-0 w-fit min-w-[7rem] border-0 ${(() => {
                                      const s = task.status.replace('in_progress', 'in-progress');
                                      if (s === 'completed') return 'bg-green-100 text-green-800';
                                      if (s === 'in-progress') return 'bg-blue-100 text-blue-800';
                                      if (s === 'blocked') return 'bg-red-100 text-red-800';
                                      if (s === 'on_hold') return 'bg-yellow-100 text-yellow-800';
                                      if (s === 'archived') return 'bg-black text-white';
                                      return 'bg-gray-100 text-gray-800';
                                    })()}`}
                                  >
                                    <SelectValue>{getStatusText(task.status)}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      { value: 'not_started', label: 'Not Started', cls: 'bg-gray-100 text-gray-800' },
                                      { value: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-800' },
                                      { value: 'completed', label: 'Completed', cls: 'bg-green-100 text-green-800' },
                                      { value: 'blocked', label: 'Blocked', cls: 'bg-red-100 text-red-800' },
                                      { value: 'on_hold', label: 'On Hold', cls: 'bg-yellow-100 text-yellow-800' },
                                      { value: 'archived', label: 'Archived', cls: 'bg-black text-white' },
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
                                  value={task.priority ?? 'none'}
                                  onValueChange={(value) => {
                                    // Optimistic update
                                    setTasks(prev =>
                                      prev.map(t => t.id === task.id ? { ...t, priority: value } : t)
                                    );
                                    toast({
                                      title: "Updating task priority",
                                      description: "Please wait...",
                                    });
                                    // API update
                                    taskService.updateTask(task.id, {
                                      priority: value,
                                      project_id: task.projectId,
                                      title: task.name
                                    }).then(() => {
                                      toast({
                                        title: "Success",
                                        description: "Task priority updated successfully",
                                        variant: "default"
                                      });
                                    })
                                      .catch(error => {
                                        console.error('Failed to update priority:', error);
                                        // Revert on error
                                        setTasks(prev =>
                                          prev.map(t => t.id === task.id ? { ...t, priority: task.priority } : t)
                                        );
                                        toast({
                                          title: "Error",
                                          description: "Failed to update priority",
                                          variant: "destructive"
                                        });
                                      });
                                  }}
                                >
                                  <SelectTrigger className={`h-8 px-2 py-0 w-fit min-w-[5rem] border-0 ${getPriorityColor(task.priority ?? 'none')}`}>
                                    <SelectValue>{(task.priority ?? 'NONE').toUpperCase()}</SelectValue>
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

                                <Select value={task.owner} onValueChange={(value) => {
                                  // Optimistic update
                                  setTasks(prev =>
                                    prev.map(t => t.id === task.id ? { ...t, owner: value } : t)
                                  );
                                  toast({
                                    title: "Updating task owner",
                                    description: "Please wait...",
                                  });
                                  // API update
                                  taskService.updateTask(task.id, {
                                    assignee: value,
                                    project_id: task.projectId,
                                    title: task.name
                                  })
                                    .then(() => {
                                      toast({
                                        title: "Success",
                                        description: "Task owner updated successfully",
                                        variant: "default"
                                      });
                                    })
                                    .catch(error => {
                                      console.error('Failed to update owner:', error);
                                      // Revert on error
                                      setTasks(prev =>
                                        prev.map(t => t.id === task.id ? { ...t, owner: task.owner } : t)
                                      );
                                      toast({
                                        title: "Error",
                                        description: "Failed to update owner",
                                        variant: "destructive"
                                      });
                                    });
                                }}>
                                  <SelectTrigger className="h-8 px-2 py-0 w-fit min-w-[5rem] border-0">
                                    <SelectValue placeholder="Select owner" >
                                      {(() => {
                                        const { displayName } = deriveDisplayFromEmail((task.owner ?? '') as string);
                                        return `👤 ${displayName}`;
                                      })()}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="w-fit min-w-[5rem]">

                                    {orgMembers?.map((m) => {
                                      const username = ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id;
                                      const { displayName } = deriveDisplayFromEmail(username);
                                      return (
                                        <SelectItem key={m.user_id} value={String(username)}>
                                          {displayName} {m.designation ? `(${capitalizeFirstLetter(m.designation)})` : ""}
                                        </SelectItem>
                                      );
                                    })}

                                  </SelectContent>
                                </Select>

                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  {task.startDate ? formatDate(task.startDate) : formatDate(task.createdDate)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                                  {task.targetDate ? formatDate(task.targetDate) : '—'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                                  {projects.find(p => p.id === (task as any).projectId)?.name ?? "—"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {task.tags && task.tags.length > 0 ? (
                                  task.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                      {tag}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                                {task.tags && task.tags.length > 3 && (
                                  <Badge key='tags' variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    +{task.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                {orgMembers?.filter((m: any, index: number) => (((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id) === task.createdBy)?.map((m, index) => {
                                  const username = (((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id);
                                  const { displayName } = deriveDisplayFromEmail(username);
                                  return (
                                    <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                      {displayName}
                                    </Badge>
                                  );
                                })}

                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTaskClick(task.id)}
                                className="text-xs"
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
                )}

            {/* Error state */}
            {error && (
              <div className="text-center py-16 bg-white rounded-lg border">
                <p className="text-red-500">Error loading tasks <br></br> {error}</p>
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

        {/* Task Detail Dialog - Simplified */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedTask?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    if (selectedTask) handleTaskClick(selectedTask.id);
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TasksCatalog;
