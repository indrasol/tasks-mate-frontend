import MainNavigation from '@/components/navigation/MainNavigation';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { capitalizeFirstLetter, deriveDisplayFromEmail, formatDate, getPriorityColor, getStatusMeta } from "@/lib/projectUtils";
import { api } from '@/services/apiService';
import { BackendOrgMember } from '@/types/organization';
import { TaskCreateInitialData } from '@/types/tasks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import imageCompression from "browser-image-compression";
import { format } from 'date-fns';
import { ArrowLeft, Clock, Edit3, Loader2, Pencil, Save, Send, Trash2, Upload, X, File, FileText, Plus, MessageCircle, ChevronDown, Edit, Link2, CheckCircle, Circle, ExternalLink, } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bugService } from '@/services/bugService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { taskService } from "@/services/taskService";

interface BugComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

interface BugEvidence {
  id: string;
  type: string;
  name: string;
  url: string;
  uploaded_at: string;
}

interface BugDetails {
  closed?: boolean;
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  tags: string[];
  created_at: string;
  updated_at: string;
  recreate_guide: string;
  run_id: string;
  project_id: string;
  project_name: string;
  is_editable: boolean;
  tracker_id?: string;
  dependencies?: string[];
}

const BugDetail = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const { id: runId, bugId } = useParams();
  const currentOrgId = useCurrentOrgId();
  const queryClient = useQueryClient();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string>('');
  // const [bug, setBug] = useState<BugDetails | null>(null);

  const [bugName, setBugName] = useState('');
  const [description, setDescription] = useState('');
  const [recreateGuide, setRecreateGuide] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState('');
  const [project_id, setProjectId] = useState('');

  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [isRecreateGuideEditing, setIsRecreateGuideEditing] = useState(false);


  // @mention functionality
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionAnchorPos, setMentionAnchorPos] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const { data: orgMembersRaw = [] } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);
  const { user } = useAuth();

  const navigate = useNavigate();

  // Fetch bug details

  // useEffect(() => {
  //   if (bugId) {
  //     fetchBugDetails(false);
  //   }
  // }, [bugId]);

  // const fetchBugDetails = async (isRefetch?: boolean) => {
  //   setLoading(true);
  //   setError('');
  //   try {
  //     const response: any = await api.get<any>(`${API_ENDPOINTS.BUGS}/${bugId}`);
  //     if (response.data) {

  //       response.data.is_editable = true;
  //       setBug(response.data);
  //       setBugName(response.data.title);
  //       setDescription(response.data.description);
  //       setRecreateGuide(response.data.recreate_guide);
  //       setPriority(response.data.priority);
  //       setStatus(response.data.status);
  //       setAssignee(response.data.assignee);
  //       setProjectId(response.data.project_id);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching bug details:', error);
  //     setError('Failed to fetch bug details. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const { data: bug, isLoading: loading, error } = useQuery<BugDetails>({
    queryKey: ['bug', bugId],
    queryFn: async () => {
      try {
        // const response: any = await api.get<any>(`${API_ENDPOINTS.BUGS}/${bugId}`);
        // return {
        //   id: response?.id,
        //   title: response?.title,
        //   description: response?.description,
        //   severity: response?.severity,
        //   status: response?.status,
        //   tags: response?.tags,
        //   createdAt: response?.created_at,
        //   updatedAt: response?.updated_at,
        //   recreate_guide: response?.recreate_guide,
        //   run_id: response?.run_id,
        //   project_id: response?.project_id,
        //   project_name: response?.project_name,
        // };
        const response = await api.get<any>(`${API_ENDPOINTS.BUGS}/${bugId}`);

        if (response) {
          setBugName(response.title);
          setDescription(response.description);
          setRecreateGuide(response.steps_to_reproduce);
          setPriority(response.priority);
          setStatus(response.status);
          setAssignee(response.assignee);
          setProjectId(response.project_id);
          response.is_editable = true;
        }
        return response;

      } catch (error) {
        console.error('Error fetching bug details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug details. Please try again.",
          variant: "destructive"
        });
        // return {
        //   id: bugId || 'BUG-001',
        //   title: 'Login button not responsive on mobile',
        //   description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers including Chrome, Safari, and Firefox on iOS devices.',
        //   severity: 'medium' as 'high' | 'medium' | 'low',
        //   status: 'new' as const,
        //   tags: ['UI', 'Mobile', 'Authentication', 'Cross-browser'],
        //   createdAt: '2024-12-20T10:30:00Z',
        //   updatedAt: '2024-12-20T14:15:00Z',
        //   recreate_guide: 'Recreate guide',
        //   run_id: runId || 'RUN-001',
        //   project_id: 'P0001',
        //   project_name: 'Project 1',
        // };
      }
    },
    enabled: !!bugId,
  });

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = useQuery<BugComment[]>({
    queryKey: ['bugComments', bugId],
    queryFn: async () => {
      try {
        return await api.get(`${API_ENDPOINTS.BUGS}/${bugId}/comments`);
      } catch (error) {
        console.error('Error fetching bug comments:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug comments. Please try again.",
          variant: "destructive"
        });
        // return [
        //   {
        //     id: 'C0001',
        //     text: 'Comment 1',
        //     author: 'John Doe',
        //     created_at: '21-08-2025',
        //     updated_at: '21-08-2025',
        //   }
        // ];
      }
      return [];
    },
    enabled: !!bugId,
  });

  // Fetch evidence
  const { data: evidence = [], refetch: refetchEvidence } = useQuery<BugEvidence[]>({
    queryKey: ['bugEvidence', bugId],
    queryFn: async () => {
      try {
        return await api.get(`${API_ENDPOINTS.BUGS}/${bugId}/attachments`);
      } catch (error) {
        console.error('Error fetching bug evidence:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug evidence. Please try again.",
          variant: "destructive"
        });
        // return [
        //   {
        //     id: 'E0001',
        //     type: 'screenshot',
        //     name: 'Screenshot 1',
        //     url: 'https://example.com/screenshot1.png',
        //     uploaded_at: '21-08-2025',
        //   }
        // ];
      }
      return [];
    },
    enabled: !!bugId,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);


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

  const [fileUploadingProgress, setFileUploadingProgress] = useState(0);
  const [fileUploadingTotal, setFileUploadingTotal] = useState(0);
  const [fileUploadingPercentage, setFileUploadingPercentage] = useState(0);
  const [fileUploadingName, setFileUploadingName] = useState("");

  // Attachment upload
  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || !bug?.project_id || !bug?.id) return;
    try {
      setFileUploadingTotal(files.length);
      toast({
        title: "Uploading attachments",
        description: "Please wait...",
      });
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

            await bugService.uploadBugAttachmentForm(bug?.id, compressed, file.name, false);
            refetchEvidence();
          } catch (err: any) {
            toast({
              title: "Failed to compress image, uploading original file",
              description: err.message,
              variant: "destructive"
            });
            // other files - add as is
            await bugService.uploadBugAttachmentForm(bug?.id, file, file.name, false);
            refetchEvidence();
          }
        } else {
          // other files - add as is
          await bugService.uploadBugAttachmentForm(bug?.id, file, file.name, false);
          refetchEvidence();
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
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!bug?.id) return;
    try {
      toast({
        title: "Deleting attachment",
        description: "Please wait...",
      });
      await bugService.deleteBugAttachment(attachmentId, bug?.id);
      toast({
        title: "Success",
        description: "Attachment deleted!",
        variant: "default"
      });
      refetchEvidence();
    } catch (err: any) {
      toast({
        title: "Failed to delete attachment",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Mutation for updating description
  const updateBugDescription = useMutation({
    mutationFn: async ({ description }: { description: string }) => {
      toast({
        title: "Updating description",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, { description });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', bugId] });
      toast({
        title: "Success",
        description: "Bug description updated successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating bug description:', error);
      toast({
        title: "Error",
        description: "Failed to update bug description. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating recreate guide
  const updateBugRecreateGuide = useMutation({
    mutationFn: async ({ recreate_guide }: { recreate_guide: string }) => {
      toast({
        title: "Updating recreate guide",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, { steps_to_reproduce: recreate_guide });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', bugId] });
      toast({
        title: "Success",
        description: "Bug recreate guide updated successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating bug recreate guide:', error);
      toast({
        title: "Error",
        description: "Failed to update bug recreate guide. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating bug status
  const updateBugStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      toast({
        title: "Updating status",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', bugId] });
      toast({
        title: "Success",
        description: "Bug status updated successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating bug status:', error);
      toast({
        title: "Error",
        description: "Failed to update bug status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating bug priority
  const updateBugPriority = useMutation({
    mutationFn: async ({ priority }: { priority: string }) => {
      toast({
        title: "Updating priority",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, { priority });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', bugId] });
      toast({
        title: "Success",
        description: "Bug status updated successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating bug status:', error);
      toast({
        title: "Error",
        description: "Failed to update bug status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating bug assignee
  const updateBugAssignee = useMutation({
    mutationFn: async ({ assignee }: { assignee: string }) => {
      toast({
        title: "Updating assignee",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, { assignee });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', bugId] });
      toast({
        title: "Success",
        description: "Bug assignee updated successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating bug assignee:', error);
      toast({
        title: "Error",
        description: "Failed to update bug assignee. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for adding a comment
  const addComment = useMutation({
    mutationFn: async (commentText: string) => {
      toast({
        title: "Adding comment",
        description: "Please wait...",
      });
      const response: any = await api.post(`${API_ENDPOINTS.BUGS}/${bugId}/comments`, {
        bug_id: bugId,
        content: commentText
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully!",
        variant: "default"
      });
      setNewComment('');
      refetchComments();
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating a comment
  const updateComment = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string, text: string }) => {
      toast({
        title: "Updating comment",
        description: "Please wait...",
      });
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/${bugId}/comments/${commentId}`, {
        content: text
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment updated successfully!",
        variant: "default"
      });
      setEditingComment(null);
      setEditCommentText('');
      refetchComments();
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting a comment
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      toast({
        title: "Deleting comment",
        description: "Please wait...",
      });
      await api.del(`${API_ENDPOINTS.BUGS}/${bugId}/comments/${commentId}`);
    },
    onSuccess: () => {
      refetchComments();
      toast({
        title: "Success",
        description: "Comment deleted successfully!",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle form submissions
  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment.mutate(newComment);
    }
  };

  const handleSaveEdit = (commentId: string) => {
    if (editCommentText.trim()) {
      updateComment.mutate({ commentId, text: editCommentText });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const handleStatusChange = (newStatus: string) => {
    updateBugStatus.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateBugPriority.mutate({ priority: newPriority });
  };

  const handleAssigneeChange = (newAssignee: string) => {
    updateBugAssignee.mutate({ assignee: newAssignee });
  };

  const handleSaveGuide = async () => {
    if (!bug) return;

    try {
      setIsSubmitting(true);
      toast({
        title: "Saving guide",
        description: "Please wait...",
      });
      await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, {
        recreate_guide: recreateGuide
      });

      toast({
        title: "Success",
        description: "Guide saved successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving guide:', error);
      toast({
        title: "Error",
        description: "Failed to save guide. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: any) => {
    const files = event.target.files;
    if (!files || !bugId) return;

    try {
      setIsSubmitting(true);
      toast({
        title: "Uploading attachments",
        description: "Please wait...",
      });
      const formData = new FormData();
      Array.from(files).forEach(async (file: any) => {

        if (file.type.startsWith("image/")) {
          try {
            // compress images
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
            formData.append('files', compressed);
          } catch (err: any) {
            toast({
              title: "Failed to compress image, uploading original file",
              description: err.message,
              variant: "destructive"
            });
            // other files - add as is
            formData.append('files', file);
          }
        } else {
          // other files - add as is
          formData.append('files', file);
        }

      });

      await api.put(`${API_ENDPOINTS.BUGS}/${bugId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await refetchEvidence();
      toast({
        title: "Success",
        description: "Evidence uploaded successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast({
        title: "Error",
        description: "Failed to upload evidence. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Attachment upload
  const handleImageUpload = async (file: File) => {
    if (!file || !bug?.project_id || !bugId) return;
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

          // const data: any = await taskService.uploadTaskAttachmentForm(task.project_id, taskId, compressed, file.name, true);
          // if (data?.url) {
          //   return data?.url;
          // }
        } catch (err: any) {
          toast({
            title: "Failed to compress image, uploading original file",
            description: err.message,
            variant: "destructive"
          });
          // other files - add as is
          // const data: any = await taskService.uploadTaskAttachmentForm(task.project_id, taskId, file, file.name, true);
          // if (data?.url) {
          //   return data?.url;
          // }
        }
      } else {
        // other files - add as is
        // const data: any = await taskService.uploadTaskAttachmentForm(task.project_id, taskId, file, file.name, true);
        // if (data?.url) {
        //   return data?.url;
        // }
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

  // Attachment upload
  // const handleAttachmentUpload = async (files: FileList | null) => {
  //   if (!files || !bug?.project_id || !bugId) return;
  //   try {
  //     for (const file of Array.from(files)) {
  //       if (file.type.startsWith("image/")) {
  //         try {
  //           // compress images
  //           const compressed = await imageCompression(file, {
  //             maxSizeMB: 1,
  //             maxWidthOrHeight: 1920,
  //             useWebWorker: true,
  //             alwaysKeepResolution: true,
  //             maxIteration: 2,
  //           });

  //           // await taskService.uploadTaskAttachmentForm(task.project_id, taskId, compressed, file.name, false);
  //         } catch (err: any) {
  //           toast({
  //             title: "Failed to compress image, uploading original file",
  //             description: err.message,
  //             variant: "destructive"
  //           });
  //           // other files - add as is
  //           // await taskService.uploadTaskAttachmentForm(task.project_id, taskId, file, file.name, false);
  //         }
  //       } else {
  //         // other files - add as is
  //         // await taskService.uploadTaskAttachmentForm(task.project_id, taskId, file, file.name, false);
  //       }
  //     }
  //     // const data: any[] = await taskService.getTaskAttachments(taskId);
  //     // setAttachments(Array.isArray(data) ? data : []);
  //     toast({
  //       title: "Success",
  //       description: "Attachment(s) uploaded!",
  //       variant: "default"
  //     });
  //   } catch (err: any) {
  //     toast({
  //       title: "Failed to upload attachment",
  //       description: err.message,
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const handleDeleteAttachment = async (attachmentId: string) => {
  //   if (!bug?.project_id) return;
  //   try {
  //     // await taskService.deleteTaskAttachment(attachmentId, task.project_id);
  //     // setAttachments(attachments.filter(a => a.attachment_id !== attachmentId));
  //     toast({
  //       title: "Success",
  //       description: "Attachment deleted!",
  //       variant: "default"
  //     });
  //   } catch (err: any) {
  //     toast({
  //       title: "Failed to delete attachment",
  //       description: err.message,
  //       variant: "destructive"
  //     });
  //   }
  // };

  const handleSaveChanges = async (isPriorityChange?: string, isStatusChange?: string, isAssigneeChange?: string, isProjectChange?: string, isStartDateChange?: string, isTargetDateChange?: string, isTagsChange?: string[]) => {
    if (!bugId) return;
    try {
      const payload: any = {
        title: bugName,
        description,
        status: isStatusChange ?? status,
        priority: isPriorityChange ?? priority,
        assignee: isAssigneeChange ?? assignee,
      };
      if (isProjectChange || bug?.project_id) payload.project_id = isProjectChange ?? bug?.project_id;
      // if (isStartDateChange || bug?.startDate) payload.start_date = toYMDLocal(fromYMDLocal(isStartDateChange ?? bug.startDate) || new Date());
      // if (isTargetDateChange || bug?.targetDate) payload.due_date = toYMDLocal(fromYMDLocal(isTargetDateChange ?? bug.targetDate) || new Date());
      // if (isTagsChange || Array.isArray(bug?.tags)) payload.tags = isTagsChange ?? bug?.tags;
      toast({
        title: "Saving changes...",
        description: "Please wait while we save your changes.",
        variant: "default"
      });
      // await bugService.updateTask(bugId, payload);
      toast({
        title: "Success",
        description: "Bug changes saved successfully!",
        variant: "default"
      });
      setIsTitleEditing(false);
      setIsDescriptionEditing(false);
      // fetchHistory();

    } catch (err: any) {
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to save changes');
      toast({
        title: "Failed to save changes",
        description: msg,
        variant: "destructive"
      });
      // fetchBugDetails(false);

    }
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
  const filteredMembers = (mentionSearchText
    ? orgMembers.filter(member => {
      // Check username, display name and email
      const searchLower = mentionSearchText.toLowerCase();
      const usernameMatch = member.email?.toLowerCase().includes(searchLower);
      const displayNameMatch = member.displayName?.toLowerCase().includes(searchLower);
      return usernameMatch || displayNameMatch;
    })
    : orgMembers).filter((member) => member.email !== user?.email);


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

  // Comment functions
  // const handleAddComment = async () => {
  //   if (!newComment.trim()) return;

  //   try {
  //     // Create optimistic comment with temp ID
  //     const tempId = `temp-${Date.now()}`;
  //     const optimisticComment = {
  //       comment_id: tempId,
  //       content: newComment,
  //       created_by: user?.email || user?.id,
  //       created_at: new Date().toISOString(),
  //       task_id: taskId,
  //       isOptimistic: true
  //     };

  //     // Apply optimistic update
  //     setComments(prev => [optimisticComment, ...prev]);
  //     setNewComment("");

  //     const payload = {
  //       task_id: taskId,
  //       content: newComment,
  //       task_title: taskName || task?.name,
  //     };

  //     toast({
  //       title: "Adding comment",
  //       description: "Please wait...",
  //     });

  //     const created = await api.post(`${API_ENDPOINTS.TASK_COMMENTS}?project_id=${task?.project_id}`, payload);

  //     // Replace optimistic comment with real one
  //     setComments(prev => prev.map(c =>
  //       c.comment_id === tempId ? created : c
  //     ));

  //     toast({
  //       title: "Success",
  //       description: "Comment added",
  //       variant: "default"
  //     });
  //   } catch (err: any) {
  //     // Revert optimistic update on error
  //     setComments(prev => prev.filter(c => !c.isOptimistic));
  //     setNewComment(newComment); // Restore comment text
  //     toast({
  //       title: "Failed to add comment",
  //       description: err.message,
  //       variant: "destructive"
  //     });
  //   }
  // };
  // const handleEditComment = (commentId: string) => {
  //   const comment = comments.find((c) => c.comment_id === commentId);
  //   if (comment) {
  //     setEditingComment(commentId);
  //     setEditCommentText(comment.content);
  //   }
  // };
  // const handleSaveEdit = async () => {
  //   if (!editCommentText.trim() || !editingComment) return;

  //   const originalComment = comments.find(c => c.comment_id === editingComment);
  //   const originalContent = originalComment?.content || originalComment?.comment || '';

  //   try {
  //     // Apply optimistic update
  //     setComments(prev => prev.map(c =>
  //       c.comment_id === editingComment
  //         ? { ...c, content: editCommentText, isEditing: true }
  //         : c
  //     ));

  //     toast({
  //       title: "Updating comment",
  //       description: "Please wait...",
  //     });

  //     const updated = await api.put(
  //       `${API_ENDPOINTS.TASK_COMMENTS}/${editingComment}?project_id=${task?.project_id}`,
  //       { content: editCommentText, task_title: taskName || task?.name }
  //     );

  //     setComments(prev => prev.map(c =>
  //       c.comment_id === editingComment ? Object.assign({}, updated, { isEditing: false }) : c
  //     ));

  //     setEditingComment(null);
  //     setEditCommentText("");
  //     toast({
  //       title: "Success",
  //       description: "Comment updated",
  //       variant: "default"
  //     });
  //   } catch (err: any) {
  //     // Revert on error
  //     setComments(prev => prev.map(c =>
  //       c.comment_id === editingComment
  //         ? { ...c, content: originalContent, isEditing: false }
  //         : c
  //     ));
  //     toast({
  //       title: "Failed to update comment",
  //       description: err.message,
  //       variant: "destructive"
  //     });
  //   }
  // };
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };


  // const handleStatusChange = async (v: string) => {
  //   setStatus(v);
  //   setTask((prev: any) => ({ ...prev, status: v }));
  //   handleSaveChanges(null, v);
  // };

  // const handlePriorityChange = async (v: string) => {
  //   setPriority(v);
  //   setTask((prev: any) => ({ ...prev, priority: v }));
  //   handleSaveChanges(v, null);
  // };

  // const handleAssigneeChange = async (v: string) => {
  //   setAssignee(v);
  //   setTask((prev: any) => ({ ...prev, assignee: v }));
  //   handleSaveChanges(null, null, v);
  // };

  // const handleProjectChange = async (v: string) => {
  //   setProjectId(v);
  //   setTask((prev: any) => ({ ...prev, project_id: v }));
  //   handleSaveChanges(null, null, null, v);
  // };

  // const handleStartDateChange = async (v: string) => {
  //   setStartDate(v);
  //   setTask((prev: any) => ({ ...prev, startDate: v }));
  //   handleSaveChanges(null, null, null, null, v);
  // };

  // const handleTargetDateChange = async (v: string) => {
  //   setTargetDate(v);
  //   setTask((prev: any) => ({ ...prev, targetDate: v }));
  //   handleSaveChanges(null, null, null, null, null, v);
  // };

  // const handleTagsChange = async (v: string, isAdd: boolean) => {
  //   let tags = task.tags || [];
  //   if (isAdd) {
  //     if (tags.includes(v)) return;
  //     tags.push(v);
  //   } else {
  //     tags = tags.filter((tag: string) => tag !== v);
  //   }
  //   setTags(tags);
  //   setTagInput('');
  //   setIsTagInputOpen(false);
  //   handleSaveChanges(null, null, null, null, null, null, tags);
  // };

  const [initialData, setInitialData] = useState<TaskCreateInitialData>(null);

  const handleConvertToTask = async () => {
    if (!bug) return;
    const bugData: TaskCreateInitialData = {
      projectId: bug.project_id,
      name: bug.title,
      description: bug.description,
      // status: bug.status,
      // priority: bug.priority,
      // tags: bug.tags,
      bug_id: bug.id,
      tracker_id: bug.tracker_id,
    }
    setInitialData(bugData)
    setIsNewTaskModalOpen(true)
  }

  // Fetch dependencies
  const { data: dependencies = [], refetch: refetchDependencies } = useQuery<any[]>({
    queryKey: ['bugDependencies', bugId],
    queryFn: async () => {
      try {
        return await api.get(`${API_ENDPOINTS.BUGS}/${bugId}/dependencies`);
      } catch (error) {
        console.error('Error fetching bug dependencies:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug dependencies. Please try again.",
          variant: "destructive"
        });
      }
      return [];
    },
    enabled: !!bugId,
  });

  const [dependencyDetails, setDependencyDetails] = useState<any[]>([]);

  // Fetch full dependency details
  useEffect(() => {
    if (!dependencies || !dependencies.length) { setDependencyDetails([]); return; }
    console.log(dependencies);
    Promise.all(dependencies.map((dep) => taskService.getTaskById(dep.task_id) as Promise<any>))
      .then((details: any) => setDependencyDetails(details as any[]))
      .catch(() => setDependencyDetails([]));
  }, [bugId, dependencies]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-red-500">Error loading bug details. Please try again later.</div>
  //     </div>
  //   );
  // }

  // No bug found
  // if (!bug) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div>Bug not found</div>
  //     </div>
  //   );
  // }

  // Render the component with the bug data
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>

        {/* <nav className="px-6 py-4 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50" >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(`${currentOrgId ? `/tester-zone/runs/${runId}?org_id=${currentOrgId}` : `/tester-zone/runs/${runId}`}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent p-0 m-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Board
              </Button>
            </div>

          </div>
        </nav> */}

        {/* Breadcrumb */}
        {/* <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={currentOrgId ? `/tester-zone?org_id=${currentOrgId}` : '/tester-zone'}>
                  Bug Tracker
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={currentOrgId ? `/tester-zone/runs/${runId}?org_id=${currentOrgId}` : `/tester-zone/runs/${runId}`}>{runId}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Badge className="bg-red-100 text-red-700 border-red-200 text-sm font-medium">
                  {bug?.id}
                </Badge>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}

        {/* Header */}
        <div className="px-6 bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${getSeverityColor(bug?.priority)} border text-sm font-medium`}>
                  {bug?.priority?.toUpperCase()}
                </Badge>

                <CopyableIdBadge
                  id={bug?.id}
                  org_id={currentOrgId}
                  isCompleted={bug?.closed || bug?.status === 'closed'}
                  tracker_id={bug?.tracker_id || bug?.run_id}
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  copyLabel="Bug"
                />

                <Select value={assignee} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {orgMembers?.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => {
                      return (
                        <SelectItem key={m.user_id} value={String(m.name)}>
                          {m.displayName} {m.designation ? `(${capitalizeFirstLetter(m.designation)})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {bug?.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created {formatDate(bug?.created_at)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to={currentOrgId ? `/tester-zone/runs/${runId || bug?.run_id || bug?.tracker_id}?org_id=${currentOrgId}` : `/tester-zone/runs/${runId || bug?.run_id || bug?.tracker_id}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Board
                </Link>
              </Button>
              <Button
                onClick={() => handleConvertToTask()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Convert to Task
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {bug?.tags?.map((tag, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
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
                        onClick={() => {
                          updateBugDescription.mutate({ description });
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
                        onClick={() => {
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
                      disabled={!bug?.is_editable}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bug?.is_editable && isDescriptionEditing ? (
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

            {/* Recreate Guide */}
            <Card className="glass border-0 shadow-tasksmate">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-sora">Recreate Guide</CardTitle>
                  {isRecreateGuideEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          updateBugRecreateGuide.mutate({ recreate_guide: recreateGuide });
                          setIsRecreateGuideEditing(false);
                        }}
                        title="Save recreate guide"
                      >
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setIsRecreateGuideEditing(false);
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
                      onClick={() => setIsRecreateGuideEditing(true)}
                      disabled={!bug?.is_editable}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bug?.is_editable && isRecreateGuideEditing ? (
                  <RichTextEditor
                    content={recreateGuide}
                    onChange={(content) => setRecreateGuide(content)}
                    placeholder="Add a detailed recreate guide..."
                    onImageUpload={handleImageUpload}
                    className="min-h-[175px]"
                  />
                ) : (
                  <RichTextEditor
                    content={recreateGuide}
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
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recreate Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bug?.recreate_guide}
                  onChange={(e) => setRecreateGuide(e.target.value)}
                  placeholder="Write the steps to recreate this bug..."
                  className="min-h-[120px] resize-none"
                />
                <Button onClick={handleSaveGuide} variant="outline" size="sm" className="mt-4">
                  Save Guide
                </Button>
              </CardContent>
            </Card> */}

            {/* Evidence Gallery */}

            <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
              <CardHeader>
                <CardTitle className="font-sora flex items-center space-x-2 text-gray-900 dark:text-white">
                  <File className="h-4 w-4" />
                  <span>Evidence & Screenshots ({evidence?.length ?? 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                    } bg-gray-50/50 dark:bg-gray-700/50`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-500 dark:text-gray-400">Drop files here or click to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Max 5 files</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleAttachmentUpload(e.target.files)}
                    accept="*/*"
                    disabled={!bug?.is_editable}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!bug?.is_editable}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {fileUploadingProgress > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Uploading {fileUploadingProgress} of {fileUploadingTotal} files - {fileUploadingName}</h4>
                    <Progress value={fileUploadingPercentage} />
                  </div>
                )}

                {evidence.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Uploaded Files:</h4>
                    {evidence.map((file, index) => (
                      <div key={file.id || index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {file.name}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!bug?.is_editable}
                          onClick={() => handleDeleteAttachment(file.id)}
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

            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Evidence & Screenshots
                  <div className="flex gap-2">
                    <Button onClick={handleFileUpload} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button onClick={() => refetchEvidence()} size="sm" variant="outline">
                      Save
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidence?.map((item) => (
                    <div key={item.id} className="bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-video bg-white flex items-center justify-center">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item?.uploaded_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Comments Section */}
            <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
              <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-sora flex items-center space-x-2 text-gray-900 dark:text-white">
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
                              disabled={!bug?.is_editable}
                              onChange={handleCommentChange}
                              onClick={() => setShowMentionPopover(false)}
                              placeholder="Add a comment... (Type @ to mention someone)"
                              className="min-h-20 resize-none"
                            />

                            {/* @mention popover */}
                            {showMentionPopover && (
                              <div
                                className="absolute z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto w-64"
                                style={{
                                  top: 30, // Position below cursor
                                  left: 10
                                }}
                              >
                                <div className="p-1">
                                  <div className="px-2 py-1 text-sm font-semibold border-b border-gray-100 dark:border-gray-600 mb-1 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-t">
                                    @Mention Team Member
                                  </div>
                                  {filteredMembers.length === 0 ? (
                                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">No members found</div>
                                  ) : (
                                    filteredMembers.map((member, idx) => {
                                      // const { displayName } = deriveDisplayFromEmail(member.email || '');
                                      return (
                                        <button
                                          key={member.id || member.user_id}
                                          className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors ${idx === mentionActiveIndex ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50'}`}
                                          type="button"
                                          onMouseDown={(e) => {
                                            // Using onMouseDown instead of onClick to prevent focus issues
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectMention(member.displayName);
                                          }}
                                        >
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                              {member.displayName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">{member.displayName}</span>
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
                              disabled={!newComment.trim() || !bug?.is_editable}
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
                        <div key={comment.id} className="flex space-x-3 group">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Avatar className="w-8 h-8 border border-white">
                                <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                  {(() => {
                                    const creator = (comment.user_id || "") as string;
                                    const { initials } = deriveDisplayFromEmail(creator || "u");
                                    return initials || "U";
                                  })()}
                                </AvatarFallback>
                              </Avatar>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-xs p-2">
                              {(() => {
                                const creator = (comment.user_id || "") as string;
                                const { displayName } = deriveDisplayFromEmail(creator || "user");
                                return displayName;
                              })()}
                            </HoverCardContent>
                          </HoverCard>
                          <div className="flex-1">
                            {editingComment === comment.id ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Textarea
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    placeholder="Edit your comment..."
                                    className="min-h-20 resize-none"
                                    disabled={!bug?.is_editable}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" onClick={() => handleSaveEdit(comment.id)}
                                    disabled={!bug?.is_editable || !editCommentText?.trim()}
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
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  <p className="whitespace-pre-wrap">
                                    {renderCommentWithMentions(comment.content)}
                                  </p>
                                  {
                                    (comment.updated_at || comment.created_at) &&
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(comment.updated_at || comment.created_at), 'MMM d, yyyy h:mm a')}
                                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                                        <span className="text-xs text-gray-400 ml-1">(edited)</span>
                                      )}

                                    </p>
                                  }

                                </div>
                                {(() => {
                                  const creator = String(comment.user_id || "").toLowerCase();
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
                                        onClick={() => {
                                          setEditingComment(comment.id);
                                          setEditCommentText(comment.content);
                                        }}
                                        disabled={!canEdit || !bug?.is_editable}
                                        title={canEdit ? "Edit" : "Only author can edit"}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        disabled={!canEdit || !bug?.is_editable}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bug Properties */}
            <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
              <CardHeader>
                <CardTitle className="text-lg">Bug Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="severity">Status</Label>
                  <Select value={bug?.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={bug?.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Save Changes
                </Button> */}
              </CardContent>
            </Card>

            {/* Dependencies */}
            <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-sora flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Link2 className="h-4 w-4" />
                    <span>Tasks ({dependencyDetails?.length ?? 0})</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="micro-lift"
                    onClick={() => handleConvertToTask()}
                    disabled={!bug?.is_editable}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dependencyDetails.map((dep: any) => {
                  const depId = dep.task_id ?? dep.id;
                  return (
                    <div key={depId} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 micro-lift group border border-gray-200 dark:border-gray-600">
                      {/* Toggle */}
                      {/* <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {(dep.status ?? '') === 'completed' ? <CheckCircle className="h-5 w-5 text-tasksmate-green-end" /> : <Circle className="h-5 w-5 text-gray-400" />}
                      </Button> */}

                      {/* Task ID */}
                      <CopyableIdBadge id={String(depId)} org_id={currentOrgId} isCompleted={(dep.status ?? '') === 'completed'} />

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
                      </div>

                      {/* Content Column */}
                      <div className="flex flex-col min-w-0 basis-full w-full mt-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
                          <span className="font-bold">Title :</span>
                          <span className={`truncate max-w-[14rem] ${(dep.status ?? '') === 'completed' ? 'line-through text-gray-400 dark:text-gray-500 cursor-pointer' : 'hover:underline cursor-pointer'}`}
                            onClick={() => {
                              const url = `/tasks/${depId}${currentOrgId ? `?org_id=${currentOrgId}` : ''}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {dep.title ?? dep.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <NewTaskModal
        open={isNewTaskModalOpen}
        onOpenChange={(open) => {
          setInitialData(null)
          setIsNewTaskModalOpen(open)
        }}
        onTaskCreated={() => { setInitialData(null); refetchDependencies(); }}
        defaultTags={[bug?.id]}
        isConvertingFromBug={true}
        projectName={bug?.project_name}
        initialData={initialData}
      />
    </div>
  );
};

export default BugDetail;
