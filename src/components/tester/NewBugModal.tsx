
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

interface NewBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  projectName?: string; // Made optional
}

const NewBugModal = ({ open, onOpenChange, runId, projectName }: NewBugModalProps) => {
  const { projects, loading: loadingProjects } = useProjects();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '',
    projectId: '',
    projectName: projectName || '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  
  // Set default project if provided
  useEffect(() => {
    if (projectName && projects.length > 0) {
      const foundProject = projects.find(p => p.name === projectName);
      if (foundProject) {
        setFormData(prev => ({
          ...prev,
          projectId: foundProject.id,
          projectName: foundProject.name
        }));
      }
    }
  }, [projectName, projects]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName) {
      alert("Please select a project");
      return;
    }
    
    // Auto-add project name as the first tag
    const bugData = {
      ...formData,
      tags: [formData.projectName, ...formData.tags],
      runId
    };
    console.log('Creating new bug:', bugData);
    onOpenChange(false);
    setFormData({
      title: '',
      description: '',
      severity: '',
      projectId: '',
      projectName: '',
      tags: []
    });
  };
  
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    if (selectedProject) {
      setFormData({
        ...formData,
        projectId: projectId,
        projectName: selectedProject.name
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report New Bug</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Bug Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief description of the bug"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of the bug..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Bug Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={formData.projectId} onValueChange={handleProjectChange}>
              <SelectTrigger>
                {loadingProjects ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading projects...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select project" />
                )}
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 && !loadingProjects && (
                  <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                )}
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <p className="text-xs text-gray-500">
              {formData.projectName ? (
                <Badge className="bg-teal-100 text-teal-800 text-xs mr-1">{formData.projectName}</Badge>
              ) : (
                <span>Select a project above</span>
              )}
              {formData.projectName && " will be automatically added to this bug"}
            </p>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              disabled={!formData.title || !formData.description || !formData.severity || !formData.projectId}
            >
              Create Bug
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBugModal;
