
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Calendar, User } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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

interface AddSubtaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubtaskAdded: (task: Task) => void;
}

const AddSubtaskModal = ({ open, onOpenChange, onSubtaskAdded }: AddSubtaskModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  // Mock tasks data - in real app this would come from API or localStorage
  const mockTasks: Task[] = [
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
    },
    {
      id: "T1238",
      name: "Create mobile responsive design",
      description: "Optimize UI for mobile devices",
      status: "todo",
      owner: "SK",
      targetDate: "Dec 22",
      comments: 2,
      progress: 0,
      tags: ["mobile", "responsive", "ui"],
      createdBy: "SK",
      createdDate: "Dec 9"
    }
  ];

  useEffect(() => {
    // Load tasks from localStorage if available, otherwise use mock data
    const storedTasks = localStorage.getItem('duplicatedTasks');
    const duplicatedTasks = storedTasks ? JSON.parse(storedTasks) : [];
    setAvailableTasks([...mockTasks, ...duplicatedTasks]);
  }, []);

  const filteredTasks = availableTasks.filter(task => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      task.id.toLowerCase().includes(query) ||
      task.name.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });

  const handleTaskSelect = (task: Task) => {
    onSubtaskAdded(task);
    onOpenChange(false);
    setSearchQuery("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'blocked': return 'Blocked';
      case 'todo': return 'To Do';
      default: return 'Unknown';
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Add Subtask</DialogTitle>
          <DialogDescription className="text-gray-600">
            Search and select an existing task to add as a subtask.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by task ID, name, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No tasks found matching your search" : "No tasks available"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTaskSelect(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {task.id}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{task.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
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

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{task.owner}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{task.targetDate}</span>
                    </div>
                    <span>{task.progress}% complete</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubtaskModal;
