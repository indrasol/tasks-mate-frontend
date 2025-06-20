import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, MoreVertical, Check } from "lucide-react";

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

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskStatusToggle: (taskId: string) => void;
}

const TaskListView = ({ tasks, onTaskClick, onTaskStatusToggle }: TaskListViewProps) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in-progress": return "In Progress";
      case "blocked": return "Blocked";
      case "todo": return "To Do";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          className="glass border-0 shadow-tasksmate cursor-pointer group hover:shadow-tasksmate-hover transition-all duration-200"
          onClick={() => onTaskClick(task.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Checkbox and ID */}
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      task.status === 'completed' 
                        ? 'bg-tasksmate-gradient border-transparent' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskStatusToggle(task.id);
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

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                      {task.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                  
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
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

                  {/* Single row with metadata and comments */}
                  <div className="flex items-center justify-between mt-2">
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
              </div>

              {/* Status tag positioned at the right end */}
              <div className="ml-4">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskListView;
