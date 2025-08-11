import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Clock } from "lucide-react";

interface TaskHistory {
  history_id: string;
  created_by: string;
  created_at: string;
  title?: string;
  metadata?: {
    field: string;
    old?: string | number | Date;
    new?: string | number | Date;
  }[];
}

interface HistoryCardProps {
  history: TaskHistory[];
  isLoading: boolean;
  className?: string;
}

export function HistoryCard({ history, isLoading, className = "" }: HistoryCardProps) {
  if (isLoading) {
    return (
      <Card className="glass border-0 shadow-tasksmate">
        <CardHeader>
          <CardTitle className="font-sora">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">

            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
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

  if (history.length === 0) {
    return (
      <Card className="glass border-0 shadow-tasksmate">
        <CardHeader>
          <CardTitle className="font-sora">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No history available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeDescription = (item: TaskHistory) => {
    if (item.title) return item.title;

    if (item.metadata && item.metadata.length > 0) {
      const changes = item.metadata.map(change => {
        switch (change.field) {
          case 'status':
            return `Changed status from "${change.old}" to "${change.new}"`;
          case 'priority':
            return `Changed priority from "${change.old}" to "${change.new}"`;
          case 'assignee':
            return `Assigned to ${change.new}`;
          case 'due_date':
            return `Updated due date to ${new Date(change.new).toLocaleDateString()}`;
          default:
            return `Updated ${change.field}`;
        }
      });
      return changes.join(', ');
    }

    return 'Updated the task';
  };

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split(/[.\-_]/)
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <Card className="glass border-0 shadow-tasksmate">
      <CardHeader>
        <CardTitle className="font-sora"><span>History</span>
          <Badge variant="outline" className="ml-auto">
            {history.length} {history.length === 1 ? 'event' : 'events'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6 pl-6 pr-2 py-2">
              {history.map((item) => (
                <div key={item.history_id} className="relative pb-6">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>

                  <div className="ml-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getUserInitials(item.created_by)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.created_by}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pl-10">
                      <p className="text-sm">{getChangeDescription(item)}</p>

                      {item.metadata && item.metadata.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.metadata.map((change, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              <span className="font-medium">{change.field}:</span>{' '}
                              <span className="line-through text-red-400 mr-1">
                                {change.old?.toString() || 'empty'}
                              </span>
                              <span>→</span>{' '}
                              <span className="text-green-500">
                                {change.new?.toString() || 'empty'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline line */}
                  {history[history.length - 1] !== item && (
                    <div className="absolute left-1.5 top-4 h-full w-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>


      </CardContent>
    </Card>
  );
}

export default HistoryCard;
