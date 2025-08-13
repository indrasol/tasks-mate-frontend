import { format } from "date-fns";
import { formatDate } from "@/lib/projectUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock } from "lucide-react";
import { getStatusMeta } from "@/lib/projectUtils";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface TaskHistory {
  history_id: string;
  created_by: string;
  created_at: string;
  title?: string;
  action?: string;
  metadata?: any; // allow array or object from backend
}

interface HistoryCardProps {
  history: TaskHistory[];
  isLoading: boolean;
  className?: string;
  projectNameById?: (id: string) => string | undefined;
}

export function HistoryCard({ history, isLoading, className = "", projectNameById }: HistoryCardProps) {
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

  const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '' || value === 'null') return '—';
    if (field === 'status') return getStatusMeta(String(value) as any).label;
    if (field === 'priority') return String(value).toUpperCase();
    if (field === 'due_date' || field === 'start_date' || field === 'completed_at') {
      try { return formatDate(String(value)); } catch { return String(value); }
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const formatDisplayName = (raw: string): string => {
    if (!raw) return "Someone";
    const base = raw.includes("@") ? raw.split("@")[0] : raw;
    return base
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const getAccentClass = (title: string) => {
    // Added -> green, Deleted -> red, Updated -> blue
    if (title.startsWith('attachment_')) {
      if (title.endsWith('created')) return 'text-emerald-600';
      if (title.endsWith('deleted')) return 'text-red-600';
      return 'text-blue-600';
    }
    if (title === 'created' || title.includes('added')) return 'text-emerald-600';
    if (title === 'deleted' || title.includes('removed')) return 'text-red-600';
    return 'text-blue-600';
  };

  // const getChangeDescription = (item: TaskHistory): JSX.Element | string => {
  //   const who = formatDisplayName(item.created_by || 'Someone');
  //   const title = (item.title || '').toLowerCase();

  //   // Normalize metadata shape
  //   const metaArray: any[] = Array.isArray(item.metadata)
  //     ? item.metadata
  //     : item.metadata && typeof item.metadata === 'object'
  //       ? [item.metadata]
  //       : [];

  //   if (title.startsWith('attachment_')) {
  //     const action = title.split('_')[1];
  //     return (
  //       <span>
  //         <span className="font-semibold">{who}</span> {action} an <span className={getAccentClass(title)}>attachment</span>
  //       </span>
  //     );
  //   }
  //   if (title === 'subtask_added') {
  //     const sid = metaArray[0]?.subtask_id;
  //     return (
  //       <span>
  //         <span className="font-semibold">{who}</span> added subtask {sid && (<span className="text-emerald-600 font-semibold">{sid}</span>)}
  //       </span>
  //     );
  //   }
  //   if (title === 'subtask_removed') {
  //     const sid = metaArray[0]?.subtask_id;
  //     return (
  //       <span>
  //         <span className="font-semibold">{who}</span> removed subtask {sid && (<span className="text-red-600 font-semibold">{sid}</span>)}
  //       </span>
  //     );
  //   }
  //   if (title === 'created') return (<span><span className="font-semibold">{who}</span> created the task</span>);
  //   if (title === 'deleted') return (<span><span className="font-semibold">{who}</span> deleted the task</span>);

  //   if (title === 'updated' && metaArray.length > 0) {
  //     const parts: JSX.Element[] = [];
  //     for (const change of metaArray) {
  //       const field = String(change.field || '').toLowerCase();
  //       const newVal = change.new;
  //       const oldVal = change.old;
  //       switch (field) {
  //         case 'status':
  //           parts.push(
  //             <span key={`status`}>
  //               status from <span className="font-semibold">{formatValue('status', oldVal)}</span> to <span className="font-medium text-blue-600">{formatValue('status', newVal)}</span>
  //             </span>
  //           );
  //           break;
  //         case 'priority':
  //           parts.push(
  //             <span key={`priority`}>
  //               priority from <span className="font-semibold">{formatValue('priority', oldVal)}</span> to <span className="font-medium text-blue-600">{formatValue('priority', newVal)}</span>
  //             </span>
  //           );
  //           break;
  //         case 'due_date':
  //           parts.push(
  //             <span key={`due_date`}>
  //               due date from <span className="font-semibold">{formatValue('due_date', oldVal)}</span> to <span className="font-medium text-blue-600">{formatValue('due_date', newVal)}</span>
  //             </span>
  //           );
  //           break;
  //         case 'start_date':
  //           parts.push(
  //             <span key={`start_date`}>
  //               start date from <span className="font-semibold">{formatValue('start_date', oldVal)}</span> to <span className="font-medium text-blue-600">{formatValue('start_date', newVal)}</span>
  //             </span>
  //           );
  //           break;
  //         case 'title':
  //           parts.push(<span key={`title`}>title</span>);
  //           break;
  //         case 'description':
  //           parts.push(<span key={`description`}>description</span>);
  //           break;
  //         case 'tags':
  //           parts.push(<span key={`tags`}>tags</span>);
  //           break;
  //         case 'project_id':
  //           parts.push(<span key={`project`}>project</span>);
  //           break;
  //         default:
  //           break;
  //       }
  //     }
  //     if (parts.length > 0) {
  //       const interleaved: JSX.Element[] = [];
  //       parts.forEach((p, idx) => {
  //         if (idx > 0) interleaved.push(<span key={`sep-${idx}`}>, </span>);
  //         interleaved.push(p);
  //       });
  //       return (
  //         <span>
  //           <span className="font-semibold">{who}</span> updated {interleaved}
  //         </span>
  //       );
  //     }
  //   }

  //   return (<span><span className="font-semibold">{who}</span> updated the task</span>);
  // };

  const normalizeMeta = (m: any): any[] => {
    if (!m) return [];
    if (Array.isArray(m)) return m;
    if (typeof m === "string") {
      try {
        const parsed = JSON.parse(m);
        return Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" ? [parsed] : []);
      } catch { return []; }
    }
    if (typeof m === "object") return [m];
    return [];
  };
  
  const humanName = (raw: string): string => {
    if (!raw) return "Someone";
    const base = raw.includes("@") ? raw.split("@")[0] : raw;
    return base.split(/[._-]+/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
  };
  
  const tagsDiff = (oldVal: any, newVal: any) => {
    const oldArr = Array.isArray(oldVal) ? oldVal : [];
    const newArr = Array.isArray(newVal) ? newVal : [];
    const oldSet = new Set(oldArr);
    const newSet = new Set(newArr);
    const added = newArr.filter(x => !oldSet.has(x));
    const removed = oldArr.filter(x => !newSet.has(x));
    const parts: JSX.Element[] = [];
    if (added.length) parts.push(<span key="added">added <span className="font-medium text-emerald-600">{added.join(", ")}</span></span>);
    if (removed.length) parts.push(<span key="removed">removed <span className="font-medium text-rose-600">{removed.join(", ")}</span></span>);
    if (!parts.length) return null;
    const interleaved: JSX.Element[] = [];
    parts.forEach((p, i) => { if (i) interleaved.push(<span key={`sep-${i}`}>, </span>); interleaved.push(p); });
    return <>tags {interleaved}</>;
  };
  
  const valueFor = (field: string, value: any, projectNameById?: (id: string) => string | undefined) => {
    if (value === null || value === undefined || value === "" || value === "null") return "—";
    if (field === "status") return getStatusMeta(String(value) as any).label;
    if (field === "priority") return String(value).toUpperCase();
    if (field === "due_date" || field === "start_date" || field === "completed_at") {
      try { return formatDate(String(value)); } catch { return String(value); }
    }
    if (field === "project_id" && projectNameById) {
      return projectNameById(String(value)) || String(value);
    }
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  };

  const getChangeDescription = (item: TaskHistory, projectNameById?: (id: string) => string | undefined): JSX.Element | string => {
    const who = humanName(item.created_by || "Someone");
    const title = String(item.title || "").toLowerCase();
    const action = String(item.action || "").toLowerCase(); // Also check the action field
    const metaArray = normalizeMeta(item.metadata);
    // console.log("History item", item);
  
    // Check both title and action for "created"
    if (action === "created") {
      return <span><span className="font-semibold">{who}</span> created the task</span>;
    }
    
    // Check both title and action for "deleted"
    if (action === "deleted") {
      return <span><span className="font-semibold">{who}</span> deleted the task</span>;
    }
  
    // Attachments
    if (action.startsWith("attachment_")) {
      const attachAction = action.split("_")[1] || "updated";
      const displayAction = attachAction === "deleted" ? "deleted" : "updated";
      const colorClass = attachAction === "deleted" ? "text-red-600" : "text-blue-600";
      const context = metaArray[0] || {};
      const name = context?.filename || context?.name;
      const url = context?.url;
      return (
        <span>
          <span className="font-semibold">{who}</span> {displayAction} an <span className={colorClass}>attachment</span>
          {name ? (
            <> (
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:text-blue-700 underline underline-offset-2">
                  {name}
                </a>
              ) : (
                <span className="font-medium">{name}</span>
              )}
            )</>
          ) : null}
        </span>
      );
    }
  
    // Subtasks & Dependencies
    if (action === "subtask_added") {
      const sid = metaArray[0]?.subtask_id;
      return <span><span className="font-semibold">{who}</span> added subtask {sid && <span className="text-emerald-600 font-semibold">{sid}</span>}</span>;
    }
    if (action === "subtask_removed") {
      const sid = metaArray[0]?.subtask_id;
      return <span><span className="font-semibold">{who}</span> removed subtask {sid && <span className="text-red-600 font-semibold">{sid}</span>}</span>;
    }
    if (action === "dependency_added") {
      const did = metaArray[0]?.dependency_id;
      return <span><span className="font-semibold">{who}</span> added dependency {did && <span className="text-emerald-600 font-semibold">{did}</span>}</span>;
    }
    if (action === "dependency_removed") {
      const did = metaArray[0]?.dependency_id;
      return <span><span className="font-semibold">{who}</span> removed dependency {did && <span className="text-red-600 font-semibold">{did}</span>}</span>;
    }
  
    if (action === "updated" && metaArray.length > 0) {
      const parts: JSX.Element[] = [];
      for (const change of metaArray) {
        const field = String(change.field || "").toLowerCase();
        const oldVal = change.old;
        const newVal = change.new;
  
        if (field === "tags") {
          const diff = tagsDiff(oldVal, newVal);
          if (diff) parts.push(<span key="tags">{diff}</span>);
          continue;
        }
  
        if (field === "assignee") {
          parts.push(
            <span key="assignee">
              owner from <span className="font-semibold">{humanName(String(oldVal || "—"))}</span> to{" "}
              <span className="font-medium text-blue-600">{humanName(String(newVal || "—"))}</span>
            </span>
          );
          continue;
        }
  
        if (["status","priority","due_date","start_date","completed_at","project_id","title","description"].includes(field)) {
          const prettyOld = valueFor(field, oldVal, projectNameById);
          const prettyNew = valueFor(field, newVal, projectNameById);
  
          if (field === "title" || field === "description") {
            parts.push(<span key={field}>{field}</span>);
          } else {
            parts.push(
              <span key={field}>
                {field.replace("_", " ")} from <span className="font-semibold">{prettyOld}</span> to{" "}
                <span className="font-medium text-blue-600">{prettyNew}</span>
              </span>
            );
          }
        }
      }
  
      if (parts.length) {
        const interleaved: JSX.Element[] = [];
        parts.forEach((p, idx) => { if (idx) interleaved.push(<span key={`sep-${idx}`}>, </span>); interleaved.push(p); });
        return <span><span className="font-semibold">{who}</span> updated {interleaved}</span>;
      }
    }
  
    return <span><span className="font-semibold">{who}</span> updated the task</span>;
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
                    <div className="flex items-start gap-2 text-sm">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="h-8 w-8 cursor-default">
                            <AvatarFallback>
                              {getUserInitials(item.created_by)}
                            </AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="py-1 px-2 text-xs">
                          {item.created_by}
                        </HoverCardContent>
                      </HoverCard>
                      <div>
                        <p className="text-sm">{getChangeDescription(item, projectNameById)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
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
