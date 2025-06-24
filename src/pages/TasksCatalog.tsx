
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Check, Search, Plus, MoreVertical, MessageSquare, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import TaskFilters from "@/components/tasks/TaskFilters";
import ViewToggle from "@/components/tasks/ViewToggle";
import TaskListView from "@/components/tasks/TaskListView";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import MainNavigation from "@/components/navigation/MainNavigation";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  targetDate: string;
  comments: number;
  progress: number;
  tags?: string[];
  createdBy?: string;
  createdDate?: string;
}

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
  // State management - now all hooks are called consistently
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Tasks state - now includes dynamic task creation
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "T1234",
      name: "Implement user authentication",
      description: "Set up Supabase auth with email/password login",
      status: "in-progress",
      owner: "JD",
      targetDate: "Dec 15",
      comments: 3,
      progress: 60,
      tags: ["authentication", "backend", "supabase"],
      createdBy: "JD",
      createdDate: "Dec 8"
    },
    {
      id: "T1235", 
      name: "Design task cards",
      description: "Create responsive task card components with glassmorphism",
      status: "completed",
      owner: "SK",
      targetDate: "Dec 10",
      comments: 7,
      progress: 100,
      tags: ["ui", "design", "frontend"],
      createdBy: "SK",
      createdDate: "Dec 5"
    },
    {
      id: "T1236",
      name: "Set up CI/CD pipeline",
      description: "Configure automated testing and deployment",
      status: "todo",
      owner: "MR",
      targetDate: "Dec 20",
      comments: 1,
      progress: 0,
      tags: ["devops", "automation"],
      createdBy: "MR",
      createdDate: "Dec 7"
    },
    {
      id: "T1237",
      name: "Add real-time notifications",
      description: "Implement Supabase realtime for task updates",
      status: "blocked",
      owner: "AM",
      targetDate: "Dec 18",
      comments: 5,
      progress: 25,
      tags: ["realtime", "notifications", "backend"],
      createdBy: "AM",
      createdDate: "Dec 6"
    }
  ]);

  // Listen for new task creation events
  useEffect(() => {
    const handleTaskCreated = (event: CustomEvent) => {
      const newTask = event.detail;
      console.log("New task created:", newTask);
      setTasks(prev => [newTask, ...prev]);
    };

    window.addEventListener('taskCreated', handleTaskCreated as EventListener);
    
    return () => {
      window.removeEventListener('taskCreated', handleTaskCreated as EventListener);
    };
  }, []);

  // Filter and search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(task.status);

      // Owner filter
      const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(task.owner);

      // Date filter (simplified for demo)
      const matchesDate = selectedDateRange === null; // For now, showing all tasks

      return matchesSearch && matchesStatus && matchesOwner && matchesDate;
    });
  }, [tasks, searchQuery, selectedStatuses, selectedOwners, selectedDateRange]);

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
    switch (status) {
      case "completed": return "Completed";
      case "in-progress": return "In Progress";
      case "blocked": return "Blocked";
      case "todo": return "To Do";
      default: return "Unknown";
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleNewTask = () => {
    setIsNewTaskModalOpen(true);
  };

  const handleNewMeeting = () => {
    // Placeholder for future meeting creation
    console.log("New meeting clicked");
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  // Filter handlers
  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleOwnerToggle = (owner: string) => {
    setSelectedOwners(prev => 
      prev.includes(owner) 
        ? prev.filter(o => o !== owner)
        : [...prev, owner]
    );
  };

  const handleDateRangeChange = (range: string | null) => {
    setSelectedDateRange(range);
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSelectedOwners([]);
    setSelectedDateRange(null);
    setSearchQuery("");
  };

  const handleTaskStatusToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'todo' : 'completed' }
        : task
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <MainNavigation 
        onNewTask={handleNewTask}
        onNewMeeting={handleNewMeeting}
      />

      {/* Main Content - adjusted for left sidebar */}
      <div className="ml-64 transition-all duration-300">
        {/* Page Header */}
        <div className="px-6 py-6 bg-white/50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
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

        {/* Secondary Controls */}
        <div className="px-6 py-4 bg-white/30 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ViewToggle view={view} onViewChange={setView} />
              
              <TaskFilters
                selectedStatuses={selectedStatuses}
                selectedOwners={selectedOwners}
                selectedDateRange={selectedDateRange}
                onStatusToggle={handleStatusToggle}
                onOwnerToggle={handleOwnerToggle}
                onDateRangeChange={handleDateRangeChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by keyword or ID (e.g. T1234)" 
                className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
        </div>

        {/* Tasks Display */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
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
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                              task.status === 'completed' 
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
                          <Badge variant="secondary" className="text-xs font-mono">
                            {task.id}
                          </Badge>
                        </div>
                        
                        {/* Status tag positioned at the right */}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusText(task.status)}
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

                      {/* Footer with metadata and comments */}
                      <div className="pt-4 border-t border-gray-200">
                        {/* Single row with metadata and comments */}
                        <div className="flex items-center justify-between">
                          {/* Metadata as colored tags */}
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                              👤 {task.createdBy || task.owner}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                              📅 {task.createdDate || 'N/A'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                              🎯 {task.targetDate}
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
                <p className="text-gray-500 text-lg">No tasks found matching your criteria</p>
                <Button 
                  className="mt-4 bg-tasksmate-gradient hover:scale-105 transition-transform"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
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
