import { API_ENDPOINTS } from '@/config';
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
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useProjects } from '@/hooks/useProjects';
import { api } from '@/services/apiService';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto bg-white dark:bg-gray-900">
        <SheetHeader className="mb-6">
          <SheetTitle className="dark:text-white">Create New Test Run</SheetTitle>
          <SheetDescription className="dark:text-gray-300">
            Set up a new test run for your project.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Tracker Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter tracker name"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project" className="text-gray-700 dark:text-gray-300">Project</Label>
            <Select value={formData.projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {loadingProjects ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading projects...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select project" />
                )}
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                {projects.length === 0 && !loadingProjects && (
                  <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                )}
                {projects.sort((a, b) => a.name.localeCompare(b.name)).map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">{project.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
              <Label htmlFor="priority" className="text-gray-700 dark:text-gray-300">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
      </SheetContent>
    </Sheet>
  );
};

export default NewRunModal;
