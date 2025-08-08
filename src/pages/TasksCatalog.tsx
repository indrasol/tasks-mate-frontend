import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CalendarRange
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { deriveDisplayFromEmail, formatDate } from "@/lib/projectUtils";
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
} from '@/components/ui/dropdown-menu';
import TaskListView from "@/components/tasks/TaskListView";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import MainNavigation from "@/components/navigation/MainNavigation";
import { taskService } from "@/services/taskService";
import { BackendTask, Task } from "@/types/tasks";


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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: organizations } = useOrganizations();
  const currentOrgId = useCurrentOrgId() ?? organizations?.[0]?.id;
  const { data: orgMembers } = useOrganizationMembers(currentOrgId);

  useEffect(() => {
    setLoadingTasks(true);
    setError(null);
    taskService.getTasks()
      .then((data: BackendTask[]) => {
        // Map backend data to frontend Task type
        const mapped = (data || []).map((t: any) => ({
          id: t.task_id,
          name: t.title,
          description: t.description,
          // Normalize API statuses for UI expectations
          status: (t.status || "not_started")
            .replace("in_progress", "in-progress")
            .replace("not_started", "todo"),
          owner: t.assignee, // Backend returns 'assignee'
          startDate: t.start_date,
          targetDate: t.due_date,
          comments: t.comments ?? 0,
          progress: t.progress ?? 0,
          priority: t.priority,
          tags: t.tags,
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
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  // Mock project context
  const currentProject = 'TasksMate Web';

  // Enhanced date filtering logic
  const isDateInRange = (taskDate: string, filter: string) => {
    const date = new Date(taskDate);
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
        return date < now && tasks.find(t => t.targetDate === taskDate)?.status !== 'completed';
      default:
        return true;
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

  // Enhanced filter and search logic
  const filteredTasks = useMemo(() => {
    return sortTasks(tasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      // Status filter
      const matchesStatus = filterStatus === "all" || task.status === filterStatus;

      // Owner filter
      const matchesOwner = filterOwner === "all" || task.owner === filterOwner;

      // Date filter
      const matchesDate = dateFilter === "all" || isDateInRange(task.targetDate, dateFilter);

      return matchesSearch && matchesStatus && matchesOwner && matchesDate;
    }));
  }, [tasks, searchQuery, filterStatus, filterOwner, dateFilter, sortBy, sortDirection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "blocked": return "bg-red-500";
      case "todo": return "bg-gray-400";
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
        ? { ...task, status: task.status === 'completed' ? 'todo' : 'completed' }
        : task
    ));

    // 2️⃣ Persist change to backend
    try {

      taskService.updateTask(taskId, { status: newStatus });

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

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterOwner("all");
    setDateFilter("all");
    setSearchQuery("");
  };

  // In the render, show loading/error states
  if (loadingTasks) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

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

                {/* Status Filter Dropdown */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Status</span>
                    </SelectItem>
                    <SelectItem value="todo">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">To Do</span>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">In Progress</span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Blocked</span>
                    </SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                          <Badge className={`text-xs font-mono bg-green-600 text-white ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                            {task.id}
                          </Badge>
                        </div>

                        {/* Status tag positioned at the right */}
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
                        <Badge className="text-xs font-mono bg-green-600 text-white">
                          {task.priority}
                        </Badge>
                      </div>

                      {/* Task Info - Fixed height to ensure consistent margin line alignment */}
                      <div className="space-y-3 mb-4" style={{ minHeight: '120px' }}>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">{task.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
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
                        {/* Start Date */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                            {`🟢Start date: ${formatDate(task.startDate ?? task.createdDate)}`}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                            🎯 {task.targetDate || '—'}
                          </Badge>
                        </div>
                      </div>


                      {/* Footer with metadata and comments */}
                      <div className="pt-4 border-t border-gray-200">
                        {/* Single row with metadata and comments */}
                        <div className="flex items-center justify-between">
                          {/* Metadata as colored tags */}
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                              {(() => {
                                const m = (orgMembers || []).find((x: any) => x.user_id === task.owner);
                                const nameSource = (task.owner ?? "") as string;
                                if (!nameSource) return "👤 —";
                                const { displayName } = deriveDisplayFromEmail(nameSource);
                                return `👤 ${displayName}`;
                              })()}
                            </Badge>

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
              />
            )}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <Grid3X3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tasks found</p>
                <p className="text-gray-400 mb-4">
                  {searchQuery || filterStatus !== "all" || filterOwner !== "all" || dateFilter !== "all"
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
