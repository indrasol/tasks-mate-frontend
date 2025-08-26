import { API_ENDPOINTS } from '@/../config';
import MainNavigation from '@/components/navigation/MainNavigation';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { formatDate } from '@/lib/projectUtils';
import { api } from '@/services/apiService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Clock, Edit3, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import imageCompression from "browser-image-compression";

interface BugComment {
  id: string;
  text: string;
  author: string;
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
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  tags: string[];
  created_at: string;
  updated_at: string;
  recreate_guide: string;
  run_id: string;
  project_id: string;
  project_name: string;
}

const BugDetail = () => {
  const { id: runId, bugId } = useParams();
  const currentOrgId = useCurrentOrgId();
  const queryClient = useQueryClient();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recreateGuide, setRecreateGuide] = useState('');

  // Fetch bug details
  const { data: bug, isLoading, error } = useQuery<BugDetails>({
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
        return await api.get<any>(`${API_ENDPOINTS.BUGS}/${bugId}`);

      } catch (error) {
        console.error('Error fetching bug details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug details. Please try again.",
          variant: "destructive"
        });
        return {
          id: bugId || 'BUG-001',
          title: 'Login button not responsive on mobile',
          description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers including Chrome, Safari, and Firefox on iOS devices.',
          severity: 'medium' as 'high' | 'medium' | 'low',
          status: 'new' as const,
          tags: ['UI', 'Mobile', 'Authentication', 'Cross-browser'],
          createdAt: '2024-12-20T10:30:00Z',
          updatedAt: '2024-12-20T14:15:00Z',
          recreate_guide: 'Recreate guide',
          run_id: runId || 'RUN-001',
          project_id: 'P0001',
          project_name: 'Project 1',
        };
      }
    },
    enabled: !!bugId,
  });

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = useQuery<BugComment[]>({
    queryKey: ['bugComments', bugId],
    queryFn: async () => {
      try {
        const response: any = await api.get(`${API_ENDPOINTS.BUGS}/${bugId}/comments`);
        return response.data;
      } catch (error) {
        console.error('Error fetching bug comments:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug comments. Please try again.",
          variant: "destructive"
        });
        return [
          {
            id: 'C0001',
            text: 'Comment 1',
            author: 'John Doe',
            created_at: '21-08-2025',
            updated_at: '21-08-2025',
          }
        ];
      }
    },
    enabled: !!bugId,
  });

  // Fetch evidence
  const { data: evidence = [], refetch: refetchEvidence } = useQuery<BugEvidence[]>({
    queryKey: ['bugEvidence', bugId],
    queryFn: async () => {
      try {
        const response: any = await api.get(`${API_ENDPOINTS.BUGS}/${bugId}/evidence`);
        return response.data
      } catch (error) {
        console.error('Error fetching bug evidence:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug evidence. Please try again.",
          variant: "destructive"
        });
        return [
          {
            id: 'E0001',
            type: 'screenshot',
            name: 'Screenshot 1',
            url: 'https://example.com/screenshot1.png',
            uploaded_at: '21-08-2025',
          }
        ];
      }
    },
    enabled: !!bugId,
  });

  // Mutation for updating bug status
  const updateBugStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
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

  // Mutation for adding a comment
  const addComment = useMutation({
    mutationFn: async (commentText: string) => {
      const response: any = await api.post(`${API_ENDPOINTS.BUGS}/${bugId}/comments`, {
        text: commentText
      });
      return response.data;
    },
    onSuccess: () => {
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
      const response: any = await api.put(`${API_ENDPOINTS.BUGS}/comments/${commentId}`, { text });
      return response.data;
    },
    onSuccess: () => {
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
      await api.del(`${API_ENDPOINTS.BUGS}/comments/${commentId}`);
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

  const handleSeverityChange = (newSeverity: string) => {
    updateBugStatus.mutate({ status: newSeverity });
  };

  const handleSaveGuide = async () => {
    if (!bug) return;

    try {
      setIsSubmitting(true);
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

      await api.put(`${API_ENDPOINTS.BUGS}/${bugId}/evidence`, formData, {
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

  // Loading state
  if (isLoading) {
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

      <div className="ml-64 p-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
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
            {/* <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${runId}/bugs`}>Bug Board</Link>
              </BreadcrumbLink>
            </BreadcrumbItem> */}
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
        </Breadcrumb>

        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${getSeverityColor(bug?.severity)} border text-sm font-medium`}>
                  {bug?.severity?.toUpperCase()}
                </Badge>
                <Badge className="text-sm font-mono bg-red-600 text-white">
                  {bug?.id}
                </Badge>
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
                <Link to={currentOrgId ? `/tester-zone/runs/${runId}?org_id=${currentOrgId}` : `/tester-zone/runs/${runId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Board
                </Link>
              </Button>
              <Button
                onClick={() => setIsNewTaskModalOpen(true)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bug?.description}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  readOnly
                />
              </CardContent>
            </Card>

            {/* Recreate Guide */}
            <Card>
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
            </Card>

            {/* Evidence Gallery */}
            <Card>
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
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Comment */}
                <div className="flex gap-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-green-500 hover:bg-green-600 text-white self-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(comment?.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingComment(comment.id)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {editingComment === comment.id ? (
                        <div className="flex gap-2">
                          <Textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(comment.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingComment(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bug Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bug Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={bug?.severity} onValueChange={handleSeverityChange}>
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

                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewTaskModal
        open={isNewTaskModalOpen}
        onOpenChange={setIsNewTaskModalOpen}
        onTaskCreated={() => console.log('Task created from bug')}
        defaultTags={[bug?.id]}
        isConvertingFromBug={true}
        projectName={bug?.project_name}
      />
    </div>
  );
};

export default BugDetail;
