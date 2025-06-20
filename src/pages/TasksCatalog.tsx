
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Check, Search, Plus, Filter, Grid3X3, List, MoreVertical, MessageSquare, Calendar, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const TasksCatalog = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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

  // Mock data for demonstration
  const tasks = [
    {
      id: "T1234",
      name: "Implement user authentication",
      description: "Set up Supabase auth with email/password login",
      status: "in-progress",
      owner: "JD",
      targetDate: "Dec 15",
      comments: 3,
      progress: 60
    },
    {
      id: "T1235", 
      name: "Design task cards",
      description: "Create responsive task card components with glassmorphism",
      status: "completed",
      owner: "SK",
      targetDate: "Dec 10",
      comments: 7,
      progress: 100
    },
    {
      id: "T1236",
      name: "Set up CI/CD pipeline",
      description: "Configure automated testing and deployment",
      status: "todo",
      owner: "MR",
      targetDate: "Dec 20",
      comments: 1,
      progress: 0
    },
    {
      id: "T1237",
      name: "Add real-time notifications",
      description: "Implement Supabase realtime for task updates",
      status: "blocked",
      owner: "AM",
      targetDate: "Dec 18",
      comments: 5,
      progress: 25
    }
  ];

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
    console.log("Creating new task...");
    // TODO: Implement new task creation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span className="font-sora font-bold text-xl">TasksMate</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="font-sora font-semibold text-lg text-gray-700">Tasks Catalog</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-tasksmate-gradient hover:scale-105 transition-transform"
              onClick={handleNewTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Avatar className="cursor-pointer">
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Secondary Controls */}
      <div className="px-6 py-4 bg-white/50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Owner
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date
              </Button>
            </div>
          </div>
          
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by keyword or ID (e.g. T1234)" 
              className="pl-10 bg-white/80"
            />
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className="glass border-0 shadow-tasksmate micro-lift cursor-pointer group hover:scale-105 transition-all duration-200"
                onClick={() => handleTaskClick(task.id)}
              >
                <CardContent className="p-6">
                  {/* Header with status ribbon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                      <Badge variant="secondary" className="text-xs font-mono">
                        {task.id}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("More options for", task.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Task Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">{task.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {/* AI Summary Badge */}
                    <div className="flex justify-center">
                      <Badge className="bg-tasksmate-gradient text-white border-0 text-xs">
                        ✨ AI Summary
                      </Badge>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">{task.owner}</AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className="text-xs">
                        {task.targetDate}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">{task.comments}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksCatalog;
