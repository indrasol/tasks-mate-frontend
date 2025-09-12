
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
import { Search, Calendar, User, Check } from "lucide-react";
import { deriveDisplayFromEmail, formatDate, getPriorityColor } from "@/lib/projectUtils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { taskService } from "@/services/taskService";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import NewTaskModal from "@/components/tasks/NewTaskModal";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  priority?: string;
  startDate?: string;
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
  excludeIds?: string[];
  projectId?: string; // Optional project ID to filter tasks by project
  taskId?: string; // Optional task ID to filter out current task
  owner?: string; // Optional owner to set as default for new subtasks
}

const AddSubtaskModal = ({ open, onOpenChange, onSubtaskAdded, excludeIds = [], projectId, taskId, owner }: AddSubtaskModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateNewOpen, setIsCreateNewOpen] = useState(false);

  // Get org context so we only pull tasks in the same org
  const currentOrgId = useCurrentOrgId();

  useEffect(() => {
    if (!open) return; // only fetch when modal opens
    setLoading(true);
    setError(null);

    let params: any = {};

    if (currentOrgId) {
      params.org_id = currentOrgId;
    }

    if (projectId) {
      params.project_id = projectId;
    }

    // Set limit to 100 (backend maximum) to show more than the default 20 tasks
    // params.limit = 100;
    taskService.getTasks(params)
      .then((data) => {
        const mapped = ((data as any[]) || []).map((t: any) => ({
          id: t.task_id,
          name: t.title,
          description: t.description,
          status: (t.status || "not_started").replace("in_progress", "in-progress"),
          owner: t.assignee,
          priority: t.priority,
          startDate: t.start_date ?? t.created_at,
          targetDate: t.due_date,
          comments: 0,
          progress: 0,
          tags: t.tags,
          createdBy: t.created_by,
          createdDate: t.created_at,
        }));
        // Exclude tasks specified (such as current task and its existing subtasks)
        const filtered = mapped.filter((t) => !excludeIds.includes(t.id))?.filter((t) => t.status !== "archived" && t.status !== "deleted" && t.status !== "completed");
        setAvailableTasks(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tasks");
        setLoading(false);
      });
  }, [open, currentOrgId, excludeIds]);

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

  const handleNewTaskCreated = (newTask: any) => {
    // Map from NewTaskModal's Task shape to this modal's Task interface
    const mapped: Task = {
      id: newTask.id,
      name: newTask.name,
      description: newTask.description ?? "",
      status: (newTask.status || "not_started").replace("in_progress", "in-progress"),
      owner: newTask.owner,
      priority: newTask.priority,
      startDate: newTask.createdDate,
      targetDate: newTask.targetDate,
      comments: newTask.comments ?? 0,
      progress: newTask.progress ?? 0,
      tags: newTask.tags ?? [],
      createdBy: newTask.createdBy,
      createdDate: newTask.createdDate,
    } as Task;
    onSubtaskAdded(mapped);
    setIsCreateNewOpen(false);
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
    const normalized = status.replace("in_progress", "in-progress");
    switch (normalized) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'blocked': return 'Blocked';
      case 'not_started': return 'Not Started';
      case 'on_hold': return 'On Hold';
      case 'archived': return 'Archived';
      default: return 'Unknown';
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  if (!open) return null;

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
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading tasks...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredTasks.length === 0 ? (
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
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === 'completed'
                            ? 'bg-tasksmate-gradient border-transparent'
                            : 'border-gray-300'
                          }`}
                      >
                        {task.status === 'completed' && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Badge className="text-xs font-mono bg-green-600 text-white">
                        {task.id}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                        {(() => {
                          const { displayName } = deriveDisplayFromEmail((task.owner ?? '') as string);
                          return `👤 ${displayName}`;
                        })()}
                      </Badge>
                      <Badge className={`text-xs ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                              task.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'archived' ? 'bg-black text-white' :
                                  'bg-gray-100 text-gray-800'
                        } hover:bg-transparent hover:text-inherit`}>
                        {getStatusText(task.status)}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority ?? 'none')}`}>{(task.priority ?? 'none').toUpperCase()}</Badge>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{task.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      <span className="text-gray-600 text-xs mr-1">Tags:</span>
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
                  <div className="flex flex-wrap items-center gap-1 text-xs mt-2">
                    <span className="text-gray-600 text-xs">Start date:</span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {formatDate(task.startDate ?? task.createdDate)}
                    </Badge>
                    <span className="text-gray-600 text-xs">Due date:</span>
                    <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                      {task.targetDate ? formatDate(task.targetDate) : '—'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateNewOpen(true)}>+ Add New Sub Task</Button>
          </div>
        </div>
      </DialogContent>

      {/* New Task Modal to create and auto-add as subtask */}
      <NewTaskModal
        open={isCreateNewOpen}
        onOpenChange={setIsCreateNewOpen}
        onTaskCreated={handleNewTaskCreated}
        initialData={{
          projectId: projectId,
          parentTaskId: taskId, // Pass current task ID as parent
          // is_subtask: true, // Indicate this is a subtask
          owner: owner, // Default to current user or leave empty
        }}
      />
    </Dialog>
  );
};

export default AddSubtaskModal;
