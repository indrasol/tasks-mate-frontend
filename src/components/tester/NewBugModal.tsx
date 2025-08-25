import { API_ENDPOINTS } from '@/../config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useProjects } from '@/hooks/useProjects';
import { api } from '@/services/apiService';
import { Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface NewBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  projectName?: string; // Made optional
}

const NewBugModal = ({ open, onOpenChange, runId, projectName }: NewBugModalProps) => {
  const { projects, loading: loadingProjects } = useProjects();
  const currentOrgId = useCurrentOrgId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium', // Default to medium severity
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.title || !formData.description || !formData.severity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare bug data
      const bugData = {
        org_id: currentOrgId,
        project_id: formData.projectId,
        project_name: formData.projectName,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: 'open', // Default status for new bugs
        tags: [formData.projectName, ...formData.tags],
        tracker_id: runId,
        // Add any additional fields required by your API
      };

      // Show loading toast
      const loadingToast = toast({
        title: "Creating Bug",
        description: "Please wait while we create your bug report...",
      });

      // Call API to create bug
      await api.post(API_ENDPOINTS.BUGS, bugData);
      
      // Close the modal and reset form
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        severity: 'medium',
        projectId: '',
        projectName: projectName || '',
        tags: []
      });
      
      // Show success toast
      toast({
        title: "Success",
        description: "Bug reported successfully!",
        variant: "default"
      });
      
      // Refresh any parent components if needed
      const event = new CustomEvent('bug-created');
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error creating bug:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to report bug. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Report New Bug</SheetTitle>
          <SheetDescription>
            Fill in the details below to report a new bug.
          </SheetDescription>
        </SheetHeader>
        
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

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : 'Report Bug'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NewBugModal;
