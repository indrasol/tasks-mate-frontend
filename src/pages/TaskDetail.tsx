import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CopyableIdBadge from "@/components/ui/copyable-id-badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronDown,
  Circle,
  Copy,
  Edit,
  ExternalLink,
  File,
  FileText,
  Link2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
// import DuplicateTaskModal from "@/components/tasks/DuplicateTaskModal";
import AddDependencyModal from "@/components/tasks/AddDependencyModal";
import AddSubtaskModal from "@/components/tasks/AddSubtaskModal";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import { API_ENDPOINTS } from "@/config";
import { api } from "@/services/apiService";
import { taskService } from "@/services/taskService";

import MainNavigation from "@/components/navigation/MainNavigation";
import HistoryCard from "@/components/tasks/HistoryCard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAuth } from "@/hooks/useAuth";
import { capitalizeFirstLetter, deriveDisplayFromEmail, formatDate, getPriorityColor, getStatusMeta } from "@/lib/projectUtils";
import imageCompression from "browser-image-compression";


const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [project_id, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // const isInitialMount = useRef({ status: status, priority: priority });
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
  // Editing toggles
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  // Delete comment modal
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  // @mention functionality
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionAnchorPos, setMentionAnchorPos] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  // Keyboard navigation for @mention suggestions
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);

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
  // Build possible identifiers for current user to match against task owner/creator
  const userIdentifiers = useMemo(() => {
    if (!user) return [] as string[];
    const ids: string[] = [];
    if (user.id) ids.push(String(user.id));
    // Supabase stores custom username inside user_metadata.username
    const metaUsername = (user as any)?.user_metadata?.username;
    if (metaUsername) ids.push(String(metaUsername));
    if (user.email) ids.push(String(user.email));
    if (user.email) {
      ids.push(deriveDisplayFromEmail(user.email).displayName);
    }
    return ids.map((x) => x.toLowerCase());
  }, [user]);

  // Allow delete only if current user is task owner/assignee or creator
  const canDeleteTask = useMemo(() => {
    if (!task) return false;
    const ownerString = String(task?.owner ?? '').toLowerCase();
    const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
    return (
      userIdentifiers.includes(ownerString) ||
      userIdentifiers.includes(ownerDisplay)
    );
  }, [task, userIdentifiers]);

  const currentOrgId = useCurrentOrgId();
  const { data: orgMembers = [] } = useOrganizationMembers(currentOrgId || '');  // Use empty string if undefined
  // const { data: membersData, refetch: refetchMembers } = useProjectMembers(id);

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

  const fetchTaskDetails = (showLoading = true) => {
    if (!taskId) return;
    if (showLoading) setLoading(true);
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
          is_editable: true,

          // is_editable: (user?.id === data.assignee || user?.id === data.created_by)
          //   || (user?.user_metadata?.username === data.assignee || user?.user_metadata?.username === data.created_by),
        };

        setTask(mapped);
        setTaskName(data.title);
        setDescription(data.description);
        setStatus(data.status);
        setPriority(data.priority);
        setAssignee(data.assignee);
        setProjectId(data.project_id);
        setStartDate(data.start_date);
        setTargetDate(data.due_date);
        setTags(data.tags);
        setSubtasks(data.sub_tasks || []);
        setLoading(false);
        fetchHistory();
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load task");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTaskDetails(true);
  }, [taskId]);

  // Fetch project name list for current org and map id
  useEffect(() => {
    if (!currentOrgId || !task?.project_id) return;
    (async () => {
      try {
        // Fetch *all* projects in the organization so we can resolve project names even for projects
        // the current user is not explicitly a member of.
        const projects = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}?show_all=true`);
        const map: Record<string, string> = {};
        projects.forEach((pr: any) => { map[pr.project_id] = pr.name; });
        setProjectsMap(map);
        const p = projects.find((x: any) => x.project_id === task?.project_id);
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
    taskService.getTaskHistory(taskId)
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
    if (!task || !task?.dependencies || !task?.dependencies.length) { setDependencyDetails([]); return; }
    Promise.all((task?.dependencies as string[]).map((id: string) => taskService.getTaskById(id) as Promise<any>))
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

  const handleSaveChanges = async (isPriorityChange?: string, isStatusChange?: string, isAssigneeChange?: string, isProjectChange?: string, isStartDateChange?: string, isTargetDateChange?: string, isTagsChange?: string[]) => {
    if (!taskId) return;
    try {
      const payload: any = {
        title: taskName,
        description,
        status: isStatusChange ?? status,
        priority: isPriorityChange ?? priority,
        assignee: isAssigneeChange ?? assignee,
      };
      if (isProjectChange || task?.project_id) payload.project_id = isProjectChange ?? task?.project_id;
      if (isStartDateChange || task?.startDate) payload.start_date = toYMDLocal(fromYMDLocal(isStartDateChange ?? task?.startDate) || new Date());
      if (isTargetDateChange || task?.targetDate) payload.due_date = toYMDLocal(fromYMDLocal(isTargetDateChange ?? task?.targetDate) || new Date());
      if (isTagsChange || Array.isArray(task?.tags)) payload.tags = isTagsChange ?? task?.tags;
      toast({
        title: "Saving changes...",
        description: "Please wait while we save your changes.",
        variant: "default"
      });
      await taskService.updateTask(taskId, payload);
      toast({
        title: "Success",
        description: "Task changes saved successfully!",
        variant: "default"
      });
      setIsTitleEditing(false);
      setIsDescriptionEditing(false);
      fetchHistory();

    } catch (err: any) {
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to save changes');
      toast({
        title: "Failed to save changes",
        description: msg,
        variant: "destructive"
      });
      fetchTaskDetails(false);
    }
  };


  const handleStatusChange = async (v: string) => {
    setStatus(v);
    setTask((prev: any) => ({ ...prev, status: v }));
    handleSaveChanges(null, v);
  };

  const handlePriorityChange = async (v: string) => {
    setPriority(v);
    setTask((prev: any) => ({ ...prev, priority: v }));
    handleSaveChanges(v, null);
  };

  const handleAssigneeChange = async (v: string) => {
    setAssignee(v);
    setTask((prev: any) => ({ ...prev, assignee: v }));
    handleSaveChanges(null, null, v);
  };

  const handleProjectChange = async (v: string) => {
    setProjectId(v);
    setTask((prev: any) => ({ ...prev, project_id: v }));
    handleSaveChanges(null, null, null, v);
  };

  const handleStartDateChange = async (v: string) => {
    setStartDate(v);
    setTask((prev: any) => ({ ...prev, startDate: v }));
    handleSaveChanges(null, null, null, null, v);
  };

  const handleTargetDateChange = async (v: string) => {
    setTargetDate(v);
    setTask((prev: any) => ({ ...prev, targetDate: v }));
    handleSaveChanges(null, null, null, null, null, v);
  };

  const handleTagsChange = async (v: string, isAdd: boolean) => {
    let tags = task?.tags || [];
    if (isAdd) {
      if (tags.includes(v)) return;
      tags.push(v);
    } else {
      tags = tags.filter((tag: string) => tag !== v);
    }
    setTags(tags);
    setTagInput('');
    setIsTagInputOpen(false);
    handleSaveChanges(null, null, null, null, null, null, tags);
  };



  // useEffect(() => {
  //   console.log(status,isInitialMount.current.status)
  //   if (status === '' || status === null || status === undefined) {
  //     return;
  //   }
  //   if(isInitialMount.current.status === status) {      
  //     return;
  //   }else{
  //     isInitialMount.current.status = status;
  //     handleSaveChanges();
  //   }

  // }, [status]);

  // useEffect(() => {
  //   if (priority === '' || priority === null || priority === undefined) {
  //     return;
  //   }
  //   if(isInitialMount.current.priority === priority) {
  //     return;
  //   }else{
  //     isInitialMount.current.priority = priority;
  //     handleSaveChanges();
  //   }

  // }, [priority]);

  // Toggle status via circle badge (completed ↔ not_started)
  const handleStatusToggle = async () => {
    if (!taskId) return;

    if (!task?.is_editable) {
      // toast({
      //   title: "Failed to update status",
      //   description: "You do not have permission to update this task?.",
      //   variant: "destructive"
      // });
      return;
    }
    // Determine new status
    const prevStatus = status;
    const newStatus = prevStatus === 'completed' ? 'not_started' : 'completed';

    // Optimistic UI update
    setStatus(newStatus);
    setTask((prev: any) => ({ ...prev, status: newStatus }));

    try {
      await taskService.updateTask(taskId, {
        status: newStatus,
        project_id: task?.project_id,
        title: taskName || task?.name
      });
      // Refresh history to reflect the change immediately
      fetchHistory();
    } catch (err: any) {
      // revert on failure
      setStatus(prevStatus);
      setTask((prev: any) => ({ ...prev, status: prevStatus }));
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to update status');
      toast({
        title: "Failed to update status",
        description: msg,
        variant: "destructive"
      });
    }
  };

  // File upload handlers
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - uploadedFiles.length);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Success",
      description: `${newFiles.length} file(s) uploaded successfully!`,
      variant: "default"
    });
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
    // handleFileUpload(e.dataTransfer.files);
    handleAttachmentUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileInputClick = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  };

  // @mention helpers
  const getCursorPosition = (textarea: HTMLTextAreaElement): number => {
    return textarea.selectionStart || 0;
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNewComment(newText);

    const curPos = getCursorPosition(e.target);
    setCursorPosition(curPos);

    // Get text before cursor
    const textBeforeCursor = newText.substring(0, curPos);

    // Show pop-over ONLY when the cursor is currently inside an @-mention that has no
    // terminating regular space/punctuation yet (i.e. the mention is still being typed).
    // NBSP (\u00A0) is treated as part of the mention so selecting a name will close it.
    const inProgressMatch = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);

    if (inProgressMatch) {
      // User is typing a mention → keep / open popover
      setMentionSearchText(inProgressMatch[1] || "");
      if (!showMentionPopover) setShowMentionPopover(true);
      setMentionActiveIndex(0);
    } else if (showMentionPopover) {
      // Cursor is no longer within a mention → close popover
      setShowMentionPopover(false);
    }
  };

  const handleSelectMention = useCallback((username: string) => {
    if (!commentInputRef.current) return;

    const textarea = commentInputRef.current;
    const text = textarea.value;
    const curPos = getCursorPosition(textarea);

    // Find the position of the @ character
    const textBeforeCursor = text.substring(0, curPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    // Insert the username (only if we found an @ symbol)
    if (atIndex !== -1) {
      // Find any text that was already typed after the @
      const mentionRegex = /@([\w]+(?:[\s-][\w]+)*)(?=[\s.,!?]|$)/g;
      const match = textBeforeCursor.match(mentionRegex);
      const typedAfterAt = match ? match[0].length : 0;

      // Replace regular spaces with non-breaking spaces so the mention is one contiguous token
      const usernameSafe = username.replace(/ /g, '\u00A0');

      // Create new text by replacing what was typed after @ with the selected username
      const newText =
        text.substring(0, atIndex + 1) + // Keep text up to and including @
        usernameSafe + ' ' + // Add username (with NBSP) and trailing regular space
        text.substring(curPos); // Keep text after cursor

      console.log('Adding mention:', username);
      console.log('New text:', newText);

      // Update the comment text
      setNewComment(newText);

      // Close the popover
      setShowMentionPopover(false);

      // Set focus back to textarea and place cursor after inserted username and space
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = atIndex + username.length + 2; // +2 for @ and space
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50); // Longer timeout to ensure focus works
    }
  }, []);

  // Handle click outside to close mention popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commentInputRef.current && !commentInputRef.current.contains(e.target as Node)) {
        setShowMentionPopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter organization members based on search text
  const filteredMembers = mentionSearchText
    ? orgMembers.filter(member => {
      // Check username, display name and email
      const searchLower = mentionSearchText.toLowerCase();
      const usernameMatch = member.email?.toLowerCase().includes(searchLower);
      const displayName = deriveDisplayFromEmail(member.email || '').displayName.toLowerCase();
      const displayNameMatch = displayName.includes(searchLower);

      return usernameMatch || displayNameMatch;
    })
    : orgMembers;

  // Function to render comment text with @mentions highlighted
  const renderCommentWithMentions = (text: string) => {
    if (!text) return null;

    // Regular expression to find @mentions. Names may contain non-breaking spaces (\u00A0) that we insert when the user selects from the popover.
    // The match stops before the first regular whitespace, punctuation, or line end.
    const mentionRegex = /@[\w\u00A0]+(?:[\u00A0-][\w\u00A0]+)*(?=[\s.,!?]|$)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Find all mentions and split the text
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add the mention with highlighting
      parts.push(
        <span key={`mention-${match.index}`} className="bg-blue-100 text-blue-800 px-1 rounded">
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Comment functions
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      // Create optimistic comment with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = {
        comment_id: tempId,
        content: newComment,
        created_by: user?.email || user?.id,
        created_at: new Date().toISOString(),
        task_id: taskId,
        isOptimistic: true
      };

      // Apply optimistic update
      setComments(prev => [optimisticComment, ...prev]);
      setNewComment("");

      const payload = {
        task_id: taskId,
        content: newComment,
        task_title: taskName || task?.name,
      };

      const created = await api.post(`${API_ENDPOINTS.TASK_COMMENTS}?project_id=${task?.project_id}`, payload);

      // Replace optimistic comment with real one
      setComments(prev => prev.map(c =>
        c.comment_id === tempId ? created : c
      ));

      toast({
        title: "Success",
        description: "Comment added",
        variant: "default"
      });
    } catch (err: any) {
      // Revert optimistic update on error
      setComments(prev => prev.filter(c => !c.isOptimistic));
      setNewComment(newComment); // Restore comment text
      toast({
        title: "Failed to add comment",
        description: err.message,
        variant: "destructive"
      });
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

    const originalComment = comments.find(c => c.comment_id === editingComment);
    const originalContent = originalComment?.content || originalComment?.comment || '';

    try {
      // Apply optimistic update
      setComments(prev => prev.map(c =>
        c.comment_id === editingComment
          ? { ...c, content: editCommentText, isEditing: true }
          : c
      ));

      const updated = await api.put(
        `${API_ENDPOINTS.TASK_COMMENTS}/${editingComment}?project_id=${task?.project_id}`,
        { content: editCommentText, task_title: taskName || task?.name }
      );

      setComments(prev => prev.map(c =>
        c.comment_id === editingComment ? Object.assign({}, updated, { isEditing: false }) : c
      ));

      setEditingComment(null);
      setEditCommentText("");
      toast({
        title: "Success",
        description: "Comment updated",
        variant: "default"
      });
    } catch (err: any) {
      // Revert on error
      setComments(prev => prev.map(c =>
        c.comment_id === editingComment
          ? { ...c, content: originalContent, isEditing: false }
          : c
      ));
      toast({
        title: "Failed to update comment",
        description: err.message,
        variant: "destructive"
      });
    }
  };
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };
  const handleDeleteComment = async (commentId: string) => {
    // Store comment for potential restoration
    const commentToDelete = comments.find(c => c.comment_id === commentId);

    try {
      // Optimistic removal
      setComments(prev => prev.filter(c => c.comment_id !== commentId));

      await api.del(`${API_ENDPOINTS.TASK_COMMENTS}/${commentId}?project_id=${task?.project_id}`, {});
      toast({
        title: "Success",
        description: "Comment deleted",
        variant: "default"
      });
    } catch (err: any) {
      // Restore comment on error
      if (commentToDelete) {
        setComments(prev => [...prev, commentToDelete]);
      }
      toast({
        title: "Failed to delete comment",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // For add/delete/toggle subtask, update backend (if supported)
  const handleAddSubtask = async (selectedTask: any) => {
    if (!taskId) return;
    try {
      await taskService.addSubtask(taskId, selectedTask?.id);
      setSubtasks(prev => [...prev, selectedTask?.id]);
      toast({
        title: "Success",
        description: `Subtask "${selectedTask?.name}" added successfully!`,
        variant: "default"
      });
      fetchHistory();
    } catch (err: any) {
      toast({
        title: "Failed to add subtask",
        description: err.message,
        variant: "destructive"
      });
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
      toast({
        title: "Success",
        description: "Subtask deleted successfully!",
        variant: "default"
      });
      fetchHistory();
    } catch (err: any) {
      toast({
        title: "Failed to delete subtask",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Dependencies handlers
  const handleAddDependency = async (selectedTask: any) => {
    if (!taskId) return;
    try {
      await taskService.addDependency(taskId, selectedTask?.id);
      setTask((prev: any) => ({ ...prev, dependencies: [...(prev?.dependencies ?? []), selectedTask?.id] }));
      setDependencyDetails((prev: any[]) => [...prev, selectedTask]);
      toast({
        title: "Success",
        description: `Dependency "${selectedTask?.name}" added successfully!`,
        variant: "default"
      });
      fetchHistory();
    } catch (err: any) {
      toast({
        title: "Failed to add dependency",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!taskId) return;
    try {
      await taskService.removeDependency(taskId, dependencyId);
      setTask((prev: any) => ({ ...prev, dependencies: (prev?.dependencies ?? []).filter((id: string) => id !== dependencyId) }));
      setDependencyDetails((prev: any[]) => prev.filter((d: any) => (d.task_id ?? d.id) !== dependencyId));
      toast({
        title: "Success",
        description: "Dependency removed successfully!",
        variant: "default"
      });
      fetchHistory();
    } catch (err: any) {
      toast({
        title: "Failed to remove dependency",
        description: err.message,
        variant: "destructive"
      });
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
  const handleImageUpload = async (file: File) => {
    if (!file || !task?.project_id || !taskId) return;
    try {
      if (file.type.startsWith("image/")) {
        try {
          // compress images
          const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            alwaysKeepResolution: true,
            maxIteration: 2,
          });

          const data: any = await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, compressed, file.name, true);
          if (data?.url) {
            return data?.url;
          }
        } catch (err: any) {
          toast({
            title: "Failed to compress image, uploading original file",
            description: err.message,
            variant: "destructive"
          });
          // other files - add as is
          const data: any = await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, file, file.name, true);
          if (data?.url) {
            return data?.url;
          }
        }
      } else {
        // other files - add as is
        const data: any = await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, file, file.name, true);
        if (data?.url) {
          return data?.url;
        }
      }

    } catch (err: any) {
      toast({
        title: "Failed to upload image",
        description: err.message,
        variant: "destructive"
      });
    }
    return URL.createObjectURL(file);
  };

  const [fileUploadingProgress, setFileUploadingProgress] = useState(0);
  const [fileUploadingTotal, setFileUploadingTotal] = useState(0);
  const [fileUploadingPercentage, setFileUploadingPercentage] = useState(0);
  const [fileUploadingName, setFileUploadingName] = useState("");

  // Attachment upload
  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || !task?.project_id || !taskId) return;
    try {
      setFileUploadingTotal(files.length);
      for (const file of Array.from(files)) {
        setFileUploadingProgress((prev: number) => prev + 1);
        setFileUploadingName(file.name);
        const percentage = Math.round((fileUploadingProgress / fileUploadingTotal) * 100);
        setFileUploadingPercentage(percentage);
        if (file.type.startsWith("image/")) {
          try {
            // compress images
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              alwaysKeepResolution: true,
              maxIteration: 2,
            });

            await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, compressed, file.name, false);
            fetchAttachments();
          } catch (err: any) {
            toast({
              title: "Failed to compress image, uploading original file",
              description: err.message,
              variant: "destructive"
            });
            // other files - add as is
            await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, file, file.name, false);
            fetchAttachments();
          }
        } else {
          // other files - add as is
          await taskService.uploadTaskAttachmentForm(task?.project_id, taskId, file, file.name, false);
          fetchAttachments();
        }
      }

      toast({
        title: "Success",
        description: "Attachment(s) uploaded!",
        variant: "default"
      });

    } catch (err: any) {
      toast({
        title: "Failed to upload attachment",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setFileUploadingProgress(0);
      setFileUploadingTotal(0);
      setFileUploadingName("");
      setFileUploadingPercentage(0);
    }
    fetchHistory();
  };

  const fetchAttachments = async () => {
    if (!task?.project_id || !taskId) return;
    try {
      const data: any[] = await taskService.getTaskAttachments(taskId);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: "Failed to fetch attachments",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task?.project_id) return;
    try {
      await taskService.deleteTaskAttachment(attachmentId, task?.project_id);
      setAttachments(attachments.filter(a => a.attachment_id !== attachmentId));
      toast({
        title: "Success",
        description: "Attachment deleted!",
        variant: "default"
      });
      fetchHistory();
    } catch (err: any) {
      toast({
        title: "Failed to delete attachment",
        description: err.message,
        variant: "destructive"
      });
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



  // In the render, show loading/error states for attachments/history
  // if (loadingAttachments) return <div className="p-8 text-center">Loading attachments...</div>;
  // if (attachmentsError) return <div className="p-8 text-center text-red-500">{attachmentsError}</div>;
  // if (loadingHistory) return <div className="p-8 text-center">Loading history...</div>;
  // if (historyError) return <div className="p-8 text-center text-red-500">{historyError}</div>;

  // Keyboard navigation handler for the comment textarea when the mention popover is open
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionPopover || filteredMembers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionActiveIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionActiveIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const member = filteredMembers[mentionActiveIndex];
      if (member) {
        const { displayName } = deriveDisplayFromEmail(member.email || '');
        handleSelectMention(displayName);
      }
    } else if (e.key === 'Escape') {
      setShowMentionPopover(false);
    }
  };

  if (loading) {
    // return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div></div>;

    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="min-h-screen px-6 py-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading task details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  else if (error) {
    // return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="min-h-screen px-6 py-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-red-500">Error loading task details <br></br> {error}</p>
              <Button
                className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                onClick={() => fetchTaskDetails(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  else {

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
                {task?.is_editable && (
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
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">

                    <CopyableIdBadge id={task?.id} isCompleted={status === 'completed'} />

                    {/* <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                    {(() => {
                      const { displayName } = deriveDisplayFromEmail((task?.owner ?? '') as string);
                      return `👤 ${displayName}`;
                    })()}
                  </Badge> */}
                    <Select value={assignee} disabled={!task?.is_editable} onValueChange={handleAssigneeChange}>
                      <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        {orgMembers?.map((m) => {
                          const username = ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id;
                          const { displayName } = deriveDisplayFromEmail(username);
                          return (
                            <SelectItem key={m.user_id} value={String(username)}>
                              {displayName} {m.designation ? `(${capitalizeFirstLetter(m.designation)})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {/* Status selector (moved from Details card) */}
                    <Select value={status} disabled={!task?.is_editable} onValueChange={handleStatusChange}>
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
                    <Select value={priority} disabled={!task?.is_editable} onValueChange={handlePriorityChange}>
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
                    {task?.is_editable && canDeleteTask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => setIsDeleteTaskOpen(true)}
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {/* Title */}
                  <div className="mt-2 flex items-start gap-2">
                    {isTitleEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          className={`text-2xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${status === 'completed' ? 'line-through text-gray-400' : ''}`}
                        />
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={async () => {
                              await handleSaveChanges();
                              setIsTitleEditing(false);
                            }}
                            title="Save title"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={async () => {
                              setIsTitleEditing(false);
                            }}
                            title="Cancel"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      </div>
                    ) : (
                      <>
                        <span className={`text-2xl font-sora font-bold ${status === 'completed' ? 'line-through text-gray-400' : ''}`}>{taskName}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsTitleEditing(true)} disabled={!task?.is_editable}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    {/* Tags removed, now in Details card */}
                  </div>
                </div>

                {/* Right actions (Duplicate only) */}
                <div className="ml-4 flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-sora">Description</CardTitle>
                      {isDescriptionEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={async () => {
                              await handleSaveChanges();
                              setIsDescriptionEditing(false);
                            }}
                            title="Save description"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={async () => {
                              setIsDescriptionEditing(false);
                            }}
                            title="Cancel"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setIsDescriptionEditing(true)}
                          disabled={!task?.is_editable}
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task?.is_editable && isDescriptionEditing ? (
                      <RichTextEditor
                        content={description}
                        onChange={(content) => setDescription(content)}
                        placeholder="Add a detailed description..."
                        onImageUpload={handleImageUpload}
                        className="min-h-[175px]"
                      />
                    ) : (
                      <RichTextEditor
                        content={description}
                        hideToolbar
                        className="min-h-[175px]"
                      />

                      // <div
                      //   className="prose max-w-none text-gray-700"
                      //   dangerouslySetInnerHTML={{ __html: description || '<p>No description</p>' }}
                      // />
                    )}
                  </CardContent>
                </Card>

                {/* Subtasks - Commented out as requested
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
                    const subtaskId = subtask?.task_id ?? subtask?.id;
                    return (
                      <div key={subtaskId} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-white/50 micro-lift group">
                        
                        <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => handleSubtaskToggle(subtaskId)}>
                          {subtask?.status === 'completed' ? <CheckCircle className="h-5 w-5 text-tasksmate-green-end" /> : <Circle className="h-5 w-5 text-gray-400" />}
                        </Button>

                        
                        <CopyableIdBadge id={String(subtaskId)} isCompleted={subtask?.status === 'completed'} />

                        
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                          {(() => {
                            const { displayName } = deriveDisplayFromEmail((subtask?.assignee ?? '') as string);
                            return `👤 ${displayName}`;
                          })()}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${getStatusMeta((subtask?.status || 'not_started') as any).color}`}>
                          {getStatusMeta((subtask?.status || 'not_started') as any).label}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask?.priority ?? 'none')}`}>{(subtask?.priority ?? 'none').toUpperCase()}</Badge>

                        
                        <div className="inline-flex items-center gap-1">
                          <span className="text-gray-600 text-xs">Due date:</span>
                          <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                            {subtask?.due_date ? formatDate(subtask?.due_date) : '—'}
                          </Badge>
                        </div>

                        
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

                        
                        <div className="flex flex-col min-w-0 basis-full w-full mt-1">
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 min-w-0">
                            
                            <span className={`font-bold truncate max-w-[14rem] ${subtask?.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                              {subtask?.title ?? subtask?.name}
                            </span>
                          </div>

                          
                        </div>

                        
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              */}

                {/* Documents Section - Enhanced */}
                {/* Dependencies */}
                <Card className="glass border-0 shadow-tasksmate">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-sora flex items-center space-x-2">
                        <Link2 className="h-4 w-4" />
                        <span>Dependencies ({dependencyDetails?.length ?? 0})</span>
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="micro-lift"
                        onClick={() => setIsAddDependencyOpen(true)}
                        disabled={!task?.is_editable}
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
                          <Button variant="ghost" size="sm" className="p-0 h-auto" disabled={!task?.is_editable} onClick={() => handleDependencyToggle(depId)}>
                            {(dep.status ?? '') === 'completed' ? <CheckCircle className="h-5 w-5 text-tasksmate-green-end" /> : <Circle className="h-5 w-5 text-gray-400" />}
                          </Button>

                          {/* Task ID */}
                          <CopyableIdBadge id={String(depId)} isCompleted={(dep.status ?? '') === 'completed'} />

                          {/* Owner, Status, Priority badges */}
                          <Badge key='owner' variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                            {(() => {
                              const { displayName } = deriveDisplayFromEmail((dep.assignee ?? '') as string);
                              return `👤 ${displayName}`;
                            })()}
                          </Badge>
                          <Badge key='status' variant="secondary" className={`text-xs ${getStatusMeta((dep.status || 'not_started') as any).color}`}>
                            {getStatusMeta((dep.status || 'not_started') as any).label}
                          </Badge>
                          <Badge key='priority' variant="outline" className={`text-xs ${getPriorityColor(dep.priority ?? 'none')}`}>{(dep.priority ?? 'none').toUpperCase()}</Badge>

                          {/* Project and Start date removed as requested */}
                          <div className="inline-flex items-center gap-1">
                            <span className="text-gray-600 text-xs">Due date:</span>
                            <Badge key='due_date' variant="secondary" className="text-xs bg-rose-100 text-rose-800">
                              {dep.due_date ? formatDate(dep.due_date) : '—'}
                            </Badge>
                          </div>

                          {/* Created date removed as requested */}

                          {/* Tags removed as requested */}

                          {/* Actions to the far right */}
                          <div className="ml-auto flex items-center gap-1">
                            <Button key='open_task' variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700" onClick={() => {
                              const url = `/tasks/${depId}${currentOrgId ? `?org_id=${currentOrgId}` : ''}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button key='delete_task' variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" disabled={!task?.is_editable} onClick={() => handleDeleteDependency(depId)}>
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
                            {/* {dep.description && (
                            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 mt-2 min-w-0">
                              <span className="font-bold">Description :</span>
                              <span className={`truncate max-w-[20rem] ${(dep.status ?? '') === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                {dep.description}
                              </span>
                            </div>
                          )} */}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Documents Section - Enhanced */}
                <Card className="glass border-0 shadow-tasksmate">
                  <CardHeader>
                    <CardTitle className="font-sora flex items-center space-x-2">
                      <File className="h-4 w-4" />
                      <span>Attachments ({attachments?.length ?? 0})</span>
                    </CardTitle>
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
                        disabled={!task?.is_editable}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-4 right-4"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!task?.is_editable}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {fileUploadingProgress > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Uploading {fileUploadingProgress} of {fileUploadingTotal} files - {fileUploadingName}</h4>
                        <Progress value={fileUploadingPercentage} />
                      </div>
                    )}

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
                              disabled={!task?.is_editable}
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
                              <div className="relative">
                                <Textarea
                                  onKeyDown={handleTextareaKeyDown}
                                  ref={commentInputRef}
                                  value={newComment}
                                  disabled={!task?.is_editable}
                                  onChange={handleCommentChange}
                                  onClick={() => setShowMentionPopover(false)}
                                  placeholder="Add a comment... (Type @ to mention someone)"
                                  className="min-h-20 resize-none"
                                />

                                {/* @mention popover */}
                                {showMentionPopover && (
                                  <div
                                    className="absolute z-50 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto w-64"
                                    style={{
                                      top: 30, // Position below cursor
                                      left: 10
                                    }}
                                  >
                                    <div className="p-1">
                                      <div className="px-2 py-1 text-sm font-semibold border-b border-gray-100 mb-1 bg-blue-50 text-blue-800 rounded-t">
                                        @Mention Team Member
                                      </div>
                                      {filteredMembers.length === 0 ? (
                                        <div className="px-2 py-1 text-sm text-gray-500">No members found</div>
                                      ) : (
                                        filteredMembers.map((member, idx) => {
                                          const { displayName } = deriveDisplayFromEmail(member.email || '');
                                          return (
                                            <button
                                              key={member.id || member.user_id}
                                              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors ${idx === mentionActiveIndex ? 'bg-blue-100' : 'hover:bg-gray-100 hover:bg-blue-50 active:bg-blue-100'}`}
                                              type="button"
                                              onMouseDown={(e) => {
                                                // Using onMouseDown instead of onClick to prevent focus issues
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleSelectMention(displayName);
                                              }}
                                            >
                                              <Avatar className="h-5 w-5">
                                                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-800">
                                                  {displayName.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="text-sm font-medium">{displayName}</span>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  onClick={handleAddComment}
                                  size="sm"
                                  className="bg-tasksmate-gradient"
                                  disabled={!newComment.trim() || !task?.is_editable}
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
                                    <div className="relative">
                                      <Textarea
                                        value={editCommentText}
                                        onChange={(e) => {
                                          setEditCommentText(e.target.value);
                                          // You could implement @mention in edit mode too if needed
                                        }}
                                        disabled={!task?.is_editable}
                                        className="min-h-16 resize-none"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button size="sm" onClick={handleSaveEdit}
                                        disabled={!task?.is_editable}
                                      >
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
                                      {renderCommentWithMentions(comment.content || comment.comment)}
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
                                            disabled={!canEdit || !task?.is_editable}
                                            title={canEdit ? "Edit" : "Only author can edit"}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            onClick={() => setDeleteCommentId(comment.comment_id)}
                                            disabled={!canEdit || !task?.is_editable}
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
                {/* <Card className="glass border-0 shadow-tasksmate">
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
                   
                    Generating the summary...
                  </div>
                </CardContent>
              </Card> */}

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
                          value={task?.project_id}
                          onValueChange={handleProjectChange}
                          disabled={!task?.is_editable}
                        >
                          <SelectTrigger className="text-xs bg-cyan-100 text-cyan-800 rounded-full px-2 py-1 h-6 border-0 w-fit min-w-0 inline-flex hover:bg-cyan-100">
                            <SelectValue placeholder={projectName ?? task?.project_name ?? '—'} />
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
                            <button className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1 h-6 inline-flex items-center gap-1"
                              disabled={!task?.is_editable}
                            >
                              {formatDate(task?.startDate ?? task?.createdDate)}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="p-2">
                            <CalendarPicker
                              mode="single"
                              selected={fromYMDLocal(task?.startDate) || (task?.createdDate ? new Date(task?.createdDate) : undefined)}
                              onSelect={(v: Date) => handleStartDateChange(toYMDLocal(v))}
                              disabled={!task?.is_editable}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-600">Due date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-xs bg-rose-100 text-rose-800 rounded-full px-2 py-1 h-6 inline-flex items-center gap-1"
                              disabled={!task?.is_editable}
                            >
                              {task?.targetDate ? formatDate(task?.targetDate) : '—'}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="p-2">
                            <CalendarPicker
                              mode="single"
                              selected={fromYMDLocal(task?.targetDate)}
                              onSelect={(v: Date) => handleTargetDateChange(toYMDLocal(v))}
                              disabled={!task?.is_editable}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-600">Created</Label>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                            {formatDate(task?.createdDate)}
                          </Badge>
                        </div>
                      </div>
                      {/* Owner row removed */}
                      {/* Tags */}
                      <div className="flex items-end justify-end">
                        {/* <Label className="text-sm text-gray-600">Tags</Label> */}
                        <div className="flex items-end justify-end gap-1 flex-wrap">
                          {(task?.tags ?? []).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-800">{
                              <>
                                <span>{tag}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleTagsChange(tag, false)}
                                  title="Remove Tag"
                                  disabled={!task?.is_editable}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            }</Badge>
                          ))}
                          {(task?.tags ?? []).length > 3 && (
                            <Badge key='tags_count' variant="secondary" className="text-xs bg-gray-100 text-gray-600">+{(task?.tags ?? []).length - 3}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-purple-700 hover:text-purple-900"
                            onClick={() => setIsTagInputOpen((v) => !v)}
                            title="Add tag"
                            disabled={!task?.is_editable}
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
                            onClick={(e) => handleTagsChange(tagInput, true)}
                            disabled={!task?.is_editable}
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
            onTaskCreated={() => toast({
              title: "Success",
              description: "Duplicated task created!",
              variant: "default"
            })}
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
          {task?.is_editable && (
            <AddSubtaskModal
              open={isAddSubtaskOpen}
              onOpenChange={setIsAddSubtaskOpen}
              onSubtaskAdded={handleAddSubtask}
              excludeIds={[...(subtasks || []), ...(taskId ? [taskId] : [])]}
              projectId={task?.project_id ?? task?.projectId}
              taskId={taskId}
              owner={task?.owner || user?.email || ''} // Default to current user if no owner set
            />
          )}
          {/* Dependencies modal */}
          {task?.is_editable && (
            <AddDependencyModal
              open={isAddDependencyOpen}
              onOpenChange={setIsAddDependencyOpen}
              onDependencyAdded={handleAddDependency}
              excludeIds={[
                ...(Array.isArray(task?.dependencies) ? task?.dependencies : []),
                ...(taskId ? [taskId] : []),
              ]}
            />
          )}
          {/* Edit Task - reuse NewTaskModal in edit mode */}
          {
            task && (
              <NewTaskModal
                open={isEditTaskOpen}
                onOpenChange={setIsEditTaskOpen}
                onTaskCreated={async (updated) => {
                  setTask((prev: any) => ({ ...prev, ...updated }));
                  setIsEditTaskOpen(false);
                  toast({
                    title: "Success",
                    description: "Task updated!",
                    variant: "default"
                  });
                }}
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
            )
          }

          {/* Delete confirm dialog for Task */}
          {task?.is_editable &&
            task && isDeleteTaskOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl">
                  <div className="mb-3">
                    <div className="text-lg font-semibold">Delete Task</div>
                    <div className="text-sm text-gray-600 mt-1">
                      This action cannot be undone. Type the task ID
                      <span className="mx-1 inline-block align-middle">
                        <CopyableIdBadge id={task?.id} />
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
                      disabled={deleteConfirmText !== task?.id}
                      onClick={async () => {
                        try {
                          await api.del(`${API_ENDPOINTS.TASKS}/${task?.id}`, {});
                          toast({
                            title: "Success",
                            description: "Task deleted!",
                            variant: "default"
                          });
                          navigate(`/tasks_catalog${currentOrgId ? `?org_id=${currentOrgId}` : ''}`);
                        } catch (e: any) {
                          toast({
                            title: "Failed to delete task",
                            description: e?.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          }
          {/* Delete Comment Confirm Dialog */}
          {task?.is_editable && (
            <Dialog open={!!deleteCommentId} onOpenChange={(open) => { if (!open) setDeleteCommentId(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Comment</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">Are you sure you want to delete this comment? This action cannot be undone.</p>
                <DialogFooter className="justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteCommentId(null)}>Cancel</Button>
                  <Button className="bg-red-600 text-white" onClick={() => { if (deleteCommentId) handleDeleteComment(deleteCommentId); setDeleteCommentId(null); }}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div >

      </div >
    );
  }
};

export default TaskDetail;
