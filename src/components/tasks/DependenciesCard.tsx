import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, ExternalLink, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/projectUtils";
import { deriveDisplayFromEmail } from "@/lib/projectUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface DependenciesCardProps {
  dependencies: any[];
  loading: boolean;
  onAddDependency: () => void;
  onRemoveDependency: (taskId: string) => void;
  currentOrgId?: string;
}

export function DependenciesCard({
  dependencies,
  loading,
  onAddDependency,
  onRemoveDependency,
  currentOrgId,
}: DependenciesCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (loading) {
    return (
      <Card className="glass border-0 shadow-tasksmate">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-sora">Dependencies</CardTitle>
            <Button size="sm" variant="outline" className="micro-lift" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Dependency
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0 shadow-tasksmate">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-sora">Dependencies</CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            className="micro-lift" 
            onClick={onAddDependency}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Dependency
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {dependencies.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No dependencies added yet
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-3">
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div 
                  key={dep.task_id || dep.id} 
                  className="group flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full ${
                      dep.status === 'completed' ? 'bg-green-500' : 
                      dep.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{dep.title || dep.name}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            dep.status === 'completed' ? 'bg-green-100 text-green-800' :
                            dep.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {dep.status?.replace('_', ' ') || 'not started'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {dep.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {dep.due_date && (
                          <span className="text-xs text-muted-foreground">
                            Due: {formatDate(dep.due_date)}
                          </span>
                        )}
                        {dep.assignee && (
                          <span className="text-xs text-muted-foreground">
                            • {deriveDisplayFromEmail(dep.assignee).displayName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        const url = `/tasks/${dep.task_id || dep.id}${currentOrgId ? `?org_id=${currentOrgId}` : ''}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => onRemoveDependency(dep.task_id || dep.id)}
                      title="Remove dependency"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default DependenciesCard;
