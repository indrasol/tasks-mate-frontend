
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  Trash2, 
  Copy,
  Plus,
  CheckCircle,
  Circle,
  Send,
  Edit,
  X,
  ChevronDown
} from "lucide-react";
import DuplicateTaskModal from "@/components/tasks/DuplicateTaskModal";

const TaskDetail = () => {
  const { taskId } = useParams();
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('Create modern, responsive dashboard with glassmorphism effects. The design should include smooth animations, proper spacing, and intuitive navigation patterns.');
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);

  // Comments state
  const [comments, setComments] = useState([
    { id: 1, user: 'Mike R.', time: '2 hours ago', content: 'Updated the color scheme based on feedback', avatar: 'MR' },
    { id: 2, user: 'Alex M.', time: '2 days ago', content: 'Great progress on the wireframes!', avatar: 'AM' },
    { id: 3, user: 'Sarah K.', time: '3 days ago', content: 'Initial wireframes look promising. Let\'s iterate on the navigation flow.', avatar: 'SK' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Mock data for the task
  const task = {
    id: taskId || 'T1234',
    name: 'Redesign Dashboard UI',
    description: description,
    status: status,
    progress: 65,
    owner: 'Sarah K.',
    targetDate: '2024-01-15',
    createdDate: '2024-01-01',
    comments: comments.length
  };

  const subtasks = [
    { id: 1, name: 'Create wireframes', completed: true, owner: 'Sarah K.', due: '2024-01-05' },
    { id: 2, name: 'Design system components', completed: true, owner: 'Mike R.', due: '2024-01-08' },
    { id: 3, name: 'Implement glassmorphism cards', completed: false, owner: 'Sarah K.', due: '2024-01-12' },
    { id: 4, name: 'Add micro-interactions', completed: false, owner: 'Alex M.', due: '2024-01-15' },
  ];

  // Comment functions
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: 'Current User',
        time: 'Just now',
        content: newComment,
        avatar: 'CU'
      };
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  const handleEditComment = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditCommentText(comment.content);
    }
  };

  const handleSaveEdit = () => {
    if (editCommentText.trim() && editingComment) {
      setComments(comments.map(comment => 
        comment.id === editingComment 
          ? { ...comment, content: editCommentText }
          : comment
      ));
      setEditingComment(null);
      setEditCommentText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId: number) => {
    setComments(comments.filter(comment => comment.id !== commentId));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-gray-200">
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
                <Badge variant="secondary" className="text-xs font-mono mb-2">
                  {task.id}
                </Badge>
                <Input 
                  value={task.name}
                  className="text-2xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">🟡 Pending</SelectItem>
                <SelectItem value="active">🔵 Active</SelectItem>
                <SelectItem value="blocked">🔴 Blocked</SelectItem>
                <SelectItem value="completed">🟢 Completed</SelectItem>
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
                  <Button size="sm" variant="outline" className="micro-lift">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtask
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 micro-lift">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
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
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            <Card className="glass border-0 shadow-tasksmate">
              <CardHeader>
                <CardTitle className="font-sora">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Drop files here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">Max 5 files</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section - Now Collapsible */}
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
                        <div key={comment.id} className="flex space-x-3 group">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {comment.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <span className="font-medium">{comment.user}</span>
                                <span className="text-gray-500 ml-2">{comment.time}</span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditComment(comment.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {editingComment === comment.id ? (
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
                  This UI redesign task is <strong>65% complete</strong> and on track for the January 15th deadline. 
                  The team has successfully completed wireframes and design system components. 
                  <br /><br />
                  <strong>Next steps:</strong> Implement glassmorphism cards and add micro-interactions. 
                  Sarah and Alex are the primary contributors with good collaboration in comments.
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

            {/* Integrations */}
            <Card className="glass border-0 shadow-tasksmate">
              <CardHeader>
                <CardTitle className="font-sora">Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">Slack</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Teams</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button className="bg-tasksmate-gradient">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" className="micro-lift" onClick={() => setIsDuplicateOpen(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="micro-lift">
              Open in Slack
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </main>

      {/* Duplicate Task Modal */}
      <DuplicateTaskModal 
        open={isDuplicateOpen} 
        onOpenChange={setIsDuplicateOpen}
        sourceTask={task}
      />
    </div>
  );
};

export default TaskDetail;
