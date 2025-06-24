
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Settings, Edit, Trash2, Eye } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'new' | 'confirmed' | 'fixed' | 'retest';
  tags: string[];
  votes: number;
  thumbnail?: string;
}

const BugBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showNewBugModal, setShowNewBugModal] = useState(false);
  const [newBugForm, setNewBugForm] = useState({
    title: '',
    description: '',
    tags: ''
  });
  
  const [bugs, setBugs] = useState<Bug[]>([
    {
      id: 'BUG-001',
      title: 'Login button not responsive on mobile',
      description: 'The login button becomes unclickable on mobile devices under 768px width',
      severity: 'major',
      status: 'new',
      tags: ['UI', 'Mobile', 'Authentication'],
      votes: 3,
    },
    {
      id: 'BUG-002',
      title: 'Task deletion confirmation missing',
      description: 'Tasks can be deleted without confirmation, leading to accidental data loss',
      severity: 'critical',
      status: 'confirmed',
      tags: ['UX', 'Data Loss', 'Confirmation'],
      votes: 5,
    },
    {
      id: 'BUG-003',
      title: 'Profile image upload fails silently',
      description: 'Profile image upload shows success but image is not saved',
      severity: 'minor',
      status: 'fixed',
      tags: ['Upload', 'Profile', 'Feedback'],
      votes: 1,
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'major': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'fixed': return 'bg-green-100 text-green-700';
      case 'retest': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleNewBugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBug: Bug = {
      id: `BUG-${String(bugs.length + 1).padStart(3, '0')}`,
      title: newBugForm.title,
      description: newBugForm.description,
      severity: 'minor',
      status: 'new',
      tags: newBugForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      votes: 0
    };
    
    setBugs([...bugs, newBug]);
    setNewBugForm({ title: '', description: '', tags: '' });
    setShowNewBugModal(false);
  };

  const handleBugClick = (bugId: string) => {
    navigate(`/tester-zone/runs/${id}/bugs/${bugId}`);
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
                <Link to={`/tester-zone/runs/${id}`}>Test Book {id}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Bug Board</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora">Bug Board</h1>
            <p className="text-gray-600 mt-1">Track and manage bugs for this test book</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Board Settings
            </Button>
            <Button 
              onClick={() => setShowNewBugModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Bug
            </Button>
          </div>
        </div>

        {/* Bug Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bugs.map((bug) => (
            <Card 
              key={bug.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group border-l-4 border-l-green-500"
              onClick={() => handleBugClick(bug.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${getSeverityColor(bug.severity)} border text-xs font-medium`}>
                    {bug.severity.toUpperCase()}
                  </Badge>
                  <Badge className={`${getStatusColor(bug.status)} border-0 text-xs`}>
                    {bug.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {bug.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {bug.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {bug.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {tag}
                    </Badge>
                  ))}
                  {bug.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                      +{bug.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Votes:</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      {bug.votes}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Bug Modal */}
        <Dialog open={showNewBugModal} onOpenChange={setShowNewBugModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Bug</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleNewBugSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Bug Name</Label>
                <Input
                  id="title"
                  placeholder="Enter bug title..."
                  value={newBugForm.title}
                  onChange={(e) => setNewBugForm({...newBugForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Bug Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the bug in detail..."
                  value={newBugForm.description}
                  onChange={(e) => setNewBugForm({...newBugForm, description: e.target.value})}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas..."
                  value={newBugForm.tags}
                  onChange={(e) => setNewBugForm({...newBugForm, tags: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewBugModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Create Bug
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BugBoard;
