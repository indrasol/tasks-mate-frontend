
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Upload, Camera, Clock, ArrowLeft, Plus, Edit3, Trash2 } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import { toast } from 'sonner';

const BugDetail = () => {
  const { id: runId, bugId } = useParams();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  
  // Mock bug data with proper typing
  const [bug, setBug] = useState({
    id: bugId || 'BUG-001',
    title: 'Login button not responsive on mobile',
    description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers including Chrome, Safari, and Firefox on iOS devices.',
    severity: 'medium' as 'high' | 'medium' | 'low',
    status: 'new' as const,
    tags: ['UI', 'Mobile', 'Authentication', 'Cross-browser'],
    createdAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-20T14:15:00Z'
  });

  const [recreateGuide, setRecreateGuide] = useState('Navigate to the login page on a mobile device. Enter valid credentials in the email and password fields. Attempt to tap the "Sign In" button. Notice that the button does not respond to touch.');

  const [evidence, setEvidence] = useState([
    {
      id: '1',
      type: 'image',
      name: 'mobile-login-bug.png',
      url: '/placeholder.svg',
      uploadedAt: '2024-12-20T11:00:00Z'
    }
  ]);

  const [comments, setComments] = useState([
    {
      id: '1',
      text: 'This issue affects all mobile users trying to log in.',
      author: 'John Doe',
      createdAt: '2024-12-20T12:00:00Z'
    },
    {
      id: '2',
      text: 'I can reproduce this on iOS Safari as well.',
      author: 'Jane Smith',
      createdAt: '2024-12-20T13:30:00Z'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSeverityChange = (newSeverity: string) => {
    setBug(prev => ({ ...prev, severity: newSeverity as 'high' | 'medium' | 'low' }));
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        author: 'Current User',
        createdAt: new Date().toISOString()
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditCommentText(comment.text);
    }
  };

  const handleSaveEdit = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, text: editCommentText }
        : comment
    ));
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleSaveGuide = () => {
    console.log('Saving guide:', recreateGuide);
    toast.success('Guide saved successfully!');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newEvidence = {
            id: Date.now().toString(),
            type: 'image',
            name: file.name,
            url: e.target?.result as string,
            uploadedAt: new Date().toISOString()
          };
          setEvidence(prev => [...prev, newEvidence]);
        };
        reader.readAsDataURL(file);
      });
      toast.success('Evidence uploaded successfully!');
    }
  };

  const handleUploadEvidence = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileUpload(e as any);
    input.click();
  };

  const handleSaveEvidence = () => {
    console.log('Saving evidence changes');
    toast.success('Evidence saved successfully!');
  };

  const handleConvertToTask = () => {
    setIsNewTaskModalOpen(true);
  };

  const handleTaskCreated = (task: any) => {
    console.log('Task created from bug:', task);
    toast.success('Bug converted to task successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="ml-64 p-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/tester-zone">Test Books</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${runId}`}>Test Book {runId}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${runId}/bugs`}>Bug Board</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Badge className="bg-red-100 text-red-700 border-red-200 text-sm font-medium">
                  {bug.id}
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
                <Badge className={`${getSeverityColor(bug.severity)} border text-sm font-medium`}>
                  {bug.severity.toUpperCase()}
                </Badge>
                <Badge className="bg-red-100 text-red-700 border-red-200 text-sm font-medium">
                  {bug.id}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {bug.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created {new Date(bug.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to={`/tester-zone/runs/${runId}/bugs`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Board
                </Link>
              </Button>
              <Button 
                onClick={handleConvertToTask}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Convert to Task
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {bug.tags.map((tag, index) => (
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
                  value={bug.description}
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
                  value={recreateGuide}
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
                    <Button onClick={handleUploadEvidence} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button onClick={handleSaveEvidence} size="sm" variant="outline">
                      Save
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidence.map((item) => (
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
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Evidence placeholder */}
                  <div 
                    onClick={handleUploadEvidence}
                    className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Evidence</span>
                  </div>
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
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
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
                  <Select value={bug.severity} onValueChange={handleSeverityChange}>
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
        onTaskCreated={handleTaskCreated}
        defaultTags={[bug.id]}
      />
    </div>
  );
};

export default BugDetail;
