
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyableIdBadge from "@/components/ui/copyable-id-badge";
import { MessageSquare, Check } from "lucide-react";
import { Task } from "@/types/tasks";
import { deriveDisplayFromEmail, formatDate, getPriorityColor } from "@/lib/projectUtils";
import { useState, useEffect } from "react";
import { api } from "@/services/apiService";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/../config";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskStatusToggle: (taskId: string) => void;
  projectMap: Record<string, string>;
  canDeleteTask?: (task: Task) => boolean;
  onDeleteTask?: (taskId: string) => void;
}

const TaskListView = ({ tasks, onTaskClick, onTaskStatusToggle, projectMap, canDeleteTask, onDeleteTask }: TaskListViewProps) => {
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

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          className="glass border-0 shadow-tasksmate cursor-pointer group hover:shadow-tasksmate-hover transition-all duration-200"
          onClick={() => onTaskClick(task.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
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
                  <div onClick={(e)=>e.stopPropagation()}>
                    <CopyableIdBadge id={task.id} isCompleted={task.status==='completed'} />
                  </div>
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className={`font-semibold transition-colors truncate ${task.status==='completed' ? 'line-through text-gray-400' : 'text-gray-900 hover:text-blue-600' }`}>
                      {task.name}
                    </h3>
                    {/* Owner badge next to title */}
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                      {(() => {
                        const { displayName } = deriveDisplayFromEmail((task.owner ?? '') as string);
                        return `👤 ${displayName}`;
                      })()}
                    </Badge>
                    {/* Status badge - moved from right side */}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        task.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'archived' ? 'bg-black text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getStatusText(task.status)}
                    </Badge>
                    {/* Priority badge - moved from right side */}
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority ?? 'none')}`}>
                      {task.priority?.toUpperCase()}
                    </Badge>
                  </div>
                  {/* Description removed as requested */}

                  {/* Metadata row */}
                  <div className="flex items-center mt-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-gray-600 text-xs font-bold">Created:</span>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                        {formatDate(task.createdDate ?? (task.startDate as any))}
                      </Badge>
                      {/* Comments moved to right of Created */}
                      <div className="flex items-center gap-1 text-gray-500 ml-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs">{task.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project, Start date, Due date moved to right side */}
              <div className="ml-4 flex flex-col items-end">
                {/* Project with Start and Due dates in the same row */}
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs font-bold">Project:</span>
                    <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                      {projectMap[(task as any).projectId] ?? "—"}
                    </Badge>
                  </div>
                  
                  {/* Start Date - moved to right of Project */}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs font-bold">Start date:</span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {formatDate(task.startDate ?? task.createdDate)}
                    </Badge>
                  </div>
                  
                  {/* Due Date - moved to right of Start date */}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs font-bold">Due date:</span>
                    <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                      {task.targetDate ? formatDate(task.targetDate) : "—"}
                    </Badge>
                  </div>
                </div>
                
                {/* Tags moved below Project */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mb-2 justify-end">
                    <span className="text-gray-600 text-xs font-bold">Tags:</span>
                    {task.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      {tag}
                    </Badge>
                    ))}
                    {task.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      +{task.tags.length - 2}
                    </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskListView;
