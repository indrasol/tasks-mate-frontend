
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/../config';
import { toast } from '@/hooks/use-toast';

interface NewRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewRunModal = ({ open, onOpenChange }: NewRunModalProps) => {
  const { projects, loading: loadingProjects } = useProjects();
  const currentOrgId = useCurrentOrgId();
  
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectName: '',
    status: 'not_started', // Default status
    priority: 'medium' // Default priority
  });
  
  // Handle project selection
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Show loading state
      const loadingToast = toast({
        title: "Creating tracker",
        description: "Please wait...",
      });
      
      // Prepare data for API
      const trackerData = {
        org_id: currentOrgId,
        project_id: formData.projectId,
        project_name: formData.projectName,
        name: formData.name,
        status: formData.status,
        priority: formData.priority,
      };
      
      // Call API to create tracker
      await api.post(API_ENDPOINTS.TRACKERS, trackerData);
      
      // Close the modal and reset form
      onOpenChange(false);
      setFormData({
        name: '',
        projectId: '',
        projectName: '',
        status: 'not_started',
        priority: 'medium'
      });
      
      // Show success toast
      toast({
        title: "Success",
        description: "Tracker created successfully",
        variant: "default"
      });
      
      // Dispatch event to refresh tracker list
      const event = new CustomEvent('tracker-created');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tracker",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tracker</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tracker Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter tracker name"
              required
            />
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


          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Not Started</span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">In Progress</span>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Blocked</span>
                  </SelectItem>
                  <SelectItem value="on_hold">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">On Hold</span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                  </SelectItem>
                  <SelectItem value="archived">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Archived</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Low</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Medium</span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">High</span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Critical</span>
                  </SelectItem>
                  <SelectItem value="none">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">None</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              disabled={!formData.name || !formData.projectId}
            >
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewRunModal;
