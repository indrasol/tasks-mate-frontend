
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, MoreVertical } from "lucide-react";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  targetDate: string;
  comments: number;
  progress: number;
}

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const TaskListView = ({ tasks, onTaskClick }: TaskListViewProps) => {
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
                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
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
                  <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                </div>

                {/* Progress bar */}
                <div className="w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{task.progress}%</span>
                </div>

                {/* Owner and date */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{task.owner}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">{task.owner}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.targetDate}
                  </Badge>
                </div>

                {/* Comments */}
                <div className="flex items-center space-x-1 text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{task.comments}</span>
                </div>
              </div>

              {/* Actions */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("More options for", task.id);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskListView;
