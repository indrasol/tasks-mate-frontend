import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FileText
} from "lucide-react";
import { toast } from "sonner";
import DuplicateTaskModal from "@/components/tasks/DuplicateTaskModal";
import AddSubtaskModal from "@/components/tasks/AddSubtaskModal";
import { taskService } from "@/services/taskService";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";

import { getStatusMeta, getPriorityColor } from "@/lib/projectUtils";
import MainNavigation from "@/components/navigation/MainNavigation";

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
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
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
    "planning",
    "in_progress",
    "on_hold",
    "on-hold",
    "completed",
    "archived",
    "not_started",
    "active",
  ] as const;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    taskService.getTaskById(taskId)
      .then((data: any) => {
        setTask(data);
        setTaskName(data.title);
        setDescription(data.description);
        setStatus(data.status);
        setPriority(data.priority);
        setSubtasks(data.sub_tasks || []);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load task");
        setLoading(false);
      });
  }, [taskId]);

  // Fetch comments from backend
  // useEffect(() => {
  //   if (!taskId) return;
  //   setLoadingComments(true);
  //   setCommentsError(null);
  //   api.get(`/api/v1/tasks/comments?task_id=${taskId}`)
  //     .then((data:any[]) => {
  //       setComments(data || []);
  //       setLoadingComments(false);
  //     })
  //     .catch((err) => {
  //       setCommentsError(err.message || "Failed to load comments");
  //       setLoadingComments(false);
  //     });
  // }, [taskId]);

  // Fetch attachments
  // useEffect(() => {
  //   if (!taskId) return;
  //   setLoadingAttachments(true);
  //   setAttachmentsError(null);
  //   taskService.getTaskAttachments(taskId)
  //     .then((data: any[]) => {
  //       setAttachments(data || []);
  //       setLoadingAttachments(false);
  //     })
  //     .catch((err: any) => {
  //       setAttachmentsError(err.message || "Failed to load attachments");
  //       setLoadingAttachments(false);
  //     });
  // }, [taskId]);
  // Fetch history
  // useEffect(() => {
  //   if (!taskId) return;
  //   setLoadingHistory(true);
  //   setHistoryError(null);
  //   taskService.getTaskHistory(taskId)
  //     .then((data: any[]) => {
  //       setHistory(data || []);
  //       setLoadingHistory(false);
  //     })
  //     .catch((err: any) => {
  //       setHistoryError(err.message || "Failed to load history");
  //       setLoadingHistory(false);
  //     });
  // }, [taskId]);
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
      await taskService.updateTask(taskId, {
        name: taskName,
        description,
        status,
      });
      toast.success('Task changes saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
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
      };
      const created = await api.post(`${API_ENDPOINTS.TASK_COMMENTS}?project_id=${task?.project_id}`, payload);
      setComments([created, ...comments]);
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
      const updated = await api.put(`${API_ENDPOINTS.TASK_COMMENTS}/${editingComment}?project_id=${task?.project_id}`, { content: editCommentText });
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
    try {
      // Add subtask ID to sub_tasks array and update backend
      const updatedSubtasks = [...subtasks, selectedTask.id];
      await taskService.updateTask(taskId, { sub_tasks: updatedSubtasks });
      setSubtasks(updatedSubtasks);
      toast.success(`Subtask "${selectedTask.name}" added successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subtask');
    }
  };
  const handleSubtaskToggle = async (subtaskId: string) => {
    // Toggle logic can be implemented if backend supports subtask status
  };
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const updatedSubtasks = subtasks.filter((id) => id !== subtaskId);
      await taskService.updateTask(taskId, { sub_tasks: updatedSubtasks });
      setSubtasks(updatedSubtasks);
      toast.success('Subtask deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete subtask');
    }
  };

  // Attachment upload
  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || !task?.project_id || !taskId) return;
    try {
      for (const file of Array.from(files)) {
        // 1. Upload to Supabase Storage
        const { url, path, attachmentId } = await taskService.uploadTaskAttachmentToStorage({
          projectId: task.project_id,
          taskId,
          file,
        });
        // 2. Save metadata to backend
        await taskService.uploadTaskAttachment(task.project_id, {
          task_id: taskId,
          name: file.name,
          url,
          path,
          attachment_id: attachmentId,
        });
      }
      // Refresh attachments
      const data: any[] = await taskService.getTaskAttachments(taskId);
      if (data)
        setAttachments(data);
      else
        setAttachments([])
      toast.success('Attachment(s) uploaded!');
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


        <nav className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-gray-200" >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/tasks_catalog" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Catalog</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-sora font-bold">TasksMate</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Avatar className="w-8 h-8">
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="px-6 py-6 bg-white/30 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-1 h-12 rounded-full ${getStatusColor(task.status)}`}></div>
                <div>
                  <Badge className="text-xs font-mono bg-green-600 text-white mb-2">
                    {task.task_id}
                  </Badge>
                  <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="text-2xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {getStatusMeta(s as any).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
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
                    className="min-h-32 border-0 bg-transparent resize-none focus-visible:ring-0"
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
                  {subtasks.map((subtaskId) => {
                    const subtask = task.sub_tasks?.find(s => s.id === subtaskId);
                    if (!subtask) return null; // Should not happen if subtasks are fetched correctly
                    return (
                      <div key={subtaskId} className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 micro-lift group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => handleSubtaskToggle(subtaskId)}
                        >
                          {subtask.completed ? (
                            <CheckCircle className="h-5 w-5 text-tasksmate-green-end" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className={`font-medium ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                            {subtask.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{subtask.owner}</span>
                            <span>•</span>
                            <span>{new Date(subtask.due).toLocaleDateString()}</span>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {subtaskId}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          className={`text-xs ${subtask.status === 'completed' ? 'bg-green-100 text-green-800' :
                            subtask.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              subtask.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {subtask.status === 'completed' ? 'Completed' :
                            subtask.status === 'in-progress' ? 'In Progress' :
                              subtask.status === 'blocked' ? 'Blocked' :
                                'To Do'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteSubtask(subtaskId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
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
                        <div className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>CU</AvatarFallback>
                          </Avatar>
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
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {comment.user?.avatar || 'CU'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium">{comment.user?.name || 'Current User'}</span>
                                  <span className="text-gray-500 ml-2">{comment.created_at}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditComment(comment.comment_id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteComment(comment.comment_id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
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
                                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  {comment.content}
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
                      <Label className="text-sm text-gray-600">Created</Label>
                      <span className="text-sm">{new Date(task.createdDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Target Date</Label>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{new Date(task.targetDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Owner</Label>
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">SK</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.owner}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-600">Status</Label>
                      <Badge className={`${getStatusBadge(task.status)} text-xs`}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <Card className="glass border-0 shadow-tasksmate">
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
              </Card>
            </div>
          </div>

          {/* Footer Actions - Updated */}
          <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
        </main>

        {/* Modals */}
        <DuplicateTaskModal
          open={isDuplicateOpen}
          onOpenChange={setIsDuplicateOpen}
          sourceTask={task}
        />
        <AddSubtaskModal
          open={isAddSubtaskOpen}
          onOpenChange={setIsAddSubtaskOpen}
          onSubtaskAdded={handleAddSubtask}
        />
      </div>

    </div>
  );
};

export default TaskDetail;
