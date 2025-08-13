import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyableIdBadge from "@/components/ui/copyable-id-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Check,
  ArrowLeft,
  Calendar,
  User,
  MessageCircle,
  Zap,
  Save,
  Copy,
  Plus,
  CheckCircle,
  Circle,
  Send,
  Edit,
  X,
  ChevronDown,
  Upload,
  FileText,
  ExternalLink,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
// import DuplicateTaskModal from "@/components/tasks/DuplicateTaskModal";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import AddSubtaskModal from "@/components/tasks/AddSubtaskModal";
import AddDependencyModal from "@/components/tasks/AddDependencyModal";
import { taskService } from "@/services/taskService";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";

import { getStatusMeta, getPriorityColor, formatDate, deriveDisplayFromEmail } from "@/lib/projectUtils";
import { useAuth } from "@/hooks/useAuth";
import MainNavigation from "@/components/navigation/MainNavigation";
import HistoryCard from "@/components/tasks/HistoryCard";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);
  const [isAddDependencyOpen, setIsAddDependencyOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Subtask details state
  const [subtaskDetails, setSubtaskDetails] = useState<any[]>([]);
  const [dependencyDetails, setDependencyDetails] = useState<any[]>([]);

  // Move all state declarations to the top
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Utility helpers -------------------------------------------------
  const priorityOptions = ["critical", "high", "medium", "low", "none"] as const;
  const statusOptions = [
    "in_progress",
    "completed",
    "archived",
    "not_started",
    "blocked",
    "on_hold",
  ] as const;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  // Sync with sidebar collapse/expand events
  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    // Initialise based on current CSS var set by MainNavigation
    setSidebarCollapsed(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem'
    );
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const currentOrgId = useCurrentOrgId();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [projectsMap, setProjectsMap] = useState<Record<string, string>>({});

  // Local date helpers to avoid timezone off-by-one issues
  const toYMDLocal = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const fromYMDLocal = (s?: string): Date | undefined => {
    if (!s) return undefined;
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
    if (!m) return undefined;
    const [_, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  };

  // Note: Changes in details are saved via the "Save Changes" button to create a single, consolidated history event

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    taskService.getTaskById(taskId)
      .then((data: any) => {

        const mapped = {
          id: data.task_id,
          name: data.title,
          description: data.description,
          // Normalize API statuses for UI expectations
          status: (data.status || "not_started")
            .replace("in_progress", "in-progress")
            .replace("not_started", "todo"),
          owner: data.assignee, // Backend returns 'assignee'
          startDate: data.start_date,
          targetDate: data.due_date,
          comments: data.comments ?? 0,
          progress: data.progress ?? 0,
          priority: data.priority,
          tags: data.tags,
          project_id: data.project_id,
          createdBy: data.created_by,
          createdDate: data.created_at,
          dependencies: data.dependencies ?? [],
        };

        setTask(mapped);
        setTaskName(data.title);
        setDescription(data.description);
        setStatus(data.status);
        setPriority(data.priority);
        setSubtasks(data.sub_tasks || []);
        setLoading(false);
        fetchHistory();
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load task");
        setLoading(false);
      });
  }, [taskId]);

  // Fetch project name list for current org and map id
  useEffect(() => {
    if (!currentOrgId || !task?.project_id) return;
    (async () => {
      try {
        const projects = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}`);
        const map: Record<string, string> = {};
        projects.forEach((pr: any) => { map[pr.project_id] = pr.name; });
        setProjectsMap(map);
        const p = projects.find((x: any) => x.project_id === task.project_id);
        setProjectName(p?.name ?? null);
      } catch (e) {
        setProjectName(null);
      }
    })();
  }, [currentOrgId, task?.project_id]);

  // Fetch comments from backend
  useEffect(() => {
    if (!taskId) return;
    setLoadingComments(true);
    setCommentsError(null);
    api
      .get<any[]>(`${API_ENDPOINTS.TASK_COMMENTS}?task_id=${taskId}`)
      .then((data: any[]) => {
        setComments(Array.isArray(data) ? data : []);
        setLoadingComments(false);
      })
      .catch((err: any) => {
        setCommentsError(err.message || "Failed to load comments");
        setLoadingComments(false);
      });
  }, [taskId]);

  // Fetch attachments
  useEffect(() => {
    if (!taskId) return;
    setLoadingAttachments(true);
    setAttachmentsError(null);
    taskService.getTaskAttachments(taskId)
      .then((data: any[]) => {
        setAttachments(data || []);
        setLoadingAttachments(false);
      })
      .catch((err: any) => {
        setAttachmentsError(err.message || "Failed to load attachments");
        setLoadingAttachments(false);
      });
  }, [taskId]);

  // Fetch history
  const fetchHistory = () => {
    if (!taskId) return;
    setLoadingHistory(true);
    setHistoryError(null);
    taskService.getTaskHistory(taskId, taskName || task?.name)
      .then((data: any[]) => {
        setHistory(data || []);
        setLoadingHistory(false);
      })
      .catch((err: any) => {
        setHistoryError(err.message || "Failed to load history");
        setLoadingHistory(false);
      });
  };

  // Remove automatic history refetch on every local task change; fetch only when needed

  // Fetch full subtask details
  useEffect(() => {
    if (!subtasks.length) { setSubtaskDetails([]); return; }
    Promise.all(subtasks.map((id) => taskService.getTaskById(id) as Promise<any>))
      .then((details: any) => setSubtaskDetails(details as any[]))
      .catch(() => setSubtaskDetails([]));
  }, [subtasks]);
  // Fetch full dependency details
  useEffect(() => {
    if (!task || !task.dependencies || !task.dependencies.length) { setDependencyDetails([]); return; }
    Promise.all((task.dependencies as string[]).map((id: string) => taskService.getTaskById(id) as Promise<any>))
      .then((details: any) => setDependencyDetails(details as any[]))
      .catch(() => setDependencyDetails([]));
  }, [task]);

  // Mock data for the task
  // const task = {
  //   id: taskId || 'T1234',
  //   name: taskName,
  //   description: description,
  //   status: status,
  //   progress: 65,
  //   owner: 'Sarah K.',
  //   targetDate: '2024-01-15',
  //   createdDate: '2024-01-01',
  //   comments: comments.length,
  //   tags: ['UI/UX', 'Frontend', 'Dashboard']
  // };

  const handleSaveChanges = async () => {
    if (!taskId) return;
    try {
      const payload: any = {
        title: taskName,
        description,
        status,
        priority,
      };
      if (task?.project_id) payload.project_id = task.project_id;
      if (task?.startDate) payload.start_date = toYMDLocal(fromYMDLocal(task.startDate) || new Date());
      if (task?.targetDate) payload.due_date = toYMDLocal(fromYMDLocal(task.targetDate) || new Date());
      if (Array.isArray(task?.tags)) payload.tags = task.tags;
      await taskService.updateTask(taskId, payload);
      toast.success('Task changes saved successfully!');
      fetchHistory();
    } catch (err: any) {
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to save changes');
      toast.error(msg);
    }
  };

  // Toggle status via circle badge (completed ↔ not_started)
  const handleStatusToggle = async () => {
    if (!taskId) return;
    // Determine new status
    const prevStatus = status;
    const newStatus = prevStatus === 'completed' ? 'not_started' : 'completed';

    // Optimistic UI update
    setStatus(newStatus);
    setTask((prev: any) => ({ ...prev, status: newStatus }));

    try {
      await taskService.updateTask(taskId, {
        status: newStatus,
        project_id: task.project_id,
        title: taskName || task.name
      });
      // Refresh history to reflect the change immediately
      fetchHistory();
    } catch (err: any) {
      // revert on failure
      setStatus(prevStatus);
      setTask((prev: any) => ({ ...prev, status: prevStatus }));
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to update status');
      toast.error(msg);
    }
  };

  // File upload handlers
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - uploadedFiles.length);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) uploaded successfully!`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileInputClick = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  };

  // Comment functions
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const payload = {
        task_id: taskId,
        content: newComment,
        // Send snapshot title when available to satisfy DB schema
        task_title: taskName || task?.name,
      };
      const created = await api.post(`${API_ENDPOINTS.TASK_COMMENTS}?project_id=${task?.project_id}`, payload);
      setComments([created as any, ...comments]);
      setNewComment("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add comment");
    }
  };
  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => c.comment_id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditCommentText(comment.content);
    }
  };
  const handleSaveEdit = async () => {
    if (!editCommentText.trim() || !editingComment) return;
    try {
      const updated = await api.put(`${API_ENDPOINTS.TASK_COMMENTS}/${editingComment}?project_id=${task?.project_id}`, { content: editCommentText, task_title: taskName || task?.name });
      setComments(comments.map((c) => c.comment_id === editingComment ? updated : c));
      setEditingComment(null);
      setEditCommentText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };
  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.del(`${API_ENDPOINTS.TASK_COMMENTS}/${commentId}?project_id=${task?.project_id}`, {});
      setComments(comments.filter((c) => c.comment_id !== commentId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  // For add/delete/toggle subtask, update backend (if supported)
  const handleAddSubtask = async (selectedTask: any) => {
    if (!taskId) return;
    try {
      await taskService.addSubtask(taskId, selectedTask.id);
      setSubtasks(prev => [...prev, selectedTask.id]);
      toast.success(`Subtask "${selectedTask.name}" added successfully!`);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subtask');
    }
  };
  const handleSubtaskToggle = async (subtaskId: string) => {
    // Find subtask
    const idx = subtaskDetails.findIndex((s: any) => (s.task_id ?? s.id) === subtaskId);
    if (idx === -1) return;
    const sub = subtaskDetails[idx];
    const prevStatus: string = sub.status ?? 'not_started';
    const newStatus: string = prevStatus === 'completed' ? 'not_started' : 'completed';

    // Optimistic update
    setSubtaskDetails((prev: any[]) => {
      const next = [...prev];
      next[idx] = { ...sub, status: newStatus };
      return next;
    });

    try {
      await taskService.updateTask(subtaskId, {
        status: newStatus,
        project_id: sub.project_id,
        title: sub.title ?? sub.name,
      });
    } catch (e) {
      // revert on failure
      setSubtaskDetails((prev: any[]) => {
        const next = [...prev];
        next[idx] = { ...sub, status: prevStatus };
        return next;
      });
    }
  };
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!taskId) return;
    try {
      await taskService.removeSubtask(taskId, subtaskId);
      setSubtasks(prev => prev.filter(id => id !== subtaskId));
      toast.success('Subtask deleted successfully!');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete subtask');
    }
  };

  // Dependencies handlers
  const handleAddDependency = async (selectedTask: any) => {
    if (!taskId) return;
    try {
      await taskService.addDependency(taskId, selectedTask.id);
      setTask((prev: any) => ({ ...prev, dependencies: [...(prev?.dependencies ?? []), selectedTask.id] }));
      setDependencyDetails((prev: any[]) => [...prev, selectedTask]);
      toast.success(`Dependency "${selectedTask.name}" added successfully!`);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add dependency');
    }
  };
  
  const handleDeleteDependency = async (dependencyId: string) => {
    if (!taskId) return;
    try {
      await taskService.removeDependency(taskId, dependencyId);
      setTask((prev: any) => ({ ...prev, dependencies: (prev?.dependencies ?? []).filter((id: string) => id !== dependencyId) }));
      setDependencyDetails((prev: any[]) => prev.filter((d: any) => (d.task_id ?? d.id) !== dependencyId));
      toast.success('Dependency removed successfully!');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove dependency');
    }
  };
  
  const handleDependencyToggle = async (dependencyId: string) => {
    // Find dependency
    const idx = dependencyDetails.findIndex((d: any) => (d.task_id ?? d.id) === dependencyId);
    if (idx === -1) return;
    const dep = dependencyDetails[idx];
    const prevStatus: string = dep.status ?? 'not_started';
    const newStatus: string = prevStatus === 'completed' ? 'not_started' : 'completed';

    // Optimistic update
    setDependencyDetails((prev: any[]) => {
      const next = [...prev];
      next[idx] = { ...dep, status: newStatus };
      return next;
    });

    try {
      await taskService.updateTask(dependencyId, {
        status: newStatus,
        project_id: dep.project_id,
        title: dep.title ?? dep.name,
      });
    } catch (e) {
      // revert on failure
      setDependencyDetails((prev: any[]) => {
        const next = [...prev];
        next[idx] = { ...dep, status: prevStatus };
        return next;
      });
    }
  };

  // Attachment upload
  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || !task?.project_id || !taskId) return;
    try {
      for (const file of Array.from(files)) {
        await taskService.uploadTaskAttachmentForm(task.project_id, taskId, file, file.name);
      }
      const data: any[] = await taskService.getTaskAttachments(taskId);
      setAttachments(Array.isArray(data) ? data : []);
      toast.success('Attachment(s) uploaded!');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload attachment');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task?.project_id) return;
    try {
      await taskService.deleteTaskAttachment(attachmentId, task.project_id);
      setAttachments(attachments.filter(a => a.attachment_id !== attachmentId));
      toast.success('Attachment deleted!');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete attachment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };


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

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      blocked: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  // In the render, show loading/error states for attachments/history
  // if (loadingAttachments) return <div className="p-8 text-center">Loading attachments...</div>;
  // if (attachmentsError) return <div className="p-8 text-center text-red-500">{attachmentsError}</div>;
  // if (loadingHistory) return <div className="p-8 text-center">Loading history...</div>;
  // if (historyError) return <div className="p-8 text-center text-red-500">{historyError}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>


        <nav className="px-6 py-4 backdrop-blur-sm border-b border-gray-200" >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}` : ''}`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Catalog</span>
              </Link>
              {/* Removed TasksMate logo and divider */}
            </div>

            {/* Removed profile avatar */}
          </div>
        </nav>

        {/* Header */}
        <header className="px-6 py-6 bg-white/30 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full">
            <div className="flex items-start justify-between space-x-3">
              {/* Column with toggle + green bar */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${status === 'completed'
                    ? 'bg-tasksmate-gradient border-transparent' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={handleStatusToggle}
                >
                  {status === 'completed' && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="w-1 h-10 rounded-full bg-green-500 mt-2"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">

                  <CopyableIdBadge id={task.id} isCompleted={status === 'completed'} />

                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                    {(() => {
                      const { displayName } = deriveDisplayFromEmail((task.owner ?? '') as string);
                      return `👤 ${displayName}`;
                    })()}
                  </Badge>
                  {/* Status selector (moved from Details card) */}
                  <Select value={status} onValueChange={(v) => { setStatus(v as string); }}>
                    <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(s as any).color}`}>{getStatusMeta(s as any).label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Priority selector (moved from Details card) */}
                  <Select value={priority} onValueChange={(v) => { setPriority(v as typeof priority); }}>
                    <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>{p.toUpperCase()}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Edit icon removed as requested */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={() => setIsDeleteTaskOpen(true)}
                    title="Delete task"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {/* Title */}
                <div className="mt-2">
                  <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className={`text-2xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${status === 'completed' ? 'line-through text-gray-400' : ''}`}
                  />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  {/* Tags removed, now in Details card */}
                </div>
              </div>

              {/* Right actions (Save + Duplicate) */}
              <div className="ml-4 flex items-center gap-2">
                <Button className="bg-tasksmate-gradient" onClick={handleSaveChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" className="micro-lift" onClick={() => setIsDuplicateOpen(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </div>
            </div>

            {/* Removed status & priority selectors (moved to Details card) */}
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          <div className="w-full grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="font-sora">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`min-h-32 border-0 bg-transparent resize-none focus-visible:ring-0 ${status === 'completed' ? 'line-through text-gray-400' : ''}`}
                    placeholder="Add a description..."
                  />
                </CardContent>
              </Card>

              {/* Subtasks */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-sora">Subtasks</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      className="micro-lift"
                      onClick={() => setIsAddSubtaskOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtask
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subtaskDetails.map((subtask: any) => {
                    const subtaskId = subtask.task_id ?? subtask.id;
                    return (
                      <div key={subtaskId} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-white/50 micro-lift group">
                        {/* Toggle */}
                        <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => handleSubtaskToggle(subtaskId)}>
                          {subtask.status === 'completed' ? <CheckCircle className="h-5 w-5 text-tasksmate-green-end" /> : <Circle className="h-5 w-5 text-gray-400" />}
                        </Button>

                        {/* Task ID beside status toggle */}
                        <CopyableIdBadge id={String(subtaskId)} isCompleted={subtask.status === 'completed'} />

                        {/* Owner, Status, Priority badges inline with Task ID */}
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                          {(() => {
                            const { displayName } = deriveDisplayFromEmail((subtask.assignee ?? '') as string);
                            return `👤 ${displayName}`;
                          })()}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${getStatusMeta((subtask.status || 'not_started') as any).color}`}>
                          {getStatusMeta((subtask.status || 'not_started') as any).label}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask.priority ?? 'none')}`}>{(subtask.priority ?? 'none').toUpperCase()}</Badge>

                        {/* Project */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Project:</span>
                          <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                            {projectsMap[subtask.project_id as string] ?? (subtask.project_name ?? '—')}
                          </Badge>
                        </div>

                        {/* Start date */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Start date:</span>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {formatDate(subtask.start_date ?? subtask.created_at)}
                          </Badge>
                        </div>

                        {/* Due date */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Due date:</span>
                          <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                            {subtask.due_date ? formatDate(subtask.due_date) : '—'}
                          </Badge>
                        </div>

                        {/* Created date */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Created:</span>
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                            {formatDate(subtask.created_at)}
                          </Badge>
                        </div>

                        {/* Tags (show up to 2, then +N) */}
                        {Array.isArray(subtask.tags) && subtask.tags.length > 0 && (
                          <div className="inline-flex items-center gap-1 flex-wrap">
                            <span className="text-gray-600 text-xs">Tags:</span>
                            {subtask.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <Badge key={`${subtaskId}-tag-${idx}`} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                {tag}
                              </Badge>
                            ))}
                            {subtask.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">+{subtask.tags.length - 2}</Badge>
                            )}
                          </div>
                        )}

                        {/* Actions to the far right */}
                        <div className="ml-auto flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700" onClick={() => {
                            const url = `/tasks/${subtaskId}${currentOrgId ? `?org_id=${currentOrgId}` : ''}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => handleDeleteSubtask(subtaskId)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Content Column (second line under toggle + task id) */}
                        <div className="flex flex-col min-w-0 basis-full w-full mt-1">
                          {/* Title (second line) */}
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 min-w-0">
                            <span className="font-bold">Title :</span>
                            <span className={`truncate max-w-[14rem] ${subtask.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                              {subtask.title ?? subtask.name}
                            </span>
                          </div>

                          {/* Description below */}
                          {subtask.description && (
                            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 mt-2 min-w-0">
                              <span className="font-bold">Description :</span>
                              <span className={`truncate max-w-[20rem] ${subtask.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                {subtask.description}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions removed here as they are placed at far right of first row */}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Documents Section - Enhanced */}
              {/* Dependencies */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-sora">Dependencies</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      className="micro-lift"
                      onClick={() => setIsAddDependencyOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dependency
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dependencyDetails.map((dep: any) => {
                    const depId = dep.task_id ?? dep.id;
                    return (
                      <div key={depId} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-white/50 micro-lift group">
                        {/* Toggle */}
                        <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => handleDependencyToggle(depId)}>
                          {(dep.status ?? '') === 'completed' ? <CheckCircle className="h-5 w-5 text-tasksmate-green-end" /> : <Circle className="h-5 w-5 text-gray-400" />}
                        </Button>

                        {/* Task ID */}
                        <CopyableIdBadge id={String(depId)} isCompleted={(dep.status ?? '') === 'completed'} />

                        {/* Owner, Status, Priority badges */}
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                          {(() => {
                            const { displayName } = deriveDisplayFromEmail((dep.assignee ?? '') as string);
                            return `👤 ${displayName}`;
                          })()}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${getStatusMeta((dep.status || 'not_started') as any).color}`}>
                          {getStatusMeta((dep.status || 'not_started') as any).label}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(dep.priority ?? 'none')}`}>{(dep.priority ?? 'none').toUpperCase()}</Badge>

                        {/* Project */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Project:</span>
                          <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                            {projectsMap[dep.project_id as string] ?? (dep.project_name ?? '—')}
                          </Badge>
                        </div>

                        {/* Dates */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Start date:</span>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {formatDate(dep.start_date ?? dep.created_at)}
                          </Badge>
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Due date:</span>
                          <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                            {dep.due_date ? formatDate(dep.due_date) : '—'}
                          </Badge>
                        </div>

                        {/* Created date */}
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Created:</span>
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                            {formatDate(dep.created_at)}
                          </Badge>
                        </div>

                        {/* Tags (show up to 2, then +N) */}
                        {Array.isArray(dep.tags) && dep.tags.length > 0 && (
                          <div className="inline-flex items-center gap-1 flex-wrap">
                            <span className="text-gray-600 text-xs">Tags:</span>
                            {dep.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <Badge key={`${depId}-tag-${idx}`} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                {tag}
                              </Badge>
                            ))}
                            {dep.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">+{dep.tags.length - 2}</Badge>
                            )}
                          </div>
                        )}

                        {/* Actions to the far right */}
                        <div className="ml-auto flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700" onClick={() => {
                            const url = `/tasks/${depId}${currentOrgId ? `?org_id=${currentOrgId}` : ''}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => handleDeleteDependency(depId)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Content Column */}
                        <div className="flex flex-col min-w-0 basis-full w-full mt-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 min-w-0">
                            <span className="font-bold">Title :</span>
                            <span className={`truncate max-w-[14rem] ${(dep.status ?? '') === 'completed' ? 'line-through text-gray-400' : ''}`}>
                              {dep.title ?? dep.name}
                            </span>
                          </div>
                          {dep.description && (
                            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 mt-2 min-w-0">
                              <span className="font-bold">Description :</span>
                              <span className={`truncate max-w-[20rem] ${(dep.status ?? '') === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                {dep.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Documents Section - Enhanced */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="font-sora">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">Drop files here or click to upload</p>
                      <p className="text-xs text-gray-400">Max 5 files</p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleAttachmentUpload(e.target.files)}
                      accept="*/*"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Uploaded Files:</h4>
                      {attachments.map((file, index) => (
                        <div key={file.attachment_id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                              {file.name}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(file.attachment_id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section - Collapsible */}
              <Card className="glass border-0 shadow-tasksmate">
                <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-sora flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>Comments ({comments.length})</span>
                        </CardTitle>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isCommentsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {/* Add new comment */}
                      <div className="mb-6">
                        <div className="flex">
                          <div className="flex-1 space-y-2">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="min-h-20 resize-none"
                            />
                            <div className="flex justify-end">
                              <Button
                                onClick={handleAddComment}
                                size="sm"
                                className="bg-tasksmate-gradient"
                                disabled={!newComment.trim()}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comments list */}
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.comment_id} className="flex space-x-3 group">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Avatar className="w-8 h-8 border border-white">
                                  <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                    {(() => {
                                      const creator = (comment.created_by || "") as string;
                                      const { initials } = deriveDisplayFromEmail(creator || "u");
                                      return initials || "U";
                                    })()}
                                  </AvatarFallback>
                                </Avatar>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-xs p-2">
                                {(() => {
                                  const creator = (comment.created_by || "") as string;
                                  const { displayName } = deriveDisplayFromEmail(creator || "user");
                                  return displayName;
                                })()}
                              </HoverCardContent>
                            </HoverCard>
                            <div className="flex-1">
                              {editingComment === comment.comment_id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="min-h-16 resize-none"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Button size="sm" onClick={handleSaveEdit}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm text-gray-700">
                                    {comment.content || comment.comment}
                                  </div>
                                  {(() => {
                                    const creator = String(comment.created_by || "").toLowerCase();
                                    const me = new Set([
                                      String(user?.id || "").toLowerCase(),
                                      String(user?.email || "").toLowerCase(),
                                      String(user?.user_metadata?.username || "").toLowerCase(),
                                    ]);
                                    const canEdit = creator && me.has(creator);
                                    return (
                                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => handleEditComment(comment.comment_id)}
                                          disabled={!canEdit}
                                          title={canEdit ? "Edit" : "Only author can edit"}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                          onClick={() => handleDeleteComment(comment.comment_id)}
                                          disabled={!canEdit}
                                          title={canEdit ? "Delete" : "Only author can delete"}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* AI Summary - Chat input removed */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-sora flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-tasksmate-green-end" />
                      <span>AI Summary</span>
                    </CardTitle>
                    <Button size="sm" variant="outline" className="text-xs">
                      Regen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {task.description}
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="font-sora">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Project</Label>
                      <Select
                        value={task.project_id}
                        onValueChange={(id) => { setTask((prev: any) => ({ ...prev, project_id: id })); }}
                      >
                        <SelectTrigger className="text-xs bg-cyan-100 text-cyan-800 rounded-full px-2 py-1 h-6 border-0 w-fit min-w-0 inline-flex hover:bg-cyan-100">
                          <SelectValue placeholder={projectName ?? task.project_name ?? '—'} />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {Object.entries(projectsMap).map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Start date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1 h-6 inline-flex items-center gap-1">
                            {formatDate(task.startDate ?? task.createdDate)}
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="p-2">
                          <CalendarPicker
                            mode="single"
                            selected={fromYMDLocal(task.startDate) || (task.createdDate ? new Date(task.createdDate) : undefined)}
                            onSelect={(d: any) => { if (!d) return; setTask((prev: any) => ({ ...prev, startDate: toYMDLocal(d) })); }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Due date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-xs bg-rose-100 text-rose-800 rounded-full px-2 py-1 h-6 inline-flex items-center gap-1">
                            {task.targetDate ? formatDate(task.targetDate) : '—'}
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="p-2">
                          <CalendarPicker
                            mode="single"
                            selected={fromYMDLocal(task.targetDate)}
                            onSelect={(d: any) => { if (!d) return; setTask((prev: any) => ({ ...prev, targetDate: toYMDLocal(d) })); }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Created</Label>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                          {formatDate(task.createdDate)}
                        </Badge>
                      </div>
                    </div>
                    {/* Owner row removed */}
                    {/* Tags */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Tags</Label>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(task.tags ?? []).slice(0, 3).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-800">{tag}</Badge>
                        ))}
                        {(task.tags ?? []).length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">+{(task.tags ?? []).length - 3}</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-purple-700 hover:text-purple-900"
                          onClick={() => setIsTagInputOpen((v) => !v)}
                          title="Add tag"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {isTagInputOpen && (
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="New tag"
                          className="h-8 w-40"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const trimmed = tagInput.trim();
                            if (!trimmed) return;
                            setTask((prev: any) => ({ ...prev, tags: [...(prev.tags ?? []), trimmed] }));
                            setTagInput("");
                            setIsTagInputOpen(false);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    )}

                    {/* Status and Priority moved to header */}
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <HistoryCard
                history={history}
                isLoading={loadingHistory}
                projectNameById={(id: string) => projectsMap[id]}
              />

              {/* <Card className="glass border-0 shadow-tasksmate">
                <CardHeader>
                  <CardTitle className="font-sora">History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">                   

                   {history.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="text-gray-900">{item.action}</div>
                          <div className="text-gray-500 text-xs">
                            {item.user?.name || 'System'} • {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))} 
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>

          {/* Footer Actions removed */}
        </main>

        {/* Modals */}
        {/* Replace legacy DuplicateTaskModal by reusing NewTaskModal with initialData */}
        <NewTaskModal
          open={isDuplicateOpen}
          onOpenChange={setIsDuplicateOpen}
          onTaskCreated={() => toast.success('Duplicated task created!')}
          initialData={{
            projectId: task?.project_id ?? task?.projectId,
            name: task?.name,
            description: task?.description,
            status: task?.status,
            priority: task?.priority,
            owner: task?.owner,
            startDate: task?.startDate ?? task?.createdDate,
            targetDate: task?.targetDate,
            tags: task?.tags ?? [],
          }}
        />
        <AddSubtaskModal
          open={isAddSubtaskOpen}
          onOpenChange={setIsAddSubtaskOpen}
          onSubtaskAdded={handleAddSubtask}
          excludeIds={[...(subtasks || []), ...(taskId ? [taskId] : [])]}
        />
        {/* Dependencies modal */}
        <AddDependencyModal
          open={isAddDependencyOpen}
          onOpenChange={setIsAddDependencyOpen}
          onDependencyAdded={handleAddDependency}
          excludeIds={[
            ...(Array.isArray(task?.dependencies) ? task.dependencies : []),
            ...(taskId ? [taskId] : []),
          ]}
        />
        {/* Edit Task - reuse NewTaskModal in edit mode */}
        {task && (
          <NewTaskModal
            open={isEditTaskOpen}
            onOpenChange={setIsEditTaskOpen}
            onTaskCreated={async (updated) => {
              setTask((prev: any) => ({ ...prev, ...updated }));
              setIsEditTaskOpen(false);
              toast.success('Task updated');
            }}
            initialData={{
              projectId: task.project_id ?? task.projectId,
              name: task.name,
              description: task.description,
              status: task.status,
              priority: task.priority,
              owner: task.owner,
              startDate: task.startDate ?? task.createdDate,
              targetDate: task.targetDate,
              tags: task.tags ?? [],
            }}
          />
        )}

        {/* Delete confirm dialog for Task */}
        {task && isDeleteTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl">
              <div className="mb-3">
                <div className="text-lg font-semibold">Delete Task</div>
                <div className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. Type the task ID
                  <span className="mx-1 inline-block align-middle">
                    <CopyableIdBadge id={task.id} />
                  </span>
                  to confirm deletion.
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-1">Enter Task ID</div>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Enter the task ID to confirm" />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setIsDeleteTaskOpen(false); setDeleteConfirmText(''); }}>Cancel</Button>
                <Button
                  className="bg-red-600 text-white"
                  disabled={deleteConfirmText !== task.id}
                  onClick={async () => {
                    try {
                      await api.del(`${API_ENDPOINTS.TASKS}/${task.id}`, {});
                      toast.success('Task deleted');
                      navigate(`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}` : ''}`);
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to delete task');
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskDetail;
